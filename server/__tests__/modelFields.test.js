import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/index.js';

describe('model fields persistence', () => {
  it('meals: stores and returns optional fields', async () => {
    const { app } = createServer(':memory:');
    const meal = {
      id: 'm-10',
      userId: 'u1',
      type: 'breakfast',
      name: 'Omelette',
      calories: 420,
      items: [{ name: 'eggs', grams: 120 }],
      occurredAt: 1000,
      updatedAt: 1000,
      clientTag: 'ct-1',
    };
    await request(app).post('/v1/meals').send(meal).expect(200);
    const res = await request(app).get('/v1/meals?since=0').expect(200);
    const found = res.body.items.find((i) => i.id === 'm-10');
    expect(found).toBeTruthy();
    expect(found.userId).toBe('u1');
    expect(found.type).toBe('breakfast');
    expect(found.name).toBe('Omelette');
    expect(found.calories).toBe(420);
    expect(Array.isArray(found.items)).toBe(true);
    expect(found.clientTag).toBe('ct-1');
  });

  it('activities: stores and returns optional fields', async () => {
    const { app } = createServer(':memory:');
    const act = {
      id: 'a-10',
      userId: 'u2',
      kind: 'walk',
      distanceKm: 2.5,
      durationSec: 900,
      steps: 3000,
      samples: [{ t: 1, lat: 1, lng: 2 }],
      startedAt: 1100,
      endedAt: 2000,
      updatedAt: 2000,
      clientTag: 'ct-2',
    };
    await request(app).post('/v1/activities').send(act).expect(200);
    const res = await request(app).get('/v1/activities?since=0').expect(200);
    const found = res.body.items.find((i) => i.id === 'a-10');
    expect(found).toBeTruthy();
    expect(found.userId).toBe('u2');
    expect(found.kind).toBe('walk');
    expect(found.distanceKm).toBe(2.5);
    expect(found.durationSec).toBe(900);
    expect(found.steps).toBe(3000);
    expect(Array.isArray(found.samples)).toBe(true);
    expect(found.startedAt).toBe(1100);
    expect(found.endedAt).toBe(2000);
    expect(found.clientTag).toBe('ct-2');
  });

  it('workouts: stores and returns optional fields', async () => {
    const { app } = createServer(':memory:');
    const wo = {
      id: 'wo-10',
      userId: 'u3',
      name: 'Upper Body',
      reps: [{ title: 'Bench', sets: [{ reps: 8, weightKg: 60 }] }],
      updatedAt: 3000,
      clientTag: 'ct-3',
    };
    await request(app).post('/v1/workouts').send(wo).expect(200);
    const res = await request(app).get('/v1/workouts?since=0').expect(200);
    const found = res.body.items.find((i) => i.id === 'wo-10');
    expect(found).toBeTruthy();
    expect(found.userId).toBe('u3');
    expect(found.name).toBe('Upper Body');
    expect(Array.isArray(found.reps)).toBe(true);
    expect(found.clientTag).toBe('ct-3');
  });

  it('weights: stores and returns optional fields', async () => {
    const { app } = createServer(':memory:');
    const w = {
      id: 'w-10',
      userId: 'u4',
      kg: 77.7,
      occurredAt: 4000,
      updatedAt: 4000,
      clientTag: 'ct-4',
    };
    await request(app).post('/v1/weights').send(w).expect(200);
    const res = await request(app).get('/v1/weights?since=0').expect(200);
    const found = res.body.items.find((i) => i.id === 'w-10');
    expect(found).toBeTruthy();
    expect(found.userId).toBe('u4');
    expect(found.kg).toBe(77.7);
    expect(found.clientTag).toBe('ct-4');
  });
});

