import { jwtDecode } from 'jwt-decode';

/**
 * Checks if a JWT token is expired or will expire soon
 * @param token The JWT token to check
 * @param bufferSeconds Number of seconds before expiration to consider token as "expiring soon" (default: 60)
 * @returns true if token is expired or expiring soon, false otherwise
 */
export const isTokenExpiredOrExpiringSoon = (token: string | null, bufferSeconds: number = 60): boolean => {
  if (!token) return true;

  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    
    if (!decoded.exp) {
      // If token doesn't have expiration, consider it invalid
      return true;
    }

    // Check if token is expired or will expire within bufferSeconds
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferSeconds * 1000;

    return expirationTime <= (currentTime + bufferTime);
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // If we can't decode, consider it expired
  }
};

/**
 * Checks if a JWT token is actually expired (not just expiring soon)
 * @param token The JWT token to check
 * @returns true if token is expired, false otherwise
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    
    if (!decoded.exp) {
      return true;
    }

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    return expirationTime <= currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

/**
 * Gets the time until token expiration in milliseconds
 * @param token The JWT token to check
 * @returns Time until expiration in milliseconds, or null if token is invalid
 */
export const getTimeUntilExpiration = (token: string | null): number | null => {
  if (!token) return null;

  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    
    if (!decoded.exp) {
      return null;
    }

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    return timeUntilExpiration > 0 ? timeUntilExpiration : 0;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

