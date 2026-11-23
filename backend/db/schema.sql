PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'staff'
                CHECK (role IN ('admin', 'manager', 'staff')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS suppliers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One supplier / one category -> many products (one-to-many)
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sku         TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_level   INTEGER NOT NULL DEFAULT 0 CHECK (min_level >= 0),
  price       REAL    NOT NULL DEFAULT 0 CHECK (price >= 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
  supplier_id INTEGER REFERENCES suppliers(id)  ON DELETE RESTRICT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Every stock in/out is recorded here and changes products.quantity
CREATE TABLE IF NOT EXISTS stock_movements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
  type       TEXT    NOT NULL CHECK (type IN ('IN', 'OUT')),
  amount     INTEGER NOT NULL CHECK (amount > 0),
  note       TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier  ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_movements_product  ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created  ON stock_movements(created_at);