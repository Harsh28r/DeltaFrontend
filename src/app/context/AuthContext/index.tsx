'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  companyName?: string;
  role?: string;
  level?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, remember?: boolean) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = (): boolean => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return false;
      }

      // Check localStorage first (remember me)
      let storedToken = localStorage.getItem('auth_token');
      let storedUser = localStorage.getItem('auth_user');

      // If not in localStorage, check sessionStorage
      if (!storedToken) {
        storedToken = sessionStorage.getItem('auth_token');
        storedUser = sessionStorage.getItem('auth_user');
      }

      // Check cookies as fallback
      if (!storedToken) {
        const cookieMatch = document.cookie.match(/(?:^|;\s*)(?:auth_token|token|accessToken)=([^;]+)/);
        if (cookieMatch) {
          storedToken = cookieMatch[1];
        }
      }

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          return true;
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Clear invalid data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_user');
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  };

  const login = (newToken: string, userData: User, remember: boolean = false) => {
    try {
      if (remember) {
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('auth_token', newToken);
        sessionStorage.setItem('auth_user', JSON.stringify(userData));
      }
      
      // Set cookies for backend middleware authentication check
      const cookieOptions = remember ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '';
      document.cookie = `auth_token=${newToken}${cookieOptions}; path=/`;
      document.cookie = `token=${newToken}${cookieOptions}; path=/`;
      document.cookie = `accessToken=${newToken}${cookieOptions}; path=/`;
      
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Error storing authentication data:', error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      
      // Clear cookies
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      setToken(null);
      setUser(null);
      
      router.push('/auth/auth1/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    try {
      const isAuth = checkAuth();
      setIsLoading(false);
      
      // Let backend middleware handle route protection
      // We just check if user is authenticated for UI purposes
      
      // Additional check: if user tries to access root path without auth, redirect to login
      if (!isAuth && typeof window !== 'undefined' && window.location.pathname === '/') {
        router.push('/auth/auth1/login');
      }
    } catch (error) {
      console.error('Error in AuthContext useEffect:', error);
      setIsLoading(false);
    }
  }, []); // Remove router dependency to prevent infinite re-renders

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
