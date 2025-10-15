// Attendance Type Definitions

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  accuracy?: number;
}

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  platform: string;
}

export interface CheckInOut {
  time: string;
  location: Location;
  deviceInfo?: DeviceInfo;
  selfie?: string;
  notes?: string;
}

export interface Break {
  _id?: string;
  startTime: string;
  endTime?: string;
  reason: string;
  duration?: number; // in minutes
}

export interface WorkLocation {
  _id?: string;
  time: string;
  location: Location;
  activity: string;
  notes?: string;
}

export interface UserBasic {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
  level?: number;
}

export interface Attendance {
  _id: string;
  id?: string;
  user: UserBasic | string; // Can be populated object or just ID
  date: string;
  checkIn?: CheckInOut;
  checkInTime?: string;
  checkInLocation?: Location;
  checkOut?: CheckInOut;
  checkOutTime?: string;
  checkOutLocation?: Location;
  totalHours: number;
  activeWorkTime?: number;
  status: 'checked-in' | 'checked-out' | 'absent' | 'on-leave';
  breaks: Break[];
  totalBreakTime: number;
  workLocations: WorkLocation[];
  isManualEntry?: boolean;
  manualEntryBy?: UserBasic | string;
  manualEntryReason?: string;
  isOnBreak?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface AttendanceStatus {
  status: 'checked-in' | 'checked-out' | 'absent' | 'not-checked-in';
  attendance: Attendance | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
}

export interface AttendanceSummary {
  totalUsers: number;
  checkedIn: number;
  checkedOut: number;
  absent: number;
  onBreak: number;
}

export interface CheckedInUser {
  user: UserBasic;
  checkInTime: string;
  checkInLocation: Location;
  checkInSelfie?: string;
  hoursWorked: number;
  isOnBreak: boolean;
  workLocations: number;
  isManualEntry?: boolean;
  manualEntryBy?: UserBasic | string;
  manualEntryReason?: string;
  notes?: string;
}

export interface CheckedOutUser {
  user: UserBasic;
  checkInTime: string;
  checkInSelfie?: string;
  checkOutTime: string;
  checkOutSelfie?: string;
  totalHours: number;
  checkOutLocation: Location;
  isManualEntry?: boolean;
  manualEntryBy?: UserBasic | string;
  manualEntryReason?: string;
  notes?: string;
}

export interface LiveDashboard {
  date: string;
  summary: AttendanceSummary;
  checkedInUsers: CheckedInUser[];
  checkedOutUsers: CheckedOutUser[];
  absentUsers: UserBasic[];
}

export interface AttendanceStats {
  totalRecords: number;
  totalHours: string;
  avgHoursPerDay: string;
  totalBreakTime: number;
  totalWorkLocations: number;
  statusBreakdown: {
    checkedIn: number;
    checkedOut: number;
    absent: number;
    onLeave: number;
  };
  manualEntries: number;
}

export interface UserAttendanceStats {
  totalDays: number;
  totalHours: number;
  totalBreakTime: number;
  avgHoursPerDay: number;
  checkedInDays: number;
  checkedOutDays: number;
  workLocationCount: number;
}

export interface LocationHistoryItem {
  type: 'check-in' | 'check-out' | 'work-location';
  time: string;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number;
  activity?: string;
  notes?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Request Types
export interface CheckInRequest {
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number;
  selfie?: string;
  notes?: string;
  platform?: string;
}

export interface CheckOutRequest {
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number;
  selfie?: string;
  notes?: string;
}

export interface BreakStartRequest {
  reason: string;
}

export interface WorkLocationRequest {
  latitude: number;
  longitude: number;
  address: string;
  activity: string;
  notes?: string;
}

export interface ManualEntryRequest {
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  notes?: string;
  reason: string;
}

export interface UpdateAttendanceRequest {
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
  notes?: string;
}

// API Response Types
export interface AttendanceListResponse {
  attendance: Attendance[];
  pagination: Pagination;
  summary?: {
    total: number;
    checkedIn: number;
    checkedOut: number;
    absent: number;
  };
}

export interface UserAttendanceDetailResponse {
  user: UserBasic;
  stats: UserAttendanceStats;
  attendance: Attendance[];
  pagination: Pagination;
}

export interface LocationHistoryResponse {
  user: UserBasic;
  totalLocations: number;
  locationHistory: LocationHistoryItem[];
}


