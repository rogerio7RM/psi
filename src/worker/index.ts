import { Hono } from "hono";

type PublisherEnv = Env & {
  INSTAGRAM_ACCESS_TOKEN?: string;
  INSTAGRAM_USER_ID?: string;
  PUBLISH_ADMIN_KEY?: string;
};
const app = new Hono<{ Bindings: PublisherEnv }>();
const GRAPH = "https://graph.instagram.com/v24.0";

app.get("/api/", (c) => c.json({ name: "PrimeSphere Intelligence", publisher: "Meta API integration" }));

// All publishing endpoints require an independent secret, not the Instagram token.
// No public route ever returns access tokens or raw Meta error responses.
app.use("/api/publisher/*", async (c, next) => {
  const expected = c.env.PUBLISH_ADMIN_KEY;
  const supplied = c.req.header("X-Publisher-Key");
  if (!expected || !supplied || supplied !== expected) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

app.get("/api/publisher/instagram/status", async (c) => {
  const { INSTAGRAM_ACCESS_TOKEN: token, INSTAGRAM_USER_ID: userId } = c.env;
  if (!token || !userId) return c.json({ configured: false, reason: "Missing Instagram credentials" }, 503);
  try {
    const url = new URL(`${GRAPH}/me`);
    url.searchParams.set("fields", "id,username");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return c.json({ configured: true, authorized: false, httpStatus: response.status }, 502);
    const profile = await response.json() as { id?: string; username?: string };
    return c.json({ configured: true, authorized: profile.id === userId, username: profile.username, idMatches: profile.id === userId });
  } catch {
    return c.json({ configured: true, authorized: false, reason: "Meta API unavailable" }, 502);
  }
});

type MetaResponse = { id?: string; status_code?: string; error?: { message?: string } };
async function metaPost(path: string, token: string, params: Record<string, string>): Promise<MetaResponse> {
  const body = new URLSearchParams(params);
  const response = await fetch(`${GRAPH}/${path}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  const data = await response.json() as MetaResponse;
  if (!response.ok || !data.id) throw new Error(`Meta API returned HTTP ${response.status}`);
  return data;
}
async function waitForMedia(id: string, token: string) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const url = new URL(`${GRAPH}/${id}`);
    url.searchParams.set("fields", "status_code");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("Unable to check Instagram media status");
    const result = await response.json() as MetaResponse;
    if (result.status_code === "FINISHED") return;
    if (result.status_code === "ERROR" || result.status_code === "EXPIRED") throw new Error("Instagram media processing failed");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Instagram media is not ready; retry later");
}

app.post("/api/publisher/instagram/carousel", async (c) => {
  const token = c.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = c.env.INSTAGRAM_USER_ID;
  if (!token || !userId) return c.json({ error: "Instagram not configured" }, 503);
  let payload: { images?: string[]; caption?: string; confirmPublish?: boolean };
  try { payload = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }
  if (!payload.confirmPublish) return c.json({ error: "Explicit confirmPublish required" }, 400);
  if (!Array.isArray(payload.images) || payload.images.length < 2 || payload.images.length > 10 ||
      !payload.images.every((url) => typeof url === "string" && /^https:\/\//.test(url)) ||
      typeof payload.caption !== "string" || payload.caption.length > 2200) {
    return c.json({ error: "Supply 2–10 HTTPS image URLs and a caption (max 2200 chars)" }, 400);
  }
  try {
    const children: string[] = [];
    for (const imageUrl of payload.images) {
      const child = await metaPost(`${userId}/media`, token, { image_url: imageUrl, is_carousel_item: "true" });
      children.push(child.id!);
    }
    for (const id of children) await waitForMedia(id, token);
    const carousel = await metaPost(`${userId}/media`, token, {
      media_type: "CAROUSEL", children: children.join(","), caption: payload.caption,
    });
    await waitForMedia(carousel.id!, token);
    const published = await metaPost(`${userId}/media_publish`, token, { creation_id: carousel.id! });
    return c.json({ published: true, mediaId: published.id });
  } catch {
    // Never leak tokens, URLs or upstream error payloads.
    return c.json({ published: false, error: "Instagram publication failed; check Cloudflare logs and Meta permissions" }, 502);
  }
});

export default app;
