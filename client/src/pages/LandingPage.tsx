import { useState } from 'react';
import Login from '../components/Login';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <h1 className="text-3xl font-bold text-white">Welcome to the UNS Simulator!</h1>
      )}
    </div>
  );
}
