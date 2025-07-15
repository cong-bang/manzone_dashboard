// Simple API test utility for development
import { authService } from '../services/authService';

export const testLogin = async () => {
  try {
    console.log('Testing login with admin credentials...');
    const result = await authService.login({
      email: 'admin',
      password: 'admin',
      rememberMe: true
    });
    
    console.log('Login successful:', result);
    
    // Test token validation
    console.log('Testing token validation...');
    const userProfile = await authService.validateToken(result.token);
    console.log('Token validation successful:', userProfile);
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Export for debugging purposes
(window as any).testLogin = testLogin;
