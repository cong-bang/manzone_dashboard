import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_BASE_URL = 'https://manzone.wizlab.io.vn';

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
    phoneNumber?: string;
    address?: string;
    active?: boolean;
  };
}

interface JWTPayload {
  sub: string;
  scope: string;
  iss: string;
  exp: number;
  iat: number;
  email: string;
  jti: string;
}

interface ApiLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
  };
}

interface UserProfileResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    createdAt: string;
    updatedAt: string;
    deleted: boolean;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber: string;
    avatarUrl: string;
    active: boolean;
    email: string;
    address: string;
  };
}

const fetchUserProfile = async (token: string) => {
  try {
    const response = await axios.get<UserProfileResponse>(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      return {
        id: userData.id.toString(),
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        role: userData.role.toLowerCase(),
        avatar: userData.avatarUrl,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        active: userData.active
      };
    }
    
    throw new Error('Failed to fetch user profile');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (error.response?.status === 403) {
        throw new Error('FORBIDDEN');
      }
    }
    throw new Error('PROFILE_FETCH_FAILED');
  }
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await axios.post<ApiLoginResponse>(`${API_BASE_URL}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });

      if (response.data.success && response.data.data.token) {
        const token = response.data.data.token;
        
        // Decode JWT to check user scope
        const decodedToken = jwtDecode<JWTPayload>(token);
        
        // Check if user has ADMIN scope
        if (decodedToken.scope !== 'ADMIN') {
          throw new Error('INSUFFICIENT_PERMISSIONS');
        }

        // Fetch real user profile data
        try {
          const userProfile = await fetchUserProfile(token);
          
          return {
            success: true,
            token,
            user: userProfile
          };
        } catch (profileError: any) {
          // If profile fetch fails, fall back to JWT data
          console.warn('Failed to fetch user profile, using JWT data:', profileError.message);
          
          return {
            success: true,
            token,
            user: {
              id: decodedToken.sub,
              email: decodedToken.email,
              name: 'Admin User', // Fallback name
              role: decodedToken.scope.toLowerCase(),
              avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
            }
          };
        }
      }
      
      throw new Error('LOGIN_FAILED');
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        throw error;
      }
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('INVALID_CREDENTIALS');
        }
        throw new Error('NETWORK_ERROR');
      }
      
      throw new Error('LOGIN_FAILED');
    }
  },

  validateToken: async (token: string) => {
    try {
      const decodedToken = jwtDecode<JWTPayload>(token);
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        throw new Error('Token expired');
      }
      
      // Check if user has ADMIN scope
      if (decodedToken.scope !== 'ADMIN') {
        throw new Error('Insufficient permissions');
      }

      // Try to fetch real user profile data
      try {
        const userProfile = await fetchUserProfile(token);
        return userProfile;
      } catch (profileError) {
        // If profile fetch fails, fall back to JWT data
        console.warn('Failed to fetch user profile during token validation, using JWT data');
        
        return {
          id: decodedToken.sub,
          email: decodedToken.email,
          name: 'Admin User', // Fallback name
          role: decodedToken.scope.toLowerCase(),
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
        };
      }
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  resetPassword: async (_email: string) => {
    // Simulate password reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  getUserProfile: async (token: string) => {
    return await fetchUserProfile(token);
  }
};