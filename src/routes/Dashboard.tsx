import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="p-4 pb-24">
      <div className="grid gap-4">
        <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          Weight Trend (Last 2 Months)
        </div>
        <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          Calories Remaining Today
        </div>
      </div>
      <Link
        to="/meals/new"
        className="fixed bottom-24 right-4 bg-blue-500 text-white rounded-full px-4 py-3 shadow-lg"
      >
        Add Meal
      </Link>
    </div>
  );
}
