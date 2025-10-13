// Attendance API Service

import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config';
import type {
  Attendance,
  AttendanceStatus,
  AttendanceListResponse,
  LiveDashboard,
  UserAttendanceDetailResponse,
  LocationHistoryResponse,
  AttendanceStats,
  CheckInRequest,
  CheckOutRequest,
  BreakStartRequest,
  WorkLocationRequest,
  ManualEntryRequest,
  UpdateAttendanceRequest,
} from '@/app/(DashboardLayout)/types/attendance';

const getAuthHeaders = () => {
  // Try to get token from multiple possible storage locations
  let token = localStorage.getItem('auth_token') || 
              sessionStorage.getItem('auth_token') || 
              localStorage.getItem('token');
  
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ==================== USER ENDPOINTS ====================

/**
 * Check-in with GPS location
 */
export const checkIn = async (data: CheckInRequest): Promise<Attendance> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_CHECK_IN, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Check-in failed');
  }

  const result = await response.json();
  return result.attendance;
};

/**
 * Check-out with GPS location
 */
export const checkOut = async (data: CheckOutRequest): Promise<Attendance> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Check-out failed');
  }

  const result = await response.json();
  return result.attendance;
};

/**
 * Get current attendance status
 */
export const getAttendanceStatus = async (): Promise<AttendanceStatus> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_STATUS, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attendance status');
  }

  return await response.json();
};

/**
 * Start a break
 */
export const startBreak = async (data: BreakStartRequest): Promise<any> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_BREAK_START, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start break');
  }

  return await response.json();
};

/**
 * End current break
 */
export const endBreak = async (): Promise<any> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_BREAK_END, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to end break');
  }

  return await response.json();
};

/**
 * Add work location
 */
export const addWorkLocation = async (data: WorkLocationRequest): Promise<any> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_WORK_LOCATION, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add work location');
  }

  return await response.json();
};

/**
 * Get my attendance history
 */
export const getMyAttendanceHistory = async (params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<AttendanceListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${API_ENDPOINTS.ATTENDANCE_MY_HISTORY}${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attendance history');
  }

  return await response.json();
};

// ==================== SUPERADMIN ENDPOINTS ====================

/**
 * Get live attendance dashboard
 */
export const getLiveDashboard = async (date?: string): Promise<LiveDashboard> => {
  let url = API_ENDPOINTS.ATTENDANCE_ADMIN_LIVE;
  
  if (date) {
    // Use the same date for both startDate and endDate to get data for a specific day
    url = `${url}?startDate=${date}&endDate=${date}`;
  }
    
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch live dashboard');
  }

  return await response.json();
};

/**
 * Get all users attendance with filters
 */
export const getAllAttendance = async (params?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AttendanceListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.date) queryParams.append('date', params.date);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.userId) queryParams.append('userId', params.userId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${API_ENDPOINTS.ATTENDANCE_ADMIN_ALL}${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attendance records');
  }

  return await response.json();
};

/**
 * Get user attendance details
 */
export const getUserAttendanceDetail = async (
  userId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
): Promise<UserAttendanceDetailResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${API_ENDPOINTS.ATTENDANCE_ADMIN_USER(userId)}${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user attendance details');
  }

  return await response.json();
};

/**
 * Get attendance statistics
 */
export const getAttendanceStats = async (params?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
}): Promise<{ stats: AttendanceStats }> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.userId) queryParams.append('userId', params.userId);

  const url = `${API_ENDPOINTS.ATTENDANCE_ADMIN_STATS}${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attendance statistics');
  }

  return await response.json();
};

/**
 * Get user location history
 */
export const getUserLocationHistory = async (
  userId: string,
  params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<LocationHistoryResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.date) queryParams.append('date', params.date);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const url = `${API_ENDPOINTS.ATTENDANCE_ADMIN_LOCATION_HISTORY(userId)}${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch location history');
  }

  return await response.json();
};

/**
 * Create manual attendance entry
 */
export const createManualEntry = async (data: ManualEntryRequest): Promise<Attendance> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_ADMIN_MANUAL_ENTRY, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create manual entry');
  }

  const result = await response.json();
  return result.attendance;
};

/**
 * Update attendance record
 */
export const updateAttendance = async (
  attendanceId: string,
  data: UpdateAttendanceRequest
): Promise<Attendance> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_ADMIN_UPDATE(attendanceId), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update attendance');
  }

  const result = await response.json();
  return result.attendance;
};

/**
 * Delete attendance record
 */
export const deleteAttendance = async (attendanceId: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.ATTENDANCE_ADMIN_DELETE(attendanceId), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete attendance');
  }
};




