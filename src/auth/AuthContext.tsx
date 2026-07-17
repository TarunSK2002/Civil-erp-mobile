import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import SecureStore from '../utils/secureStore';

interface User {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Clear any previous persistent session on startup to make login session-only
        await SecureStore.deleteItemAsync('user_session');
      } catch (e) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    // Pre-warm the Render backend server on startup by triggering a silent request
    api.get('/health').catch(() => {});
    
    initAuth();
  }, []);

  const login = async (userData: User) => {
    await SecureStore.setItemAsync('user_session', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('user_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
