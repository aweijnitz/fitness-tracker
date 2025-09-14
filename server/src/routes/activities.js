/**
 * Activities Routes
 *
 * Registers the following endpoints:
 * - POST /v1/activities    Create or replace an activity
 * - PUT  /v1/activities/:id Update an existing activity
 * - GET  /v1/activities     List activities updated since a timestamp
 *
 * Body schema (POST/PUT):
 *   { id: string, kind: string, durationSec: number, updatedAt: number }
 *
 * Notes:
 * - Input values are sanitized (IDs/text) before persistence.
 * - `db` must be better-sqlite3-compatible (or the in-memory stub in tests).
 *
 * @param {import('express').Application} app Express application instance
 * @param {{ prepare: Function, exec: Function }} db Database handle
 */
import { sanitizeId, sanitizeText, sanitizeNumber } from '../sanitize.js';

export function registerActivityRoutes(app, db) {
  app.post('/v1/activities', (req, res) => {
    const id = sanitizeId(req.body.id);
    const userId = sanitizeText(req.body.userId ?? '');
    const kind = sanitizeText(req.body.kind);
    const distanceKm = Number(req.body.distanceKm ?? 0);
    const durationSec = sanitizeNumber(req.body.durationSec, 0);
    const steps = sanitizeNumber(req.body.steps, 0);
    const samples = JSON.stringify(req.body.samples ?? []);
    const startedAt = sanitizeNumber(req.body.startedAt, 0) || sanitizeNumber(req.body.updatedAt, 0);
    const endedAt = sanitizeNumber(req.body.endedAt, 0) || sanitizeNumber(req.body.updatedAt, 0);
    const updatedAt = sanitizeNumber(req.body.updatedAt, 0);
    const clientTag = sanitizeText(req.body.clientTag ?? '');
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO activities (id, userId, kind, distanceKm, durationSec, steps, samples, startedAt, endedAt, updatedAt, clientTag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, userId, kind, distanceKm, durationSec, steps, samples, startedAt, endedAt, updatedAt, clientTag);
    res.json({ ok: true });
  });

  app.put('/v1/activities/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const userId = sanitizeText(req.body.userId ?? '');
    const kind = sanitizeText(req.body.kind);
    const distanceKm = Number(req.body.distanceKm ?? 0);
    const durationSec = sanitizeNumber(req.body.durationSec, 0);
    const steps = sanitizeNumber(req.body.steps, 0);
    const samples = JSON.stringify(req.body.samples ?? []);
    const startedAt = sanitizeNumber(req.body.startedAt, 0) || sanitizeNumber(req.body.updatedAt, 0);
    const endedAt = sanitizeNumber(req.body.endedAt, 0) || sanitizeNumber(req.body.updatedAt, 0);
    const updatedAt = sanitizeNumber(req.body.updatedAt, 0);
    const clientTag = sanitizeText(req.body.clientTag ?? '');
    const stmt = db.prepare(
      'UPDATE activities SET userId=?, kind=?, distanceKm=?, durationSec=?, steps=?, samples=?, startedAt=?, endedAt=?, updatedAt=?, clientTag=? WHERE id=?'
    );
    const info = stmt.run(userId, kind, distanceKm, durationSec, steps, samples, startedAt, endedAt, updatedAt, clientTag, id);
    res.json({ updated: info.changes > 0 });
  });

  app.get('/v1/activities', (req, res) => {
    const since = sanitizeNumber(req.query.since, 0) || 0;
    const rows = db.prepare('SELECT * FROM activities WHERE updatedAt >= ?').all(since);
    const items = rows.map((r) => ({
      id: r.id,
      userId: r.userId ?? 'server',
      kind: r.kind,
      distanceKm: r.distanceKm ?? 0,
      durationSec: r.durationSec,
      steps: r.steps ?? 0,
      samples: r.samples ? safeParseJSON(r.samples, []) : [],
      startedAt: r.startedAt ?? r.updatedAt,
      endedAt: r.endedAt ?? r.updatedAt,
      updatedAt: r.updatedAt,
      clientTag: r.clientTag ?? 'server',
    }));
    res.json({ items, syncStamp: Date.now() });
  });

  app.delete('/v1/activities/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    const info = db.prepare('DELETE FROM activities WHERE id=?').run(id);
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
