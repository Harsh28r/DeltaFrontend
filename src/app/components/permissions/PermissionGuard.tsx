'use client'
import React from 'react';
import { usePermissions } from '@/app/context/PermissionContext';
import { PERMISSIONS } from '@/app/types/permissions';

interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireAll?: boolean;
  permissions?: string[];
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions = [],
  fallback = null,
  children,
  requireAll = true
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  // Check single permission
  if (permission && permissions.length === 0) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    return hasRequiredPermissions ? <>{children}</> : <>{fallback}</>;
  }

  return <>{fallback}</>;
};

// Convenience components for common permission checks
export const LeadCreateGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard permission={PERMISSIONS.LEADS_CREATE} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const LeadReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard permission={PERMISSIONS.LEADS_READ} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const LeadUpdateGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard permission={PERMISSIONS.LEADS_UPDATE} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const LeadDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard permission={PERMISSIONS.LEADS_DELETE} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const UserManageGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard permission={PERMISSIONS.USERS_MANAGE} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export default PermissionGuard;
