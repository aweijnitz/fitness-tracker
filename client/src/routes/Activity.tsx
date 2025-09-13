import { useReducer, useRef, useEffect } from 'react';
import {
  initialSessionState,
  sessionReducer,
} from '../activity/session';
import { db, type Activity as ActivityRecord } from '../db';
import { enqueueMutation } from '../sync';

export default function Activity() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (state.status === 'running' && watchId.current == null) {
      if ('geolocation' in navigator) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            dispatch({
              type: 'addSample',
              sample: {
                timestamp: pos.timestamp,
                location: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                },
              },
            });
          },
          () => {},
          { enableHighAccuracy: true },
        );
      }
    }
    if (state.status !== 'running' && watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [state.status]);

  useEffect(() => {
    async function requestLock() {
      if (state.status === 'running' && 'wakeLock' in navigator) {
        try {
          const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> } };
          wakeLock.current = await nav.wakeLock?.request('screen');
          wakeLock.current?.addEventListener('release', () => {
            wakeLock.current = null;
          });
        } catch {
          // ignore
        }
      }
    }
    requestLock();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestLock();
      } else {
        wakeLock.current?.release();
        wakeLock.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLock.current?.release();
      wakeLock.current = null;
    };
  }, [state.status]);

  const start = () => dispatch({ type: 'start', timestamp: Date.now() });
  const pause = () => dispatch({ type: 'pause', timestamp: Date.now() });
  const resume = () => dispatch({ type: 'resume', timestamp: Date.now() });
  const stop = async () => {
    const timestamp = Date.now();
    const finalState = sessionReducer(state, { type: 'stop', timestamp });
    dispatch({ type: 'stop', timestamp });
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    wakeLock.current?.release();
    wakeLock.current = null;

    const activity: ActivityRecord = {
      id: crypto.randomUUID(),
      userId: 'local-user',
      kind: 'walk',
      distanceKm: finalState.distance,
      durationSec: finalState.duration,
      steps: 0,
      samples: finalState.samples,
      startedAt: new Date(finalState.startedAt ?? timestamp).toISOString(),
      endedAt: new Date(timestamp).toISOString(),
      updatedAt: new Date(timestamp).toISOString(),
      clientTag: crypto.randomUUID(),
    };
    await db.activities.add(activity);
    await enqueueMutation({
      entity: 'activity',
      operation: 'create',
      payload: activity,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div>Distance: {state.distance.toFixed(2)} km</div>
      <div>Duration: {state.duration}s</div>
      {state.status === 'idle' && (
        <button className="btn" onClick={start}>
          Start
        </button>
      )}
      {state.status === 'running' && (
        <div className="space-x-2">
          <button className="btn" onClick={pause}>
            Pause
          </button>
          <button className="btn" onClick={stop}>
            Stop
          </button>
        </div>
      )}
      {state.status === 'paused' && (
        <div className="space-x-2">
          <button className="btn" onClick={resume}>
            Resume
          </button>
          <button className="btn" onClick={stop}>
            Stop
          </button>
        </div>
      )}
      {state.status === 'stopped' && (
        <button className="btn" onClick={start}>
          Restart
        </button>
      )}
    </div>
  );
}
