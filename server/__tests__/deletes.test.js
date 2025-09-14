import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/index.js';

describe('delete endpoints', () => {
  it('deletes a meal', async () => {
    const { app } = createServer(':memory:');
    await request(app).post('/v1/meals').send({ id: 'm1', name: 'x', calories: 1, occurredAt: 1, updatedAt: 1 });
    const before = await request(app).get('/v1/meals');
    expect(before.body.items.length).toBe(1);
    const del = await request(app).delete('/v1/meals/m1');
    expect(del.status).toBe(200);
    const after = await request(app).get('/v1/meals');
    expect(after.body.items.length).toBe(0);
  });

  it('deletes an activity', async () => {
    const { app } = createServer(':memory:');
    await request(app).post('/v1/activities').send({ id: 'a1', kind: 'walk', durationSec: 1, updatedAt: 1 });
    const before = await request(app).get('/v1/activities');
    expect(before.body.items.length).toBe(1);
    const del = await request(app).delete('/v1/activities/a1');
    expect(del.status).toBe(200);
    const after = await request(app).get('/v1/activities');
    expect(after.body.items.length).toBe(0);
  });

  it('deletes a workout', async () => {
    const { app } = createServer(':memory:');
    await request(app).post('/v1/workouts').send({ id: 'w1', name: 'leg', updatedAt: 1 });
    const before = await request(app).get('/v1/workouts');
    expect(before.body.items.length).toBe(1);
    const del = await request(app).delete('/v1/workouts/w1');
    expect(del.status).toBe(200);
    const after = await request(app).get('/v1/workouts');
    expect(after.body.items.length).toBe(0);
  });
});

