// Token utilities for consistent JWT handling across the application

export interface TokenValidationResult {
  isValid: boolean;
  token?: string;
  error?: string;
}

/**
 * Cleans a JWT token by removing whitespace and newlines
 */
export const cleanToken = (token: string): string => {
  return token.trim().replace(/\s+/g, '');
};

/**
 * Validates if a string has the correct JWT format (3 parts separated by dots)
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Validates and cleans a JWT token
 */
export const validateAndCleanToken = (token: string): TokenValidationResult => {
  try {
    if (!token) {
      return { isValid: false, error: 'Token is empty' };
    }
    
    const cleanedToken = cleanToken(token);
    
    if (!isValidJWTFormat(cleanedToken)) {
      return { isValid: false, error: 'Invalid JWT format' };
    }
    
    return { isValid: true, token: cleanedToken };
  } catch (error) {
    return { isValid: false, error: 'Token validation failed' };
  }
};

/**
 * Safely retrieves a token from storage and validates it
 */
export const getValidTokenFromStorage = (): string | null => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const validation = validateAndCleanToken(token);
    
    if (!validation.isValid) {
      console.warn('Invalid token found in storage, clearing:', validation.error);
      clearTokenFromStorage();
      return null;
    }
    
    return validation.token!;
  } catch (error) {
    console.error('Error retrieving token from storage:', error);
    clearTokenFromStorage();
    return null;
  }
};

/**
 * Safely stores a token after validation
 */
export const setTokenInStorage = (token: string, useLocalStorage = false): boolean => {
  try {
    const validation = validateAndCleanToken(token);
    
    if (!validation.isValid) {
      console.error('Cannot store invalid token:', validation.error);
      return false;
    }
    
    const storage = useLocalStorage ? localStorage : sessionStorage;
    storage.setItem('token', validation.token!);
    
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
};

/**
 * Clears tokens from both localStorage and sessionStorage
 */
export const clearTokenFromStorage = (): void => {
  try {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  } catch (error) {
    console.error('Error clearing tokens from storage:', error);
  }
};

/**
 * Creates authorization headers with a validated token
 */
export const createAuthHeaders = (): Record<string, string> => {
  const token = getValidTokenFromStorage();
  
  if (!token) {
    throw new Error('No valid authentication token available');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': '*/*'
  };
};
