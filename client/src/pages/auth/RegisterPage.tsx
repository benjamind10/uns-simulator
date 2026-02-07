import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

import type { RootState, AppDispatch } from '../../store/store';
import { clearError, registerAsync } from '../../store/auth';

const inputClasses =
  'w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

export default function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const result = await dispatch(
      registerAsync({
        username: form.username,
        email: form.email,
        password: form.password,
      })
    );

    if (registerAsync.fulfilled.match(result)) {
      navigate('/login');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              UNS Simulator
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create your account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="username"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="Create a password"
              />
            </div>
            <div>
              <label
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="Confirm your password"
              />
            </div>
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
