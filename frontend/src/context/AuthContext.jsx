import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eventforge_token');

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem('eventforge_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { token, user: authenticatedUser } = response.data;
    localStorage.setItem('eventforge_token', token);
    setUser(authenticatedUser);
    return response.data;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    const { token, user: authenticatedUser } = response.data;
    localStorage.setItem('eventforge_token', token);
    setUser(authenticatedUser);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('eventforge_token');
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const response = await api.put('/auth/me', payload);
    setUser(response.data.user);
    return response.data.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: Boolean(user),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
