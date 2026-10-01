PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_permissions (
  plan_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY (plan_id, permission),
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  subscription_status TEXT NOT NULL DEFAULT 'active',
  plan_id TEXT,
  access_expires_at TEXT,
  billing_provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  effect TEXT NOT NULL DEFAULT 'allow',
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, permission),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at);

INSERT OR IGNORE INTO plans (id, code, name, description, active, created_at, updated_at)
VALUES
  ('plan-trades', 'TRADES', 'Trades', 'Acesso à carteira principal RM.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan-educacional', 'EDUCACIONAL', 'Educacional', 'Acesso à biblioteca e aos estudos educacionais.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan-premium', 'PREMIUM', 'Premium', 'Trades RM e biblioteca Educacional.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan-internal-eb', 'INTERNAL_EB', 'Interno EB', 'Acesso interno RM + EB + Educacional.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan-internal-dc', 'INTERNAL_DC', 'Interno DC', 'Acesso interno RM + DC + Educacional.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan-internal-full', 'INTERNAL_FULL', 'Interno Completo', 'Acesso interno a todos os Trades e ao Educacional.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO plan_permissions (plan_id, permission) VALUES
  ('plan-trades', 'trades.rm'),
  ('plan-educacional', 'education.*'),
  ('plan-premium', 'trades.rm'),
  ('plan-premium', 'education.*'),
  ('plan-internal-eb', 'trades.rm'),
  ('plan-internal-eb', 'trades.eb'),
  ('plan-internal-eb', 'education.*'),
  ('plan-internal-dc', 'trades.rm'),
  ('plan-internal-dc', 'trades.dc'),
  ('plan-internal-dc', 'education.*'),
  ('plan-internal-full', 'trades.*'),
  ('plan-internal-full', 'education.*');
