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
import { sanitizeId, sanitizeText, sanitizeNumber } from '../sanitize.js';

export function registerWorkoutRoutes(app, db) {
  app.post('/v1/workouts', (req, res) => {
    const id = sanitizeId(req.body.id);
    const userId = sanitizeText(req.body.userId ?? '');
    const name = sanitizeText(req.body.name);
    const reps = JSON.stringify(req.body.reps ?? []);
    const updatedAt = sanitizeNumber(req.body.updatedAt, 0);
    const clientTag = sanitizeText(req.body.clientTag ?? '');
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO workouts (id, userId, name, reps, updatedAt, clientTag) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, userId, name, reps, updatedAt, clientTag);
    res.json({ ok: true });
  });

  app.put('/v1/workouts/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const userId = sanitizeText(req.body.userId ?? '');
    const name = sanitizeText(req.body.name);
    const reps = JSON.stringify(req.body.reps ?? []);
    const updatedAt = sanitizeNumber(req.body.updatedAt, 0);
    const clientTag = sanitizeText(req.body.clientTag ?? '');
    const stmt = db.prepare('UPDATE workouts SET userId=?, name=?, reps=?, updatedAt=?, clientTag=? WHERE id=?');
    const info = stmt.run(userId, name, reps, updatedAt, clientTag, id);
    res.json({ updated: info.changes > 0 });
  });

  app.get('/v1/workouts', (req, res) => {
    const since = sanitizeNumber(req.query.since, 0) || 0;
    const rows = db.prepare('SELECT * FROM workouts WHERE updatedAt >= ?').all(since);
    const items = rows.map((r) => ({
      id: r.id,
      userId: r.userId ?? 'server',
      name: r.name,
      reps: r.reps ? safeParseJSON(r.reps, []) : [],
      updatedAt: r.updatedAt,
      clientTag: r.clientTag ?? 'server',
    }));
    res.json({ items, syncStamp: Date.now() });
  });

  app.delete('/v1/workouts/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const info = db.prepare('DELETE FROM workouts WHERE id=?').run(id);
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
