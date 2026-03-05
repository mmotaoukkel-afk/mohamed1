
/**
 * Product Utilities
 * Shared logic for data normalization, image extraction, and price formatting.
 * Handles both WooCommerce API and Firestore data formats.
 */

/**
 * Extracts a valid image URI from a product object.
 * Handles both WooCommerce object format and Firestore string arrays.
 */
export const getProductImage = (product) => {
    if (!product) return null;

    // 1. Direct image property (legacy or normalized)
    if (typeof product.image === 'string' && product.image) return product.image;

    // 2. WooCommerce style images array
    if (Array.isArray(product.images) && product.images.length > 0) {
        const firstImg = product.images[0];
        if (typeof firstImg === 'string') return firstImg;
        if (firstImg?.src) return firstImg.src;
    }

    // 3. Fallback to image property if it was an object
    if (product.image?.src) return product.image.src;

    return null;
};

/**
 * Strips HTML tags from a string (for WooCommerce descriptions)
 */
const stripHtml = (html) => {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')    // Remove HTML tags
        .replace(/&nbsp;/g, ' ')     // Replace &nbsp;
        .replace(/&amp;/g, '&')      // Replace &amp;
        .replace(/&lt;/g, '<')       // Replace &lt;
        .replace(/&gt;/g, '>')       // Replace &gt;
        .replace(/&quot;/g, '"')     // Replace &quot;
        .replace(/&#039;/g, "'")     // Replace &#039;
        .replace(/\s+/g, ' ')        // Normalize whitespace
        .trim();
};

/**
 * Normalizes product data to a consistent format used by UI components.
 * Works with both WooCommerce API data and Firestore data.
 */
export const normalizeProduct = (item) => {
    if (!item) return null;

    // Normalize images: Ensure it's an array of objects { src: string }
    const images = (Array.isArray(item.images) ? item.images : []).map(img => {
        if (typeof img === 'string') return { src: img };
        return img;
    });

    // Handle price extraction (WooCommerce returns prices as strings)
    const price = parseFloat(item.sale_price || item.price || 0);
    const regularPrice = parseFloat(item.regular_price || item.compareAtPrice || item.price || 0);
    const onSale = item.on_sale === true || (regularPrice > price && price > 0);

    // Extract stock status
    const stockStatus = item.stock_status || (item.stock > 0 ? 'instock' : 'outofstock');
    const inStock = stockStatus === 'instock' || item.in_stock === true;

    return {
        ...item,
        id: item.id || item.uid,
        name: item.name || '',
        price: price,
        sale_price: price,
        regular_price: regularPrice,
        regularPrice: regularPrice,
        on_sale: onSale,
        onSale: onSale,
        images: images,
        thumbnail: getProductImage(item),
        stock_status: stockStatus,
        in_stock: inStock,
        inStock: inStock,
        category: item.category || (item.categories?.[0]?.name) || 'Uncategorized',
        categories: item.categories || [],
        description: stripHtml(item.description || ''),
        short_description: stripHtml(item.short_description || item.description || ''),
        tags: item.tags || [],
    };
};

/**
 * Formats product data specifically for Cart/Favorites context
 */
export const formatForState = (item, quantity = 1) => {
    const normalized = normalizeProduct(item);
    return {
        id: normalized.id,
        name: normalized.name,
        price: normalized.price,
        image: normalized.thumbnail,
        quantity: quantity,
    };
};
