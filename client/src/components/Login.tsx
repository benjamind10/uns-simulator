import { useState } from 'react';
import { loginUser } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginUser(email, password);
    if (result) {
      sessionStorage.setItem('authToken', result.token);
      login(); // <-- update global state
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Login</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <input
        type="text"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 mb-4 border border-gray-600 bg-gray-900 text-white placeholder-gray-400 rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 mb-6 border border-gray-600 bg-gray-900 text-white placeholder-gray-400 rounded"
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
      >
        Log In
      </button>
    </form>
  );
}
