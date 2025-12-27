import NetInfo from '@react-native-community/netinfo';
import { storage } from '../utils/storage';

/**
 * WooCommerce API Service - Kataraa
 */

const WOO_CONFIG = {
  baseURL: 'https://kataraa.com/wp-json/wc/v3',
  consumerKey: process.env.EXPO_PUBLIC_WOO_KEY,
  consumerSecret: process.env.EXPO_PUBLIC_WOO_SECRET,
};

const getAuthHeader = () => {
  const credentials = btoa(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`);
  return `Basic ${credentials}`;
};

const isOffline = async () => {
  const state = await NetInfo.fetch();
  return !state.isConnected;
};

  // Get Products
  async getProducts(page = 1, perPage = 20, category = null) {
  try {
    if (await isOffline()) {
      const cached = await storage.getItem('cached_products');
      if (cached) {
        // Filter by category if needed
        if (category) {
          return cached.filter(p => p.categories?.some(c => c.id === category));
        }
        return cached.slice((page - 1) * perPage, page * perPage);
      }
      return [];
    }

    let url = `${WOO_CONFIG.baseURL}/products?page=${page}&per_page=${perPage}&status=publish`;
    if (category) url += `&category=${category}`;

    const response = await fetch(url, {
      headers: { 'Authorization': getAuthHeader() }
    });

    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();

    // Update cache on first page load
    if (page === 1 && !category) {
      await storage.setItem('cached_products', data);
    }

    return data;
  } catch (error) {
    console.error('getProducts error:', error);
    const cached = await storage.getItem('cached_products');
    return cached || [];
  }
},

  // Get Single Product
  async getProduct(id) {
  try {
    const response = await fetch(`${WOO_CONFIG.baseURL}/products/${id}`, {
      headers: { 'Authorization': getAuthHeader() }
    });
    if (!response.ok) throw new Error('Product not found');
    return await response.json();
  } catch (error) {
    console.error('getProduct error:', error);
    return null;
  }
},

  // Get Categories
  async getCategories() {
  try {
    if (await isOffline()) {
      const cached = await storage.getItem('cached_categories');
      return cached || [];
    }

    const response = await fetch(`${WOO_CONFIG.baseURL}/products/categories?per_page=50`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    await storage.setItem('cached_categories', data);
    return data;
  } catch (error) {
    console.error('getCategories error:', error);
    const cached = await storage.getItem('cached_categories');
    return cached || [];
  }
},

  // Search Products
  async searchProducts(query, page = 1, perPage = 20) {
  try {
    const response = await fetch(
      `${WOO_CONFIG.baseURL}/products?search=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&status=publish`,
      { headers: { 'Authorization': getAuthHeader() } }
    );
    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  } catch (error) {
    console.error('searchProducts error:', error);
    return [];
  }
},

  // Create Order
  async createOrder(orderData) {
  try {
    const response = await fetch(`${WOO_CONFIG.baseURL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) throw new Error('Failed to create order');
    return await response.json();
  } catch (error) {
    console.error('createOrder error:', error);
    throw error;
  }
},
};

export default api;
