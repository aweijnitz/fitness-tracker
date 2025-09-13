import express from 'express';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

function sanitizeId(value) {
  return String(value).replace(/[^a-zA-Z0-9-].*$/, '');
}

function sanitizeText(value) {
  return String(value).replace(/[^\w\s-]/g, '');
}

export function createServer(dbPath = 'fitness.db') {
  const db = new Database(dbPath);
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
    const items = db.prepare('SELECT * FROM meals WHERE updatedAt > ?').all(since);
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
    const items = db.prepare('SELECT * FROM activities WHERE updatedAt > ?').all(since);
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
    const items = db.prepare('SELECT * FROM workouts WHERE updatedAt > ?').all(since);
    res.json({ items, syncStamp: Date.now() });
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
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}
