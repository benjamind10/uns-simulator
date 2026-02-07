import { Link } from 'react-router-dom';

import Login from '../../components/global/Login';

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              UNS Simulator
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>
          <Login />
        </div>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
