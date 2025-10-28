/**
 * Utility functions to prevent circular references in ApexCharts
 * This prevents "Maximum call stack size exceeded" errors
 */

/**
 * Deep clone an object to break circular references
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

/**
 * Clean data for chart usage - removes circular references and ensures proper types
 */
export const cleanChartData = <T>(data: T[]): T[] => {
  try {
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        const cleaned = {} as T;
        for (const key in item) {
          if (item.hasOwnProperty(key)) {
            const value = item[key];
            if (typeof value === 'string') {
              cleaned[key] = String(value) as T[Extract<keyof T, string>];
            } else if (typeof value === 'number') {
              cleaned[key] = Number(value) as T[Extract<keyof T, string>];
            } else if (typeof value === 'boolean') {
              cleaned[key] = Boolean(value) as T[Extract<keyof T, string>];
            } else if (value === null || value === undefined) {
              cleaned[key] = (typeof value === 'number' ? 0 : '') as T[Extract<keyof T, string>];
            } else {
              cleaned[key] = value;
            }
          }
        }
        return cleaned;
      }
      return item;
    });
  } catch (error) {
    console.warn('Error cleaning chart data:', error);
    return data;
  }
};

/**
 * Safe JSON stringify for debugging - handles circular references
 */
export const safeStringify = (obj: any, space?: number): string => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, val) => {
    if (val != null && typeof val === 'object') {
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);
    }
    return val;
  }, space);
};

/**
 * Create a safe chart options object
 */
export const createSafeChartOptions = (baseOptions: any): any => {
  try {
    // Deep clone to break any circular references
    const cloned = deepClone(baseOptions);
    
    // Ensure all functions are properly serialized
    const safeOptions = JSON.parse(JSON.stringify(cloned, (key, value) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      return value;
    }));
    
    return safeOptions;
  } catch (error) {
    console.warn('Error creating safe chart options:', error);
    return baseOptions;
  }
};
