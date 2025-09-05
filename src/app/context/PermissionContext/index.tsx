'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { API_ENDPOINTS } from '@/lib/config';
import { UserPermissions, PermissionResponse } from '@/app/types/permissions';

interface PermissionContextType {
  userPermissions: UserPermissions | null;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPermissions = async (userId: string, authToken: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.USER_PERMISSIONS(userId), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: PermissionResponse = await response.json();
        setUserPermissions({
          allowed: data.allowed || [],
          denied: data.denied || []
        });
      } else if (response.status === 404) {
        // User permissions not found, set default permissions
        setUserPermissions({
          allowed: [],
          denied: []
        });
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to fetch permissions: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      // Set default permissions on error
      setUserPermissions({
        allowed: [],
        denied: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPermissions = async (): Promise<void> => {
    if (user?.id && token) {
      await fetchUserPermissions(user.id, token);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false;
    
    // Check if permission is explicitly denied
    if (userPermissions.denied.includes(permission)) {
      return false;
    }
    
    // Check if permission is explicitly allowed
    if (userPermissions.allowed.includes(permission)) {
      return true;
    }
    
    // If not explicitly allowed or denied, default to false
    return false;
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Fetch permissions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && token) {
      fetchUserPermissions(user.id, token);
    } else {
      setUserPermissions(null);
      setError(null);
    }
  }, [isAuthenticated, user?.id, token]);

  const value: PermissionContextType = {
    userPermissions,
    isLoading,
    error,
    refreshPermissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
