import { API_ENDPOINTS } from '@/lib/config';

/**
 * Fetches a selfie image from the CP sourcing API
 * @param sourcingId - The CP sourcing record ID
 * @param selfieIndex - The index of the selfie in the sourcing history (0-based)
 * @param token - Authentication token
 * @returns Promise<string> - The selfie image URL or blob URL
 */
export const fetchSelfie = async (
  sourcingId: string, 
  selfieIndex: number, 
  token: string
): Promise<string> => {
  try {
    const response = await fetch(API_ENDPOINTS.CP_SOURCING_SELFIE(sourcingId, selfieIndex), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch selfie: ${response.status}`);
    }

    // Check if the response is an image
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.startsWith('image/')) {
      // Convert response to blob and create object URL
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } else {
      // If it's not an image, try to get the URL directly
      return response.url;
    }
  } catch (error) {
    console.error('Error fetching selfie:', error);
    throw error;
  }
};

/**
 * Gets the appropriate image URL for a selfie
 * @param selfiePath - The selfie path from the database
 * @param sourcingId - The CP sourcing record ID (optional, for API fallback)
 * @param selfieIndex - The index of the selfie (optional, for API fallback)
 * @param token - Authentication token (optional, for API fallback)
 * @returns Promise<string> - The image URL
 */
export const getSelfieUrl = async (
  selfiePath: string,
  sourcingId?: string,
  selfieIndex?: number,
  token?: string
): Promise<string> => {
  // If it's already a full URL or data URL, return as is
  if (selfiePath.startsWith('http') || selfiePath.startsWith('data:')) {
    return selfiePath;
  }

  // If we have the sourcing ID and index, try to fetch from API
  if (sourcingId !== undefined && selfieIndex !== undefined && token) {
    try {
      return await fetchSelfie(sourcingId, selfieIndex, token);
    } catch (error) {
      console.warn('Failed to fetch selfie from API, falling back to direct URL:', error);
    }
  }

  // Fallback to direct URL construction
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/${selfiePath}`;
};

/**
 * Cleans up object URLs to prevent memory leaks
 * @param url - The object URL to revoke
 */
export const cleanupObjectUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
