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
import { sanitizeId, sanitizeText } from '../sanitize.js';

export function registerMealRoutes(app, db) {
  app.post('/v1/meals', (req, res) => {
    const id = sanitizeId(req.body.id);
    const name = sanitizeText(req.body.name);
    const calories = Number(req.body.calories);
    const occurredAt = Number(req.body.occurredAt);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO meals (id, name, calories, occurredAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, name, calories, occurredAt, updatedAt);
    res.json({ ok: true });
  });

  app.put('/v1/meals/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const name = sanitizeText(req.body.name);
    const calories = Number(req.body.calories);
    const occurredAt = Number(req.body.occurredAt);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare(
      'UPDATE meals SET name=?, calories=?, occurredAt=?, updatedAt=? WHERE id=?'
    );
    const info = stmt.run(name, calories, occurredAt, updatedAt, id);
    res.json({ updated: info.changes > 0 });
  });

  app.get('/v1/meals', (req, res) => {
    const since = Number(req.query.since) || 0;
    const items = db.prepare('SELECT * FROM meals WHERE updatedAt >= ?').all(since);
    res.json({ items, syncStamp: Date.now() });
  });

  app.delete('/v1/meals/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const info = db.prepare('DELETE FROM meals WHERE id=?').run(id);
    res.json({ deleted: info.changes > 0 });
  });
}
