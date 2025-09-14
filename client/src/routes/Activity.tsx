import { useReducer, useRef, useEffect, useState, useCallback } from 'react';
import {
  initialSessionState,
  sessionReducer,
} from '../activity/session';
import { db, type Activity as ActivityRecord } from '../db';
import { enqueueMutation } from '../sync';
import dayjs from 'dayjs';
import { uuid } from '../utils/uuid';

function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = sec.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss.padStart(2, '0')}`;
}

export default function Activity() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const [recentCount, setRecentCount] = useState<number>(() => {
    // Load from localStorage → env → default
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('recentActivitiesCount');
        const n = Number(stored);
        if (Number.isFinite(n) && n > 0) return n;
      }
    } catch {}
    const v = Number((import.meta as any).env?.VITE_RECENT_ACTIVITIES_COUNT);
    return Number.isFinite(v) && v > 0 ? v : 10;
  });
  const [recent, setRecent] = useState<ActivityRecord[]>([]);

  const loadRecent = useCallback(async (count = recentCount) => {
    const items = await db.activities
      .orderBy('updatedAt')
      .reverse()
      .limit(count)
      .toArray();
    setRecent(items);
  }, [recentCount]);

  useEffect(() => {
    loadRecent().catch(() => {});
  }, [loadRecent]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('recentActivitiesCount', String(recentCount));
      }
    } catch {}
  }, [recentCount]);

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
      id: uuid(),
      userId: 'local-user',
      kind: 'walk',
      distanceKm: finalState.distance,
      durationSec: finalState.duration,
      steps: 0,
      samples: finalState.samples,
      startedAt: new Date(finalState.startedAt ?? timestamp).toISOString(),
      endedAt: new Date(timestamp).toISOString(),
      updatedAt: new Date(timestamp).toISOString(),
      clientTag: uuid(),
    };
    await db.activities.add(activity);
    await enqueueMutation({
      entity: 'activity',
      operation: 'create',
      payload: activity,
    });
    await loadRecent();
  };

  return (
    <div className="p-4 space-y-6">
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

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Recent activities</h2>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            Show
            <input
              type="number"
              min={1}
              className="w-16 border rounded px-2 py-1"
              value={recentCount}
              onChange={(e) => {
                const n = Number(e.target.value);
                const next = Number.isFinite(n) && n > 0 ? n : 10;
                setRecentCount(next);
                loadRecent(next);
              }}
            />
          </label>
        </div>
        {recent.length === 0 ? (
          <div className="text-sm text-gray-500">No activities yet.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recent.map((a) => {
              const ended = a.endedAt ?? a.updatedAt;
              const when = dayjs(ended).format('YYYY-MM-DD HH:mm');
              const durStr = formatDuration(Number(a.durationSec || 0));
              return (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-600">{when}</span>
                    <span className="font-medium capitalize">{a.kind}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{(a.distanceKm ?? 0).toFixed(2)} km</div>
                    <div className="text-xs text-gray-600">{durStr}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
