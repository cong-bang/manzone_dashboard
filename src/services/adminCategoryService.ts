import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { createAuthHeaders, clearTokenFromStorage } from '../utils/tokenUtils';

// Types for Category Management API
export interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

export interface CategoryListParams {
  page?: number;
  size?: number;
  sortDir?: 'ASC' | 'DESC';
  sortBy?: 'NAME' | 'CREATED_AT' | 'UPDATED_AT';
  searchString?: string;
}

export interface CategoryListResponse {
  content: Category[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  first: boolean;
  empty: boolean;
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

const configureAxios = () => {
  axios.defaults.withCredentials = false; 
  
  axios.interceptors.request.use(
    (config) => {
      try {
        const authHeaders = createAuthHeaders();
        Object.assign(config.headers, authHeaders);
        return config;
      } catch (error) {
        if (config.url?.includes('/auth/login')) {
          return config;
        }
        return Promise.reject(error);
      }
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error - please check your connection and CORS configuration');
      }
      
      if (error.response?.status === 401) {
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

export const adminCategoryService = {
  // Test endpoint for CORS verification
  testConnection: async (): Promise<ApiResponse<string>> => {
    try {
      const response = await axios.get<ApiResponse<string>>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES_TEST),
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

  // Get all categories with pagination and filters
  getAllCategories: async (params: CategoryListParams = {}): Promise<ApiResponse<CategoryListResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.sortDir) queryParams.append('sortDir', params.sortDir);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.searchString) queryParams.append('searchString', params.searchString);

      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES)}?${queryParams.toString()}`;
      const response = await axios.get<ApiResponse<CategoryListResponse>>(url, {
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
        
        throw new Error(errorMessage || 'Failed to fetch categories');
      }
      throw new Error('Network error while fetching categories');
    }
  },

  // Get category by ID
  getCategoryById: async (id: number): Promise<ApiResponse<Category>> => {
    try {
      const response = await axios.get<ApiResponse<Category>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES)}/${id}`,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (errorCode === 404) {
          throw new Error('CATEGORY_NOT_FOUND');
        }
        if (errorCode === 401) {
          throw new Error('UNAUTHORIZED');
        }
        if (errorCode === 403) {
          throw new Error('ACCESS_DENIED');
        }
        
        throw new Error(errorMessage || 'Failed to fetch category');
      }
      throw new Error('Network error while fetching category');
    }
  },

  // Create new category
  createCategory: async (categoryData: CreateCategoryRequest): Promise<ApiResponse<Category>> => {
    try {
      const response = await axios.post<ApiResponse<Category>>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES),
        categoryData,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        const validationErrors = error.response?.data?.errors;
        
        if (errorCode === 400) {
          if (validationErrors?.name) {
            throw new Error('CATEGORY_NAME_ALREADY_EXISTS');
          }
          throw new Error('INVALID_REQUEST - ' + (errorMessage || 'Validation failed'));
        }
        
        throw new Error(errorMessage || 'Failed to create category');
      }
      throw new Error('Network error while creating category');
    }
  },

  // Update category
  updateCategory: async (id: number, categoryData: UpdateCategoryRequest): Promise<ApiResponse<Category>> => {
    try {
      const response = await axios.put<ApiResponse<Category>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES)}/${id}`,
        categoryData,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        const validationErrors = error.response?.data?.errors;
        
        if (errorCode === 404) {
          throw new Error('CATEGORY_NOT_FOUND');
        }
        if (errorCode === 400) {
          if (validationErrors?.name) {
            throw new Error('CATEGORY_NAME_ALREADY_EXISTS');
          }
          throw new Error('INVALID_REQUEST - ' + (errorMessage || 'Validation failed'));
        }
        
        throw new Error(errorMessage || 'Failed to update category');
      }
      throw new Error('Network error while updating category');
    }
  },

  // Delete category
  deleteCategory: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await axios.delete<ApiResponse<void>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES)}/${id}`,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (errorCode === 404) {
          throw new Error('CATEGORY_NOT_FOUND');
        }
        if (errorCode === 400) {
          throw new Error('CANNOT_DELETE_CATEGORY');
        }
        
        throw new Error(errorMessage || 'Failed to delete category');
      }
      throw new Error('Network error while deleting category');
    }
  },
  
  restoreCategory: async (id: number): Promise<ApiResponse<Category>> => {
    try {
      const response = await axios.post<ApiResponse<Category>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES)}/${id}/restore`,
        {},
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to restore category');
      }
      throw new Error('Network error while restoring category');
    }
  },

  configureAxios
};