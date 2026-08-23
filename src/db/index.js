const path = require('path');
const { DatabaseSync } = require('node:sqlite');

class SQLiteWrapper {
  constructor(dbPath) {
    this._db = new DatabaseSync(dbPath);
  }

  pragma(str) {
    try {
      this._db.exec(`PRAGMA ${str}`);
    } catch (e) {
      // Ignore pragma unsupported errors if any
    }
  }

  exec(sql) {
    return this._db.exec(sql);
  }

  prepare(sql) {
    const stmt = this._db.prepare(sql);
    return {
      get: (...params) => stmt.get(...params),
      all: (...params) => stmt.all(...params),
      run: (...params) => {
        const info = stmt.run(...params);
        return {
          changes: Number(info.changes),
          lastInsertRowid: Number(info.lastInsertRowid)
        };
      }
    };
  }
}

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data.sqlite');
const db = new SQLiteWrapper(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// SCHEMA
// Notes:
//  - order_status_history is APPEND-ONLY. No route ever UPDATEs or DELETEs
//    a row from it -- that is what makes the tracking timeline immutable.
//  - rate_cards holds one row per (order_type, rate_type) combination so
//    B2B/B2C and intra/inter zone rates are configured independently and
//    nothing is hardcoded in application code.
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('customer','agent','admin')),
  phone         TEXT,
  -- agent-only fields
  is_available  INTEGER DEFAULT 1,
  current_lat   REAL,
  current_lng   REAL,
  home_zone_id  INTEGER REFERENCES zones(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS zones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Areas / pincodes mapped to a zone. Zone detection for an order looks up
-- the area/pincode text of the pickup & drop address in this table.
CREATE TABLE IF NOT EXISTS zone_areas (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id   INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL UNIQUE, -- normalized (lowercase) area name or pincode
  UNIQUE(zone_id, area_name)
);

-- One row per (order_type, rate_type). rate_type is 'intra' (pickup zone ==
-- drop zone) or 'inter' (different zones). Admin-configurable, no
-- hardcoded numbers anywhere in the rate engine.
CREATE TABLE IF NOT EXISTS rate_cards (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_type    TEXT NOT NULL CHECK (order_type IN ('B2B','B2C')),
  rate_type     TEXT NOT NULL CHECK (rate_type IN ('intra','inter')),
  base_price    REAL NOT NULL DEFAULT 0,   -- flat charge included in every order
  rate_per_kg   REAL NOT NULL DEFAULT 0,   -- multiplied by billed weight
  min_charge    REAL NOT NULL DEFAULT 0,   -- floor for the freight component
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(order_type, rate_type)
);

-- COD surcharge configuration per order type. Can be a flat fee, a percent
-- of freight, or both (percent_fee is applied on top of flat_fee).
CREATE TABLE IF NOT EXISTS cod_surcharge_config (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_type   TEXT NOT NULL UNIQUE CHECK (order_type IN ('B2B','B2C')),
  flat_fee     REAL NOT NULL DEFAULT 0,
  percent_fee  REAL NOT NULL DEFAULT 0, -- percentage of freight charge, e.g. 2 = 2%
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code          TEXT NOT NULL UNIQUE,
  customer_id         INTEGER NOT NULL REFERENCES users(id),
  created_by_id       INTEGER NOT NULL REFERENCES users(id), -- may be an admin creating on behalf of the customer
  pickup_address      TEXT NOT NULL,
  pickup_area         TEXT NOT NULL,
  pickup_zone_id      INTEGER REFERENCES zones(id),
  drop_address        TEXT NOT NULL,
  drop_area           TEXT NOT NULL,
  drop_zone_id        INTEGER REFERENCES zones(id),
  length_cm           REAL NOT NULL,
  breadth_cm          REAL NOT NULL,
  height_cm           REAL NOT NULL,
  actual_weight_kg    REAL NOT NULL,
  volumetric_weight_kg REAL NOT NULL,
  billed_weight_kg    REAL NOT NULL,
  order_type          TEXT NOT NULL CHECK (order_type IN ('B2B','B2C')),
  payment_type        TEXT NOT NULL CHECK (payment_type IN ('Prepaid','COD')),
  rate_type           TEXT NOT NULL CHECK (rate_type IN ('intra','inter')),
  freight_charge      REAL NOT NULL,
  cod_surcharge       REAL NOT NULL DEFAULT 0,
  total_charge        REAL NOT NULL,
  status              TEXT NOT NULL DEFAULT 'Created' CHECK (status IN
                        ('Created','Assigned','Picked Up','In Transit','Out for Delivery',
                         'Delivered','Failed','Rescheduled','Cancelled')),
  agent_id            INTEGER REFERENCES users(id),
  scheduled_date      TEXT, -- delivery attempt date (used for reschedule)
  delivered_at        TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- APPEND-ONLY immutable audit trail. Every status transition, assignment
-- and reassignment inserts a new row here; nothing is ever edited/removed.
CREATE TABLE IF NOT EXISTS order_status_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id),
  status      TEXT NOT NULL,
  actor_id    INTEGER REFERENCES users(id),
  actor_role  TEXT NOT NULL,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reschedules (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id),
  old_date      TEXT,
  new_date      TEXT NOT NULL,
  requested_by  INTEGER REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id),
  channel     TEXT NOT NULL DEFAULT 'email',
  event       TEXT NOT NULL,
  recipient   TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'sent',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_agent ON orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_history_order ON order_status_history(order_id);
`);

module.exports = db;
