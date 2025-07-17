// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://manzone.wizlab.io.vn', // Change this to actual server URL later
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      PROFILE: '/users/profile'
    },
    ADMIN: {
      USERS: '/admin/users',
      USERS_TEST: '/admin/users/test',
      USER_STATISTICS: '/admin/users/statistics',
      CATEGORIES: '/categories',
      CATEGORIES_TEST: '/categories/test',
      PRODUCTS: '/products',
      PRODUCTS_TEST: '/products/test',
      ORDERS: '/orders/admin',
      ORDERS_TEST: '/orders/admin/test',
      ORDER_STATISTICS: '/orders/admin/statistics'

    }
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to update base URL (for when you change to actual server)
export const updateBaseUrl = (newBaseUrl: string): void => {
  API_CONFIG.BASE_URL = newBaseUrl;
};
