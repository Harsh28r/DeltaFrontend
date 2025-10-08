/**
 * Utility functions for handling datetime values in the application
 */

export interface DateTimeValue {
  raw: string;
  formatted: string;
  isValid: boolean;
  type: 'date' | 'datetime' | 'time';
}

/**
 * Validates and formats a datetime value
 */
export const validateDateTime = (value: string, type: 'date' | 'datetime' | 'time'): DateTimeValue => {
  if (!value || value.trim() === '') {
    return {
      raw: '',
      formatted: '',
      isValid: false,
      type
    };
  }

  try {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return {
        raw: value,
        formatted: value,
        isValid: false,
        type
      };
    }

    let formatted: string;
    
    switch (type) {
      case 'date':
        formatted = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short'
        });
        break;
      case 'datetime':
        formatted = date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        break;
      case 'time':
        formatted = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        break;
      default:
        formatted = value;
    }

    return {
      raw: value,
      formatted,
      isValid: true,
      type
    };
  } catch {
    return {
      raw: value,
      formatted: value,
      isValid: false,
      type
    };
  }
};

/**
 * Converts a datetime value to the proper format for HTML inputs
 */
export const formatForInput = (value: string, type: 'date' | 'datetime' | 'time'): string => {
  if (!value) return '';
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    
    switch (type) {
      case 'date':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'datetime':
        // Format for datetime-local input (YYYY-MM-DDTHH:MM)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      case 'time':
        return date.toTimeString().slice(0, 5); // HH:MM
      default:
        return value;
    }
  } catch {
    return value;
  }
};

/**
 * Converts input value to proper ISO string for storage
 */
export const formatForStorage = (inputValue: string, type: 'date' | 'datetime' | 'time'): string => {
  if (!inputValue) return '';

  try {
    let date: Date;
    
    switch (type) {
      case 'date':
        // Input is in YYYY-MM-DD format
        date = new Date(inputValue + 'T00:00:00');
        break;
      case 'datetime':
        // Input is in YYYY-MM-DDTHH:MM format
        date = new Date(inputValue);
        break;
      case 'time':
        // Input is in HH:MM format, use today's date
        const today = new Date();
        const [hours, minutes] = inputValue.split(':');
        date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                       parseInt(hours), parseInt(minutes));
        break;
      default:
        date = new Date(inputValue);
    }
    
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    } else {
      return inputValue;
    }
  } catch {
    return inputValue;
  }
};

/**
 * Gets relative time description
 */
export const getRelativeTime = (value: string): string => {
  if (!value) return '';
  
  try {
    const date = new Date(value);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
    return "";
  } catch {
    return "";
  }
};

/**
 * Validates if a string is a valid datetime
 */
export const isValidDateTime = (value: string): boolean => {
  if (!value) return false;
  
  try {
    const date = new Date(value);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};


