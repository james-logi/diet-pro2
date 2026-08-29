-- diet-pro2 D1 schema
-- Run this once in the Cloudflare dashboard D1 Console (or `wrangler d1 execute`).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'F',
  height_cm REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weight_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  weight_kg REAL NOT NULL,
  measured_at TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, date);

CREATE TABLE IF NOT EXISTS diet_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  start_weight_kg REAL NOT NULL,
  target_weight_kg REAL NOT NULL,
  duration_months INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  target_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diet_goals_user ON diet_goals(user_id, created_at);

CREATE TABLE IF NOT EXISTS plan_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_id TEXT NOT NULL REFERENCES diet_goals(id),
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  bmi REAL NOT NULL,
  target_weight_kg REAL NOT NULL,
  duration_months INTEGER NOT NULL,
  goal_status TEXT NOT NULL,
  note TEXT,
  saved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plan_snapshots_user ON plan_snapshots(user_id, saved_at);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_id TEXT,
  total_price INTEGER NOT NULL,
  ordered_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '결제대기',
  payment_key TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, ordered_at);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_id TEXT NOT NULL REFERENCES diet_goals(id),
  rule TEXT NOT NULL,
  gift_type TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '지급완료'
);
CREATE INDEX IF NOT EXISTS idx_gifts_user ON gifts(user_id, issued_at);
