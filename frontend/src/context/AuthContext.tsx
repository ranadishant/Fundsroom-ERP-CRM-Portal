import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiFetch, getAuthToken, setAuthToken, removeAuthToken } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    if (!getAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to verify token', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.success && data.token) {
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
  };

  const switchRoleQuick = async (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      Admin: 'admin@fundsroom.com',
      Sales: 'sales@fundsroom.com',
      Warehouse: 'warehouse@fundsroom.com',
      Accounts: 'accounts@fundsroom.com',
    };
    await login(roleEmailMap[role], 'Password123!');
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRoleQuick }}>
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
