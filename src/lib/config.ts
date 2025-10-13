// API Configuration
// export const API_BASE_URL = 'http://localhost:5000'; // Hardcoded for now - fixed undefined issue
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  ADMIN_LOGIN: `${API_BASE_URL}/api/superadmin/admin-login`,
  
  // Roles
  ROLES: `${API_BASE_URL}/api/superadmin/roles`,
  ROLE_BY_ID: (id: string) => `${API_BASE_URL}/api/superadmin/roles/${id}`,
  
  // Users - TEMPORARY: Using projects endpoint until backend implements users API
  USERS: `${API_BASE_URL}/api/projects`, // Temporary: will extract users from projects
  USERS_BY_ROLE: (roleName: string) => `${API_BASE_URL}/api/projects`, // Temporary: will filter by role
  CREATE_USER: `${API_BASE_URL}/api/superadmin/create-user`,
  CREATE_USER_WITH_PROJECTS: `${API_BASE_URL}/api/superadmin/create-user-with-projects`,
  UPDATE_USER_PROJECTS: `${API_BASE_URL}/api/superadmin/update-user-projects`,
  USER_BY_ID: (id: string) => `${API_BASE_URL}/api/superadmin/users/${id}`,
  USER_HISTORY: (id: string) => `${API_BASE_URL}/api/superadmin/users/${id}/history`,
  UPDATE_USER: (id: string) => `${API_BASE_URL}/api/superadmin/users/${id}`,
  DELETE_USER: (id: string) => `${API_BASE_URL}/api/superadmin/users/${id}`,
  
  // TODO: Backend needs to implement these endpoints:
  // USERS: `${API_BASE_URL}/api/superadmin/users`,
  // USERS_BY_ROLE: (roleName: string) => `${API_BASE_URL}/api/superadmin/users/role/${roleName}`,
  
  // Projects
  PROJECTS: `${API_BASE_URL}/api/projects`,
  ASSIGN_PROJECT_MEMBER: `${API_BASE_URL}/api/projects/members/add`,
  ASSIGN_ROLE: `${API_BASE_URL}/api/projects/members/assign-role`,
  BULK_ASSIGN_ROLE: `${API_BASE_URL}/api/projects/members/bulk-assign-role`,
  
  // Lead Management
  LEAD_SOURCES: `${API_BASE_URL}/api/lead-sources`,
  LEAD_SOURCE_BY_ID: (id: string) => `${API_BASE_URL}/api/lead-sources/${id}`,
  CREATE_LEAD_SOURCE: `${API_BASE_URL}/api/lead-sources`,
  UPDATE_LEAD_SOURCE: (id: string) => `${API_BASE_URL}/api/lead-sources/${id}`,
  DELETE_LEAD_SOURCE: (id: string) => `${API_BASE_URL}/api/lead-sources/${id}`,
  
  LEAD_STATUSES: `${API_BASE_URL}/api/lead-statuses`,
  LEAD_STATUS_BY_ID: (id: string) => `${API_BASE_URL}/api/lead-statuses/${id}`,
  CREATE_LEAD_STATUS: `${API_BASE_URL}/api/lead-statuses`,
  UPDATE_LEAD_STATUS: (id: string) => `${API_BASE_URL}/api/lead-statuses/${id}`,
  DELETE_LEAD_STATUS: (id: string) => `${API_BASE_URL}/api/lead-statuses/${id}`,
  
  // Leads
  LEADS: (projectId?: string) => projectId ? `${API_BASE_URL}/api/leads?projectId=${projectId}` : `${API_BASE_URL}/api/leads`,
  LEAD_BY_ID: (id: string) => `${API_BASE_URL}/api/leads/${id}`,
  CREATE_LEAD: (projectId: string) => `${API_BASE_URL}/api/leads?projectId=${projectId}`,
  UPDATE_LEAD: (id: string) => `${API_BASE_URL}/api/leads/${id}`,
  DELETE_LEAD: (id: string) => `${API_BASE_URL}/api/leads/${id}`,
  BULK_TRANSFER_LEADS: `${API_BASE_URL}/api/leads/bulk-transfer`,
  LEAD_ACTIVITIES: `${API_BASE_URL}/api/lead-activities/`,
  
  // Permissions
  ALL_USERS_PERMISSIONS: `${API_BASE_URL}/api/permissions/all-users`,
  USER_PERMISSIONS: (userId: string) => `${API_BASE_URL}/api/superadmin/users/${userId}/permissions`,
  UPDATE_USER_PERMISSIONS: (userId: string) => `${API_BASE_URL}/api/superadmin/users/${userId}/permissions`,
  ROLE_PERMISSIONS: (roleId: string) => `${API_BASE_URL}/api/permissions/role/${roleId}/permissions`,
  UPDATE_ROLE_PERMISSIONS: (roleId: string) => `${API_BASE_URL}/api/permissions/role/${roleId}/permissions`,
  
  // Channel Partners
  CHANNEL_PARTNERS: `${API_BASE_URL}/api/channel-partner/`,
  CHANNEL_PARTNER_BY_ID: (id: string) => `${API_BASE_URL}/api/channel-partner/${id}`,
  CREATE_CHANNEL_PARTNER: `${API_BASE_URL}/api/channel-partner/`,
  UPDATE_CHANNEL_PARTNER: (id: string) => `${API_BASE_URL}/api/channel-partner/${id}`,
  DELETE_CHANNEL_PARTNER: (id: string) => `${API_BASE_URL}/api/channel-partner/${id}`,
  UPLOAD_CHANNEL_PARTNER_PHOTO: (id: string) => `${API_BASE_URL}/api/channel-partner/${id}/photo`,
  
  // CP Sourcing
  CP_SOURCING: `${API_BASE_URL}/api/cp-sourcing/`,
  CP_SOURCING_BY_ID: (id: string) => `${API_BASE_URL}/api/cp-sourcing/${id}`,
  CP_SOURCING_UNIQUE_USERS: (projectId: string, channelPartnerId: string) => `${API_BASE_URL}/api/cp-sourcing/unique-users?projectId=${projectId}&channelPartnerId=${channelPartnerId}`,
  CP_SOURCING_UNIQUE_USERS_ALL: `${API_BASE_URL}/api/cp-sourcing/unique-users-all`,
  CREATE_CP_SOURCING: `${API_BASE_URL}/api/cp-sourcing/`,
  UPDATE_CP_SOURCING: (id: string) => `${API_BASE_URL}/api/cp-sourcing/${id}`,
  DELETE_CP_SOURCING: (id: string) => `${API_BASE_URL}/api/cp-sourcing/${id}`,
  CP_SOURCING_SELFIE: (id: string, index: number) => `${API_BASE_URL}/api/cp-sourcing/${id}/selfie/${index}`,
  
  // User Reporting
    USER_REPORTING: `${API_BASE_URL}/api/user-reporting`,
    USER_REPORTING_GET: `${API_BASE_URL}/api/user-reporting`,
    USER_REPORTING_UPDATE: (id: string) => `${API_BASE_URL}/api/user-reporting/${id}`,
    USER_REPORTING_DELETE: (id: string) => `${API_BASE_URL}/api/user-reporting/${id}`,
    USER_REPORTING_HIERARCHY: (userId: string) => `${API_BASE_URL}/api/user-reporting/hierarchy/${userId}`,
  
  // Reminders
  REMINDERS: `${API_BASE_URL}/api/reminder`,
  REMINDER_BY_ID: (id: string) => `${API_BASE_URL}/api/reminder/${id}`,
  CREATE_REMINDER: `${API_BASE_URL}/api/reminder`,
  UPDATE_REMINDER: (id: string) => `${API_BASE_URL}/api/reminder/${id}`,
  DELETE_REMINDER: (id: string) => `${API_BASE_URL}/api/reminder/${id}`,
  
  // Attendance
  ATTENDANCE_CHECK_IN: `${API_BASE_URL}/api/attendance/check-in`,
  ATTENDANCE_CHECK_OUT: `${API_BASE_URL}/api/attendance/check-out`,
  ATTENDANCE_STATUS: `${API_BASE_URL}/api/attendance/status`,
  ATTENDANCE_BREAK_START: `${API_BASE_URL}/api/attendance/break/start`,
  ATTENDANCE_BREAK_END: `${API_BASE_URL}/api/attendance/break/end`,
  ATTENDANCE_WORK_LOCATION: `${API_BASE_URL}/api/attendance/work-location`,
  ATTENDANCE_MY_HISTORY: `${API_BASE_URL}/api/attendance/my-history`,
  ATTENDANCE_ADMIN_LIVE: `${API_BASE_URL}/api/attendance/admin/live`,
  ATTENDANCE_ADMIN_ALL: `${API_BASE_URL}/api/attendance/admin/all`,
  ATTENDANCE_ADMIN_USER: (userId: string) => `${API_BASE_URL}/api/attendance/admin/user/${userId}`,
  ATTENDANCE_ADMIN_STATS: `${API_BASE_URL}/api/attendance/admin/stats`,
  ATTENDANCE_ADMIN_LOCATION_HISTORY: (userId: string) => `${API_BASE_URL}/api/attendance/admin/location-history/${userId}`,
  ATTENDANCE_ADMIN_MANUAL_ENTRY: `${API_BASE_URL}/api/attendance/admin/manual-entry`,
  ATTENDANCE_ADMIN_UPDATE: (attendanceId: string) => `${API_BASE_URL}/api/attendance/admin/${attendanceId}`,
  ATTENDANCE_ADMIN_DELETE: (attendanceId: string) => `${API_BASE_URL}/api/attendance/admin/${attendanceId}`,
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
