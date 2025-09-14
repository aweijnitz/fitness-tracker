/**
 * Meals Routes
 *
 * Registers the following endpoints:
 * - POST /v1/meals      Create or replace a meal
 * - PUT  /v1/meals/:id  Update an existing meal
 * - GET  /v1/meals      List meals updated since a timestamp
 *
 * Body schema (POST/PUT):
 *   { id: string, name: string, calories: number, occurredAt: number, updatedAt: number }
 *
 * Notes:
 * - Input values are sanitized (IDs/text) before persistence.
 * - `db` must be better-sqlite3-compatible (or the in-memory stub in tests).
 *
 * @param {import('express').Application} app Express application instance
 * @param {{ prepare: Function, exec: Function }} db Database handle
 */
import { sanitizeId, sanitizeText, sanitizeNumber } from '../sanitize.js';

export function registerMealRoutes(app, db) {
  app.post('/v1/meals', (req, res) => {
    const id = sanitizeId(req.body.id);
    const userId = sanitizeText(req.body.userId ?? '');
    const type = sanitizeText(req.body.type ?? 'meal');
    const name = sanitizeText(req.body.name);
    const calories = Number(req.body.calories ?? 0);
    const items = JSON.stringify(req.body.items ?? []);
    const occurredAt = sanitizeNumber(req.body.occurredAt, 0);
    const updatedAt = sanitizeNumber(req.body.updatedAt, 0);
    const clientTag = sanitizeText(req.body.clientTag ?? '');
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO meals (id, userId, type, name, calories, items, occurredAt, updatedAt, clientTag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, userId, type, name, calories, items, occurredAt, updatedAt, clientTag);
    res.json({ ok: true });
  });

  app.put('/v1/meals/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const userId = sanitizeText(req.body.userId ?? '');
    const type = sanitizeText(req.body.type ?? 'meal');
    const name = sanitizeText(req.body.name);
    const calories = Number(req.body.calories ?? 0);
    const items = JSON.stringify(req.body.items ?? []);
    const occurredAt = sanitizeNumber(req.body.occurredAt, 0);
    const updatedAt = sanitizeNumber(req.body.updatedAt, 0);
    const clientTag = sanitizeText(req.body.clientTag ?? '');
    const stmt = db.prepare(
      'UPDATE meals SET userId=?, type=?, name=?, calories=?, items=?, occurredAt=?, updatedAt=?, clientTag=? WHERE id=?'
    );
    const info = stmt.run(userId, type, name, calories, items, occurredAt, updatedAt, clientTag, id);
    res.json({ updated: info.changes > 0 });
  });

  app.get('/v1/meals', (req, res) => {
    const since = sanitizeNumber(req.query.since, 0) || 0;
    const rows = db.prepare('SELECT * FROM meals WHERE updatedAt >= ?').all(since);
    const items = rows.map((r) => ({
      id: r.id,
      userId: r.userId ?? 'server',
      type: r.type ?? 'meal',
      calories: r.calories,
      name: r.name,
      items: r.items ? safeParseJSON(r.items, []) : [],
      occurredAt: r.occurredAt,
      updatedAt: r.updatedAt,
      clientTag: r.clientTag ?? 'server',
    }));
    res.json({ items, syncStamp: Date.now() });
  });

  app.delete('/v1/meals/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const info = db.prepare('DELETE FROM meals WHERE id=?').run(id);
    res.json({ deleted: info.changes > 0 });
  });
}

function safeParseJSON(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
