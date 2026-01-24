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
        let results = await api.searchProducts(searchQuery);

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
