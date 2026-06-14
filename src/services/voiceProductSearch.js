/**
 * Voice Product Search Service
 * Searches products based on extracted keywords from voice input
 */

import api from './api';
import { extractKeywords, buildSearchQuery } from '../utils/keywordExtractor';

/**
 * Search products using voice-extracted keywords
 * @param {string} transcript - Raw speech-to-text transcription
 * @returns {Promise<Array>} - Filtered and ranked products
 */
export async function searchByVoice(transcript) {
    try {
        // 1. Extract keywords from transcription
        const keywords = extractKeywords(transcript);

        // 2. Build search query
        const searchQuery = buildSearchQuery(keywords);

        // 3. Search products using API
        // let results = await api.searchProducts(searchQuery);
        
        // --- DUMMY PRODUCTS FOR BOT TRAINING ---
        const DUMMY_PRODUCTS = [
            { id: 101, name: 'سيروم فيتامين سي للتفتيح', price: '150', sale_price: '120', description: 'سيروم مرطب يعطي نضارة وإشراقة للبشرة، مناسب للتفتيح', tags: [{name: 'تفتيح'}, {name: 'إشراقة'}], images: [{src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'}] },
            { id: 102, name: 'غسول حمض الساليسيليك للبشرة الدهنية', price: '90', sale_price: '85', description: 'غسول ينظف المسام بعمق ويقلل الإفرازات الدهنية وحب الشباب', tags: [{name: 'حب الشباب'}, {name: 'دهنية'}], images: [{src: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500'}] },
            { id: 103, name: 'كريم ليلي بالريتينول للتجاعيد', price: '250', sale_price: '200', description: 'يحتوي على الريتينول لشد البشرة ومحاربة التجاعيد والخطوط الدقيقة', tags: [{name: 'تجاعيد'}, {name: 'ريتينول'}], images: [{src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500'}] },
            { id: 104, name: 'مرطب مهدئ للبشرة الحساسة', price: '180', sale_price: '150', description: 'مرطب لطيف لتهدئة الاحمرار، مناسب للبشرة الجافة والحساسة', tags: [{name: 'حساسة'}, {name: 'جافة'}], images: [{src: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=500'}] },
            { id: 105, name: 'كريم الهالات السوداء', price: '120', sale_price: '100', description: 'كريم حول العين يقلل من الهالات السوداء والانتفاخات', tags: [{name: 'هالات'}, {name: 'عين'}], images: [{src: 'https://images.unsplash.com/photo-1571781526291-c477ebfd024b?w=500'}] }
        ];

        // Basic matching logic for dummy products
        let results = DUMMY_PRODUCTS.filter(p => {
            const query = (searchQuery || transcript).toLowerCase();
            if (!query) return true;
            return p.name.includes(query) || 
                   p.description.includes(query) || 
                   p.tags.some(t => query.includes(t.name)) ||
                   (keywords.concern && p.tags.some(t => t.name.includes(keywords.concern))) ||
                   (keywords.skinType && p.tags.some(t => t.name.includes(keywords.skinType)));
        });
        
        // If no strict matches but we extracted keywords, return some products randomly to keep conversation flowing
        if (results.length === 0 && (keywords.concern || keywords.skinType || keywords.productType)) {
             results = [DUMMY_PRODUCTS[Math.floor(Math.random() * DUMMY_PRODUCTS.length)]];
        }

        // 4. Filter results based on extracted criteria
        // WARNING: We relaxed the strict filtering because keywords are often in English (e.g. 'oily')
        // while product descriptions are in Arabic. Strict filtering was removing valid results.
        // Instead, we now use these keywords primarily for RANKING in step 5.

        let filteredResults = results;

        // Only strictly filter by Price as it is numerical/safe
        if (keywords.priceRange) {
            filteredResults = filteredResults.filter(product => {
                const price = parseFloat(product.price);
                return checkPriceRange(price, keywords.priceRange);
            });
        }

        // 5. Rank results by relevance (Boost items matching valid skin/concern)
        const rankedResults = rankProducts(filteredResults, keywords);

        return {
            products: rankedResults,
            keywords: keywords,
            searchQuery: searchQuery
        };

    } catch (error) {
        console.error('Voice search error:', error);
        throw error;
    }
}

/**
 * Filter products based on extracted keywords
 * @param {Array} products - Products from API
 * @param {object} keywords - Extracted keywords
 * @returns {Array} - Filtered products
 */
function filterProducts(products, keywords) {
    return products.filter(product => {
        // Filter by skin type
        if (keywords.skinType) {
            const skinTypeMatch = product.attributes?.some(attr =>
                attr.name?.toLowerCase().includes('skin') &&
                attr.options?.some(opt => opt.toLowerCase().includes(keywords.skinType))
            ) || product.description?.toLowerCase().includes(keywords.skinType);

            if (!skinTypeMatch) return false;
        }

        // Filter by concern/benefit
        if (keywords.concern) {
            const concernMatch = product.tags?.some(tag =>
                tag.name?.toLowerCase().includes(keywords.concern)
            ) || product.description?.toLowerCase().includes(keywords.concern) ||
                product.name?.toLowerCase().includes(keywords.concern);

            if (!concernMatch) return false;
        }

        // Filter by price range
        if (keywords.priceRange) {
            const price = parseFloat(product.price);
            const priceMatch = checkPriceRange(price, keywords.priceRange);

            if (!priceMatch) return false;
        }

        return true;
    });
}

/**
 * Check if price matches the range
 * @param {number} price - Product price
 * @param {string} range - Price range keyword
 * @returns {boolean} - Whether price matches range
 */
function checkPriceRange(price, range) {
    switch (range) {
        case 'low':
            return price < 10;
        case 'medium':
            return price >= 10 && price <= 25;
        case 'high':
            return price > 25;
        default:
            return true;
    }
}

/**
 * Rank products by relevance to keywords
 * @param {Array} products - Filtered products
 * @param {object} keywords - Extracted keywords
 * @returns {Array} - Ranked products
 */
function rankProducts(products, keywords) {
    return products.map(product => {
        let score = 0;

        // Boost score for exact product type match
        if (keywords.productType &&
            product.name?.toLowerCase().includes(keywords.productType)) {
            score += 10;
        }

        // Boost for concern match
        if (keywords.concern &&
            (product.name?.toLowerCase().includes(keywords.concern) ||
                product.tags?.some(tag => tag.name?.toLowerCase().includes(keywords.concern)))) {
            score += 5;
        }

        // Boost for skin type match
        if (keywords.skinType &&
            product.description?.toLowerCase().includes(keywords.skinType)) {
            score += 3;
        }

        // Boost for higher ratings
        if (product.average_rating) {
            score += parseFloat(product.average_rating);
        }

        // Boost for popular products
        if (product.total_sales) {
            score += Math.min(product.total_sales / 10, 5);
        }

        return { ...product, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export default {
    searchByVoice,
    filterProducts,
    rankProducts
};
