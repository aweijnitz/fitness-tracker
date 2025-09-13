import { TokenManager } from '../auth/tokenManager';
import * as openauth from 'openauth-js';
import { vi, beforeEach, test, expect } from 'vitest';

beforeEach(async () => {
  const tm = new TokenManager();
  await tm.clear();
});

test('stores and loads tokens from IndexedDB', async () => {
  const tm = new TokenManager();
  const tokens = { accessToken: 'a', refreshToken: 'r', expiresAt: Date.now() + 1000 };
  await tm.save(tokens);
  const tm2 = new TokenManager();
  const loaded = await tm2.load();
  expect(loaded).toEqual(tokens);
});

test('refreshes expired access token', async () => {
  const refreshMock = vi.spyOn(openauth, 'refresh').mockResolvedValue({
    access_token: 'new-access',
    refresh_token: 'new-refresh',
    expires_in: 3600,
  });
  const tm = new TokenManager();
  await tm.save({ accessToken: 'old', refreshToken: 'r1', expiresAt: Date.now() - 1000 });
  const token = await tm.getValidAccessToken();
  expect(refreshMock).toHaveBeenCalledWith('r1');
  expect(token).toBe('new-access');
});
