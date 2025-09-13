import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/index.js';

describe('meals API', () => {
  it('creates and retrieves meals', async () => {
    const { app } = createServer(':memory:');
    const meal = { id: '1', name: 'apple', calories: 95, occurredAt: 1, updatedAt: 1 };
    await request(app).post('/v1/meals').send(meal).expect(200);
    const res = await request(app).get('/v1/meals').expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe('apple');
  });

  it('updates a meal', async () => {
    const { app } = createServer(':memory:');
    const meal = { id: '1', name: 'apple', calories: 95, occurredAt: 1, updatedAt: 1 };
    await request(app).post('/v1/meals').send(meal).expect(200);
    await request(app).put('/v1/meals/1').send({ name: 'banana', calories: 100, occurredAt: 1, updatedAt: 2 }).expect(200);
    const res = await request(app).get('/v1/meals').expect(200);
    expect(res.body.items[0].name).toBe('banana');
  });

  it('sanitizes inputs to prevent SQL injection', async () => {
    const { app, db } = createServer(':memory:');
    const meal = {
      id: "1'; DROP TABLE meals;--",
      name: "apple'); DROP TABLE meals;--",
      calories: 95,
      occurredAt: 1,
      updatedAt: 1,
    };
    await request(app).post('/v1/meals').send(meal).expect(200);
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meals'").get();
    expect(table).toBeTruthy();
    const res = await request(app).get('/v1/meals').expect(200);
    expect(res.body.items[0].id).toBe('1');
  });
});
