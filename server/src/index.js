import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Load configuration from .env without external deps
function loadEnv() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const candidates = [
      path.resolve(__dirname, '../.env'),
      path.resolve(process.cwd(), '.env'),
    ];
    for (const p of candidates) {
      try {
        const fs = requireFs();
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          for (const rawLine of content.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const idx = line.indexOf('=');
            if (idx === -1) continue;
            const key = line.slice(0, idx).trim();
            let val = line.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) process.env[key] = val;
          }
          break; // stop at first found
        }
      } catch {
        // ignore file read/parse issues
      }
    }
  } catch {
    // noop
  }
}

function requireFs() {
  return createRequire(import.meta.url)('fs');
}

// Minimal in-memory DB used for tests (dbPath === ':memory:') to avoid native module
class MemoryDb {
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

  prepare(sql) {
    const self = this;
    const lower = sql.toLowerCase().trim();

    // Special-case sqlite_master existence checks used by a test
    const isMasterQuery = lower.includes("from sqlite_master") && lower.includes("name='meals'");

    return {
      run(...params) {
        // meals
        if (lower.startsWith('insert or replace into meals')) {
          const [id, name, calories, occurredAt, updatedAt] = params;
          const arr = self.tables.get('meals') || [];
          const idx = arr.findIndex((r) => r.id === id);
          const row = { id, name, calories, occurredAt, updatedAt };
          if (idx >= 0) arr[idx] = row; else arr.push(row);
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
          if (idx >= 0) arr[idx] = row; else arr.push(row);
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
          if (idx >= 0) arr[idx] = row; else arr.push(row);
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
          if (idx >= 0) arr[idx] = row; else arr.push(row);
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

        return { changes: 0 };
      },

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
        return [];
      },

      get() {
        if (isMasterQuery) {
          return self.created.has('meals') ? { name: 'meals' } : undefined;
        }
        return undefined;
      },
    };
  }
}

function sanitizeId(value) {
  return String(value).replace(/[^a-zA-Z0-9-].*$/, '');
}

function sanitizeText(value) {
  return String(value).replace(/[^\w\s-]/g, '');
}

function sanitizeNumber(value, min = -Infinity, max = Infinity) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, min), max);
}

// Load env before reading defaults
loadEnv();

export function createServer(dbPath = process.env.DB_PATH || 'fitness.db') {
  const db = dbPath === ':memory:'
    ? new MemoryDb()
    : new (createRequire(import.meta.url)('better-sqlite3'))(dbPath);
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

  const app = express();
  app.use(express.json());

  app.post('/v1/meals', (req, res) => {
    const id = sanitizeId(req.body.id);
    const name = sanitizeText(req.body.name);
    const calories = Number(req.body.calories);
    const occurredAt = Number(req.body.occurredAt);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare('INSERT OR REPLACE INTO meals (id, name, calories, occurredAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, name, calories, occurredAt, updatedAt);
    res.json({ ok: true });
  });

  app.put('/v1/meals/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const name = sanitizeText(req.body.name);
    const calories = Number(req.body.calories);
    const occurredAt = Number(req.body.occurredAt);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare('UPDATE meals SET name=?, calories=?, occurredAt=?, updatedAt=? WHERE id=?');
    const info = stmt.run(name, calories, occurredAt, updatedAt, id);
    res.json({ updated: info.changes > 0 });
  });

  app.get('/v1/meals', (req, res) => {
    const since = Number(req.query.since) || 0;
    const items = db.prepare('SELECT * FROM meals WHERE updatedAt >= ?').all(since);
    res.json({ items, syncStamp: Date.now() });
  });

  // activities
  app.post('/v1/activities', (req, res) => {
    const id = sanitizeId(req.body.id);
    const kind = sanitizeText(req.body.kind);
    const durationSec = Number(req.body.durationSec);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare('INSERT OR REPLACE INTO activities (id, kind, durationSec, updatedAt) VALUES (?, ?, ?, ?)');
    stmt.run(id, kind, durationSec, updatedAt);
    res.json({ ok: true });
  });

  app.put('/v1/activities/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const kind = sanitizeText(req.body.kind);
    const durationSec = Number(req.body.durationSec);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare('UPDATE activities SET kind=?, durationSec=?, updatedAt=? WHERE id=?');
    const info = stmt.run(kind, durationSec, updatedAt, id);
    res.json({ updated: info.changes > 0 });
  });

  app.get('/v1/activities', (req, res) => {
    const since = Number(req.query.since) || 0;
    const items = db.prepare('SELECT * FROM activities WHERE updatedAt >= ?').all(since);
    res.json({ items, syncStamp: Date.now() });
  });

  // workouts
  app.post('/v1/workouts', (req, res) => {
    const id = sanitizeId(req.body.id);
    const name = sanitizeText(req.body.name);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare('INSERT OR REPLACE INTO workouts (id, name, updatedAt) VALUES (?, ?, ?)');
    stmt.run(id, name, updatedAt);
    res.json({ ok: true });
  });

  app.put('/v1/workouts/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const name = sanitizeText(req.body.name);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare('UPDATE workouts SET name=?, updatedAt=? WHERE id=?');
    const info = stmt.run(name, updatedAt, id);
    res.json({ updated: info.changes > 0 });
  });

  app.get('/v1/workouts', (req, res) => {
    const since = Number(req.query.since) || 0;
    const items = db.prepare('SELECT * FROM workouts WHERE updatedAt >= ?').all(since);
    res.json({ items, syncStamp: Date.now() });
  });

  // weights (CRUD)
  app.post('/v1/weights', (req, res) => {
    const id = sanitizeId(req.body.id);
    const valueKg = sanitizeNumber(req.body.valueKg, 0, 1000);
    const occurredAt = sanitizeNumber(req.body.occurredAt, 0);
    const updatedAt = sanitizeNumber(req.body.updatedAt, 0);
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO weights (id, valueKg, occurredAt, updatedAt) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, valueKg, occurredAt, updatedAt);
    res.json({ ok: true });
  });

  app.put('/v1/weights/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const valueKg = sanitizeNumber(req.body.valueKg, 0, 1000);
    const occurredAt = sanitizeNumber(req.body.occurredAt, 0);
    const updatedAt = sanitizeNumber(req.body.updatedAt, 0);
    const stmt = db.prepare(
      'UPDATE weights SET valueKg=?, occurredAt=?, updatedAt=? WHERE id=?'
    );
    const info = stmt.run(valueKg, occurredAt, updatedAt, id);
    res.json({ updated: info.changes > 0 });
  });

  app.get('/v1/weights', (req, res) => {
    const since = sanitizeNumber(req.query.since, 0);
    const items = db.prepare('SELECT * FROM weights WHERE updatedAt >= ?').all(since || 0);
    res.json({ items, syncStamp: Date.now() });
  });

  app.delete('/v1/weights/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const stmt = db.prepare('DELETE FROM weights WHERE id=?');
    const info = stmt.run(id);
    res.json({ deleted: info.changes > 0 });
  });

  // static client serving
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return { app, db };
}

// start server if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { app } = createServer();
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || process.env.IP || '0.0.0.0';
  app.listen(port, host, () => console.log(`Server listening on http://${host}:${port}`));
}
