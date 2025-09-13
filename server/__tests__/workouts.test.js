import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/index.js';

describe('workouts API', () => {
  it('creates and retrieves workouts', async () => {
    const { app } = createServer(':memory:');
    const workout = { id: '1', name: 'leg day', updatedAt: 1 };
    await request(app).post('/v1/workouts').send(workout).expect(200);
    const res = await request(app).get('/v1/workouts').expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe('leg day');
  });

  it('updates a workout', async () => {
    const { app } = createServer(':memory:');
    const workout = { id: '1', name: 'leg day', updatedAt: 1 };
    await request(app).post('/v1/workouts').send(workout).expect(200);
    await request(app)
      .put('/v1/workouts/1')
      .send({ name: 'arm day', updatedAt: 2 })
      .expect(200);
    const res = await request(app).get('/v1/workouts').expect(200);
    expect(res.body.items[0].name).toBe('arm day');
  });
});

