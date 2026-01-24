import { getAllProducts, getProductById, PRODUCT_CATEGORIES } from './adminProductService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

const api = {
  // Get Products from Firestore
  async getProducts(page = 1, perPage = 20, category = null, options = {}) {
    try {
      console.log(`🔌 Fetching products from Firestore (Page: ${page})`, { category, ...options });

      const fetchOptions = {
        limitCount: 1000, // Fetch all to allow proper sorting and client-side pagination
        status: 'active', // Only show active products to customers
      };

      if (category) {
        fetchOptions.category = category;
      }

      // Fetch all matching products
      let allProducts = await getAllProducts(fetchOptions);

      // 1. Filter by Skin Type (using tags)
      if (options.skin) {
        const skinType = options.skin.toLowerCase();
        allProducts = allProducts.filter(p =>
          p.tags && p.tags.some(tag => tag.toLowerCase() === skinType)
        );
      }

      // 2. Sort Products
      if (options.sortBy) {
        switch (options.sortBy) {
          case 'price-asc':
            allProducts.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            allProducts.sort((a, b) => b.price - a.price);
            break;
          case 'alphabetic':
            allProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
          // 'newest' is default from getAllProducts
          default:
            break;
        }
      }

      // Calculate start and end indices for pagination
      const start = (page - 1) * perPage;
      const end = start + perPage;

      // Slice the array for the requested page
      const products = allProducts.slice(start, end);

      console.log(`✅ Loaded ${products.length} products (Page ${page}: ${start}-${end} of ${allProducts.length})`);
      return products;

    } catch (error) {
      console.error('❌ API Error (getProducts):', error.message);
      return [];
    }
  },

  // Get Single Product
  async getProduct(id) {
    try {
      console.log(`🔌 Fetching product ${id}`);
      return await getProductById(id);
    } catch (error) {
      console.error('❌ API Error (getProduct):', error.message);
      return null;
    }
  },

  // Get Categories
  async getCategories() {
    try {
      return PRODUCT_CATEGORIES;
    } catch (error) {
      console.error('❌ API Error (getCategories):', error.message);
      return [];
    }
  },

  // Search Products
  async searchProducts(query, page = 1, perPage = 20) {
    try {
      console.log(`🔍 Searching: ${query}`);
      // Basic client-side filtering for search as Firestore doesn't support full-text search natively
      const allProducts = await getAllProducts({ status: 'active', limitCount: 100 });

      const lowerQuery = query.toLowerCase();
      return allProducts.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('❌ API Error (searchProducts):', error.message);
      return [];
    }
  },

  // Create Order
  async createOrder(orderData) {
    try {
      console.log('📝 Creating order in Firestore...');
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: serverTimestamp(),
        status: 'pending', // Default status
      });
      return { id: docRef.id, ...orderData };
    } catch (error) {
      console.error('❌ API Error (createOrder):', error.message);
      throw error;
    }
  }
};

export default api;
