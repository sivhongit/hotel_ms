import { useState, type ReactNode } from 'react';
import api from '../services/api';
import type { AuthUser } from '../types/hostel';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hostel_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('hostel_refresh_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('hostel_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  const login = async (email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('hostel_token', data.accessToken);
    localStorage.setItem('hostel_refresh_token', data.refreshToken);
    localStorage.setItem('hostel_user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>('/auth/register', {
      username,
      email,
      password,
    });
    localStorage.setItem('hostel_token', data.accessToken);
    localStorage.setItem('hostel_refresh_token', data.refreshToken);
    localStorage.setItem('hostel_user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // Ignore logout errors
      }
    }
    localStorage.removeItem('hostel_token');
    localStorage.removeItem('hostel_refresh_token');
    localStorage.removeItem('hostel_user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
