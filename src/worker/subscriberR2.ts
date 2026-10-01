import type { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
  role: "admin" | "member";
  status: "active" | "suspended";
  subscriptionStatus: "active" | "trial" | "past_due" | "canceled" | "expired" | "internal";
  planCode: string | null;
  accessExpiresAt: string | null;
  billingProvider: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  permissions: string[];
  sessionVersion: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PlanRecord = {
  code: string;
  name: string;
  description: string;
  active: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

type SessionRecord = {
  userId: string;
  sessionVersion: number;
  createdAt: string;
  expiresAt: string;
  userAgent: string;
};

type LoginAttempt = {
  attempts: number;
  windowStartedAt: string;
  blockedUntil: string | null;
};

export type Viewer = {
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
const ROOT = "subscriber/";
const AUTH = ROOT + "auth/";

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

const defaultPlans: PlanRecord[] = [
  { code: "TRADES", name: "Trades", description: "Acesso à carteira principal RM.", active: true, permissions: ["trades.rm"], createdAt: "", updatedAt: "" },
  { code: "EDUCACIONAL", name: "Educacional", description: "Acesso à biblioteca e aos estudos educacionais.", active: true, permissions: ["education.*"], createdAt: "", updatedAt: "" },
  { code: "PREMIUM", name: "Premium", description: "Trades RM e biblioteca Educacional.", active: true, permissions: ["trades.rm", "education.*"], createdAt: "", updatedAt: "" },
  { code: "INTERNAL_EB", name: "Interno EB", description: "Acesso interno RM + EB + Educacional.", active: true, permissions: ["trades.rm", "trades.eb", "education.*"], createdAt: "", updatedAt: "" },
  { code: "INTERNAL_DC", name: "Interno DC", description: "Acesso interno RM + DC + Educacional.", active: true, permissions: ["trades.rm", "trades.dc", "education.*"], createdAt: "", updatedAt: "" },
  { code: "INTERNAL_FULL", name: "Interno Completo", description: "Acesso interno a todos os Trades e ao Educacional.", active: true, permissions: ["trades.*", "education.*"], createdAt: "", updatedAt: "" },
];

const enc = new TextEncoder();

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function bucket(c: any): R2Bucket | null {
  return (c.env.PRIVATE_CONTENT as R2Bucket | undefined) ?? null;
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

async function verifyPassword(password: string, user: UserRecord) {
  const computed = await derivePassword(password, user.passwordSalt, user.passwordIterations);
  if (computed.length !== user.passwordHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ user.passwordHash.charCodeAt(i);
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
  return granted.endsWith(".*") && required.startsWith(granted.slice(0, -1));
}

function isAccessActive(user: UserRecord) {
  if (user.role === "admin") return user.status === "active";
  if (user.status !== "active") return false;
  if (!["active", "trial", "internal"].includes(user.subscriptionStatus)) return false;
  return !user.accessExpiresAt || Date.parse(user.accessExpiresAt) > Date.now();
}

async function getJson<T>(store: R2Bucket, key: string): Promise<T | null> {
  const object = await store.get(key);
  if (!object) return null;
  try {
    return await object.json<T>();
  } catch {
    return null;
  }
}

async function putJson(store: R2Bucket, key: string, value: unknown) {
  await store.put(key, JSON.stringify(value), { httpMetadata: { contentType: "application/json" } });
}

async function listKeys(store: R2Bucket, prefix: string, limit = 5000) {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await store.list({ prefix, cursor, limit: Math.min(1000, Math.max(1, limit - keys.length)) });
    keys.push(...page.objects.map((item) => item.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor && keys.length < limit);
  return keys;
}

async function getPlan(store: R2Bucket, code: string | null): Promise<PlanRecord | null> {
  if (!code) return null;
  const normalized = code.toUpperCase();
  const custom = await getJson<PlanRecord>(store, AUTH + "plans/" + normalized + ".json");
  if (custom) return custom;
  return defaultPlans.find((plan) => plan.code === normalized) ?? null;
}

async function listPlans(store: R2Bucket) {
  const map = new Map(defaultPlans.map((plan) => [plan.code, { ...plan }]));
  for (const key of await listKeys(store, AUTH + "plans/")) {
    const plan = await getJson<PlanRecord>(store, key);
    if (plan) map.set(plan.code, plan);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function getUserById(store: R2Bucket, id: string) {
  return getJson<UserRecord>(store, AUTH + "users/" + id + ".json");
}

async function getUserByEmail(store: R2Bucket, email: string) {
  const emailHash = await sha256(normalizeEmail(email));
  const index = await getJson<{ userId: string }>(store, AUTH + "email/" + emailHash + ".json");
  return index?.userId ? getUserById(store, index.userId) : null;
}

async function saveUser(store: R2Bucket, user: UserRecord) {
  await putJson(store, AUTH + "users/" + user.id + ".json", user);
  await putJson(store, AUTH + "email/" + await sha256(user.email) + ".json", { userId: user.id });
}

async function hasAnyAdmin(store: R2Bucket) {
  const keys = await listKeys(store, AUTH + "users/", 1000);
  for (const key of keys) {
    const user = await getJson<UserRecord>(store, key);
    if (user?.role === "admin") return true;
  }
  return false;
}

async function bootstrapRequired(store: R2Bucket) {
  const config = await getJson<{ adminBootstrapped?: boolean }>(store, AUTH + "config.json");
  if (config?.adminBootstrapped) return false;
  return !(await hasAnyAdmin(store));
}

async function effectivePermissions(store: R2Bucket, user: UserRecord) {
  if (user.role === "admin") return ["*"];
  const plan = await getPlan(store, user.planCode);
  return [...new Set([...(plan?.active ? plan.permissions : []), ...user.permissions.filter(validPermission)])].sort();
}

async function toViewer(store: R2Bucket, user: UserRecord): Promise<Viewer> {
  const active = isAccessActive(user);
  const plan = await getPlan(store, user.planCode);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    subscriptionStatus: user.subscriptionStatus,
    accessExpiresAt: user.accessExpiresAt,
    planCode: user.planCode,
    planName: plan?.name ?? null,
    permissions: active ? await effectivePermissions(store, user) : [],
    accessActive: active,
  };
}

export function viewerHasPermission(viewer: Viewer, required: string) {
  return viewer.role === "admin" || viewer.permissions.some((permission) => permissionMatches(permission, required));
}

export async function getSubscriberViewer(c: any): Promise<Viewer | null> {
  const store = bucket(c);
  if (!store) return null;
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const session = await getJson<SessionRecord>(store, AUTH + "sessions/" + tokenHash + ".json");
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  const user = await getUserById(store, session.userId);
  if (!user || user.status !== "active" || user.sessionVersion !== session.sessionVersion) return null;
  return toViewer(store, user);
}

async function createSession(c: any, user: UserRecord) {
  const store = bucket(c);
  if (!store) throw new Error("Private storage unavailable");
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const session: SessionRecord = {
    userId: user.id,
    sessionVersion: user.sessionVersion,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    userAgent: (c.req.header("user-agent") || "").slice(0, 500),
  };
  await putJson(store, AUTH + "sessions/" + tokenHash + ".json", session);
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

async function audit(store: R2Bucket, actorUserId: string | null, action: string, targetType: string, targetId: string | null, metadata?: unknown) {
  const timestamp = nowIso();
  const key = AUTH + "audit/" + timestamp.replace(/[:.]/g, "-") + "_" + crypto.randomUUID() + ".json";
  await putJson(store, key, {
    id: crypto.randomUUID(),
    actorUserId,
    action,
    targetType,
    targetId,
    metadata: metadata ?? null,
    createdAt: timestamp,
  });
}

async function requireViewer(c: any, permission?: string) {
  const viewer = await getSubscriberViewer(c);
  if (!viewer) return c.json({ error: "Authentication required" }, 401);
  if (!viewer.accessActive && viewer.role !== "admin") return c.json({ error: "Subscription inactive" }, 403);
  if (permission && !viewerHasPermission(viewer, permission)) return c.json({ error: "Permission denied", required: permission }, 403);
  return viewer;
}

async function requireAdmin(c: any) {
  const viewer = await getSubscriberViewer(c);
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

function publicUser(user: UserRecord, plan: PlanRecord | null) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    subscription_status: user.subscriptionStatus,
    access_expires_at: user.accessExpiresAt,
    last_login_at: user.lastLoginAt,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    billing_provider: user.billingProvider,
    provider_customer_id: user.providerCustomerId,
    provider_subscription_id: user.providerSubscriptionId,
    plan_code: user.planCode,
    plan_name: plan?.name ?? null,
    permissions: user.permissions,
  };
}

export function registerSubscriberRoutes(app: Hono<any>) {
  app.get("/api/auth/me", async (c) => {
    c.header("Cache-Control", "no-store");
    const store = bucket(c);
    if (!store) return c.json({ configured: false, authenticated: false, bootstrapRequired: false }, 503);
    const viewer = await getSubscriberViewer(c);
    return c.json({
      configured: true,
      authenticated: !!viewer,
      bootstrapRequired: await bootstrapRequired(store),
      user: viewer,
    });
  });

  app.post("/api/auth/bootstrap", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    if (!(await bootstrapRequired(store))) return c.json({ error: "Bootstrap already completed" }, 409);
    const supplied = c.req.header("X-Setup-Key");
    if (!c.env.PUBLISH_ADMIN_KEY || supplied !== c.env.PUBLISH_ADMIN_KEY) return c.json({ error: "Invalid setup key" }, 401);
    const body = await c.req.json<{ name?: string; email?: string; password?: string }>().catch(() => null);
    const email = normalizeEmail(body?.email || "");
    const name = (body?.name || "").trim().slice(0, 120);
    const password = body?.password || "";
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !validPassword(password)) {
      return c.json({ error: "Name, valid email and password with at least 12 characters are required" }, 400);
    }
    if (await getUserByEmail(store, email)) return c.json({ error: "Email already registered" }, 409);
    const credentials = await hashPassword(password);
    const timestamp = nowIso();
    const user: UserRecord = {
      id: crypto.randomUUID(), email, name,
      passwordHash: credentials.hash, passwordSalt: credentials.salt, passwordIterations: credentials.iterations,
      role: "admin", status: "active", subscriptionStatus: "internal", planCode: "INTERNAL_FULL",
      accessExpiresAt: null, billingProvider: null, providerCustomerId: null, providerSubscriptionId: null,
      permissions: [], sessionVersion: 1, lastLoginAt: timestamp, createdAt: timestamp, updatedAt: timestamp,
    };
    await saveUser(store, user);
    await putJson(store, AUTH + "config.json", { adminBootstrapped: true, updatedAt: timestamp });
    await createSession(c, user);
    await audit(store, user.id, "bootstrap_admin", "user", user.id);
    return c.json({ created: true, user: await toViewer(store, user) }, 201);
  });

  app.post("/api/auth/login", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const body = await c.req.json<{ email?: string; password?: string }>().catch(() => null);
    const email = normalizeEmail(body?.email || "");
    const password = body?.password || "";
    if (!email || !password || password.length > 128) return c.json({ error: "Invalid credentials" }, 401);

    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const attemptKey = AUTH + "login-attempts/" + await sha256(ip + "|" + email) + ".json";
    const attempt = await getJson<LoginAttempt>(store, attemptKey);
    if (attempt?.blockedUntil && Date.parse(attempt.blockedUntil) > Date.now()) {
      return c.json({ error: "Too many attempts. Try again later." }, 429);
    }

    const user = await getUserByEmail(store, email);
    const ok = !!user && user.status === "active" && await verifyPassword(password, user);
    if (!ok) {
      const expiredWindow = !attempt || Date.now() - Date.parse(attempt.windowStartedAt) > LOGIN_WINDOW_MS;
      const attempts = expiredWindow ? 1 : attempt.attempts + 1;
      await putJson(store, attemptKey, {
        attempts,
        windowStartedAt: expiredWindow ? nowIso() : attempt!.windowStartedAt,
        blockedUntil: attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOGIN_WINDOW_MS).toISOString() : null,
      } satisfies LoginAttempt);
      return c.json({ error: "Invalid credentials" }, 401);
    }

    await store.delete(attemptKey);
    user.lastLoginAt = nowIso();
    user.updatedAt = user.lastLoginAt;
    await saveUser(store, user);
    await createSession(c, user);
    await audit(store, user.id, "login", "session", null);
    return c.json({ authenticated: true, user: await toViewer(store, user) });
  });

  app.post("/api/auth/logout", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const store = bucket(c);
    const token = getCookie(c, SESSION_COOKIE);
    if (store && token) await store.delete(AUTH + "sessions/" + await sha256(token) + ".json");
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ authenticated: false });
  });

  app.post("/api/auth/change-password", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const viewer = await requireViewer(c);
    if (viewer instanceof Response) return viewer;
    const body = await c.req.json<{ currentPassword?: string; newPassword?: string }>().catch(() => null);
    if (!body?.currentPassword || !body?.newPassword || !validPassword(body.newPassword)) {
      return c.json({ error: "New password must have at least 12 characters" }, 400);
    }
    const user = await getUserById(store, viewer.id);
    if (!user || !await verifyPassword(body.currentPassword, user)) return c.json({ error: "Current password is incorrect" }, 401);
    const credentials = await hashPassword(body.newPassword);
    user.passwordHash = credentials.hash;
    user.passwordSalt = credentials.salt;
    user.passwordIterations = credentials.iterations;
    user.sessionVersion += 1;
    user.updatedAt = nowIso();
    await saveUser(store, user);
    await createSession(c, user);
    await audit(store, user.id, "change_password", "user", user.id);
    return c.json({ changed: true });
  });

  app.get("/api/content/trades/:account", async (c) => {
    c.header("Cache-Control", "private, no-store");
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const account = c.req.param("account").toLowerCase();
    if (!["rm", "eb", "dc"].includes(account)) return c.notFound();
    const viewer = await requireViewer(c, "trades." + account);
    if (viewer instanceof Response) return viewer;
    const object = await store.get(ROOT + "trades/" + account + ".json");
    if (!object) return c.json({ error: "Trade data unavailable" }, 404);
    return new Response(object.body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  });

  app.get("/api/content/education/:slug/:filename", async (c) => {
    c.header("Cache-Control", "private, no-store");
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const slug = c.req.param("slug");
    const filename = c.req.param("filename");
    if (!/^[a-z0-9-]{3,80}$/.test(slug) || !/^[a-zA-Z0-9._-]{3,160}$/.test(filename)) return c.notFound();
    const viewer = await requireViewer(c, "education.study." + slug);
    if (viewer instanceof Response) return viewer;
    const object = await store.get(ROOT + "education/" + slug + "/" + filename);
    if (!object) return c.notFound();
    return new Response(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType || contentType(filename), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  });

  app.get("/data/trades.json", (c) => c.notFound());
  app.get("/data/trades-eb.json", (c) => c.notFound());
  app.get("/data/trades-dc.json", (c) => c.notFound());
  app.get("/estudos/*", (c) => c.notFound());

  app.put("/api/publisher/private/trades/:account", async (c) => {
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const account = c.req.param("account").toLowerCase();
    if (!["rm", "eb", "dc"].includes(account)) return c.json({ error: "Invalid account" }, 400);
    const raw = await c.req.text();
    if (!raw || raw.length > 2_000_000) return c.json({ error: "Invalid payload size" }, 413);
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return c.json({ error: "Invalid JSON" }, 400); }
    if (!Array.isArray(parsed?.rows)) return c.json({ error: "Invalid trade snapshot" }, 400);
    await store.put(ROOT + "trades/" + account + ".json", raw, { httpMetadata: { contentType: "application/json" } });
    return c.json({ stored: true, account, rows: parsed.rows.length });
  });

  app.put("/api/publisher/private/education/:slug/:filename", async (c) => {
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const slug = c.req.param("slug");
    const filename = c.req.param("filename");
    if (!/^[a-z0-9-]{3,80}$/.test(slug) || !/^[a-zA-Z0-9._-]{3,160}$/.test(filename)) return c.json({ error: "Invalid path" }, 400);
    const body = await c.req.arrayBuffer();
    if (!body.byteLength || body.byteLength > 30_000_000) return c.json({ error: "Invalid file" }, 413);
    await store.put(ROOT + "education/" + slug + "/" + filename, body, { httpMetadata: { contentType: c.req.header("content-type") || contentType(filename) } });
    return c.json({ stored: true, slug, filename });
  });

  app.get("/api/admin/permissions", async (c) => {
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    return c.json({ permissions: [
      { code: "trades.rm", label: "Trades RM" },
      { code: "trades.eb", label: "Trades EB" },
      { code: "trades.dc", label: "Trades DC" },
      { code: "trades.*", label: "Todos os Trades" },
      { code: "education.library", label: "Biblioteca Educacional" },
      { code: "education.*", label: "Todo o Educacional" },
      { code: "education.study.matematica-zero-dte", label: "Estudo: Matemática do Zero DTE" },
      { code: "education.study.analise-quantitativa-put-spreads-0-dte", label: "Estudo: Put Spreads 0 DTE" },
    ] });
  });

  app.get("/api/admin/plans", async (c) => {
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const plans = await listPlans(store);
    return c.json({ plans: plans.map((plan) => ({ id: plan.code, ...plan })) });
  });

  app.put("/api/admin/plans/:code", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const code = c.req.param("code").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,40}$/.test(code)) return c.json({ error: "Invalid plan code" }, 400);
    const body = await c.req.json<{ name?: string; description?: string; active?: boolean; permissions?: string[] }>().catch(() => null);
    const previous = await getPlan(store, code);
    const timestamp = nowIso();
    const plan: PlanRecord = {
      code,
      name: (body?.name || previous?.name || code).trim().slice(0, 100),
      description: (body?.description ?? previous?.description ?? "").trim().slice(0, 500),
      active: body?.active ?? previous?.active ?? true,
      permissions: Array.isArray(body?.permissions) ? [...new Set(body!.permissions!.filter(validPermission))] : previous?.permissions ?? [],
      createdAt: previous?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    await putJson(store, AUTH + "plans/" + code + ".json", plan);
    await audit(store, viewer.id, previous ? "update_plan" : "create_plan", "plan", code);
    return c.json({ saved: true, code });
  });

  app.get("/api/admin/users", async (c) => {
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const users: ReturnType<typeof publicUser>[] = [];
    for (const key of await listKeys(store, AUTH + "users/")) {
      const user = await getJson<UserRecord>(store, key);
      if (!user) continue;
      users.push(publicUser(user, await getPlan(store, user.planCode)));
    }
    users.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return c.json({ users });
  });

  app.post("/api/admin/users", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const body = await c.req.json<any>().catch(() => null);
    const email = normalizeEmail(body?.email || "");
    const name = String(body?.name || "").trim().slice(0, 120);
    const password = String(body?.password || "");
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !validPassword(password)) {
      return c.json({ error: "Name, valid email and temporary password with at least 12 characters are required" }, 400);
    }
    if (await getUserByEmail(store, email)) return c.json({ error: "Email already registered" }, 409);
    const requestedPlan = body?.planCode ? await getPlan(store, body.planCode) : null;
    const credentials = await hashPassword(password);
    const timestamp = nowIso();
    const user: UserRecord = {
      id: crypto.randomUUID(), email, name,
      passwordHash: credentials.hash, passwordSalt: credentials.salt, passwordIterations: credentials.iterations,
      role: body?.role === "admin" ? "admin" : "member",
      status: body?.status === "suspended" ? "suspended" : "active",
      subscriptionStatus: ["active", "trial", "past_due", "canceled", "expired", "internal"].includes(body?.subscriptionStatus) ? body.subscriptionStatus : "active",
      planCode: requestedPlan?.code ?? null,
      accessExpiresAt: body?.accessExpiresAt || null,
      billingProvider: body?.billingProvider || null,
      providerCustomerId: body?.providerCustomerId || null,
      providerSubscriptionId: body?.providerSubscriptionId || null,
      permissions: Array.isArray(body?.permissions) ? body.permissions.filter(validPermission) : [],
      sessionVersion: 1, lastLoginAt: null, createdAt: timestamp, updatedAt: timestamp,
    };
    await saveUser(store, user);
    await audit(store, viewer.id, "create_user", "user", user.id, { email, planCode: user.planCode });
    return c.json({ created: true, id: user.id }, 201);
  });

  app.patch("/api/admin/users/:id", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const user = await getUserById(store, c.req.param("id"));
    if (!user) return c.notFound();
    const body = await c.req.json<any>().catch(() => null);
    if (!body) return c.json({ error: "Invalid JSON" }, 400);
    if (body.name !== undefined) user.name = String(body.name).trim().slice(0, 120);
    if (body.role !== undefined) user.role = body.role === "admin" ? "admin" : "member";
    if (body.status !== undefined) user.status = body.status === "suspended" ? "suspended" : "active";
    if (body.subscriptionStatus !== undefined && ["active", "trial", "past_due", "canceled", "expired", "internal"].includes(body.subscriptionStatus)) user.subscriptionStatus = body.subscriptionStatus;
    if (body.planCode !== undefined) user.planCode = (await getPlan(store, body.planCode))?.code ?? null;
    if (body.accessExpiresAt !== undefined) user.accessExpiresAt = body.accessExpiresAt || null;
    if (body.billingProvider !== undefined) user.billingProvider = body.billingProvider || null;
    if (body.providerCustomerId !== undefined) user.providerCustomerId = body.providerCustomerId || null;
    if (body.providerSubscriptionId !== undefined) user.providerSubscriptionId = body.providerSubscriptionId || null;
    if (Array.isArray(body.permissions)) user.permissions = [...new Set((body.permissions as unknown[]).filter((permission): permission is string => typeof permission === "string" && validPermission(permission)))];
    user.updatedAt = nowIso();
    await saveUser(store, user);
    await audit(store, viewer.id, "update_user", "user", user.id, { status: user.status, subscriptionStatus: user.subscriptionStatus, planCode: user.planCode });
    return c.json({ saved: true });
  });

  app.post("/api/admin/users/:id/password", async (c) => {
    if (!sameOrigin(c)) return c.json({ error: "Invalid origin" }, 403);
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const user = await getUserById(store, c.req.param("id"));
    if (!user) return c.notFound();
    const body = await c.req.json<{ password?: string }>().catch(() => null);
    const password = body?.password || "";
    if (!validPassword(password)) return c.json({ error: "Password must have at least 12 characters" }, 400);
    const credentials = await hashPassword(password);
    user.passwordHash = credentials.hash;
    user.passwordSalt = credentials.salt;
    user.passwordIterations = credentials.iterations;
    user.sessionVersion += 1;
    user.updatedAt = nowIso();
    await saveUser(store, user);
    await audit(store, viewer.id, "reset_password", "user", user.id);
    return c.json({ changed: true });
  });

  app.get("/api/admin/audit", async (c) => {
    const store = bucket(c);
    if (!store) return c.json({ error: "Private storage unavailable" }, 503);
    const viewer = await requireAdmin(c);
    if (viewer instanceof Response) return viewer;
    const keys = (await listKeys(store, AUTH + "audit/", 1000)).sort().reverse().slice(0, 100);
    const events = [];
    for (const key of keys) {
      const event = await getJson<any>(store, key);
      if (event) events.push(event);
    }
    return c.json({ events });
  });
}
