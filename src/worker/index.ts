import { Hono } from "hono";

type PublisherEnv = Env & {
  INSTAGRAM_ACCESS_TOKEN?: string;
  INSTAGRAM_USER_ID?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
  FACEBOOK_PAGE_ID?: string;
  PUBLISH_ADMIN_KEY?: string;
  INSTAGRAM_MEDIA?: R2Bucket;
  AUTO_PUBLISH_ENABLED?: string;
};
const app = new Hono<{ Bindings: PublisherEnv }>();
const GRAPH = "https://graph.instagram.com/v24.0";
const FB_GRAPH = "https://graph.facebook.com/v24.0";

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
    if (!response.ok) {
      const failure = await response.json().catch(() => ({})) as { error?: { code?: number; error_subcode?: number; type?: string; message?: string } };
      return c.json({
        configured: true,
        authorized: false,
        httpStatus: response.status,
        metaErrorCode: failure.error?.code ?? null,
        metaErrorSubcode: failure.error?.error_subcode ?? null,
        metaErrorType: failure.error?.type ?? null,
        metaErrorMessage: (failure.error?.message || "").slice(0, 240).replace(/[A-Za-z0-9_\-.]{40,}/g, "[redacted]") || null,
      }, 502);
    }
    const profile = await response.json() as { id?: string; username?: string };
    return c.json({ configured: true, authorized: profile.id === userId, username: profile.username, metaUserId: profile.id, idMatches: profile.id === userId });
  } catch {
    return c.json({ configured: true, authorized: false, reason: "Meta API unavailable" }, 502);
  }

});

app.get("/api/publisher/facebook/status", async (c) => {
  const { FACEBOOK_PAGE_ACCESS_TOKEN: token, FACEBOOK_PAGE_ID: pageId } = c.env;
  if (!token || !pageId) return c.json({ configured: false, reason: "Missing Facebook Page credentials" }, 503);
  try {
    const url = new URL(`${FB_GRAPH}/${pageId}`);
    url.searchParams.set("fields", "id,name");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({})) as { error?: { code?: number; error_subcode?: number; type?: string; message?: string } };
      return c.json({
        configured: true,
        authorized: false,
        httpStatus: response.status,
        metaErrorCode: failure.error?.code ?? null,
        metaErrorSubcode: failure.error?.error_subcode ?? null,
        metaErrorType: failure.error?.type ?? null,
        metaErrorMessage: (failure.error?.message || "").slice(0, 240).replace(/[A-Za-z0-9_\-.]{40,}/g, "[redacted]") || null,
      }, 502);
    }
    const page = await response.json() as { id?: string; name?: string };
    return c.json({ configured: true, authorized: page.id === pageId, pageName: page.name, metaPageId: page.id, idMatches: page.id === pageId });
  } catch {
    return c.json({ configured: true, authorized: false, reason: "Facebook Graph API unavailable" }, 502);
  }
});

