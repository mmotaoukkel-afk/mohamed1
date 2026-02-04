import { getAllProducts, getProductById, PRODUCT_CATEGORIES, normalizeProduct } from './adminProductService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { triggerAdminAlert } from './adminNotificationService';

const api = {
  // Get Products from Firestore
  async getProducts(page = 1, perPage = 20, category = null, options = {}) {
    try {
      console.log(`🔌 Fetching products from Firestore (Page: ${page})`, { category, ...options });

      const fetchOptions = {
        limitCount: 1000, // Fetch all to allow proper sorting and client-side pagination/filtering
        status: 'active', // Only show active products to customers
      };

      // Fetch ALL active products once
      let allProducts = await getAllProducts(fetchOptions);

      // 1. Apply Normalization FIRST (so we have valid category objects for filtering)
      const normalizedAll = allProducts.map(normalizeProduct);

      // 2. Filter by Category Client-Side (Supports aliases and name-based fallback)
      let filtered = normalizedAll;
      if (category) {
        const catObj = PRODUCT_CATEGORIES.find(c => c.id === category);
        filtered = normalizedAll.filter(p => {
          // Match by ANY of the normalized IDs
          const matchesNormalized = p.categories.some(c => c.id === category);
          if (matchesNormalized) return true;

          // Fallback: match by aliases if the product still has raw data
          if (catObj && catObj.aliases) {
            return catObj.aliases.includes(p.category);
          }
          return p.category === category;
        });
      }

      // 3. Filter by Skin Type (using tags)
      if (options.skin) {
        const skinType = options.skin.trim().toLowerCase();
        filtered = filtered.filter(p =>
          p.tags && p.tags.some(tag => tag.trim().toLowerCase() === skinType) ||
          p.skinType && p.skinType.trim().toLowerCase() === skinType
        );
      }

      // 4. Sort Products
      if (options.sortBy) {
        switch (options.sortBy) {
          case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
          case 'alphabetic':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
          default:
            break;
        }
      }

      // Pagination
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginated = filtered.slice(start, end);

      console.log(`✅ Loaded ${paginated.length} products (Page ${page}: filtering ${filtered.length} matches from ${normalizedAll.length} total)`);
      return paginated;

    } catch (error) {
      console.error('❌ API Error (getProducts):', error.message);
      return [];
    }
  },

  // Get Single Product
  async getProduct(id) {
    try {
      console.log(`🔌 Fetching product ${id}`);
      const product = await getProductById(id);
      return product ? normalizeProduct(product) : null;
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
      const allProducts = await getAllProducts({ status: 'active', limitCount: 1000 });

      const lowerQuery = query.toLowerCase();
      return allProducts
        .filter(p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description?.toLowerCase().includes(lowerQuery)
        )
        .map(normalizeProduct);
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
        status: 'pending',
      });

      triggerAdminAlert({
        type: 'order',
        title: 'طلب جديد! 🛍️',
        body: `قام ${orderData.billing?.first_name || 'زبون'} بطلب جديد بقيمة ${orderData.total || ''} د.م`,
        data: { orderId: docRef.id }
      });

      return { id: docRef.id, ...orderData };
    } catch (error) {
      console.error('❌ API Error (createOrder):', error.message);
      throw error;
    }
  }
};

export default api;
