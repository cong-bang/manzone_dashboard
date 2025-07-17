import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { createAuthHeaders, clearTokenFromStorage } from '../utils/tokenUtils';

// Types for Order Management API
export interface OrderDetail {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN';
  phoneNumber: string;
  avatarUrl: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  deleted: boolean;
}

export interface Order {
  id: number;
  user: User;
  orderDetails: OrderDetail[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  phoneNumber: string;
  shippingAddress: string;
  note: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderRequest {
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

export interface OrderListParams {
  page?: number;
  size?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

export interface OrderListResponse {
  content: Order[];
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

// Configure axios defaults for CORS
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

export const adminOrderService = {
  // Test endpoint for CORS verification
  testConnection: async (): Promise<ApiResponse<string>> => {
    try {
      const response = await axios.get<ApiResponse<string>>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.ORDERS_TEST),
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

  // Get all orders with pagination and filters
  getAllOrders: async (params: OrderListParams = {}): Promise<ApiResponse<OrderListResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.status) queryParams.append('status', params.status);

      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.ORDERS)}?${queryParams.toString()}`;
      console.log('Request URL:', url);
      console.log('Headers:', createAuthHeaders());
      const response = await axios.get<ApiResponse<OrderListResponse>>(url, {
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
        if (errorCode === 405) {
          throw new Error('METHOD_NOT_ALLOWED - please check if GET is supported or use POST for this endpoint');
        }
        
        throw new Error(errorMessage || 'Failed to fetch orders');
      }
      throw new Error('Network error while fetching orders');
    }
  },

  // Update order by ID
  updateOrderById: async (id: number, orderData: UpdateOrderRequest): Promise<ApiResponse<Order>> => {
    try {
      const response = await axios.put<ApiResponse<Order>>(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.ORDERS)}/${id}/status`,
        orderData,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (errorCode === 404) {
          throw new Error('ORDER_NOT_FOUND');
        }
        if (errorCode === 400) {
          throw new Error('INVALID_STATUS - ' + (errorMessage || 'Invalid status update'));
        }
        
        throw new Error(errorMessage || 'Failed to update order');
      }
      throw new Error('Network error while updating order');
    }
  },

  // Configure axios CORS settings
  configureAxios
};