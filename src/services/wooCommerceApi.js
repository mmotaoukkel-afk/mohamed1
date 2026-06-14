import { MOCK_PRODUCTS, MOCK_CATEGORIES } from './mockData';

const wooCommerceApi = {
    async getProducts(page = 1, perPage = 20, category = null, options = {}) {
        console.log(`🛒 Mocking getProducts (Page: ${page})`);
        const safePerPage = Math.min(Math.max(1, perPage || 20), 100);
        let mock = MOCK_PRODUCTS.map(p => ({
            ...p,
            total_sales: p.total_sales || Math.floor(Math.random() * 200) + 10,
            tags: p.tags || [{ id: 1, name: 'normal' }],
        }));
        if (category) {
            mock = mock.filter(p => p.categories?.some(c => c.id?.toString() === category?.toString() || c.slug === category));
        }
        if (options.search) {
            const q = options.search.toLowerCase();
            mock = mock.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        }
        if (options.sortBy === 'price-asc') mock.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        if (options.sortBy === 'price-desc') mock.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        const start = (page - 1) * safePerPage;
        return mock.slice(start, start + safePerPage);
    },

    async getAllProducts(category = null) {
        console.log('🛒 Mocking getAllProducts...');
        if (category) return MOCK_PRODUCTS.filter(p => p.categories?.some(c => c.id?.toString() === category?.toString() || c.slug === category));
        return [...MOCK_PRODUCTS];
    },

    async getProduct(id) {
        console.log(`🛒 Mocking getProduct ${id}...`);
        return MOCK_PRODUCTS.find(p => p.id?.toString() === id?.toString()) || null;
    },

    async getCategories() {
        console.log('🛒 Mocking getCategories...');
        return MOCK_CATEGORIES.map(c => ({ ...c, count: MOCK_PRODUCTS.filter(p => p.categories?.some(pc => pc.id === c.id)).length }));
    },

    async searchProducts(query, page = 1, perPage = 20) {
        console.log(`🛒 Mocking searchProducts "${query}"...`);
        const safePerPage = Math.min(Math.max(1, perPage || 20), 100);
        const q = query.toLowerCase();
        const results = MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        const start = (page - 1) * safePerPage;
        return results.slice(start, start + safePerPage);
    },

    async updateProduct(id, data) {
        console.log(`🔼 Mocking updateProduct ${id}...`, data);
        return { id, ...data };
    },

    async createProduct(data) {
        console.log('🆕 Mocking createProduct...', data.name);
        return { id: Math.floor(Math.random() * 10000), ...data };
    },

    async deleteProduct(id) {
        console.log(`🗑️ Mocking deleteProduct ${id}...`);
        return { id, deleted: true };
    },

    async getTotalProductCount() {
        return MOCK_PRODUCTS.length;
    },

    async getProductReviews(productId) {
        return [];
    },
};

export default wooCommerceApi;
