import { describe, it, expect, vi } from 'vitest';
import { AppDB } from '../db';
import { enqueueMutation, replayMutations } from '../sync';

describe('mutation queue', () => {
  it('persists across reloads', async () => {
    const db = new AppDB('persist-db');
    await enqueueMutation(
      { entity: 'meal', operation: 'create', payload: { foo: 'bar' } },
      db,
    );
    db.close();
    const reopened = new AppDB('persist-db');
    const items = await reopened.mutations.toArray();
    expect(items).toHaveLength(1);
    expect(items[0].entity).toBe('meal');
    await reopened.delete();
  });

  it('retries with backoff on failure', async () => {
    const db = new AppDB('retry-db');
    await enqueueMutation(
      { entity: 'meal', operation: 'create', payload: { foo: 'bar' } },
      db,
    );

    const send = vi
      .fn<[], Promise<void>>()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce();

    let now = 0;
    const nowFn = vi.fn(() => now);

    await replayMutations({ sendMutation: send, now: nowFn, db });
    let queued = await db.mutations.toArray();
    expect(send).toHaveBeenCalledTimes(1);
    expect(queued[0].retryCount).toBe(1);
    const retryAt = queued[0].retryAt;
    expect(retryAt).toBeGreaterThan(0);

    now = retryAt - 1;
    await replayMutations({ sendMutation: send, now: nowFn, db });
    queued = await db.mutations.toArray();
    expect(send).toHaveBeenCalledTimes(1);
    expect(queued).toHaveLength(1);

    now = retryAt;
    await replayMutations({ sendMutation: send, now: nowFn, db });
    queued = await db.mutations.toArray();
    expect(send).toHaveBeenCalledTimes(2);
    expect(queued).toHaveLength(0);

    await db.delete();
  });
});
