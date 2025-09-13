import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'text-blue-500' : 'text-gray-500';

export default function AppShell() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <nav className="flex justify-around border-t bg-white dark:bg-gray-800 py-2 pb-[env(safe-area-inset-bottom)]">
        <NavLink to="/" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/meals" className={linkClass}>
          Meals
        </NavLink>
        <NavLink to="/activity" className={linkClass}>
          Activity
        </NavLink>
        <NavLink to="/workout" className={linkClass}>
          Workout
        </NavLink>
        <NavLink to="/settings" className={linkClass}>
          Settings
        </NavLink>
      </nav>
    </div>
  );
}
