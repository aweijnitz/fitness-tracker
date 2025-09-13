import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/index.js';

describe('activities API', () => {
  it('creates and retrieves activities', async () => {
    const { app } = createServer(':memory:');
    const activity = { id: '1', kind: 'walk', durationSec: 60, updatedAt: 1 };
    await request(app).post('/v1/activities').send(activity).expect(200);
    const res = await request(app).get('/v1/activities').expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].kind).toBe('walk');
  });

  it('updates an activity', async () => {
    const { app } = createServer(':memory:');
    const activity = { id: '1', kind: 'walk', durationSec: 60, updatedAt: 1 };
    await request(app).post('/v1/activities').send(activity).expect(200);
    await request(app)
      .put('/v1/activities/1')
      .send({ kind: 'run', durationSec: 120, updatedAt: 2 })
      .expect(200);
    const res = await request(app).get('/v1/activities').expect(200);
    expect(res.body.items[0].kind).toBe('run');
  });
});

