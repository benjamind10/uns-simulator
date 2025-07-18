import { useEffect, useState } from 'react';
import Login from '../components/Login';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  console.log(isLoggedIn);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center 
                    bg-white dark:bg-gray-900 
                    text-gray-800 dark:text-gray-100 
                    transition-colors duration-300 px-4 relative"
    >
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <h1 className="text-5xl font-bold mb-4 text-center">
          Welcome to the UNS Simulator!
        </h1>
      )}
    </div>
  );
}
