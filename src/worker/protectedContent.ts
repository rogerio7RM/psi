import type { Hono } from "hono";
import { getCookie } from "hono/cookie";

type AccessRow = {
  id: string;
  role: string;
  status: string;
  subscription_status: string;
  access_expires_at: string | null;
  plan_id: string | null;
};

const enc = new TextEncoder();

async function sha256(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function accessActive(row: AccessRow) {
  if (row.role === "admin") return row.status === "active";
  if (row.status !== "active") return false;
  if (!["active", "trial", "internal"].includes(row.subscription_status)) return false;
  return !row.access_expires_at || Date.parse(row.access_expires_at) > Date.now();
}

function permissionMatches(granted: string, required: string) {
  if (granted === "*" || granted === required) return true;
  return granted.endsWith(".*") && required.startsWith(granted.slice(0, -1));
}

async function canAccess(c: any, permission: string) {
  const db = c.env.AUTH_DB as D1Database | undefined;
  if (!db) return false;
  const token = getCookie(c, "psi_session");
  if (!token) return false;
  const row = await db.prepare(`
    SELECT u.id, u.role, u.status, u.subscription_status, u.access_expires_at, u.plan_id
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(await sha256(token), new Date().toISOString()).first<AccessRow>();
  if (!row || !accessActive(row)) return false;
  if (row.role === "admin") return true;

  const granted: string[] = [];
  if (row.plan_id) {
    const plan = await db.prepare("SELECT permission FROM plan_permissions WHERE plan_id = ?")
      .bind(row.plan_id).all<{ permission: string }>();
    granted.push(...(plan.results ?? []).map((item) => item.permission));
  }
  const overrides = await db.prepare("SELECT permission, effect FROM user_permissions WHERE user_id = ?")
    .bind(row.id).all<{ permission: string; effect: string }>();
  const permissions = new Set(granted);
  for (const item of overrides.results ?? []) {
    if (item.effect === "deny") permissions.delete(item.permission);
    else permissions.add(item.permission);
  }
  return [...permissions].some((item) => permissionMatches(item, permission));
}

async function servePrivate(c: any, key: string, permission: string, contentType?: string) {
  c.header("Cache-Control", "private, no-store");
  if (!await canAccess(c, permission)) return c.json({ error: "Authentication or permission required" }, 401);
  const bucket = c.env.PRIVATE_CONTENT as R2Bucket | undefined;
  if (!bucket) return c.json({ error: "Private content storage unavailable" }, 503);
  const object = await bucket.get(key);
  if (!object) return c.notFound();
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || contentType || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function registerProtectedLegacyContent(app: Hono<any>) {
  app.get("/data/trades.json", (c) => servePrivate(c, "trades/rm.json", "trades.rm", "application/json; charset=utf-8"));
  app.get("/data/trades-eb.json", (c) => servePrivate(c, "trades/eb.json", "trades.eb", "application/json; charset=utf-8"));
  app.get("/data/trades-dc.json", (c) => servePrivate(c, "trades/dc.json", "trades.dc", "application/json; charset=utf-8"));

  app.get("/estudos/:slug/:filename", async (c) => {
    const slug = c.req.param("slug");
    const filename = c.req.param("filename");
    if (!/^[a-z0-9-]{3,80}$/.test(slug) || !/^[a-zA-Z0-9._-]{3,160}$/.test(filename)) return c.notFound();
    const type = filename.endsWith(".pdf") ? "application/pdf"
      : filename.endsWith(".webp") ? "image/webp"
      : filename.endsWith(".png") ? "image/png"
      : "application/octet-stream";
    return servePrivate(c, `education/${slug}/${filename}`, `education.study.${slug}`, type);
  });
}
