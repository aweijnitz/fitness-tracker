/**
 * Weights Routes
 *
 * Registers the following endpoints:
 * - POST   /v1/weights        Create or replace a weight entry
 * - PUT    /v1/weights/:id    Update an existing weight entry
 * - GET    /v1/weights        List weight entries updated since a timestamp
 * - DELETE /v1/weights/:id    Delete a weight entry
 *
 * Body schema (POST/PUT):
 *   { id: string, valueKg: number, occurredAt: number, updatedAt: number }
 *
 * Notes:
 * - Inputs are sanitized; numeric values are clamped to reasonable bounds.
 * - `db` must be better-sqlite3-compatible (or the in-memory stub in tests).
 *
 * @param {import('express').Application} app Express application instance
 * @param {{ prepare: Function, exec: Function }} db Database handle
 */
import { sanitizeId, sanitizeNumber } from '../sanitize.js';

export function registerWeightRoutes(app, db) {
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
    const items = db
      .prepare('SELECT * FROM weights WHERE updatedAt >= ?')
      .all(since || 0);
    res.json({ items, syncStamp: Date.now() });
  });

  app.delete('/v1/weights/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const stmt = db.prepare('DELETE FROM weights WHERE id=?');
    const info = stmt.run(id);
    res.json({ deleted: info.changes > 0 });
  });
}
