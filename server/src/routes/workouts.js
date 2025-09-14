/**
 * Workouts Routes
 *
 * Registers the following endpoints:
 * - POST /v1/workouts      Create or replace a workout
 * - PUT  /v1/workouts/:id  Update an existing workout
 * - GET  /v1/workouts      List workouts updated since a timestamp
 *
 * Body schema (POST/PUT):
 *   { id: string, name: string, updatedAt: number }
 *
 * Notes:
 * - Input values are sanitized (IDs/text) before persistence.
 * - `db` must be better-sqlite3-compatible (or the in-memory stub in tests).
 *
 * @param {import('express').Application} app Express application instance
 * @param {{ prepare: Function, exec: Function }} db Database handle
 */
import { sanitizeId, sanitizeText } from '../sanitize.js';

export function registerWorkoutRoutes(app, db) {
  app.post('/v1/workouts', (req, res) => {
    const id = sanitizeId(req.body.id);
    const name = sanitizeText(req.body.name);
    const updatedAt = Number(req.body.updatedAt);
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO workouts (id, name, updatedAt) VALUES (?, ?, ?)'
    );
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
}
