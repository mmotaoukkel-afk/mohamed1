import { MOCK_PRODUCTS, MOCK_CATEGORIES } from './mockData';

/**
 * API Service - Kataraa
 * Uses mock data for products and categories
 */

const api = {
  // Get Products
  async getProducts(page = 1, perPage = 20, category = null) {
    try {
      console.log('📦 Loading products from mock data');
      let products = [...MOCK_PRODUCTS];

      // Filter by category if specified
      if (category) {
        products = products.filter(p => p.categories?.some(c => c.id === category));
      }

      // Paginate results
      const start = (page - 1) * perPage;
      const end = page * perPage;
      return products.slice(start, end);
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  },

  // Get Single Product
  async getProduct(id) {
    try {
      console.log(`📦 Loading product ${id} from mock data`);
      const product = MOCK_PRODUCTS.find(p => p.id === parseInt(id));
      return product || MOCK_PRODUCTS[0];
    } catch (error) {
      console.error('Error loading product:', error);
      return MOCK_PRODUCTS[0];
    }
  },

  // Get Categories
  async getCategories() {
    try {
      console.log('📂 Loading categories from mock data');
      return MOCK_CATEGORIES;
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  },

  // Search Products
  async searchProducts(query, page = 1, perPage = 20) {
    try {
      console.log(`🔍 Searching products: "${query}"`);
      const filtered = MOCK_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      );

      const start = (page - 1) * perPage;
      const end = page * perPage;
      return filtered.slice(start, end);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Create Order (Mock implementation)
  async createOrder(orderData) {
    try {
      console.log('📝 Creating mock order');
      return {
        id: Date.now(),
        status: 'pending',
        total: orderData.total || '0',
        ...orderData,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Update Order (Mock implementation)
  async updateOrder(orderId, orderData) {
    try {
      console.log(`📝 Updating mock order ${orderId}`);
      return {
        id: orderId,
        ...orderData,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },
};

export default api;
