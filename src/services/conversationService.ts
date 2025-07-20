import axios from 'axios';
import { buildApiUrl } from '../config/api';
import { createAuthHeaders, clearTokenFromStorage } from '../utils/tokenUtils';

// Types for Conversation API
export interface Conversation {
  id: number;
  userId: number;
  email: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationListParams {
  page?: number;
  size?: number;
  sort?: 'ASC' | 'DESC';
}

export interface ConversationListResponse {
  content: Conversation[];
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
  data: T;
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
      
      return Promise.reject(error);
    }
  );
};

// Initialize axios configuration
configureAxios();

export const conversationService = {
  // Get all conversations with pagination
  getAllConversations: async (params: ConversationListParams = {}): Promise<ApiResponse<ConversationListResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.sort) queryParams.append('sort', params.sort);

      const url = `https://manzone.wizlab.io.vn/api/conversations?${queryParams.toString()}`;
      console.log('Fetching conversations from:', url);
      
      const response = await axios.get<ApiResponse<ConversationListResponse>>(url, {
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
        
        throw new Error(errorMessage || 'Failed to fetch conversations');
      }
      throw new Error('Network error while fetching conversations');
    }
  },

  // Get conversation by ID
  getConversationById: async (id: number): Promise<ApiResponse<Conversation>> => {
    try {
      const response = await axios.get<ApiResponse<Conversation>>(
        `https://manzone.wizlab.io.vn/api/conversations/${id}`,
        { headers: createAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        const errorCode = error.response?.status;
        
        if (errorCode === 404) {
          throw new Error('CONVERSATION_NOT_FOUND');
        }
        if (errorCode === 401) {
          throw new Error('UNAUTHORIZED');
        }
        if (errorCode === 403) {
          throw new Error('ACCESS_DENIED');
        }
        
        throw new Error(errorMessage || 'Failed to fetch conversation');
      }
      throw new Error('Network error while fetching conversation');
    }
  },

  configureAxios
};