// Read-only duplicate check against recent media on the connected Instagram account.
// A clean result is meaningful only if the entire requested date was scanned.
app.get("/api/publisher/instagram/duplicates/:edition", async (c) => {
  const edition = c.req.param("edition");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition)) return c.json({ error: "Invalid edition" }, 400);
  const token = c.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return c.json({ verified: false, reason: "Instagram token unavailable" }, 503);
  const matches: Array<{ id: string; timestamp?: string; permalink?: string }> = [];
  try {
    let next: string | null = `${GRAPH}/me/media?fields=id,caption,timestamp,permalink,media_type&limit=50`;
    let pages = 0, reachedEarlierDate = false;
    while (next && pages < 10) {
      const response: Response = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return c.json({ verified: false, reason: "Meta media listing unavailable", httpStatus: response.status }, 502);
      const data = await response.json() as { data?: Array<{id:string;caption?:string;timestamp?:string;permalink?:string}>; paging?: {next?:string} };
      for (const media of data.data || []) {
        const day = media.timestamp?.slice(0,10);
        if (day && day < edition) reachedEarlierDate = true;
        if (day === edition && /wall street|antes da abertura|primesphere|portfolio intelligence/i.test(media.caption || ""))
          matches.push({ id: media.id, timestamp: media.timestamp, permalink: media.permalink });
      }
      next = data.paging?.next || null;
      pages++;
      if (reachedEarlierDate) break;
    }
    return c.json({ edition, verified: reachedEarlierDate || !next, duplicateFound: matches.length > 0,
      matches, scannedPages: pages, incomplete: !!next && !reachedEarlierDate });
  } catch {
    return c.json({ verified: false, reason: "Meta duplicate check failed" }, 502);
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


async function facebookPost(path: string, token: string, params: Record<string, string>) {
  const body = new URLSearchParams(params);
  const response = await fetch(`${FB_GRAPH}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json().catch(() => ({})) as { id?: string };
  if (!response.ok || !data.id) throw new Error(`Facebook Graph API returned HTTP ${response.status}`);
  return data;
}
function editionLabel(edition: string) {
  const [year, month, day] = edition.split("-");
  return `${day}/${month}/${year}`;
}
async function facebookDuplicateForEdition(env: PublisherEnv, edition: string) {
  const token = env.FACEBOOK_PAGE_ACCESS_TOKEN, pageId = env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) return { verified: false, duplicateFound: false };
  let next: string | null = `${FB_GRAPH}/${pageId}/feed?fields=id,message,created_time,permalink_url&limit=50`;
  let pages = 0, duplicateFound = false;
  const label = editionLabel(edition);
  while (next && pages < 4) {
    const response: Response = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return { verified: false, duplicateFound: false };
    const data = await response.json() as { data?: Array<{message?:string;created_time?:string}>; paging?: {next?:string} };
    for (const post of data.data || []) {
      const message = post.message || "";
      if (message.includes(label) && /morning brief|wall street|primesphere|portfolio intelligence/i.test(message)) {
        duplicateFound = true;
        break;
      }
    }
    next = data.paging?.next || null;
    pages++;
    if (duplicateFound) break;
  }
  return { verified: duplicateFound || pages > 0, duplicateFound };
}

// Public, read-only image URLs for Meta's media ingestion. Only approved files are uploaded
// through the separately authenticated publisher endpoint.
app.get("/api/media/:edition/:filename", async (c) => {
  if (!c.env.INSTAGRAM_MEDIA) return c.notFound();
  const edition = c.req.param("edition");
  const filename = c.req.param("filename");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition) || !/^card_0[1-8]\.(png|jpg|jpeg)$/.test(filename)) return c.notFound();
  const object = await c.env.INSTAGRAM_MEDIA.get(`${edition}/${filename}`);
  if (!object) return c.notFound();
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "image/png",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

// Authenticated access to the approved background library in R2.
app.get("/api/publisher/background/:number", async (c) => {
  if (!c.env.INSTAGRAM_MEDIA) return c.notFound();
  const number = Number(c.req.param("number"));
  if (!Number.isInteger(number) || number < 1 || number > 38) return c.notFound();
  const object = await c.env.INSTAGRAM_MEDIA.get(`backgrounds/aprovados/Background aprovado (${number}).png`);
  if (!object) return c.notFound();
  return new Response(object.body, { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
});

app.post("/api/publisher/media/:edition/:filename", async (c) => {
  if (!c.env.INSTAGRAM_MEDIA) return c.json({ error: "R2 binding missing" }, 503);
  const edition = c.req.param("edition");
  const filename = c.req.param("filename");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition) || !/^card_0[1-8]\.(png|jpg|jpeg)$/.test(filename)) {
    return c.json({ error: "Invalid media path" }, 400);
  }
  const type = c.req.header("content-type")?.split(";")[0].toLowerCase();
  if (type !== "image/png" && type !== "image/jpeg") return c.json({ error: "PNG or JPEG required" }, 415);
  const size = Number(c.req.header("content-length") || 0);
  if (size > 8_000_000) return c.json({ error: "File too large" }, 413);
  const bytes = await c.req.arrayBuffer();
  if (bytes.byteLength > 8_000_000 || !bytes.byteLength) return c.json({ error: "Invalid image size" }, 413);
  const signature = new Uint8Array(bytes.slice(0, 8));
  const isPng = signature.join(",") === "137,80,78,71,13,10,26,10";
  const isJpeg = signature[0] === 255 && signature[1] === 216 && signature[2] === 255;
  if ((type === "image/png" && !isPng) || (type === "image/jpeg" && !isJpeg)) return c.json({ error: "Image signature mismatch" }, 415);
  await c.env.INSTAGRAM_MEDIA.put(`${edition}/${filename}`, bytes, { httpMetadata: { contentType: type } });
  return c.json({ uploaded: true, imageUrl: new URL(`/api/media/${edition}/${filename}`, c.req.url).toString() }, 201);
});

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


type DailyEdition = { edition: string; caption: string; approved: boolean };
function madridEdition(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (key: string) => parts.find((part) => part.type === key)?.value || "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}
async function dailyReadiness(env: PublisherEnv, edition: string) {
  if (!env.INSTAGRAM_MEDIA) return { ready: false, reason: "R2 unavailable" };
  const [manifest, published, ...cards] = await Promise.all([
    env.INSTAGRAM_MEDIA.get(`${edition}/manifest.json`),
    env.INSTAGRAM_MEDIA.get(`${edition}/published.json`),
    ...Array.from({ length: 8 }, (_, i) => env.INSTAGRAM_MEDIA!.head(`${edition}/card_${String(i + 1).padStart(2, "0")}.png`)),
  ]);
  const metadata = manifest ? await manifest.json<DailyEdition>().catch(() => null) : null;
  const missing = cards.flatMap((card, i) => card ? [] : [i + 1]);
  return { ready: !!metadata?.approved && metadata.edition === edition && !!metadata.caption && !missing.length && !published,
    approved: !!metadata?.approved, missingCards: missing, alreadyPublished: !!published, caption: metadata?.caption };
}
async function metaDuplicateForEdition(env: PublisherEnv, edition: string) {
  const token = env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { verified: false, duplicateFound: false };
  let next: string | null = `${GRAPH}/me/media?fields=id,caption,timestamp,permalink,media_type&limit=50`;
  let pages = 0, reachedEarlierDate = false, duplicateFound = false;
  while (next && pages < 10) {
    const response: Response = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return { verified: false, duplicateFound: false };
    const data = await response.json() as { data?: Array<{caption?:string;timestamp?:string}>; paging?: {next?:string} };
    for (const media of data.data || []) {
      const day = media.timestamp?.slice(0,10);
      if (day && day < edition) reachedEarlierDate = true;
      if (day === edition && /wall street|antes da abertura|primesphere|portfolio intelligence/i.test(media.caption || "")) duplicateFound = true;
    }
    next = data.paging?.next || null; pages++;
    if (reachedEarlierDate || duplicateFound) break;
  }
  return { verified: duplicateFound || reachedEarlierDate || !next, duplicateFound };
}
async function publishDaily(env: PublisherEnv, origin: string, edition: string) {
  const state = await dailyReadiness(env, edition);
  if (!state.ready || !state.caption || !env.INSTAGRAM_ACCESS_TOKEN || !env.INSTAGRAM_USER_ID || !env.INSTAGRAM_MEDIA)
    return { published: false, reason: "Edition not ready, already published, or Instagram not configured" };
  const duplicate = await metaDuplicateForEdition(env, edition);
  if (!duplicate.verified) return { published: false, reason: "Meta duplicate check incomplete; publication blocked" };
  if (duplicate.duplicateFound) return { published: false, reason: "Equivalent Instagram edition already exists; publication blocked" };
  // An in-progress marker prevents an automatic retry after an ambiguous Meta response.
  const marker = `${edition}/publishing.json`;
  if (await env.INSTAGRAM_MEDIA.head(marker)) return { published: false, reason: "Publishing already attempted; manual review required" };
  await env.INSTAGRAM_MEDIA.put(marker, JSON.stringify({ startedAt: new Date().toISOString() }), { httpMetadata: { contentType: "application/json" } });
  const token = env.INSTAGRAM_ACCESS_TOKEN, userId = env.INSTAGRAM_USER_ID;
  const children: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const filename = `card_${String(i).padStart(2, "0")}.png`;
    const imageUrl = new URL(`/api/media/${edition}/${filename}`, origin).toString();
    const child = await metaPost(`${userId}/media`, token, { image_url: imageUrl, is_carousel_item: "true" });
    children.push(child.id!);
  }
  for (const id of children) await waitForMedia(id, token);
  const carousel = await metaPost(`${userId}/media`, token, { media_type: "CAROUSEL", children: children.join(","), caption: state.caption });
  await waitForMedia(carousel.id!, token);
  const result = await metaPost(`${userId}/media_publish`, token, { creation_id: carousel.id! });
  await env.INSTAGRAM_MEDIA.put(`${edition}/published.json`, JSON.stringify({ mediaId: result.id, publishedAt: new Date().toISOString() }), { httpMetadata: { contentType: "application/json" } });
  return { published: true, mediaId: result.id };
}
// Publish one approved edition through the same guarded daily pipeline.
// This endpoint never accepts tokens or captions from the caller; it reads the approved
// manifest and media already staged in R2, checks duplicates, and writes published.json.
app.post("/api/publisher/instagram/publish/:edition", async (c) => {
  const edition = c.req.param("edition");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition)) return c.json({ error: "Invalid edition" }, 400);
  try {
    const result = await publishDaily(c.env, new URL(c.req.url).origin, edition);
    return c.json(result, result.published ? 200 : 409);
  } catch {
    return c.json({ published: false, reason: "Instagram publication failed; review Worker logs before retrying" }, 502);
  }
});


async function facebookReadiness(env: PublisherEnv, edition: string) {
  if (!env.INSTAGRAM_MEDIA) return { ready: false, reason: "R2 unavailable" };
  const [manifest, published, ...cards] = await Promise.all([
    env.INSTAGRAM_MEDIA.get(`${edition}/manifest.json`),
    env.INSTAGRAM_MEDIA.get(`${edition}/facebook-published.json`),
    ...Array.from({ length: 8 }, (_, i) => env.INSTAGRAM_MEDIA!.head(`${edition}/card_${String(i + 1).padStart(2, "0")}.png`)),
  ]);
  const metadata = manifest ? await manifest.json<DailyEdition>().catch(() => null) : null;
  const missing = cards.flatMap((card, i) => card ? [] : [i + 1]);
  return {
    ready: !!metadata?.approved && metadata.edition === edition && !!metadata.caption && !missing.length && !published,
    approved: !!metadata?.approved,
    missingCards: missing,
    alreadyPublished: !!published,
    caption: metadata?.caption,
  };
}

app.get("/api/publisher/facebook/duplicates/:edition", async (c) => {
  const edition = c.req.param("edition");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition)) return c.json({ error: "Invalid edition" }, 400);
  try {
    const result = await facebookDuplicateForEdition(c.env, edition);
    return c.json({ edition, ...result });
  } catch {
    return c.json({ edition, verified: false, duplicateFound: false, reason: "Facebook duplicate check failed" }, 502);
  }
});

app.get("/api/publisher/facebook/edition/:edition", async (c) => {
  const edition = c.req.param("edition");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition)) return c.json({ error: "Invalid edition" }, 400);
  const state = await facebookReadiness(c.env, edition);
  return c.json(state);
});

app.post("/api/publisher/facebook/publish/:edition", async (c) => {
  const edition = c.req.param("edition");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition)) return c.json({ error: "Invalid edition" }, 400);
  const token = c.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = c.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) return c.json({ published: false, reason: "Facebook Page not configured" }, 503);
  try {
    const state = await facebookReadiness(c.env, edition);
    if (!state.ready || !state.caption || !c.env.INSTAGRAM_MEDIA)
      return c.json({ published: false, reason: "Edition not ready or Facebook edition already published" }, 409);

    const duplicate = await facebookDuplicateForEdition(c.env, edition);
    if (!duplicate.verified) return c.json({ published: false, reason: "Facebook duplicate check incomplete; publication blocked" }, 409);
    if (duplicate.duplicateFound) return c.json({ published: false, reason: "Equivalent Facebook edition already exists; publication blocked" }, 409);

    const marker = `${edition}/facebook-publishing.json`;
    if (await c.env.INSTAGRAM_MEDIA.head(marker))
      return c.json({ published: false, reason: "Facebook publishing already attempted; manual review required" }, 409);
    await c.env.INSTAGRAM_MEDIA.put(marker, JSON.stringify({ startedAt: new Date().toISOString() }), { httpMetadata: { contentType: "application/json" } });

    const mediaIds: string[] = [];
    const origin = new URL(c.req.url).origin;
    for (let i = 1; i <= 8; i++) {
      const filename = `card_${String(i).padStart(2, "0")}.png`;
      const imageUrl = new URL(`/api/media/${edition}/${filename}`, origin).toString();
      const photo = await facebookPost(`${pageId}/photos`, token, { url: imageUrl, published: "false" });
      mediaIds.push(photo.id!);
    }

    const params: Record<string, string> = { message: state.caption };
    mediaIds.forEach((id, index) => { params[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id }); });
    const post = await facebookPost(`${pageId}/feed`, token, params);
    await c.env.INSTAGRAM_MEDIA.put(
      `${edition}/facebook-published.json`,
      JSON.stringify({ postId: post.id, publishedAt: new Date().toISOString() }),
      { httpMetadata: { contentType: "application/json" } },
    );
    return c.json({ published: true, postId: post.id });
  } catch {
    return c.json({ published: false, reason: "Facebook publication failed; review Worker logs and Page permissions before retrying" }, 502);
  }
});

// Upload an explicitly approved daily caption; no automated publishing until enabled.
app.post("/api/publisher/instagram/edition/:edition", async (c) => {
  const edition = c.req.param("edition");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition)) return c.json({ error: "Invalid edition" }, 400);
  if (!c.env.INSTAGRAM_MEDIA) return c.json({ error: "R2 unavailable" }, 503);
  const body = await c.req.json<{ caption?: string; approved?: boolean }>().catch(() => null);
  if (!body || typeof body.caption !== "string" || !body.caption.trim() || body.caption.length > 2200 || body.approved !== true)
    return c.json({ error: "Approved caption required (max 2200 chars)" }, 400);
  await c.env.INSTAGRAM_MEDIA.put(`${edition}/manifest.json`, JSON.stringify({ edition, caption: body.caption, approved: true }), { httpMetadata: { contentType: "application/json" } });
  return c.json({ saved: true, edition });
});
app.get("/api/publisher/instagram/edition/:edition", async (c) => {
  const edition = c.req.param("edition");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition)) return c.json({ error: "Invalid edition" }, 400);
  const state = await dailyReadiness(c.env, edition);
  const { caption: _caption, ...safeState } = state;
  return c.json({ edition, ...safeState, automationEnabled: c.env.AUTO_PUBLISH_ENABLED === "true" });
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: PublisherEnv, ctx: ExecutionContext) {
    if (env.AUTO_PUBLISH_ENABLED !== "true") return;
    const now = madridEdition(new Date());
    // Cron runs at 14:00 and 15:00 UTC; publish only at 16:00 Madrid, including DST.
    if (now.hour !== 16) return;
    ctx.waitUntil(publishDaily(env, "https://primesphereintelligence.com", now.date).catch((error) => {
      console.error("Daily Instagram publish failed; publishing marker retained for manual review", String(error));
    }));
  },
};

