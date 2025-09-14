/**
 * Dev Utility Routes (disabled in production)
 *
 * Registers the following endpoints:
 * - POST /v1/_dev/populate  Clear DB and insert realistic sample data
 * - POST /v1/_dev/clear     Clear all data from supported tables
 *
 * Behavior:
 * - If `NODE_ENV === 'production'`, both endpoints return 403 and perform no action.
 * - Designed for development and testing convenience.
 *
 * @param {import('express').Application} app Express application instance
 * @param {{ prepare: Function, exec: Function }} db Database handle
 */
export function registerDevRoutes(app, db) {
  function isProd() {
    return String(process.env.NODE_ENV).toLowerCase() === 'production';
  }

  function deleteAllRows() {
    try { db.prepare('DELETE FROM meals').run(); } catch {}
    try { db.prepare('DELETE FROM activities').run(); } catch {}
    try { db.prepare('DELETE FROM workouts').run(); } catch {}
    try { db.prepare('DELETE FROM weights').run(); } catch {}
  }

  function populateSampleData() {
    const now = Date.now();
    const wStmt = db.prepare(
      'INSERT OR REPLACE INTO weights (id, valueKg, occurredAt, updatedAt) VALUES (?, ?, ?, ?)'
    );
    const baseKg = 82;
    for (let i = 0; i < 30; i++) {
      const t = now - (29 - i) * 24 * 60 * 60 * 1000;
      const val = baseKg - i * 0.1 + Math.sin(i / 3) * 0.4;
      const id = `w-${t}`;
      wStmt.run(id, Number(val.toFixed(1)), t, t);
    }

    const mStmt = db.prepare(
      'INSERT OR REPLACE INTO meals (id, name, calories, occurredAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
    );
    const meals = [
      { id: 'm-1', name: 'Oatmeal', calories: 350, t: now - 6 * 60 * 60 * 1000 },
      { id: 'm-2', name: 'Chicken Salad', calories: 520, t: now - 3 * 60 * 60 * 1000 },
      { id: 'm-3', name: 'Greek Yogurt', calories: 180, t: now - 1 * 60 * 60 * 1000 },
    ];
    for (const m of meals) mStmt.run(m.id, m.name, m.calories, m.t, m.t);

    const aStmt = db.prepare(
      'INSERT OR REPLACE INTO activities (id, kind, durationSec, updatedAt) VALUES (?, ?, ?, ?)'
    );
    const acts = [
      { id: 'a-1', kind: 'walk', dur: 1800, t: now - 2 * 60 * 60 * 1000 },
      { id: 'a-2', kind: 'ride', dur: 3600, t: now - 26 * 60 * 60 * 1000 },
      { id: 'a-3', kind: 'pushUps', dur: 600, t: now - 28 * 60 * 60 * 1000 },
    ];
    for (const a of acts) aStmt.run(a.id, a.kind, a.dur, a.t);

    const woStmt = db.prepare(
      'INSERT OR REPLACE INTO workouts (id, name, updatedAt) VALUES (?, ?, ?)'
    );
    const wos = [
      { id: 'wo-1', name: 'Leg Day', t: now - 24 * 60 * 60 * 1000 },
      { id: 'wo-2', name: 'Upper Body', t: now - 48 * 60 * 60 * 1000 },
    ];
    for (const w of wos) woStmt.run(w.id, w.name, w.t);
  }

  app.post('/v1/_dev/clear', (req, res) => {
    if (isProd()) return res.status(403).json({ error: 'disabled in production' });
    deleteAllRows();
    res.json({ ok: true });
  });

  app.post('/v1/_dev/populate', (req, res) => {
    if (isProd()) return res.status(403).json({ error: 'disabled in production' });
    deleteAllRows();
    populateSampleData();
    res.json({ ok: true });
  });
}
