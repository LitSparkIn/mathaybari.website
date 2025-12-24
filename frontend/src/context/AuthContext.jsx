import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const storedToken = localStorage.getItem('mathaybari_token');
    const storedEmail = localStorage.getItem('mathaybari_email');
    
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUser({ email: storedEmail });
    }
    setLoading(false);
  }, []);

  const login = (authToken, email) => {
    localStorage.setItem('mathaybari_token', authToken);
    localStorage.setItem('mathaybari_email', email);
    setToken(authToken);
    setUser({ email });
  };

  const logout = () => {
    localStorage.removeItem('mathaybari_token');
    localStorage.removeItem('mathaybari_email');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
