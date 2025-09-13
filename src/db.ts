import Dexie, { type Table } from 'dexie';

export interface Meal {
  id: string;
  userId: string;
  type: string;
  calories: number;
  name: string;
  items: string[];
  occurredAt: string;
  updatedAt: string;
  clientTag: string;
}

export interface LocationSample {
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface Activity {
  id: string;
  userId: string;
  kind: string;
  distanceKm: number;
  durationSec: number;
  steps: number;
  samples: LocationSample[];
  startedAt: string;
  endedAt: string;
  updatedAt: string;
  clientTag: string;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  reps: unknown[];
  updatedAt: string;
  clientTag: string;
}

export interface WeightEntry {
  id: string;
  userId: string;
  kg: number;
  occurredAt: string;
  updatedAt: string;
  clientTag: string;
}

export type MutationEntity = 'meal' | 'activity' | 'workout' | 'weight';
export type MutationOperation = 'create' | 'update' | 'delete';

export interface Mutation {
  id: string;
  entity: MutationEntity;
  operation: MutationOperation;
  payload: unknown;
  retryCount: number;
  retryAt: number;
  createdAt: number;
}

export class AppDB extends Dexie {
  meals!: Table<Meal, string>;
  activities!: Table<Activity, string>;
  workouts!: Table<Workout, string>;
  weightEntries!: Table<WeightEntry, string>;
  mutations!: Table<Mutation, string>;

  constructor(name = 'fittrack') {
    super(name);
    this.version(1).stores({
      meals: 'id, updatedAt',
      activities: 'id, updatedAt',
      workouts: 'id, updatedAt',
      weightEntries: 'id, occurredAt, updatedAt',
      mutations: 'id, entity, retryAt',
    });
  }
}

export const db = new AppDB();
