import { Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { replayMutations } from './sync';
import { sendMutationViaFetch, syncDownWeights, syncDownMeals, syncDownActivities, syncDownWorkouts } from './serverSync';
import AppShell from './AppShell';
import Dashboard from './routes/Dashboard';
import Meals from './routes/Meals';
import Activity from './routes/Activity';
import Workout from './routes/Workout';
import Settings from './routes/Settings';
import Login from './routes/Login';
import Callback from './routes/Callback';
import Offline from './routes/Offline';
import ProtectedRoute from './routes/ProtectedRoute';
import NewMeal from './routes/NewMeal';

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          syncDownWeights(),
          syncDownMeals(),
          syncDownActivities(),
          syncDownWorkouts(),
        ]);
        await replayMutations({ sendMutation: sendMutationViaFetch });
      } catch {}
    })();
  }, []);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/offline" element={<Offline />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/meals" element={<Meals />} />
        <Route path="/meals/new" element={<NewMeal />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
