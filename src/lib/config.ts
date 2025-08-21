// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  ADMIN_LOGIN: `${API_BASE_URL}/api/superadmin/admin-login`,
  
  // Roles
  ROLES: `${API_BASE_URL}/api/superadmin/roles`,
  ROLE_BY_ID: (id: string) => `${API_BASE_URL}/api/superadmin/roles/${id}`,
  
  // Projects
  PROJECTS: `${API_BASE_URL}/api/projects`,
};
