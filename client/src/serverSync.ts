import { db, type AppDB, type Mutation, type WeightEntry, type Meal, type Activity, type Workout } from './db';

const BASE = '';

// Upload a single queued mutation to the server
function toTs(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
}

export async function sendMutationViaFetch(m: Mutation): Promise<void> {
  if (m.entity === 'weight') {
    if (m.operation === 'delete') {
      const id = (m.payload as { id: string }).id;
      const res = await fetch(`/v1/weights/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('failed');
      return;
    }

    const p = m.payload as Partial<WeightEntry> & { id: string };
    const body = {
      id: p.id,
      valueKg: Number(p.kg),
      occurredAt: Number(p.occurredAt),
      updatedAt: Number(p.updatedAt),
    };
    const method = m.operation === 'create' ? 'POST' : 'PUT';
    const path = m.operation === 'create' ? '/v1/weights' : `/v1/weights/${encodeURIComponent(p.id)}`;
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('failed');
    return;
    return;
  }

  if (m.entity === 'meal') {
    if (m.operation === 'delete') {
      const id = (m.payload as { id: string }).id;
      const res = await fetch(`/v1/meals/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      return;
    }
    const p = m.payload as Partial<Meal> & { id: string };
    const body = {
      id: p.id,
      name: p.name ?? 'Meal',
      calories: Number(p.calories ?? 0),
      occurredAt: toTs(p.occurredAt ?? 0),
      updatedAt: toTs(p.updatedAt ?? Date.now()),
    };
    const method = m.operation === 'create' ? 'POST' : 'PUT';
    const path = m.operation === 'create' ? '/v1/meals' : `/v1/meals/${encodeURIComponent(p.id)}`;
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('failed');
    return;
  }

  if (m.entity === 'activity') {
    if (m.operation === 'delete') {
      const id = (m.payload as { id: string }).id;
      const res = await fetch(`/v1/activities/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      return;
    }
    const p = m.payload as Partial<Activity> & { id: string };
    const body = {
      id: p.id,
      kind: p.kind ?? 'walk',
      durationSec: Number(p.durationSec ?? 0),
      updatedAt: toTs(p.updatedAt ?? Date.now()),
    };
    const method = m.operation === 'create' ? 'POST' : 'PUT';
    const path = m.operation === 'create' ? '/v1/activities' : `/v1/activities/${encodeURIComponent(p.id)}`;
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('failed');
    return;
  }

  if (m.entity === 'workout') {
    if (m.operation === 'delete') {
      const id = (m.payload as { id: string }).id;
      const res = await fetch(`/v1/workouts/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      return;
    }
    const p = m.payload as Partial<Workout> & { id: string };
    const body = {
      id: p.id,
      name: p.name ?? 'Workout',
      updatedAt: toTs(p.updatedAt ?? Date.now()),
    };
    const method = m.operation === 'create' ? 'POST' : 'PUT';
    const path = m.operation === 'create' ? '/v1/workouts' : `/v1/workouts/${encodeURIComponent(p.id)}`;
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('failed');
    return;
  }
}

// Download weights updated since the last local update and merge into IndexedDB
export async function syncDownWeights(database: AppDB = db): Promise<void> {
  const last = await database.weightEntries.orderBy('updatedAt').last();
  const since = last ? Number(last.updatedAt) || 0 : 0;
  const res = await fetch(`/v1/weights?since=${since}`);
  if (!res.ok) return;
  const data: { items: Array<{ id: string; valueKg: number; occurredAt: number; updatedAt: number }>; syncStamp: number } = await res.json();
  const items = data.items ?? [];
  if (items.length === 0) return;
  await database.transaction('rw', database.weightEntries, async () => {
    for (const it of items) {
      await database.weightEntries.put({
        id: it.id,
        userId: 'server',
        kg: it.valueKg,
        occurredAt: String(it.occurredAt),
        updatedAt: String(it.updatedAt),
        clientTag: 'server',
      } as unknown as WeightEntry);
    }
  });
}

export async function syncDownMeals(database: AppDB = db): Promise<void> {
  const last = await database.meals.orderBy('updatedAt').last();
  const since = last ? toTs(last.updatedAt) : 0;
  const res = await fetch(`/v1/meals?since=${since}`);
  if (!res.ok) return;
  const data: { items: Array<{ id: string; name: string; calories: number; occurredAt: number; updatedAt: number }>; syncStamp: number } = await res.json();
  const items = data.items ?? [];
  if (items.length === 0) return;
  await database.transaction('rw', database.meals, async () => {
    for (const it of items) {
      await database.meals.put({
        id: it.id,
        userId: 'server',
        type: 'snack',
        calories: it.calories,
        name: it.name,
        items: [],
        occurredAt: String(it.occurredAt),
        updatedAt: String(it.updatedAt),
        clientTag: 'server',
      } as unknown as Meal);
    }
  });
}

export async function syncDownActivities(database: AppDB = db): Promise<void> {
  const last = await database.activities.orderBy('updatedAt').last();
  const since = last ? toTs(last.updatedAt) : 0;
  const res = await fetch(`/v1/activities?since=${since}`);
  if (!res.ok) return;
  const data: { items: Array<{ id: string; kind: string; durationSec: number; updatedAt: number }>; syncStamp: number } = await res.json();
  const items = data.items ?? [];
  if (items.length === 0) return;
  await database.transaction('rw', database.activities, async () => {
    for (const it of items) {
      await database.activities.put({
        id: it.id,
        userId: 'server',
        kind: it.kind,
        distanceKm: 0,
        durationSec: it.durationSec,
        steps: 0,
        samples: [],
        startedAt: String(it.updatedAt),
        endedAt: String(it.updatedAt),
        updatedAt: String(it.updatedAt),
        clientTag: 'server',
      } as unknown as Activity);
    }
  });
}

export async function syncDownWorkouts(database: AppDB = db): Promise<void> {
  const last = await database.workouts.orderBy('updatedAt').last();
  const since = last ? toTs(last.updatedAt) : 0;
  const res = await fetch(`/v1/workouts?since=${since}`);
  if (!res.ok) return;
  const data: { items: Array<{ id: string; name: string; updatedAt: number }>; syncStamp: number } = await res.json();
  const items = data.items ?? [];
  if (items.length === 0) return;
  await database.transaction('rw', database.workouts, async () => {
    for (const it of items) {
      await database.workouts.put({
        id: it.id,
        userId: 'server',
        name: it.name,
        reps: [],
        updatedAt: String(it.updatedAt),
        clientTag: 'server',
      } as unknown as Workout);
    }
  });
}
