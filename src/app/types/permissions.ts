// Permission Types and Interfaces

export interface UserPermissions {
  allowed: string[];
  denied: string[];
}

// New API User Permission Structure
export interface ApiUserPermissions {
  effective: string[];
  custom: {
    allowed: string[];
    denied: string[];
  };
}

export interface PermissionResponse {
  allowed: string[];
  denied: string[];
}

// API User Structure
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  level: number;
  isActive: boolean;
  permissions: ApiUserPermissions;
  restrictions: {
    maxProjects: number | null;
    allowedProjects: string[];
    deniedProjects: string[];
  };
}

// API Response Structure
export interface AllUsersPermissionsResponse {
  success: boolean;
  users: ApiUser[];
  total: number;
}

// Common permission strings
export const PERMISSIONS = {
  // Lead permissions
  LEADS_CREATE: 'leads:create',
  LEADS_READ: 'leads:read',
  LEADS_UPDATE: 'leads:update',
  LEADS_DELETE: 'leads:delete',
  LEADS_BULK: 'leads:bulk',
  LEADS_TRANSFER: 'leads:transfer',
  
  // User management permissions
  USERS_MANAGE: 'users:manage',
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Project permissions
  PROJECTS_READ: 'projects:read',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_UPDATE: 'projects:update',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_MANAGE: 'projects:manage',
  
  // Notification permissions
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATIONS_CREATE: 'notifications:create',
  NOTIFICATIONS_UPDATE: 'notifications:update',
  NOTIFICATIONS_DELETE: 'notifications:delete',
  
  // Role permissions
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_MANAGE: 'role:manage',
  
  // Lead source permissions (matching API response)
  LEAD_SOURCES_READ: 'leadssource:read',
  LEAD_SOURCES_CREATE: 'leadssource:create',
  LEAD_SOURCES_UPDATE: 'leadssource:update',
  LEAD_SOURCES_DELETE: 'leadssource:delete',
  LEAD_SOURCES_READ_ALL: 'leadssource:read_all',
  
  // Lead status permissions (matching API response)
  LEAD_STATUSES_READ: 'leadsstatus:read',
  LEAD_STATUSES_CREATE: 'leadsstatus:create',
  LEAD_STATUSES_UPDATE: 'leadsstatus:update',
  LEAD_STATUSES_DELETE: 'leadsstatus:delete',
  LEAD_STATUSES_READ_ALL: 'leadsstatus:read_all',
  
  // User-Project permissions
  USER_PROJECTS_READ: 'user-projects:read',
  USER_PROJECTS_ASSIGN: 'user-projects:assign',
  USER_PROJECTS_REMOVE: 'user-projects:remove',
  USER_PROJECTS_BULK_UPDATE: 'user-projects:bulk-update',
  USER_PROJECTS_BULK_DELETE: 'user-projects:bulk-delete',
  
  // Reporting permissions
  REPORTING_READ: 'reporting:read',
  
  // Notification bulk permissions
  NOTIFICATIONS_BULK_UPDATE: 'notifications:bulk-update',
  NOTIFICATIONS_BULK_DELETE: 'notifications:bulk-delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission checking utility (legacy format)
export const hasPermission = (
  userPermissions: UserPermissions | null,
  requiredPermission: Permission
): boolean => {
  if (!userPermissions) return false;
  
  // Check if permission is explicitly denied
  if (userPermissions.denied.includes(requiredPermission)) {
    return false;
  }
  
  // Check if permission is explicitly allowed
  if (userPermissions.allowed.includes(requiredPermission)) {
    return true;
  }
  
  // If not explicitly allowed or denied, default to false
  return false;
};

// Permission checking utility (new API format)
export const hasApiPermission = (
  userPermissions: ApiUserPermissions | null,
  requiredPermission: Permission
): boolean => {
  if (!userPermissions) return false;
  
  // Check if user has wildcard permission
  if (userPermissions.effective.includes('*')) {
    return true;
  }
  
  // Check if permission is explicitly denied in custom
  if (userPermissions.custom.denied.includes(requiredPermission)) {
    return false;
  }
  
  // Check if permission is explicitly allowed in custom
  if (userPermissions.custom.allowed.includes(requiredPermission)) {
    return true;
  }
  
  // Check if permission is in effective permissions (from role)
  if (userPermissions.effective.includes(requiredPermission)) {
    return true;
  }
  
  // If not found anywhere, default to false
  return false;
};

// Check multiple permissions (all must be true)
export const hasAllPermissions = (
  userPermissions: UserPermissions | null,
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.every(permission => 
    hasPermission(userPermissions, permission)
  );
};

// Check multiple permissions (any can be true)
export const hasAnyPermission = (
  userPermissions: UserPermissions | null,
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.some(permission => 
    hasPermission(userPermissions, permission)
  );
};
