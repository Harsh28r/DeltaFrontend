// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  ADMIN_LOGIN: `${API_BASE_URL}/api/superadmin/admin-login`,
  
  // Roles
  ROLES: `${API_BASE_URL}/api/superadmin/roles`,
  ROLE_BY_ID: (id: string) => `${API_BASE_URL}/api/superadmin/roles/${id}`,
  
  // Users
  USERS: `${API_BASE_URL}/api/superadmin/users`,
  USERS_BY_ROLE: (roleName: string) => `${API_BASE_URL}/api/superadmin/users/role/${roleName}`,
  CREATE_USER: `${API_BASE_URL}/api/superadmin/create-user`,
  USER_BY_ID: (id: string) => `${API_BASE_URL}/api/superadmin/users/${id}`,
  USER_HISTORY: (id: string) => `${API_BASE_URL}/api/superadmin/users/${id}/history`,
  UPDATE_USER: (id: string) => `${API_BASE_URL}/api/superadmin/users/${id}`,
  DELETE_USER: (id: string) => `${API_BASE_URL}/api/superadmin/users/${id}`,
  
  // Projects
  PROJECTS: `${API_BASE_URL}/api/projects`,
  ASSIGN_PROJECT_MEMBER: `${API_BASE_URL}/api/projects/members/add`,
  ASSIGN_ROLE: `${API_BASE_URL}/api/projects/members/assign-role`,
  BULK_ASSIGN_ROLE: `${API_BASE_URL}/api/projects/members/bulk-assign-role`,
};

// Create a custom event system for refreshing sidebar data
export const createRefreshEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('refreshSidebar'));
  }
};

export const subscribeToRefresh = (callback: () => void) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('refreshSidebar', callback);
    return () => window.removeEventListener('refreshSidebar', callback);
  }
  return () => {};
};
