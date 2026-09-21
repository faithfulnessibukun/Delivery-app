// Drop-in localStorage-backed replacement for the Supabase JS client.
// Implements only the surface area this app actually uses: auth
// (signUp/signInWithPassword/signOut/getUser) and a chainable
// from().select()/insert()/update()/delete()/upsert() query builder,
// including the embedded-join and count-only-query shapes the app
// relies on. Not a general Supabase emulator.

const DB_PREFIX = "mock_db_";
const SESSION_KEY = "mock_supabase_session";

function readTable(table) {
  try {
    const raw = localStorage.getItem(DB_PREFIX + table);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTable(table, rows) {
  localStorage.setItem(DB_PREFIX + table, JSON.stringify(rows));
}

function genId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const PK_BY_TABLE = {
  users: "id",
  customers: "customer_id",
  vendors: "vendor_id",
  riders: "rider_id",
  restaurants: "restaurant_id",
  menu_items: "menu_item_id",
  categories: "category_id",
  cart_items: "cart_item_id",
  orders: "order_id",
  order_items: "order_item_id",
  courier_orders: "courier_order_id",
  user_settings: "id",
};

// Tables that embed a related row inline, keyed by the FK column that
// points at them, matching the `select("*, other ( cols )")` calls
// this app makes.
const EMBEDS = {
  menu_items: {
    restaurants: { fk: "restaurant_id", pk: "restaurant_id" },
  },
  order_items: {
    menu_items: { fk: "menu_item_id", pk: "menu_item_id" },
  },
};

function applyEmbed(table, row) {
  const embeds = EMBEDS[table];
  if (!embeds) return row;
  const out = { ...row };
  for (const [embedTable, { fk, pk }] of Object.entries(embeds)) {
    const related = readTable(embedTable).find((r) => r[pk] === row[fk]);
    out[embedTable] = related || null;
  }
  return out;
}

// Splits a select string on top-level commas only, so an embedded
// join's own inner columns (e.g. "restaurants ( restaurant_id, name )")
// don't get sliced apart.
function splitTopLevel(selectStr) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of selectStr) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function pickColumns(row, selectStr) {
  if (!selectStr || selectStr.trim() === "*") return row;
  const topLevel = splitTopLevel(selectStr);
  let out = {};
  for (const col of topLevel) {
    if (!col) continue;
    // "*" alongside an embed, e.g. "*, restaurants ( ... )" — keep
    // every base column, embeds are layered in below.
    if (col === "*") {
      out = { ...out, ...row };
      continue;
    }
    // Embedded join fragment, e.g. "menu_items ( name )" — the embed
    // was already attached by applyEmbed under the table name; keep it.
    const embedMatch = col.match(/^(\w+)\s*\(/);
    if (embedMatch) {
      out[embedMatch[1]] = row[embedMatch[1]];
      continue;
    }
    out[col] = row[col];
  }
  return Object.keys(out).length ? out : row;
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.selectStr = "*";
    this.wantSingle = false;
    this.wantCount = false;
    this.countOnly = false;
    this.orderCol = null;
    this.orderAsc = true;
    this._op = null;
    this._payload = null;
    this._upsertConflict = null;
    this._selectCalled = false;
  }

  select(str, opts) {
    this.selectStr = str || "*";
    if (opts?.count === "exact") this.wantCount = true;
    if (opts?.head) this.countOnly = true;
    this._selectCalled = true;
    if (!this._op) this._op = "select";
    return this;
  }

  eq(col, val) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  in(col, vals) {
    const set = new Set(vals);
    this.filters.push((row) => set.has(row[col]));
    return this;
  }

  order(col, opts) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  insert(payload) {
    this._op = "insert";
    this._payload = payload;
    return this;
  }

  update(payload) {
    this._op = "update";
    this._payload = payload;
    return this;
  }

  delete() {
    this._op = "delete";
    return this;
  }

  upsert(payload, opts) {
    this._op = "upsert";
    this._payload = payload;
    this._upsertConflict = opts?.onConflict
      ? opts.onConflict.split(",").map((s) => s.trim())
      : null;
    return this;
  }

  _matches(row) {
    return this.filters.every((f) => f(row));
  }

  // Mirrors real Supabase: insert/update/upsert only return row data
  // when `.select()` was chained afterward; otherwise `data` is null.
  // When `.single()` was also chained, unwrap to one row (or error if
  // the write didn't affect exactly one row).
  _shapeWriteResult(rows) {
    if (!this._selectCalled) return { data: null, error: null };
    if (this.wantSingle) {
      if (rows.length !== 1) {
        return { data: null, error: { message: "Expected exactly one row" } };
      }
      return { data: rows[0], error: null };
    }
    return { data: rows, error: null };
  }

  _run() {
    const rows = readTable(this.table);
    const pk = PK_BY_TABLE[this.table] || "id";

    if (this._op === "insert") {
      const items = Array.isArray(this._payload) ? this._payload : [this._payload];
      const inserted = items.map((item) => {
        const row = { ...item };
        if (row[pk] == null) row[pk] = genId();
        if (this.table === "orders" || this.table === "courier_orders") {
          row.created_at = row.created_at || new Date().toISOString();
          row.updated_at = new Date().toISOString();
        }
        if (this.table === "orders" && !row.placed_at) {
          row.placed_at = new Date().toISOString();
        }
        return row;
      });
      writeTable(this.table, [...rows, ...inserted]);
      return this._shapeWriteResult(inserted);
    }

    if (this._op === "upsert") {
      const items = Array.isArray(this._payload) ? this._payload : [this._payload];
      const conflictCols = this._upsertConflict || [pk];
      let next = [...rows];
      const upserted = [];
      for (const item of items) {
        const idx = next.findIndex((r) =>
          conflictCols.every((c) => r[c] === item[c])
        );
        if (idx >= 0) {
          next[idx] = { ...next[idx], ...item };
          upserted.push(next[idx]);
        } else {
          const row = { ...item };
          if (row[pk] == null) row[pk] = genId();
          next.push(row);
          upserted.push(row);
        }
      }
      writeTable(this.table, next);
      return this._shapeWriteResult(upserted);
    }

    if (this._op === "update") {
      let updated = [];
      const next = rows.map((row) => {
        if (this._matches(row)) {
          const merged = { ...row, ...this._payload };
          if (this.table === "orders" || this.table === "courier_orders") {
            merged.updated_at = new Date().toISOString();
          }
          updated.push(merged);
          return merged;
        }
        return row;
      });
      writeTable(this.table, next);
      return this._shapeWriteResult(updated);
    }

    if (this._op === "delete") {
      const remaining = rows.filter((row) => !this._matches(row));
      const removedCount = rows.length - remaining.length;
      writeTable(this.table, remaining);
      return { data: null, error: null, count: removedCount };
    }

    // select
    let matched = rows.filter((row) => this._matches(row));

    if (this.orderCol) {
      matched = [...matched].sort((a, b) => {
        const av = a[this.orderCol];
        const bv = b[this.orderCol];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return this.orderAsc ? cmp : -cmp;
      });
    }

    if (this.countOnly) {
      return { data: null, error: null, count: matched.length };
    }

    const shaped = matched
      .map((row) => applyEmbed(this.table, row))
      .map((row) => pickColumns(row, this.selectStr));

    if (this.wantSingle) {
      if (shaped.length === 0) {
        return { data: null, error: { message: "No rows found" } };
      }
      return { data: shaped[0], error: null };
    }

    const result = { data: shaped, error: null };
    if (this.wantCount) result.count = matched.length;
    return result;
  }

  then(resolve, reject) {
    return Promise.resolve(this._run()).then(resolve, reject);
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

const auth = {
  async signUp({ email, password }) {
    const users = readTable("_auth_users");
    if (users.some((u) => u.email === email)) {
      return { data: { user: null }, error: { message: "User already registered" } };
    }
    const user = { id: genId(), email, password };
    writeTable("_auth_users", [...users, user]);
    const session = { user: { id: user.id, email: user.email } };
    writeSession(session);
    return { data: { user: session.user }, error: null };
  },

  async signInWithPassword({ email, password }) {
    const users = readTable("_auth_users");
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      return { data: { user: null }, error: { message: "Invalid login credentials" } };
    }
    const session = { user: { id: user.id, email: user.email } };
    writeSession(session);
    return { data: { user: session.user }, error: null };
  },

  async signOut() {
    writeSession(null);
    return { error: null };
  },

  async getUser() {
    const session = readSession();
    return { data: { user: session?.user || null }, error: null };
  },
};

export const supabase = {
  auth,
  from(table) {
    return new QueryBuilder(table);
  },
};
