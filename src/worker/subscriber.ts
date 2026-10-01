import type { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

export type SubscriberBindings = {
  AUTH_DB?: D1Database;
  PRIVATE_CONTENT?: R2Bucket;
  PUBLISH_ADMIN_KEY?: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  subscription_status: string;
  access_expires_at: string | null;
  plan_id: string | null;
  plan_code: string | null;
  plan_name: string | null;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  session_id?: string;
};

type Viewer = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  subscriptionStatus: string;
  accessExpiresAt: string | null;
  planCode: string | null;
  planName: string | null;
  permissions: string[];
  accessActive: boolean;
};

const SESSION_COOKIE = "psi_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_ITERATIONS = 600_000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const PERMISSIONS = [
  "trades.rm",
  "trades.eb",
  "trades.dc",
  "trades.*",
  "education.library",
  "education.*",
  "education.study.matematica-zero-dte",
  "education.study.analise-quantitativa-put-spreads-0-dte",
];

const enc = new TextEncoder();

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value))));
}

async function derivePassword(password: string, saltBase64: string, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: base64ToBytes(saltBase64), iterations },
    key,
    256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function hashPassword(password: string) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const saltBase64 = bytesToBase64(salt);
  return {
    hash: await derivePassword(password, saltBase64, PASSWORD_ITERATIONS),
    salt: saltBase64,
    iterations: PASSWORD_ITERATIONS,
  };
}

async function verifyPassword(password: string, row: UserRow) {
  const computed = await derivePassword(password, row.password_salt, row.password_iterations);
  if (computed.length !== row.password_hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ row.password_hash.charCodeAt(i);
  return diff === 0;
}

function validPassword(password: string) {
  return password.length >= 12 && password.length <= 128;
}

function validPermission(permission: string) {
  return PERMISSIONS.includes(permission) || /^education\.study\.[a-z0-9-]{3,80}$/.test(permission);
}

function permissionMatches(granted: string, required: string) {
  if (granted === "*" || granted === required) return true;
  if (granted.endsWith(".*")) return required.startsWith(granted.slice(0, -1));
  return false;
}

function hasPermission(viewer: Viewer, required: string) {
  return viewer.role === "admin" || viewer.permissions.some((permission) => permissionMatches(permission, required));
}

function isAccessActive(row: Pick<UserRow, "role" | "status" | "subscription_status" | "access_expires_at">) {
  if (row.role === "admin") return row.status === "active";
  if (row.status !== "active") return false;
  if (!["active", "trial", "internal"].includes(row.subscription_status)) return false;
  if (row.access_expires_at && Date.parse(row.access_expires_at) <= Date.now()) return false;
  return true;
}

async function getPermissions(db: D1Database, row: UserRow) {
  if (row.role === "admin") return ["*"];
  const granted = new Set<string>();
  if (row.plan_id) {
    const plan = await db.prepare("SELECT permission FROM plan_permissions WHERE plan_id = ?")
      .bind(row.plan_id).all<{ permission: string }>();
    for (const item of plan.results ?? []) granted.add(item.permission);
  }
  const overrides = await db.prepare("SELECT permission, effect FROM user_permissions WHERE user_id = ?")
    .bind(row.id).all<{ permission: string; effect: string }>();
  for (const item of overrides.results ?? []) {
    if (item.effect === "deny") granted.delete(item.permission);
    else granted.add(item.permission);
  }
  return [...granted].sort();
}

async function viewerFromRow(db: D1Database, row: UserRow): Promise<Viewer> {
  const accessActive = isAccessActive(row);
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    subscriptionStatus: row.subscription_status,
    accessExpiresAt: row.access_expires_at,
    planCode: row.plan_code,
    planName: row.plan_name,
    permissions: accessActive ? await getPermissions(db, row) : [],
    accessActive,
  };
}

