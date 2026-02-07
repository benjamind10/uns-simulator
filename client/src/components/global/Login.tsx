import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { loginAsync } from '../../store/auth';
import type { AppDispatch, RootState } from '../../store/store';

interface LoginProps {
  className?: string;
}

export default function Login({ className = '' }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Get error state from Redux
  const { error, loading } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(loginAsync({ email, password })).unwrap();
      navigate('/app');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 ${className}`}
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
