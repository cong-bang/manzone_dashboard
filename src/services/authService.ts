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
    console.log('Fetching user profile from API...');
    const response = await axios.get<UserProfileResponse>(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    console.log('API Response received:', response.status);

    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      console.log('User profile fetched successfully:', userData.email);
      
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
    
    throw new Error('Failed to fetch user profile - invalid response structure');
  } catch (error) {
    console.error('Profile fetch error details:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error('Unauthorized - token may be invalid');
        throw new Error('UNAUTHORIZED');
      }
      if (error.response?.status === 403) {
        console.error('Forbidden - insufficient permissions');
        throw new Error('FORBIDDEN');
      }
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error occurred');
        throw new Error('NETWORK_ERROR');
      }
      
      console.error('API Error Response:', error.response?.data);
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

        // Return success with token - profile will be fetched separately
        return {
          success: true,
          token,
          user: {
            id: decodedToken.sub,
            email: decodedToken.email,
            name: 'Loading...', // Temporary until profile loads
            role: decodedToken.scope.toLowerCase(),
            avatar: undefined,
            phoneNumber: undefined,
            address: undefined,
            active: true
          }
        };
      }
      
      throw new Error('LOGIN_FAILED');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        throw error;
      }
      
      if (error.message === 'UNAUTHORIZED') {
        throw new Error('INVALID_CREDENTIALS');
      }
      
      if (error.message === 'FORBIDDEN') {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }
      
      if (error.message === 'NETWORK_ERROR') {
        throw new Error('NETWORK_ERROR');
      }
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('INVALID_CREDENTIALS');
        }
        if (error.response?.status === 403) {
          throw new Error('INSUFFICIENT_PERMISSIONS');
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
        console.warn('Profile fetch failed during token validation, using JWT data');
        // Return basic data from JWT if profile fetch fails
        return {
          id: decodedToken.sub,
          email: decodedToken.email,
          name: 'Admin User',
          role: decodedToken.scope.toLowerCase(),
          avatar: undefined,
          phoneNumber: undefined,
          address: undefined,
          active: true
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
  },

  // Method to refresh current user profile
  refreshUserProfile: async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const userProfile = await fetchUserProfile(token);
      console.log('Profile refreshed successfully');
      return userProfile;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  }
};