async function getViewer(c: any): Promise<Viewer | null> {
  const db = c.env.AUTH_DB as D1Database | undefined;
  if (!db) return null;
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await db.prepare(`
    SELECT s.id AS session_id, u.*, p.code AS plan_code, p.name AS plan_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN plans p ON p.id = u.plan_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, nowIso()).first<UserRow>();
  if (!row || row.status !== "active") {
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return null;
  }
  return viewerFromRow(db, row);
}

async function createSession(c: any, userId: string) {
  const db = c.env.AUTH_DB as D1Database;
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    userId,
    tokenHash,
    nowIso(),
    expiresAt,
    (c.req.header("user-agent") || "").slice(0, 500),
  ).run();
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

function sameOrigin(c: any) {
  const origin = c.req.header("origin");
  return !origin || origin === new URL(c.req.url).origin;
}

async function audit(db: D1Database, actorUserId: string | null, action: string, targetType: string, targetId: string | null, metadata?: unknown) {
  await db.prepare(
    "INSERT INTO audit_log (id, actor_user_id, action, target_type, target_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    actorUserId,
    action,
    targetType,
    targetId,
    metadata ? JSON.stringify(metadata).slice(0, 4000) : null,
    nowIso(),
  ).run();
}

async function authorize(c: any, permission?: string) {
  const viewer = await getViewer(c);
  if (!viewer) return c.json({ error: "Authentication required" }, 401);
  if (!viewer.accessActive && viewer.role !== "admin") return c.json({ error: "Subscription inactive" }, 403);
  if (permission && !hasPermission(viewer, permission)) return c.json({ error: "Permission denied", required: permission }, 403);
  return viewer;
}

async function requireAdmin(c: any) {
  const viewer = await getViewer(c);
  if (!viewer) return c.json({ error: "Authentication required" }, 401);
  if (viewer.role !== "admin") return c.json({ error: "Administrator access required" }, 403);
  return viewer;
}

function contentType(filename: string) {
  if (filename.endsWith(".pdf")) return "application/pdf";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".png")) return "image/png";
  if (/\.jpe?g$/i.test(filename)) return "image/jpeg";
  if (filename.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

async function planIdFromCode(db: D1Database, code: string | null | undefined) {
  if (!code) return null;
  const row = await db.prepare("SELECT id FROM plans WHERE code = ? AND active = 1").bind(code).first<{ id: string }>();
  return row?.id ?? null;
}

async function replaceUserPermissions(db: D1Database, userId: string, permissions: string[]) {
  await db.prepare("DELETE FROM user_permissions WHERE user_id = ?").bind(userId).run();
  for (const permission of [...new Set(permissions.filter(validPermission))]) {
    await db.prepare(
      "INSERT INTO user_permissions (user_id, permission, effect, created_at) VALUES (?, ?, 'allow', ?)"
    ).bind(userId, permission, nowIso()).run();
  }
}

async function replacePlanPermissions(db: D1Database, planId: string, permissions: string[]) {
  await db.prepare("DELETE FROM plan_permissions WHERE plan_id = ?").bind(planId).run();
  for (const permission of [...new Set(permissions.filter(validPermission))]) {
    await db.prepare("INSERT INTO plan_permissions (plan_id, permission) VALUES (?, ?)")
      .bind(planId, permission).run();
  }
}

export function registerSubscriberRoutes(app: Hono<any>) {
  app.get("/api/auth/me", async (c) => {
    c.header("Cache-Control", "no-store");
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ configured: false, authenticated: false, bootstrapRequired: false }, 503);
    const viewer = await getViewer(c);
    const adminCount = await db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").first<{ count: number }>();
    return c.json({
      configured: true,
      authenticated: !!viewer,
      bootstrapRequired: Number(adminCount?.count ?? 0) === 0,
      user: viewer,
    });
  });

  app.post("/api/auth/bootstrap", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const adminCount = await db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").first<{ count: number }>();
    if (Number(adminCount?.count ?? 0) > 0) return c.json({ error: "Bootstrap already completed" }, 409);
    const supplied = c.req.header("X-Setup-Key");
    if (!c.env.PUBLISH_ADMIN_KEY || supplied !== c.env.PUBLISH_ADMIN_KEY) return c.json({ error: "Invalid setup key" }, 401);
    const body = await c.req.json<{ name?: string; email?: string; password?: string }>().catch(() => null);
    const email = normalizeEmail(body?.email || "");
    const name = (body?.name || "").trim().slice(0, 120);
    const password = body?.password || "";
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !validPassword(password)) {
      return c.json({ error: "Name, valid email and password with at least 12 characters are required" }, 400);
    }
    const credentials = await hashPassword(password);
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO users (
        id, email, name, password_hash, password_salt, password_iterations,
        role, status, subscription_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'admin', 'active', 'internal', ?, ?)
    `).bind(id, email, name, credentials.hash, credentials.salt, credentials.iterations, nowIso(), nowIso()).run();
    await createSession(c, id);
    await audit(db, id, "bootstrap_admin", "user", id);
    const row = await db.prepare(`
      SELECT u.*, p.code AS plan_code, p.name AS plan_name
      FROM users u LEFT JOIN plans p ON p.id = u.plan_id WHERE u.id = ?
    `).bind(id).first<UserRow>();
    return c.json({ created: true, user: row ? await viewerFromRow(db, row) : null }, 201);
  });

  app.post("/api/auth/login", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const body = await c.req.json<{ email?: string; password?: string }>().catch(() => null);
    const email = normalizeEmail(body?.email || "");
    const password = body?.password || "";
    if (!email || !password || password.length > 128) return c.json({ error: "Invalid credentials" }, 401);

    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const attemptKey = await sha256(ip + "|" + email);
    const attempt = await db.prepare("SELECT attempts, window_started_at, blocked_until FROM login_attempts WHERE key_hash = ?")
      .bind(attemptKey).first<{ attempts: number; window_started_at: string; blocked_until: string | null }>();
    if (attempt?.blocked_until && Date.parse(attempt.blocked_until) > Date.now()) {
      return c.json({ error: "Too many attempts. Try again later." }, 429);
    }

    const row = await db.prepare(`
      SELECT u.*, p.code AS plan_code, p.name AS plan_name
      FROM users u LEFT JOIN plans p ON p.id = u.plan_id
      WHERE u.email = ? LIMIT 1
    `).bind(email).first<UserRow>();
    const ok = !!row && row.status === "active" && await verifyPassword(password, row);

    if (!ok) {
      const windowExpired = !attempt || Date.now() - Date.parse(attempt.window_started_at) > LOGIN_WINDOW_MS;
      const attempts = windowExpired ? 1 : (attempt.attempts + 1);
      const blockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOGIN_WINDOW_MS).toISOString() : null;
      await db.prepare(`
        INSERT INTO login_attempts (key_hash, attempts, window_started_at, blocked_until)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key_hash) DO UPDATE SET attempts = excluded.attempts, window_started_at = excluded.window_started_at, blocked_until = excluded.blocked_until
      `).bind(attemptKey, attempts, windowExpired ? nowIso() : attempt!.window_started_at, blockedUntil).run();
      return c.json({ error: "Invalid credentials" }, 401);
    }

    await db.prepare("DELETE FROM login_attempts WHERE key_hash = ?").bind(attemptKey).run();
    await db.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?").bind(nowIso(), nowIso(), row.id).run();
    await createSession(c, row.id);
    await audit(db, row.id, "login", "session", null);
    return c.json({ authenticated: true, user: await viewerFromRow(db, row) });
  });

  app.post("/api/auth/logout", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const db = c.env.AUTH_DB as D1Database | undefined;
    const token = getCookie(c, SESSION_COOKIE);
    if (db && token) await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ authenticated: false });
  });

  app.post("/api/auth/change-password", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const viewer = await authorize(c);
    if (viewer instanceof Response) return viewer;
    const body = await c.req.json<{ currentPassword?: string; newPassword?: string }>().catch(() => null);
    if (!body?.currentPassword || !body?.newPassword || !validPassword(body.newPassword)) {
      return c.json({ error: "New password must have at least 12 characters" }, 400);
    }
    const row = await db.prepare("SELECT * FROM users WHERE id = ?").bind(viewer.id).first<UserRow>();
    if (!row || !await verifyPassword(body.currentPassword, row)) return c.json({ error: "Current password is incorrect" }, 401);
    const credentials = await hashPassword(body.newPassword);
    await db.prepare("UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?")
      .bind(credentials.hash, credentials.salt, credentials.iterations, nowIso(), viewer.id).run();
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(viewer.id).run();
    await createSession(c, viewer.id);
    await audit(db, viewer.id, "change_password", "user", viewer.id);
    return c.json({ changed: true });
  });

  app.get("/api/content/trades/:account", async (c) => {
    c.header("Cache-Control", "private, no-store");
    const bucket = c.env.PRIVATE_CONTENT as R2Bucket | undefined;
    if (!bucket) return c.json({ error: "Private content storage unavailable" }, 503);
    const account = c.req.param("account").toLowerCase();
    if (!["rm", "eb", "dc"].includes(account)) return c.notFound();
    const viewer = await authorize(c, "trades." + account);
    if (viewer instanceof Response) return viewer;
    const object = await bucket.get("trades/" + account + ".json");
    if (!object) return c.json({ error: "Trade data unavailable" }, 404);
    return new Response(object.body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });

  app.get("/api/content/education/:slug/:filename", async (c) => {
    c.header("Cache-Control", "private, no-store");
    const bucket = c.env.PRIVATE_CONTENT as R2Bucket | undefined;
    if (!bucket) return c.json({ error: "Private content storage unavailable" }, 503);
    const slug = c.req.param("slug");
    const filename = c.req.param("filename");
    if (!/^[a-z0-9-]{3,80}$/.test(slug) || !/^[a-zA-Z0-9._-]{3,160}$/.test(filename)) return c.notFound();
    const viewer = await authorize(c, "education.study." + slug);
    if (viewer instanceof Response) return viewer;
    const object = await bucket.get("education/" + slug + "/" + filename);
    if (!object) return c.notFound();
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || contentType(filename),
        "Cache-Control": "private, no-store",
        "Content-Disposition": filename.endsWith(".pdf") ? 'inline; filename="' + filename.replace(/"/g, "") + '"' : "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });

  // Prevent paid/private material from being served by the static asset binding.
  app.get("/data/trades.json", (c) => c.notFound());
  app.get("/data/trades-eb.json", (c) => c.notFound());
  app.get("/data/trades-dc.json", (c) => c.notFound());
  app.get("/estudos/*", (c) => c.notFound());

  // Secure ingestion endpoints used by the Excel/content publishing pipeline.
  // They inherit the existing /api/publisher/* X-Publisher-Key middleware.
  app.put("/api/publisher/private/trades/:account", async (c) => {
    const bucket = c.env.PRIVATE_CONTENT as R2Bucket | undefined;
    if (!bucket) return c.json({ error: "Private content storage unavailable" }, 503);
    const account = c.req.param("account").toLowerCase();
    if (!["rm", "eb", "dc"].includes(account)) return c.json({ error: "Invalid account" }, 400);
    const raw = await c.req.text();
    if (!raw || raw.length > 2_000_000) return c.json({ error: "Invalid payload size" }, 413);
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return c.json({ error: "Invalid JSON" }, 400); }
    if (!Array.isArray(parsed?.rows) || parsed.account?.toLowerCase() !== account) return c.json({ error: "Invalid trade snapshot" }, 400);
    await bucket.put("trades/" + account + ".json", raw, { httpMetadata: { contentType: "application/json" } });
    return c.json({ stored: true, account, rows: parsed.rows.length });
  });

  app.put("/api/publisher/private/education/:slug/:filename", async (c) => {
    const bucket = c.env.PRIVATE_CONTENT as R2Bucket | undefined;
    if (!bucket) return c.json({ error: "Private content storage unavailable" }, 503);
    const slug = c.req.param("slug");
    const filename = c.req.param("filename");
    if (!/^[a-z0-9-]{3,80}$/.test(slug) || !/^[a-zA-Z0-9._-]{3,160}$/.test(filename)) return c.json({ error: "Invalid path" }, 400);
    const length = Number(c.req.header("content-length") || 0);
    if (length > 30_000_000) return c.json({ error: "File too large" }, 413);
    const body = await c.req.arrayBuffer();
    if (!body.byteLength || body.byteLength > 30_000_000) return c.json({ error: "Invalid file" }, 413);
    await bucket.put("education/" + slug + "/" + filename, body, {
      httpMetadata: { contentType: c.req.header("content-type") || contentType(filename) },
    });
    return c.json({ stored: true, slug, filename });
  });

  app.get("/api/admin/permissions", async (c) => {
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    return c.json({
      permissions: [
        { code: "trades.rm", label: "Trades RM" },
        { code: "trades.eb", label: "Trades EB" },
        { code: "trades.dc", label: "Trades DC" },
        { code: "trades.*", label: "Todos os Trades" },
        { code: "education.library", label: "Biblioteca Educacional" },
        { code: "education.*", label: "Todo o Educacional" },
        { code: "education.study.matematica-zero-dte", label: "Estudo: Matemática do Zero DTE" },
        { code: "education.study.analise-quantitativa-put-spreads-0-dte", label: "Estudo: Put Spreads 0 DTE" },
      ],
    });
  });

  app.get("/api/admin/plans", async (c) => {
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const result = await db.prepare("SELECT id, code, name, description, active, created_at, updated_at FROM plans ORDER BY name").all<any>();
    const plans = [];
    for (const plan of result.results ?? []) {
      const permissions = await db.prepare("SELECT permission FROM plan_permissions WHERE plan_id = ? ORDER BY permission")
        .bind(plan.id).all<{ permission: string }>();
      plans.push({ ...plan, active: !!plan.active, permissions: (permissions.results ?? []).map((item) => item.permission) });
    }
    return c.json({ plans });
  });

  app.put("/api/admin/plans/:code", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const code = c.req.param("code").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,40}$/.test(code)) return c.json({ error: "Invalid plan code" }, 400);
    const body = await c.req.json<{ name?: string; description?: string; active?: boolean; permissions?: string[] }>().catch(() => null);
    const name = (body?.name || code).trim().slice(0, 100);
    const description = (body?.description || "").trim().slice(0, 500);
    const existing = await db.prepare("SELECT id FROM plans WHERE code = ?").bind(code).first<{ id: string }>();
    const id = existing?.id || crypto.randomUUID();
    if (existing) {
      await db.prepare("UPDATE plans SET name = ?, description = ?, active = ?, updated_at = ? WHERE id = ?")
        .bind(name, description, body?.active === false ? 0 : 1, nowIso(), id).run();
    } else {
      await db.prepare("INSERT INTO plans (id, code, name, description, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id, code, name, description, body?.active === false ? 0 : 1, nowIso(), nowIso()).run();
    }
    if (Array.isArray(body?.permissions)) await replacePlanPermissions(db, id, body!.permissions!);
    await audit(db, viewer.id, existing ? "update_plan" : "create_plan", "plan", id, { code });
    return c.json({ saved: true, code });
  });

  app.get("/api/admin/users", async (c) => {
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const result = await db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.status, u.subscription_status,
             u.access_expires_at, u.last_login_at, u.created_at, u.updated_at,
             u.billing_provider, u.provider_customer_id, u.provider_subscription_id,
             p.code AS plan_code, p.name AS plan_name
      FROM users u LEFT JOIN plans p ON p.id = u.plan_id
      ORDER BY u.created_at DESC
    `).all<any>();
    const users = [];
    for (const user of result.results ?? []) {
      const overrides = await db.prepare("SELECT permission FROM user_permissions WHERE user_id = ? AND effect = 'allow' ORDER BY permission")
        .bind(user.id).all<{ permission: string }>();
      users.push({ ...user, permissions: (overrides.results ?? []).map((item) => item.permission) });
    }
    return c.json({ users });
  });

  app.post("/api/admin/users", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const body = await c.req.json<any>().catch(() => null);
    const email = normalizeEmail(body?.email || "");
    const name = String(body?.name || "").trim().slice(0, 120);
    const password = String(body?.password || "");
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !validPassword(password)) {
      return c.json({ error: "Name, valid email and temporary password with at least 12 characters are required" }, 400);
    }
    const exists = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (exists) return c.json({ error: "Email already registered" }, 409);
    const planId = await planIdFromCode(db, body?.planCode);
    const credentials = await hashPassword(password);
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO users (
        id, email, name, password_hash, password_salt, password_iterations,
        role, status, subscription_status, plan_id, access_expires_at,
        billing_provider, provider_customer_id, provider_subscription_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, email, name, credentials.hash, credentials.salt, credentials.iterations,
      body?.role === "admin" ? "admin" : "member",
      body?.status === "suspended" ? "suspended" : "active",
      ["active", "trial", "past_due", "canceled", "expired", "internal"].includes(body?.subscriptionStatus) ? body.subscriptionStatus : "active",
      planId,
      body?.accessExpiresAt || null,
      body?.billingProvider || null,
      body?.providerCustomerId || null,
      body?.providerSubscriptionId || null,
      nowIso(), nowIso(),
    ).run();
    await replaceUserPermissions(db, id, Array.isArray(body?.permissions) ? body.permissions : []);
    await audit(db, viewer.id, "create_user", "user", id, { email, planCode: body?.planCode || null });
    return c.json({ created: true, id }, 201);
  });

  app.patch("/api/admin/users/:id", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const id = c.req.param("id");
    const current = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<any>();
    if (!current) return c.notFound();
    const body = await c.req.json<any>().catch(() => null);
    if (!body) return c.json({ error: "Invalid JSON" }, 400);
    const planId = body.planCode !== undefined ? await planIdFromCode(db, body.planCode) : current.plan_id;
    const role = body.role === undefined ? current.role : (body.role === "admin" ? "admin" : "member");
    const status = body.status === undefined ? current.status : (body.status === "suspended" ? "suspended" : "active");
    const subscriptionStatus = body.subscriptionStatus === undefined ? current.subscription_status :
      (["active", "trial", "past_due", "canceled", "expired", "internal"].includes(body.subscriptionStatus) ? body.subscriptionStatus : current.subscription_status);
    const name = body.name === undefined ? current.name : String(body.name).trim().slice(0, 120);
    const accessExpiresAt = body.accessExpiresAt === undefined ? current.access_expires_at : (body.accessExpiresAt || null);
    await db.prepare(`
      UPDATE users SET name = ?, role = ?, status = ?, subscription_status = ?, plan_id = ?, access_expires_at = ?,
        billing_provider = ?, provider_customer_id = ?, provider_subscription_id = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      name, role, status, subscriptionStatus, planId, accessExpiresAt,
      body.billingProvider === undefined ? current.billing_provider : (body.billingProvider || null),
      body.providerCustomerId === undefined ? current.provider_customer_id : (body.providerCustomerId || null),
      body.providerSubscriptionId === undefined ? current.provider_subscription_id : (body.providerSubscriptionId || null),
      nowIso(), id,
    ).run();
    if (Array.isArray(body.permissions)) await replaceUserPermissions(db, id, body.permissions);
    if (status !== "active") await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
    await audit(db, viewer.id, "update_user", "user", id, { status, subscriptionStatus, planCode: body.planCode });
    return c.json({ saved: true });
  });

  app.post("/api/admin/users/:id/password", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const id = c.req.param("id");
    const body = await c.req.json<{ password?: string }>().catch(() => null);
    const password = body?.password || "";
    if (!validPassword(password)) return c.json({ error: "Password must have at least 12 characters" }, 400);
    const exists = await db.prepare("SELECT id FROM users WHERE id = ?").bind(id).first();
    if (!exists) return c.notFound();
    const credentials = await hashPassword(password);
    await db.prepare("UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?")
      .bind(credentials.hash, credentials.salt, credentials.iterations, nowIso(), id).run();
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
    await audit(db, viewer.id, "reset_password", "user", id);
    return c.json({ changed: true });
  });

  app.get("/api/admin/audit", async (c) => {
    const db = c.env.AUTH_DB as D1Database | undefined;
    if (!db) return c.json({ error: "Authentication database unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const result = await db.prepare(`
      SELECT a.id, a.action, a.target_type, a.target_id, a.metadata_json, a.created_at,
             u.email AS actor_email, u.name AS actor_name
      FROM audit_log a LEFT JOIN users u ON u.id = a.actor_user_id
      ORDER BY a.created_at DESC LIMIT 100
    `).all<any>();
    return c.json({ events: result.results ?? [] });
  });
}
