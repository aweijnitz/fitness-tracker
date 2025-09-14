import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/index.js';

let app;

beforeEach(() => {
  const { app: a } = createServer(':memory:');
  app = a;
  process.env.NODE_ENV = 'test';
});

describe('dev endpoints', () => {
  it('populates data when not in production', async () => {
    const r1 = await request(app).post('/v1/_dev/populate');
    expect(r1.status).toBe(200);
    const w = await request(app).get('/v1/weights?since=0');
    const m = await request(app).get('/v1/meals');
    const a = await request(app).get('/v1/activities');
    const wo = await request(app).get('/v1/workouts');
    expect(w.body.items.length).toBeGreaterThanOrEqual(20);
    expect(m.body.items.length).toBeGreaterThanOrEqual(1);
    expect(a.body.items.length).toBeGreaterThanOrEqual(1);
    expect(wo.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('clears data when not in production', async () => {
    await request(app).post('/v1/_dev/populate');
    const r2 = await request(app).post('/v1/_dev/clear');
    expect(r2.status).toBe(200);
    const w = await request(app).get('/v1/weights?since=0');
    const m = await request(app).get('/v1/meals');
    const a = await request(app).get('/v1/activities');
    const wo = await request(app).get('/v1/workouts');
    expect(w.body.items.length).toBe(0);
    expect(m.body.items.length).toBe(0);
    expect(a.body.items.length).toBe(0);
    expect(wo.body.items.length).toBe(0);
  });

  it('is disabled in production', async () => {
    process.env.NODE_ENV = 'production';
    const p = await request(app).post('/v1/_dev/populate');
    const c = await request(app).post('/v1/_dev/clear');
    expect(p.status).toBe(403);
    expect(c.status).toBe(403);
  });
});

