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
      
      const apiUrl = API_ENDPOINTS.USER_PERMISSIONS(userId);
      console.log('🔗 Calling permissions API:', apiUrl);
      console.log('🔗 Expected URL should be: http://localhost:5000/api/permissions/user/' + userId);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Permissions API Response:', data);
        
        // Parse the new API response format
        if (data.success && data.permissions) {
          const effectivePermissions = data.permissions.effective || [];
          const customAllowed = data.permissions.custom?.allowed || [];
          const customDenied = data.permissions.custom?.denied || [];
          
          // Combine effective permissions with custom allowed, remove custom denied
          const allAllowed = [...effectivePermissions, ...customAllowed];
          const finalAllowed = allAllowed.filter(permission => !customDenied.includes(permission));
          
          setUserPermissions({
            allowed: finalAllowed,
            denied: customDenied
          });
        } else {
          // Fallback to old format if needed
          setUserPermissions({
            allowed: data.allowed || [],
            denied: data.denied || []
          });
        }
      } else if (response.status === 404) {
        // User permissions not found, set default permissions for development
        console.warn('Permissions API not implemented yet, using default permissions');
        setUserPermissions({
          allowed: [
            'leads:read',
            'leads:create', 
            'leads:update',
            'leads:delete',
            'lead-sources:read',
            'lead-sources:create',
            'lead-sources:update', 
            'lead-sources:delete',
            'lead-statuses:read',
            'lead-statuses:create',
            'lead-statuses:update',
            'lead-statuses:delete'
          ],
          denied: []
        });
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to fetch permissions: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      // Set default permissions on error for development
      console.warn('Using fallback permissions due to API error');
      setUserPermissions({
        allowed: [
          'leads:read',
          'leads:create', 
          'leads:update',
          'leads:delete',
          'lead-sources:read',
          'lead-sources:create',
          'lead-sources:update', 
          'lead-sources:delete',
          'lead-statuses:read',
          'lead-statuses:create',
          'lead-statuses:update',
          'lead-statuses:delete'
        ],
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
    // Check if user is super admin - give all permissions
    if (user?.role === 'superadmin' || user?.email === 'superadmin@deltayards.com') {
      console.log(`✅ Super Admin - Permission granted: ${permission}`);
      return true;
    }
    
    if (!userPermissions) {
      console.log('❌ No user permissions available');
      return false;
    }
    
    // Check if permission is explicitly denied
    if (userPermissions.denied.includes(permission)) {
      console.log(`❌ Permission denied: ${permission}`);
      return false;
    }
    
    // Check if permission is explicitly allowed
    if (userPermissions.allowed.includes(permission)) {
      console.log(`✅ Permission allowed: ${permission}`);
      return true;
    }
    
    // If not explicitly allowed or denied, default to false
    console.log(`❌ Permission not found: ${permission} (Available: ${userPermissions.allowed.join(', ')})`);
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
