import { expect, test } from 'vitest';
import { haversineDistance } from '../activity/distance';

const p = (latitude: number, longitude: number) => ({ latitude, longitude });

test('zero distance for identical points', () => {
  expect(haversineDistance(p(0, 0), p(0, 0))).toBe(0);
});

test('distance of 1 degree longitude at equator ~111.32km', () => {
  const d = haversineDistance(p(0, 0), p(0, 1));
  expect(d).toBeGreaterThan(111);
  expect(d).toBeLessThan(112);
});
