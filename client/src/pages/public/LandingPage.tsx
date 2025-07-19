import { useSelector } from 'react-redux';
import Login from '../../components/Login';
import { selectIsAuthenticated } from '../../store/authSlice';

export default function LandingPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center 
                 bg-white dark:bg-gray-900 
                 text-gray-800 dark:text-gray-100 
                 transition-colors duration-300 px-4"
    >
      {!isAuthenticated ? (
        <Login />
      ) : (
        <h1 className="text-5xl font-bold mb-4 text-center">
          Welcome to the UNS Simulator!
        </h1>
      )}
    </div>
  );
}
