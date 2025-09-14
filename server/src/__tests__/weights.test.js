import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createServer } from '../index.js';

let app;

beforeEach(() => {
  // Use in-memory DB for isolation per test
  const server = createServer(':memory:');
  app = server.app;
});

describe('/v1/weights CRUD', () => {
  it('creates and lists a weight', async () => {
    const body = { id: 'w-1', kg: 82.5, occurredAt: 1700000000000, updatedAt: 1700000000000 };
    const resCreate = await request(app).post('/v1/weights').send(body);
    expect(resCreate.status).toBe(200);
    expect(resCreate.body.ok).toBe(true);

    const resList = await request(app).get('/v1/weights?since=0');
    expect(resList.status).toBe(200);
    expect(Array.isArray(resList.body.items)).toBe(true);
    expect(resList.body.items.length).toBe(1);
    expect(resList.body.items[0]).toMatchObject({ id: 'w-1', kg: 82.5, occurredAt: 1700000000000 });
    expect(typeof resList.body.syncStamp).toBe('number');
  });

  it('updates an existing weight and filters by since', async () => {
    const base = { id: 'w-2', kg: 80, occurredAt: 1700000000000, updatedAt: 100 };
    await request(app).post('/v1/weights').send(base);

    const resUpdate = await request(app)
      .put('/v1/weights/w-2')
      .send({ kg: 79.2, occurredAt: 1700000001000, updatedAt: 200 });
    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.updated).toBe(true);

    const resListSince = await request(app).get('/v1/weights?since=150');
    expect(resListSince.status).toBe(200);
    expect(resListSince.body.items.length).toBe(1);
    expect(resListSince.body.items[0]).toMatchObject({ id: 'w-2', kg: 79.2 });
  });

  it('deletes a weight', async () => {
    const base = { id: 'w-3', kg: 90, occurredAt: 1700000000000, updatedAt: 1 };
    await request(app).post('/v1/weights').send(base);

    const resDel = await request(app).delete('/v1/weights/w-3');
    expect(resDel.status).toBe(200);
    expect(resDel.body.deleted).toBe(true);

    const resList = await request(app).get('/v1/weights?since=0');
    expect(resList.body.items.find((i) => i.id === 'w-3')).toBeUndefined();
  });

  it('sanitizes input values', async () => {
    // ID gets truncated at first illegal char, valueKg clamped to [0, 1000]
    const raw = { id: 'abc$123', kg: -5, occurredAt: -10, updatedAt: -1 };
    await request(app).post('/v1/weights').send(raw);

    const resList = await request(app).get('/v1/weights?since=0');
    expect(resList.status).toBe(200);
    expect(resList.body.items.length).toBe(1);
    const item = resList.body.items[0];
    expect(item.id).toBe('abc');
    expect(item.kg).toBe(0);
    expect(item.occurredAt).toBe(0);
    expect(item.updatedAt).toBe(0);
  });
});
