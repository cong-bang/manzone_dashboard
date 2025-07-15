import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { createAuthHeaders, clearTokenFromStorage } from '../utils/tokenUtils';

// Types for User Management API
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatarUrl: string;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber: string;
  email: string;
  address?: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatarUrl?: string;
  active?: boolean;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address?: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatarUrl?: string;
  active: boolean;
}

export interface UserListParams {
  page?: number;
  size?: number;
  sortDir?: 'ASC' | 'DESC';
  sortBy?: 'FIRST_NAME' | 'LAST_NAME' | 'EMAIL' | 'CREATED_AT' | 'UPDATED_AT' | 'ROLE';
  searchString?: string;
  role?: 'CUSTOMER' | 'ADMIN';
  isDeleted?: boolean;
}

export interface UserListResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  deletedUsers: number;
  customersCount: number;
  adminsCount: number;
  todayRegistrations: number;
  thisWeekRegistrations: number;
  thisMonthRegistrations: number;
  thisYearRegistrations: number;
  dailyRegistrations: Record<string, number>;
  customerPercentage: number;
  adminPercentage: number;
  activeUserPercentage: number;
  deletedUserPercentage: number;
  previousMonthRegistrations: number;
  registrationGrowthRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

// Configure axios defaults for CORS
const configureAxios = () => {
  // Set default configuration for CORS
  axios.defaults.withCredentials = false; // Set to true if backend requires credentials
  
  // Add request interceptor for consistent headers
  axios.interceptors.request.use(
    (config) => {
      try {
        // Ensure proper headers for CORS
        const authHeaders = createAuthHeaders();
        Object.assign(config.headers, authHeaders);
        return config;
      } catch (error) {
        // If we can't get auth headers, let the request proceed without them
        // This allows login requests to work
        if (config.url?.includes('/auth/login')) {
          return config;
        }
        return Promise.reject(error);
      }
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for error handling
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error - please check your connection and CORS configuration');
      }
      
      if (error.response?.status === 401) {
        // Clear potentially corrupted tokens on 401 errors
        clearTokenFromStorage();
        throw new Error('UNAUTHORIZED');
      }
      
      if (error.response?.status === 403) {
        throw new Error('FORBIDDEN');
      }
      
      // Check for JWT parsing errors in the response
      if (error.response?.data?.message?.includes('Invalid serialized') || 
          error.response?.data?.message?.includes('Missing part delimiters')) {
        console.error('JWT token format error detected, clearing tokens');
        clearTokenFromStorage();
        throw new Error('INVALID_TOKEN_FORMAT');
      }
      
      return Promise.reject(error);
    }
  );
};

// Initialize axios configuration
configureAxios();

