// Mock API service for demo purposes
export const apiService = {
  // Users API
  users: {
    getAll: async (page: number = 1, pageSize: number = 10, search?: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUsers = Array.from({ length: 50 }, (_, i) => ({
        id: `user_${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@manzone.com`,
        role: i % 3 === 0 ? 'admin' : 'customer',
        status: i % 4 === 0 ? 'inactive' : 'active',
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`
      }));

      let filteredUsers = mockUsers;
      if (search) {
        filteredUsers = mockUsers.filter(user => 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: filteredUsers.slice(startIndex, endIndex),
        total: filteredUsers.length,
        page,
        pageSize
      };
    },

    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id,
        name: `User ${id}`,
        email: `user${id}@manzone.com`,
        role: 'customer',
        status: 'active',
        createdAt: new Date().toISOString(),
        avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`
      };
    },

    create: async (userData: any) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { id: `user_${Date.now()}`, ...userData };
    },

    update: async (id: string, userData: any) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { id, ...userData };
    },

    delete: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }
  },

  // Products API
  products: {
    getAll: async (page: number = 1, pageSize: number = 10, search?: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockProducts = Array.from({ length: 100 }, (_, i) => ({
        id: `product_${i + 1}`,
        name: `Men's Accessory ${i + 1}`,
        description: `Premium men's accessory with high-quality materials`,
        price: (Math.random() * 200 + 20).toFixed(2),
        category: ['Watches', 'Wallets', 'Belts', 'Sunglasses', 'Ties'][i % 5],
        stock: Math.floor(Math.random() * 100),
        status: i % 8 === 0 ? 'inactive' : 'active',
        images: [
          'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1',
          'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1'
        ],
        attributes: {
          color: ['Black', 'Brown', 'Blue'][i % 3],
          material: ['Leather', 'Metal', 'Fabric'][i % 3],
          size: ['S', 'M', 'L', 'XL'][i % 4]
        },
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
      }));

      let filteredProducts = mockProducts;
      if (search) {
        filteredProducts = mockProducts.filter(product => 
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.category.toLowerCase().includes(search.toLowerCase())
        );
      }

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: filteredProducts.slice(startIndex, endIndex),
        total: filteredProducts.length,
        page,
        pageSize
      };
    },

    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id,
        name: `Men's Accessory ${id}`,
        description: `Premium men's accessory with high-quality materials`,
        price: (Math.random() * 200 + 20).toFixed(2),
        category: 'Watches',
        stock: Math.floor(Math.random() * 100),
        status: 'active',
        images: [
          'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1',
          'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1'
        ],
        attributes: {
          color: 'Black',
          material: 'Leather',
          size: 'M'
        },
        createdAt: new Date().toISOString()
      };
    },

    create: async (productData: any) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { id: `product_${Date.now()}`, ...productData };
    },

    update: async (id: string, productData: any) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { id, ...productData };
    },

    delete: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },

    bulkDelete: async (ids: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, deleted: ids.length };
    }
  },

  // Categories API
  categories: {
    getAll: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        { id: 'cat_1', name: 'Watches', parent: null, status: 'active', order: 1 },
        { id: 'cat_2', name: 'Wallets', parent: null, status: 'active', order: 2 },
        { id: 'cat_3', name: 'Belts', parent: null, status: 'active', order: 3 },
        { id: 'cat_4', name: 'Sunglasses', parent: null, status: 'active', order: 4 },
        { id: 'cat_5', name: 'Ties', parent: null, status: 'active', order: 5 },
        { id: 'cat_6', name: 'Luxury Watches', parent: 'cat_1', status: 'active', order: 1 },
        { id: 'cat_7', name: 'Sport Watches', parent: 'cat_1', status: 'active', order: 2 },
        { id: 'cat_8', name: 'Leather Wallets', parent: 'cat_2', status: 'active', order: 1 },
        { id: 'cat_9', name: 'Card Holders', parent: 'cat_2', status: 'active', order: 2 }
      ];
    },

    create: async (categoryData: any) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { id: `cat_${Date.now()}`, ...categoryData };
    },

    update: async (id: string, categoryData: any) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { id, ...categoryData };
    },

    delete: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }
  },

  // Orders API
  orders: {
    getAll: async (page: number = 1, pageSize: number = 10, search?: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockOrders = Array.from({ length: 200 }, (_, i) => ({
        id: `order_${i + 1}`,
        orderNumber: `MZ-${String(i + 1).padStart(6, '0')}`,
        customer: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        total: (Math.random() * 500 + 50).toFixed(2),
        status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][i % 5],
        paymentStatus: ['pending', 'paid', 'failed', 'refunded'][i % 4],
        items: Math.floor(Math.random() * 5) + 1,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        shippingAddress: `${i + 1} Main Street, City, State`
      }));

      let filteredOrders = mockOrders;
      if (search) {
        filteredOrders = mockOrders.filter(order => 
          order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          order.customer.toLowerCase().includes(search.toLowerCase())
        );
      }

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: filteredOrders.slice(startIndex, endIndex),
        total: filteredOrders.length,
        page,
        pageSize
      };
    },

    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id,
        orderNumber: `MZ-${String(id).padStart(6, '0')}`,
        customer: `Customer ${id}`,
        email: `customer${id}@example.com`,
        total: (Math.random() * 500 + 50).toFixed(2),
        status: 'processing',
        paymentStatus: 'paid',
        items: [
          {
            id: 'item_1',
            name: 'Premium Watch',
            price: 199.99,
            quantity: 1,
            image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
          },
          {
            id: 'item_2',
            name: 'Leather Wallet',
            price: 79.99,
            quantity: 2,
            image: 'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
          }
        ],
        shippingAddress: `${id} Main Street, City, State`,
        createdAt: new Date().toISOString()
      };
    },

    updateStatus: async (id: string, status: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },

    exportOrders: async (format: 'csv' | 'excel') => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, downloadUrl: '#' };
    }
  },

  // Dashboard Statistics
  dashboard: {
    getStats: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        totalUsers: 1245,
        totalProducts: 567,
        totalOrders: 890,
        totalRevenue: 125430.50,
        recentOrders: [
          { id: 'order_1', customer: 'John Doe', total: 199.99, status: 'shipped' },
          { id: 'order_2', customer: 'Jane Smith', total: 89.99, status: 'processing' },
          { id: 'order_3', customer: 'Bob Johnson', total: 149.99, status: 'delivered' },
          { id: 'order_4', customer: 'Alice Brown', total: 79.99, status: 'pending' }
        ],
        salesChart: [
          { month: 'Jan', sales: 4000 },
          { month: 'Feb', sales: 3000 },
          { month: 'Mar', sales: 5000 },
          { month: 'Apr', sales: 4500 },
          { month: 'May', sales: 6000 },
          { month: 'Jun', sales: 5500 }
        ],
        topProducts: [
          { name: 'Premium Watch', sales: 120 },
          { name: 'Leather Wallet', sales: 95 },
          { name: 'Designer Belt', sales: 78 },
          { name: 'Sunglasses', sales: 65 }
        ]
      };
    }
  }
};