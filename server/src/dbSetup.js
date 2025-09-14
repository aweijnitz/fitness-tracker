import { createRequire } from 'module';

// Minimal in-memory DB used for tests (dbPath === ':memory:') to avoid the native
// better-sqlite3 module during unit tests. It mimics the tiny subset of the
// better-sqlite3 API that this server uses:
//   - db.exec(sql)                     → for simple CREATE TABLE statements
//   - db.prepare(sql).run(...params)   → for INSERT/UPDATE/DELETE mutations
//   - db.prepare(sql).all(...params)   → for SELECT queries that return rows
//   - db.prepare(sql).get(...params)   → for SELECT queries that return one row
//
// Important: This is not a general SQL engine. It does lightweight pattern
// matching against the exact SQL strings used by our routes. The intent is to
// keep tests hermetic and fast without requiring native bindings.
export class MemoryDb {
  constructor() {
    this.tables = new Map();
    this.created = new Set();
  }

  exec(sql) {
    // Handle: CREATE TABLE IF NOT EXISTS <name> (...)
    const m = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i.exec(sql);
    if (m) {
      const name = m[1];
      if (!this.tables.has(name)) this.tables.set(name, []);
      this.created.add(name);
    }
  }

  /**
   * Prepare a statement-like wrapper for a specific SQL string. The returned
   * object implements the minimal subset of better-sqlite3's Statement API
   * that our code uses: run(), all(), and get().
   */
  prepare(sql) {
    const self = this;
    const lower = sql.toLowerCase().trim();

    // Special-case sqlite_master existence checks used by a test
    const isMasterQuery =
      lower.includes('from sqlite_master') && lower.includes("name='meals'");

    return {
      /**
       * Execute a mutation (INSERT/UPDATE/DELETE) against the in-memory
       * tables. The logic branches by matching the beginning of the SQL to
       * the statements used by the routes. Returns an object with a `changes`
       * count, mirroring better-sqlite3 so callers can check e.g.
       * `info.changes > 0` to determine if an UPDATE/DELETE affected rows.
       */
      run(...params) {
        // meals
        if (lower.startsWith('insert or replace into meals')) {
          const [id, name, calories, occurredAt, updatedAt] = params;
          const arr = self.tables.get('meals') || [];
          const idx = arr.findIndex((r) => r.id === id);
          const row = { id, name, calories, occurredAt, updatedAt };
          if (idx >= 0) arr[idx] = row;
          else arr.push(row);
          self.tables.set('meals', arr);
          return { changes: 1 };
        }
        if (lower.startsWith('update meals set')) {
          const [name, calories, occurredAt, updatedAt, id] = params;
          const arr = self.tables.get('meals') || [];
          const idx = arr.findIndex((r) => r.id === id);
          let changes = 0;
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], name, calories, occurredAt, updatedAt };
            changes = 1;
          }
          self.tables.set('meals', arr);
          return { changes };
        }

