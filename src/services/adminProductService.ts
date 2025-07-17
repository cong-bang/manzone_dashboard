import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { createAuthHeaders, clearTokenFromStorage } from '../utils/tokenUtils';

// Types for Product Management API
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  categoryId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrls: string[];
  categoryId: number;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrls: string[];
  categoryId: number;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  sortDir?: 'ASC' | 'DESC';
  sortBy?: 'NAME' | 'PRICE' | 'CREATED_AT' | 'UPDATED_AT';
  searchString?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductListResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
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
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
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

export const adminProductService = {
  testConnection: async (): Promise<ApiResponse<string>> => {
    try {
      const response = await axios.get<ApiResponse<string>>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS_TEST),
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

  // Get all products with pagination and filters
  getAllProducts: async (params: ProductListParams = {}): Promise<ApiResponse<ProductListResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.sortDir) queryParams.append('sortDir', params.sortDir);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.searchString) queryParams.append('searchString', params.searchString);
      if (params.categoryId !== undefined) queryParams.append('categoryId', params.categoryId.toString());
      if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());

      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS)}?${queryParams.toString()}`;
      const response = await axios.get<ApiResponse<ProductListResponse>>(url, {
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
        
        throw new Error(errorMessage || 'Failed to fetch products');
      }
      throw new Error('Network error while fetching products');
    }
  },

  // Get product by ID
  getProductById: async (id: number): Promise<ApiResponse<Product>> => {
    try {
      const response = await axios.get<ApiResponse<Product>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS)}/${id}`,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (errorCode === 404) {
          throw new Error('PRODUCT_NOT_FOUND');
        }
        if (errorCode === 401) {
          throw new Error('UNAUTHORIZED');
        }
        if (errorCode === 403) {
          throw new Error('ACCESS_DENIED');
        }
        
        throw new Error(errorMessage || 'Failed to fetch product');
      }
      throw new Error('Network error while fetching product');
    }
  },

  // Create new product
  createProduct: async (productData: CreateProductRequest): Promise<ApiResponse<Product>> => {
    try {
      const response = await axios.post<ApiResponse<Product>>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS),
        productData,
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
            throw new Error('PRODUCT_NAME_ALREADY_EXISTS');
          }
          if (validationErrors?.price) {
            throw new Error('INVALID_PRICE');
          }
          if (validationErrors?.categoryId) {
            throw new Error('INVALID_CATEGORY');
          }
          if (validationErrors?.imageUrls) {
            throw new Error('INVALID_IMAGE_URLS');
          }
          throw new Error('INVALID_REQUEST - ' + (errorMessage || 'Validation failed'));
        }
        
        throw new Error(errorMessage || 'Failed to create product');
      }
      throw new Error('Network error while creating product');
    }
  },

  // Update product
  updateProduct: async (id: number, productData: UpdateProductRequest): Promise<ApiResponse<Product>> => {
    try {
      const response = await axios.put<ApiResponse<Product>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS)}/${id}`,
        productData,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        const validationErrors = error.response?.data?.errors;
        
        if (errorCode === 404) {
          throw new Error('PRODUCT_NOT_FOUND');
        }
        if (errorCode === 400) {
          if (validationErrors?.name) {
            throw new Error('PRODUCT_NAME_ALREADY_EXISTS');
          }
          if (validationErrors?.price) {
            throw new Error('INVALID_PRICE');
          }
          if (validationErrors?.categoryId) {
            throw new Error('INVALID_CATEGORY');
          }
          if (validationErrors?.imageUrls) {
            throw new Error('INVALID_IMAGE_URLS');
          }
          throw new Error('INVALID_REQUEST - ' + (errorMessage || 'Validation failed'));
        }
        
        throw new Error(errorMessage || 'Failed to update product');
      }
      throw new Error('Network error while updating product');
    }
  },

  // Delete product
  deleteProduct: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await axios.delete<ApiResponse<void>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS)}/${id}`,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (errorCode === 404) {
          throw new Error('PRODUCT_NOT_FOUND');
        }
        if (errorCode === 400) {
          throw new Error('CANNOT_DELETE_PRODUCT');
        }
        
        throw new Error(errorMessage || 'Failed to delete product');
      }
      throw new Error('Network error while deleting product');
    }
  },
  
  // Restore product (soft delete recovery)
  restoreProduct: async (id: number): Promise<ApiResponse<Product>> => {
    try {
      const response = await axios.post<ApiResponse<Product>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS)}/${id}/restore`,
        {},
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to restore product');
      }
      throw new Error('Network error while restoring product');
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId: number, params: Omit<ProductListParams, 'categoryId'> = {}): Promise<ApiResponse<ProductListResponse>> => {
    return adminProductService.getAllProducts({ ...params, categoryId });
  },

  // Search products by name
  searchProducts: async (searchString: string, params: Omit<ProductListParams, 'searchString'> = {}): Promise<ApiResponse<ProductListResponse>> => {
    return adminProductService.getAllProducts({ ...params, searchString });
  },

  // Get products by price range
  getProductsByPriceRange: async (minPrice: number, maxPrice: number, params: Omit<ProductListParams, 'minPrice' | 'maxPrice'> = {}): Promise<ApiResponse<ProductListResponse>> => {
    return adminProductService.getAllProducts({ ...params, minPrice, maxPrice });
  },

  configureAxios
};