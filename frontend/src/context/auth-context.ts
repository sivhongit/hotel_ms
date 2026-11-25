import { createContext } from 'react';
import type { AuthUser } from '../types/hostel';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
