import { db, type AppDB, type Mutation, type MutationEntity, type MutationOperation } from './db';
import { uuid } from './utils/uuid';

export async function enqueueMutation(
  mutation: { entity: MutationEntity; operation: MutationOperation; payload: unknown },
  database: AppDB = db,
) {
  const item: Mutation = {
    id: uuid(),
    retryCount: 0,
    retryAt: 0,
    createdAt: Date.now(),
    ...mutation,
  };
  await database.mutations.add(item);
  await registerSync();
  return item;
}

export async function registerSync(tag = 'sync-mutations') {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('SyncManager' in window)
  ) {
    return;
  }
  const reg = await navigator.serviceWorker.ready;
  try {
    await (reg as ServiceWorkerRegistration & {
      sync: { register(tag: string): Promise<void> };
    }).sync.register(tag);
  } catch {
    // ignore
  }
}

export async function replayMutations(options: {
  sendMutation?: (m: Mutation) => Promise<void>;
  now?: () => number;
  db?: AppDB;
} = {}) {
  const send = options.sendMutation ?? (async () => {});
  const nowFn = options.now ?? (() => Date.now());
  const database = options.db ?? db;
  const now = nowFn();
  const pending = await database.mutations
    .where('retryAt')
    .belowOrEqual(now)
    .sortBy('createdAt');

  for (const mut of pending) {
    try {
      await send(mut);
      await database.mutations.delete(mut.id);
    } catch {
      const retryCount = mut.retryCount + 1;
      const delay = Math.min(60_000, 2 ** retryCount * 1000);
      const retryAt = now + delay;
      await database.mutations.update(mut.id, { retryCount, retryAt });
    }
  }
}
