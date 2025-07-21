import { useSelector } from 'react-redux';

import Login from '../../components/global/Login';
import { selectIsAuthenticated } from '../../store/auth';

export default function LandingPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-start pt-16
                 bg-white dark:bg-gray-900 
                 text-gray-800 dark:text-gray-100 
                 transition-colors duration-300 px-4"
    >
      {!isAuthenticated ? (
        <div className="w-full max-w-md mx-auto">
          <Login className="bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded shadow p-6" />
        </div>
      ) : (
        <h1 className="text-5xl font-bold mb-4 text-center">
          Welcome to the UNS Simulator!
        </h1>
      )}
      {/* Add some space at the bottom for the footer */}
      <div className="flex-1" />
    </div>
  );
}
