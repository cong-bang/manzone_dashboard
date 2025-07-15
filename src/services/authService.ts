import jwtDecode from 'jwt-decode';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock login validation
    if (credentials.email === 'admin@manzone.com' && credentials.password === 'admin123') {
      const token = 'mock_jwt_token_' + Date.now();
      return {
        success: true,
        token,
        user: {
          id: '1',
          email: 'admin@manzone.com',
          name: 'Admin User',
          role: 'admin',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
        }
      };
    }
    
    throw new Error('Invalid credentials');
  },

  validateToken: async (token: string) => {
    // Simulate token validation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (token.startsWith('mock_jwt_token_')) {
      return {
        id: '1',
        email: 'admin@manzone.com',
        name: 'Admin User',
        role: 'admin',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
      };
    }
    
    throw new Error('Invalid token');
  },

  resetPassword: async (email: string) => {
    // Simulate password reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
};