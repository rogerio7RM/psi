import type { Hono } from "hono";
import { getSubscriberViewer, viewerHasPermission } from "./subscriberR2";

const ROOT = "subscriber/";

async function serveProtected(
  c: any,
  key: string,
  permission: string,
  fallbackAssetPath: string,
  contentType?: string,
) {
  c.header("Cache-Control", "private, no-store");
  const viewer = await getSubscriberViewer(c);
  if (!viewer) return c.json({ error: "Authentication required" }, 401);
  if (!viewer.accessActive && viewer.role !== "admin") return c.json({ error: "Subscription inactive" }, 403);
  if (!viewerHasPermission(viewer, permission)) return c.json({ error: "Permission denied" }, 403);

  const store = c.env.PRIVATE_CONTENT as R2Bucket | undefined;
  const object = store ? await store.get(key) : null;
  if (object) {
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || contentType || "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const assets = c.env.ASSETS as Fetcher | undefined;
  if (!assets) return c.notFound();
  const url = new URL(c.req.url);
  url.pathname = fallbackAssetPath;
  url.search = "";
  const assetResponse = await assets.fetch(new Request(url.toString(), {
    method: "GET",
    headers: c.req.raw.headers,
  }));
  if (!assetResponse.ok) return c.notFound();

  const headers = new Headers(assetResponse.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  if (contentType && !headers.get("Content-Type")) headers.set("Content-Type", contentType);
  return new Response(assetResponse.body, { status: assetResponse.status, headers });
}

export function registerProtectedLegacyContent(app: Hono<any>) {
  app.get("/data/trades.json", (c) =>
    serveProtected(c, ROOT + "trades/rm.json", "trades.rm", "/data/trades.json", "application/json; charset=utf-8"));
  app.get("/data/trades-eb.json", (c) =>
    serveProtected(c, ROOT + "trades/eb.json", "trades.eb", "/data/trades-eb.json", "application/json; charset=utf-8"));
  app.get("/data/trades-dc.json", (c) =>
    serveProtected(c, ROOT + "trades/dc.json", "trades.dc", "/data/trades-dc.json", "application/json; charset=utf-8"));

  app.get("/estudos/:slug/:filename", async (c) => {
    const slug = c.req.param("slug");
    const filename = c.req.param("filename");
    if (!/^[a-z0-9-]{3,80}$/.test(slug) || !/^[a-zA-Z0-9._-]{3,160}$/.test(filename)) return c.notFound();
    const type = filename.endsWith(".pdf") ? "application/pdf"
      : filename.endsWith(".webp") ? "image/webp"
      : filename.endsWith(".png") ? "image/png"
      : "application/octet-stream";
    return serveProtected(
      c,
      ROOT + "education/" + slug + "/" + filename,
      "education.study." + slug,
      "/estudos/" + slug + "/" + filename,
      type,
    );
  });
}
