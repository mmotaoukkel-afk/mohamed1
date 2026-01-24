/**
 * Voice Analytics Service (Firestore Edition) ☁️
 * Tracks and analyzes voice search patterns globally
 */

import { collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';

const COLLECTIONS = {
    LOGS: 'search_logs'
};

/**
 * Log a voice search query to Firestore
 * @param {string} transcript - Original voice transcript
 * @param {Object} keywords - Extracted keywords
 * @param {number} resultsCount - Number of results found
 */
export async function logQuery(transcript, keywords, resultsCount) {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.LOGS), {
            transcript,
            keywords,
            resultsCount,
            timestamp: new Date().toISOString(),
            createdAt: new Date(), // for convenient sorting
            platform: 'app'
        });
        console.log('✅ Voice search logged to Cloud:', docRef.id);
        return { id: docRef.id };
    } catch (error) {
        console.error('❌ Error logging to Cloud:', error);
        // Fail silently so user experience isn't affected
    }
}

/**
 * Get aggregated insights from Firestore
 * NOTE: For MVP, we fetch last 100 logs and aggregate in-memory.
 * For production with millions of logs, use Aggregation Queries or Cloud Functions.
 * @returns {Object} - Insights
 */
export async function getInsights() {
    try {
        // Fetch last 100 logs
        const q = query(
            collection(db, COLLECTIONS.LOGS),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        const queries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Init counters
        const stats = {
            productTypes: {},
            skinTypes: {},
            concerns: {},
            totalQueries: queries.length // This is just "Recent" total. For absolute total we'd need a counter doc.
        };

        // Aggregate Data
        queries.forEach(log => {
            const k = log.keywords || {};
            if (k.productType) stats.productTypes[k.productType] = (stats.productTypes[k.productType] || 0) + 1;
            if (k.skinType) stats.skinTypes[k.skinType] = (stats.skinTypes[k.skinType] || 0) + 1;
            if (k.concern) stats.concerns[k.concern] = (stats.concerns[k.concern] || 0) + 1;
        });

        // Helper to format for charts
        const sortByCount = (obj) => {
            return Object.entries(obj)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count]) => ({ name: key, count }));
        };

        return {
            totalQueries: queries.length, // Displaying "Analyzed Sessions" count
            topProductTypes: sortByCount(stats.productTypes).slice(0, 5),
            topSkinTypes: sortByCount(stats.skinTypes).slice(0, 5),
            topConcerns: sortByCount(stats.concerns).slice(0, 5),
            recentQueries: queries.slice(0, 10),
            failedQueries: queries.filter(q => q.resultsCount === 0).slice(0, 10)
        };

    } catch (error) {
        console.error('Error fetching insights:', error);
        return {
            totalQueries: 0,
            topProductTypes: [],
            topSkinTypes: [],
            topConcerns: [],
            recentQueries: [],
            failedQueries: []
        };
    }
}

/**
 * Clear analytics log (Admin Only)
 * WARNING: This deletes data from Firestore!
 */
export async function clearAnalytics() {
    try {
        const q = query(collection(db, COLLECTIONS.LOGS), limit(50));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('🧹 Cleared recent logs from Cloud');
    } catch (error) {
        console.error('Error clearing analytics:', error);
    }
}

// Stub for compatibility if needed, but getInsights handles data fetching now
export async function getAnalyticsData() {
    return { queries: [] };
}

export default {
    logQuery,
    getInsights,
    clearAnalytics,
    getAnalyticsData
};
