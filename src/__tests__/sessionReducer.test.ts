import { expect, test } from 'vitest';
import {
  initialSessionState,
  sessionReducer,
  SessionState,
} from '../activity/session';
import { LocationSample } from '../db';

function sample(
  latitude: number,
  longitude: number,
  timestamp: number,
): LocationSample {
  return {
    timestamp,
    location: { latitude, longitude, accuracy: 5 },
  };
}

test('start and add samples accumulate distance and duration', () => {
  let state: SessionState = sessionReducer(initialSessionState, {
    type: 'start',
    timestamp: 0,
  });
  state = sessionReducer(state, {
    type: 'addSample',
    sample: sample(0, 0, 0),
  });
  state = sessionReducer(state, {
    type: 'addSample',
    sample: sample(0, 1, 1000),
  });
  expect(state.distance).toBeGreaterThan(111);
  expect(state.duration).toBe(1);
});

test('pause and resume change status', () => {
  let state = sessionReducer(initialSessionState, { type: 'start', timestamp: 0 });
  state = sessionReducer(state, { type: 'pause', timestamp: 1000 });
  expect(state.status).toBe('paused');
  state = sessionReducer(state, { type: 'resume', timestamp: 2000 });
  expect(state.status).toBe('running');
});

test('stop finalizes duration', () => {
  let state = sessionReducer(initialSessionState, { type: 'start', timestamp: 0 });
  state = sessionReducer(state, {
    type: 'addSample',
    sample: sample(0, 0, 0),
  });
  state = sessionReducer(state, { type: 'stop', timestamp: 5000 });
  expect(state.status).toBe('stopped');
  expect(state.duration).toBe(5);
});
