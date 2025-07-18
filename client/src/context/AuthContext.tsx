import { createContext, useState, useEffect } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, []);

  const login = () => setIsLoggedIn(true);
  const logout = () => {
    sessionStorage.removeItem('authToken');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
