// Debug utilities for testing token validation
import { validateAndCleanToken, getValidTokenFromStorage, clearTokenFromStorage } from './tokenUtils';

export const debugTokenValidation = () => {
  console.log('=== Token Validation Debug ===');
  
  const storedToken = getValidTokenFromStorage();
  console.log('Stored token:', storedToken ? 'Found' : 'Not found');
  
  if (storedToken) {
    const validation = validateAndCleanToken(storedToken);
    console.log('Token validation result:', validation);
    
    // Check if it's a proper JWT format
    const parts = storedToken.split('.');
    console.log('Token parts count:', parts.length);
    console.log('Token parts lengths:', parts.map(p => p.length));
  }
};

export const testTokenValidation = (testToken: string) => {
  console.log('=== Testing Token ===');
  console.log('Original token:', testToken);
  
  const validation = validateAndCleanToken(testToken);
  console.log('Validation result:', validation);
  
  return validation;
};

// Add to window for browser console testing
if (typeof window !== 'undefined') {
  (window as any).debugAuth = {
    debugTokenValidation,
    testTokenValidation,
    clearTokenFromStorage,
    getValidTokenFromStorage
  };
}
