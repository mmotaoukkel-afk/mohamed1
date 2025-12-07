const WOO_CONFIG = {
  baseURL: 'https://kataraa.com/wp-json/wc/v3',
  consumerKey: 'ck_9c64aa5537ea5b2c439fdd8e6928ddc30b4d88f2',
  consumerSecret: 'cs_709a363c9a045e61f717543c76221f00004bc9bb',
};

const api = {
  getProducts: async (page = 1, perPage = 100) => {
    const url = `${WOO_CONFIG.baseURL}/products?page=${page}&per_page=${perPage}&consumer_key=${WOO_CONFIG.consumerKey}&consumer_secret=${WOO_CONFIG.consumerSecret}`;
    const res = await fetch(url);
    return res.json();
  },

  getProduct: async (id) => {
    const url = `${WOO_CONFIG.baseURL}/products/${id}?consumer_key=${WOO_CONFIG.consumerKey}&consumer_secret=${WOO_CONFIG.consumerSecret}`;
    const res = await fetch(url);
    return res.json();
  },

  getCategories: async () => {
    const url = `${WOO_CONFIG.baseURL}/products/categories?per_page=100&consumer_key=${WOO_CONFIG.consumerKey}&consumer_secret=${WOO_CONFIG.consumerSecret}`;
    const res = await fetch(url);
    return res.json();
  },

  createOrder: async (orderData) => {
    const url = `${WOO_CONFIG.baseURL}/orders?consumer_key=${WOO_CONFIG.consumerKey}&consumer_secret=${WOO_CONFIG.consumerSecret}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return res.json();
  }
};

export default api;