        // activities
        if (lower.startsWith('insert or replace into activities')) {
          const [id, kind, durationSec, updatedAt] = params;
          const arr = self.tables.get('activities') || [];
          const idx = arr.findIndex((r) => r.id === id);
          const row = { id, kind, durationSec, updatedAt };
          if (idx >= 0) arr[idx] = row;
          else arr.push(row);
          self.tables.set('activities', arr);
          return { changes: 1 };
        }
        if (lower.startsWith('update activities set')) {
          const [kind, durationSec, updatedAt, id] = params;
          const arr = self.tables.get('activities') || [];
          const idx = arr.findIndex((r) => r.id === id);
          let changes = 0;
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], kind, durationSec, updatedAt };
            changes = 1;
          }
          self.tables.set('activities', arr);
          return { changes };
        }

        // workouts
        if (lower.startsWith('insert or replace into workouts')) {
          const [id, name, updatedAt] = params;
          const arr = self.tables.get('workouts') || [];
          const idx = arr.findIndex((r) => r.id === id);
          const row = { id, name, updatedAt };
          if (idx >= 0) arr[idx] = row;
          else arr.push(row);
          self.tables.set('workouts', arr);
          return { changes: 1 };
        }
        if (lower.startsWith('update workouts set')) {
          const [name, updatedAt, id] = params;
          const arr = self.tables.get('workouts') || [];
          const idx = arr.findIndex((r) => r.id === id);
          let changes = 0;
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], name, updatedAt };
            changes = 1;
          }
          self.tables.set('workouts', arr);
          return { changes };
        }

        // weights
        if (lower.startsWith('insert or replace into weights')) {
          const [id, valueKg, occurredAt, updatedAt] = params;
          const arr = self.tables.get('weights') || [];
          const idx = arr.findIndex((r) => r.id === id);
          const row = { id, valueKg, occurredAt, updatedAt };
          if (idx >= 0) arr[idx] = row;
          else arr.push(row);
          self.tables.set('weights', arr);
          return { changes: 1 };
        }
        if (lower.startsWith('update weights set')) {
          const [valueKg, occurredAt, updatedAt, id] = params;
          const arr = self.tables.get('weights') || [];
          const idx = arr.findIndex((r) => r.id === id);
          let changes = 0;
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], valueKg, occurredAt, updatedAt };
            changes = 1;
          }
          self.tables.set('weights', arr);
          return { changes };
        }
        if (lower.startsWith('delete from weights where id=')) {
          const [id] = params;
          const arr = self.tables.get('weights') || [];
          const before = arr.length;
          const next = arr.filter((r) => r.id !== id);
          self.tables.set('weights', next);
          return { changes: before - next.length };
        }
        if (lower.startsWith('delete from meals where id=')) {
          const [id] = params;
          const arr = self.tables.get('meals') || [];
          const before = arr.length;
          const next = arr.filter((r) => r.id !== id);
          self.tables.set('meals', next);
          return { changes: before - next.length };
        }
        if (lower.startsWith('delete from activities where id=')) {
          const [id] = params;
          const arr = self.tables.get('activities') || [];
          const before = arr.length;
          const next = arr.filter((r) => r.id !== id);
          self.tables.set('activities', next);
          return { changes: before - next.length };
        }
        if (lower.startsWith('delete from workouts where id=')) {
          const [id] = params;
          const arr = self.tables.get('workouts') || [];
          const before = arr.length;
          const next = arr.filter((r) => r.id !== id);
          self.tables.set('workouts', next);
          return { changes: before - next.length };
        }

        // bulk deletes
        if (lower.startsWith('delete from meals')) {
          const arr = self.tables.get('meals') || [];
          const before = arr.length;
          self.tables.set('meals', []);
          return { changes: before };
        }
        if (lower.startsWith('delete from activities')) {
          const arr = self.tables.get('activities') || [];
          const before = arr.length;
          self.tables.set('activities', []);
          return { changes: before };
        }
        if (lower.startsWith('delete from workouts')) {
          const arr = self.tables.get('workouts') || [];
          const before = arr.length;
          self.tables.set('workouts', []);
          return { changes: before };
        }
        if (lower.startsWith('delete from weights')) {
          const arr = self.tables.get('weights') || [];
          const before = arr.length;
          self.tables.set('weights', []);
          return { changes: before };
        }

        // If no pattern matched, report zero changes (no-op)
        return { changes: 0 };
      },

      /**
       * Execute a read (SELECT) and return an array of rows. For this stub,
       * we support the few `SELECT * FROM <table> WHERE updatedAt >= ?`
       * filters used by the API to implement sync windows.
       */
      all(...params) {
        if (lower.startsWith('select * from meals where updatedat >=')) {
          const [since] = params;
          const arr = self.tables.get('meals') || [];
          return arr.filter((r) => (r.updatedAt || 0) >= (since || 0));
        }
        if (lower.startsWith('select * from activities where updatedat >=')) {
          const [since] = params;
          const arr = self.tables.get('activities') || [];
          return arr.filter((r) => (r.updatedAt || 0) >= (since || 0));
        }
        if (lower.startsWith('select * from workouts where updatedat >=')) {
          const [since] = params;
          const arr = self.tables.get('workouts') || [];
          return arr.filter((r) => (r.updatedAt || 0) >= (since || 0));
        }
        if (lower.startsWith('select * from weights where updatedat >=')) {
          const [since] = params;
          const arr = self.tables.get('weights') || [];
          return arr.filter((r) => (r.updatedAt || 0) >= (since || 0));
        }
        // Unknown SELECT shape → empty result set
        return [];
      },

      /**
       * Return a single row for queries that expect it. We only implement the
       * sqlite_master table existence check used by one sanitization test.
       */
      get() {
        if (isMasterQuery) {
          return self.created.has('meals') ? { name: 'meals' } : undefined;
        }
        return undefined;
      },
    };
  }
}

export function getDatabase(dbPath = 'fitness.db') {
  if (dbPath === ':memory:') return new MemoryDb();
  const Better = createRequire(import.meta.url)('better-sqlite3');
  return new Better(dbPath);
}

export function initSchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    occurredAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    durationSec INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS weights (
    id TEXT PRIMARY KEY,
    valueKg REAL NOT NULL,
    occurredAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
}
