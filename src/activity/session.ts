import { LocationSample } from '../db';
import { haversineDistance } from './distance';

export interface SessionState {
  status: 'idle' | 'running' | 'paused' | 'stopped';
  samples: LocationSample[];
  distance: number; // kilometers
  duration: number; // seconds
  startedAt?: number;
  lastTimestamp?: number;
  pausedAt?: number;
  pausedMs: number;
}

export type SessionAction =
  | { type: 'start'; timestamp: number }
  | { type: 'addSample'; sample: LocationSample }
  | { type: 'pause'; timestamp: number }
  | { type: 'resume'; timestamp: number }
  | { type: 'stop'; timestamp: number };

export const initialSessionState: SessionState = {
  status: 'idle',
  samples: [],
  distance: 0,
  duration: 0,
  pausedMs: 0,
};

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'start':
      return {
        status: 'running',
        samples: [],
        distance: 0,
        duration: 0,
        startedAt: action.timestamp,
        lastTimestamp: action.timestamp,
        pausedMs: 0,
      };
    case 'addSample': {
      if (state.status !== 'running') return state;
      const samples = [...state.samples, action.sample];
      const prev = state.samples[state.samples.length - 1];
      const additional = prev
        ? haversineDistance(prev.location, action.sample.location)
        : 0;
      const lastTimestamp = action.sample.timestamp;
      const duration = state.startedAt !== undefined
        ? Math.round((lastTimestamp - state.startedAt - state.pausedMs) / 1000)
        : state.duration;
      return {
        ...state,
        samples,
        distance: state.distance + additional,
        lastTimestamp,
        duration,
      };
    }
    case 'pause':
      if (state.status !== 'running') return state;
      return { ...state, status: 'paused', pausedAt: action.timestamp };
    case 'resume': {
      if (state.status !== 'paused') return state;
      const pausedMs =
        state.pausedMs +
        (state.pausedAt ? action.timestamp - state.pausedAt : 0);
      return { ...state, status: 'running', pausedAt: undefined, pausedMs };
    }
    case 'stop': {
      if (state.status === 'idle' || state.status === 'stopped') return state;
      const pausedMs =
        state.pausedMs +
        (state.status === 'paused' && state.pausedAt
          ? action.timestamp - state.pausedAt
          : 0);
      const duration = state.startedAt !== undefined
        ? Math.round((action.timestamp - state.startedAt - pausedMs) / 1000)
        : state.duration;
      return {
        ...state,
        status: 'stopped',
        duration,
        lastTimestamp: action.timestamp,
        pausedMs,
      };
    }
    default:
      return state;
  }
}