export const adminUserService = {
  // Test endpoint for CORS verification
  testConnection: async (): Promise<ApiResponse<string>> => {
    try {
      const response = await axios.get<ApiResponse<string>>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS_TEST),
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          throw new Error('CORS or network error - please verify backend is running and CORS is configured');
        }
        throw new Error(error.response?.data?.message || 'Failed to test connection');
      }
      throw new Error('Network error while testing connection');
    }
  },
  // Get all users with pagination and filters
  getAllUsers: async (params: UserListParams = {}): Promise<ApiResponse<UserListResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.sortDir) queryParams.append('sortDir', params.sortDir);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.searchString) queryParams.append('searchString', params.searchString);
      if (params.role) queryParams.append('role', params.role);
      if (params.isDeleted !== undefined) queryParams.append('isDeleted', params.isDeleted.toString());

      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS)}?${queryParams.toString()}`;
      const response = await axios.get<ApiResponse<UserListResponse>>(url, {
        headers: createAuthHeaders()
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (error.code === 'ERR_NETWORK') {
          throw new Error('CORS or network error - please verify backend connection');
        }
        if (errorCode === 401) {
          throw new Error('UNAUTHORIZED - please login again');
        }
        if (errorCode === 403) {
          throw new Error('ACCESS_DENIED - insufficient permissions');
        }
        
        throw new Error(errorMessage || 'Failed to fetch users');
      }
      throw new Error('Network error while fetching users');
    }
  },

  // Get user by ID
  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    try {
      const response = await axios.get<ApiResponse<User>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS)}/${id}`,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (errorCode === 404) {
          throw new Error('USER_NOT_FOUND');
        }
        if (errorCode === 401) {
          throw new Error('UNAUTHORIZED');
        }
        if (errorCode === 403) {
          throw new Error('ACCESS_DENIED');
        }
        
        throw new Error(errorMessage || 'Failed to fetch user');
      }
      throw new Error('Network error while fetching user');
    }
  },

  // Create new user
  createUser: async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
    try {
      const response = await axios.post<ApiResponse<User>>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS),
        userData,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        const validationErrors = error.response?.data?.errors;
        
        if (errorCode === 400) {
          if (validationErrors?.email) {
            throw new Error('EMAIL_ALREADY_EXISTS');
          }
          if (validationErrors?.phoneNumber) {
            throw new Error('INVALID_PHONE_NUMBER');
          }
          throw new Error('INVALID_REQUEST - ' + (errorMessage || 'Validation failed'));
        }
        
        throw new Error(errorMessage || 'Failed to create user');
      }
      throw new Error('Network error while creating user');
    }
  },

  // Update user
  updateUser: async (id: number, userData: UpdateUserRequest): Promise<ApiResponse<User>> => {
    try {
      const response = await axios.put<ApiResponse<User>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS)}/${id}`,
        userData,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        const validationErrors = error.response?.data?.errors;
        
        if (errorCode === 404) {
          throw new Error('USER_NOT_FOUND');
        }
        if (errorCode === 400) {
          if (validationErrors?.email) {
            throw new Error('EMAIL_ALREADY_EXISTS');
          }
          if (validationErrors?.phoneNumber) {
            throw new Error('INVALID_PHONE_NUMBER');
          }
          throw new Error('INVALID_REQUEST - ' + (errorMessage || 'Validation failed'));
        }
        
        throw new Error(errorMessage || 'Failed to update user');
      }
      throw new Error('Network error while updating user');
    }
  },

  // Delete user (soft delete)
  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await axios.delete<ApiResponse<void>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS)}/${id}`,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (errorCode === 404) {
          throw new Error('USER_NOT_FOUND');
        }
        if (errorCode === 400) {
          throw new Error('CANNOT_DELETE_ADMIN');
        }
        
        throw new Error(errorMessage || 'Failed to delete user');
      }
      throw new Error('Network error while deleting user');
    }
  },

  // Restore user
  restoreUser: async (id: number): Promise<ApiResponse<User>> => {
    try {
      const response = await axios.post<ApiResponse<User>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS)}/${id}/restore`,
        {},
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to restore user');
      }
      throw new Error('Network error while restoring user');
    }
  },

  // Activate user
  activateUser: async (id: number): Promise<ApiResponse<User>> => {
    try {
      const response = await axios.post<ApiResponse<User>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS)}/${id}/activate`,
        {},
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to activate user');
      }
      throw new Error('Network error while activating user');
    }
  },

  // Deactivate user
  deactivateUser: async (id: number): Promise<ApiResponse<User>> => {
    try {
      const response = await axios.post<ApiResponse<User>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS)}/${id}/deactivate`,
        {},
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to deactivate user');
      }
      throw new Error('Network error while deactivating user');
    }
  },

  // Reset user password
  resetUserPassword: async (id: number, newPassword?: string): Promise<ApiResponse<void>> => {
    try {
      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS)}/${id}/reset-password`;
      const urlWithParams = newPassword ? `${url}?newPassword=${encodeURIComponent(newPassword)}` : url;
      
      const response = await axios.post<ApiResponse<void>>(
        urlWithParams,
        {},
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to reset password');
      }
      throw new Error('Network error while resetting password');
    }
  },

  // Get user statistics
  getUserStatistics: async (): Promise<ApiResponse<UserStatistics>> => {
    try {
      const response = await axios.get<ApiResponse<UserStatistics>>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USER_STATISTICS),
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
      }
      throw new Error('Network error while fetching statistics');
    }
  },

  // Configure axios CORS settings
  configureAxios
};
