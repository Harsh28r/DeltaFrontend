import { usePermissions } from '@/app/context/PermissionContext';
import { PERMISSIONS, Permission } from '@/app/types/permissions';

// Main permission hook
export const usePermissionCheck = () => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading, error } = usePermissions();

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isLoading,
    error,
  };
};

// Specific permission hooks for common use cases
export const useLeadPermissions = () => {
  const { hasPermission, isLoading, error } = usePermissions();

  return {
    canCreateLeads: hasPermission(PERMISSIONS.LEADS_CREATE),
    canReadLeads: hasPermission(PERMISSIONS.LEADS_READ),
    canUpdateLeads: hasPermission(PERMISSIONS.LEADS_UPDATE),
    canDeleteLeads: hasPermission(PERMISSIONS.LEADS_DELETE),
    isLoading,
    error,
  };
};

export const useUserPermissions = () => {
  const { hasPermission, isLoading, error } = usePermissions();

  return {
    canManageUsers: hasPermission(PERMISSIONS.USERS_MANAGE),
    canReadUsers: hasPermission(PERMISSIONS.USERS_READ),
    canCreateUsers: hasPermission(PERMISSIONS.USERS_CREATE),
    canUpdateUsers: hasPermission(PERMISSIONS.USERS_UPDATE),
    canDeleteUsers: hasPermission(PERMISSIONS.USERS_DELETE),
    isLoading,
    error,
  };
};

export const useProjectPermissions = () => {
  const { hasPermission, isLoading, error } = usePermissions();

  return {
    canReadProjects: hasPermission(PERMISSIONS.PROJECTS_READ),
    canCreateProjects: hasPermission(PERMISSIONS.PROJECTS_CREATE),
    canUpdateProjects: hasPermission(PERMISSIONS.PROJECTS_UPDATE),
    canDeleteProjects: hasPermission(PERMISSIONS.PROJECTS_DELETE),
    isLoading,
    error,
  };
};

export const useNotificationPermissions = () => {
  const { hasPermission, isLoading, error } = usePermissions();

  return {
    canReadNotifications: hasPermission(PERMISSIONS.NOTIFICATIONS_READ),
    canCreateNotifications: hasPermission(PERMISSIONS.NOTIFICATIONS_CREATE),
    canUpdateNotifications: hasPermission(PERMISSIONS.NOTIFICATIONS_UPDATE),
    canDeleteNotifications: hasPermission(PERMISSIONS.NOTIFICATIONS_DELETE),
    isLoading,
    error,
  };
};

// Hook for checking specific permissions
export const useHasPermission = (permission: Permission) => {
  const { hasPermission, isLoading, error } = usePermissions();
  
  return {
    hasPermission: hasPermission(permission),
    isLoading,
    error,
  };
};

// Hook for checking multiple permissions
export const useHasPermissions = (permissions: Permission[], requireAll: boolean = true) => {
  const { hasAllPermissions, hasAnyPermission, isLoading, error } = usePermissions();
  
  return {
    hasPermissions: requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions),
    isLoading,
    error,
  };
};

