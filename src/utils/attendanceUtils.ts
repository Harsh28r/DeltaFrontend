// Attendance Utility Functions

import { API_BASE_URL } from '@/lib/config';

/**
 * Get user's current GPS location
 */
export const getCurrentLocation = (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Reverse geocode coordinates to get address
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // Using OpenStreetMap Nominatim (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Capture photo from camera (for selfie)
 */
export const capturePhoto = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'user'; // Front camera for selfie

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    };

    input.click();
  });
};

/**
 * Format duration in minutes to hours and minutes
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Format hours to display format
 */
export const formatHours = (hours: number): string => {
  if (!hours || hours === 0) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Calculate time difference in hours
 */
export const calculateHoursDifference = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return diff / (1000 * 60 * 60); // Convert to hours
};

/**
 * Get status badge color
 */
export const getStatusColor = (
  status: string
): 'success' | 'info' | 'warning' | 'failure' | 'gray' => {
  switch (status) {
    case 'checked-in':
      return 'info';
    case 'checked-out':
      return 'success';
    case 'absent':
      return 'failure';
    case 'on-leave':
      return 'warning';
    default:
      return 'gray';
  }
};

/**
 * Get status display text
 */
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'checked-in':
      return 'Checked In';
    case 'checked-out':
      return 'Checked Out';
    case 'absent':
      return 'Absent';
    case 'on-leave':
      return 'On Leave';
    default:
      return status;
  }
};

/**
 * Format date for API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get platform information
 */
export const getPlatformInfo = (): string => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

/**
 * Check if user can take break
 */
export const canTakeBreak = (
  status: string,
  isOnBreak: boolean
): { canStart: boolean; canEnd: boolean; message?: string } => {
  if (status !== 'checked-in') {
    return {
      canStart: false,
      canEnd: false,
      message: 'You must be checked in to manage breaks',
    };
  }

  return {
    canStart: !isOnBreak,
    canEnd: isOnBreak,
  };
};

/**
 * Check if coordinates are valid
 */
export const isValidCoordinates = (lat: number, lon: number): boolean => {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

/**
 * Calculate distance between two coordinates (in km)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lon: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
};

/**
 * Get time of day greeting
 */
export const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    today.getFullYear() === checkDate.getFullYear() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getDate() === checkDate.getDate()
  );
};

/**
 * Get date range for filters
 */
export const getDateRange = (
  range: 'today' | 'week' | 'month' | 'custom',
  customStart?: Date,
  customEnd?: Date
): { startDate: string; endDate: string } => {
  const today = new Date();
  let startDate: Date;
  let endDate: Date = today;

  switch (range) {
    case 'today':
      startDate = today;
      break;
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
      break;
    case 'custom':
      startDate = customStart || today;
      endDate = customEnd || today;
      break;
    default:
      startDate = today;
  }

  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate),
  };
};
















