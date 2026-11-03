import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

/**
 * Hook to access auth context from any component.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

/**
 * AuthProvider wraps the app and manages user state + JWT persistence.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user from localStorage on first render
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hqs_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem('hqs_user');
    } finally {
      setLoading(false);
    }
  }, []);

  /** POST /api/auth/login */
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const userData = data.data;
    setUser(userData);
    localStorage.setItem('hqs_user', JSON.stringify(userData));
    toast.success(`Welcome back, ${userData.name}! 👋`);
    return userData;
  };

  /** POST /api/auth/register (patients only) */
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    const userData = data.data;
    setUser(userData);
    localStorage.setItem('hqs_user', JSON.stringify(userData));
    toast.success('Account created successfully!');
    return userData;
  };

  /** Clear session */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('hqs_user');
    toast.success('Logged out. See you soon!');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
