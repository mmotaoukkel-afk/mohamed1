/**
 * Revenue Analytics Service - Kataraa
 * جميع دوال تحليل الإيرادات - بيانات حقيقية من Firestore
 * 🔐 Admin only
 */

import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
    getCountFromServer
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import currencyService from './currencyService';

// ==========================================
// 📅 Date Range Helpers
// ==========================================

export const REVENUE_PERIODS = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_YEAR: 'this_year',
};

export const PERIOD_LABELS = {
    today: 'اليوم',
    yesterday: 'أمس',
    last_7_days: '7 أيام',
    last_30_days: '30 يوم',
    this_month: 'هذا الشهر',
    last_month: 'الشهر الماضي',
    this_year: 'هذه السنة',
};

/**
 * Get date range for a period
 */
const getDateRange = (period) => {
    const now = new Date();
    const start = new Date();
    const previousStart = new Date();
    const previousEnd = new Date();

    switch (period) {
        case REVENUE_PERIODS.TODAY:
            start.setHours(0, 0, 0, 0);
            previousStart.setDate(now.getDate() - 1);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setHours(0, 0, 0, 0);
            break;

        case REVENUE_PERIODS.YESTERDAY:
            start.setDate(now.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            const endOfYesterday = new Date(start);
            endOfYesterday.setHours(23, 59, 59, 999);
            previousStart.setDate(now.getDate() - 2);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setDate(now.getDate() - 1);
            previousEnd.setHours(0, 0, 0, 0);
            break;

        case REVENUE_PERIODS.LAST_7_DAYS:
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            previousStart.setDate(now.getDate() - 13);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setDate(now.getDate() - 7);
            previousEnd.setHours(0, 0, 0, 0);
            break;

        case REVENUE_PERIODS.LAST_30_DAYS:
            start.setDate(now.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            previousStart.setDate(now.getDate() - 59);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setDate(now.getDate() - 30);
            previousEnd.setHours(0, 0, 0, 0);
            break;

        case REVENUE_PERIODS.THIS_MONTH:
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            previousStart.setMonth(now.getMonth() - 1, 1);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setDate(1);
            previousEnd.setHours(0, 0, 0, 0);
            break;

        case REVENUE_PERIODS.LAST_MONTH:
            start.setMonth(now.getMonth() - 1, 1);
            start.setHours(0, 0, 0, 0);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            previousStart.setMonth(now.getMonth() - 2, 1);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setMonth(now.getMonth() - 1, 1);
            previousEnd.setHours(0, 0, 0, 0);
            break;

        case REVENUE_PERIODS.THIS_YEAR:
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            previousStart.setFullYear(now.getFullYear() - 1, 0, 1);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setMonth(0, 1);
            previousEnd.setHours(0, 0, 0, 0);
            break;

        default:
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
    }

    return { start, end: now, previousStart, previousEnd };
};

// ==========================================
// 📊 Main Revenue Functions
// ==========================================

/**
 * Get Revenue KPIs (الإيرادات الرئيسية)
 * Returns: Total Revenue, Order Count, AOV, Comparison with previous period
 */
export const getRevenueKPIs = async (period = REVENUE_PERIODS.LAST_7_DAYS) => {
    try {
        const { start, previousStart, previousEnd } = getDateRange(period);

        // Fetch current period orders
        const currentQuery = query(
            collection(db, 'orders'),
            where('createdAt', '>=', start),
            orderBy('createdAt', 'desc')
        );

        // Fetch previous period orders
        const previousQuery = query(
            collection(db, 'orders'),
            where('createdAt', '>=', previousStart),
            where('createdAt', '<', previousEnd),
            orderBy('createdAt', 'desc')
        );

        const [currentSnapshot, previousSnapshot] = await Promise.all([
            getDocs(currentQuery),
            getDocs(previousQuery)
        ]);

        // Calculate current period
        let currentRevenue = 0;
        let currentOrders = currentSnapshot.size;
        currentSnapshot.docs.forEach(doc => {
            const data = doc.data();
            currentRevenue += parseFloat(data.total || data.amount || 0);
        });

        // Calculate previous period
        let previousRevenue = 0;
        let previousOrders = previousSnapshot.size;
        previousSnapshot.docs.forEach(doc => {
            const data = doc.data();
            previousRevenue += parseFloat(data.total || data.amount || 0);
        });

        // Calculate metrics
        const avgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;
        const prevAvgOrderValue = previousOrders > 0 ? previousRevenue / previousOrders : 0;

        // Calculate changes
        const revenueChange = previousRevenue > 0
            ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
            : (currentRevenue > 0 ? 100 : 0);

        const ordersChange = previousOrders > 0
            ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100)
            : (currentOrders > 0 ? 100 : 0);

        const aovChange = prevAvgOrderValue > 0
            ? Math.round(((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100)
            : (avgOrderValue > 0 ? 100 : 0);

        return {
            totalRevenue: currentRevenue,
            totalRevenueFormatted: currencyService.formatAdminPrice(currentRevenue),
            revenueChange,
            revenueChangePositive: revenueChange >= 0,

            totalOrders: currentOrders,
            ordersChange,
            ordersChangePositive: ordersChange >= 0,

            avgOrderValue: Math.round(avgOrderValue),
            avgOrderValueFormatted: currencyService.formatAdminPrice(avgOrderValue),
            aovChange,
            aovChangePositive: aovChange >= 0,

            previousRevenue,
            previousOrders,
        };
    } catch (error) {
        console.error('Error fetching revenue KPIs:', error);
        return null;
    }
};

/**
 * Get Revenue Over Time (الإيرادات عبر الزمن)
 * Returns daily/weekly data for charts
 */
export const getRevenueOverTime = async (period = REVENUE_PERIODS.LAST_7_DAYS) => {
    try {
        const { start } = getDateRange(period);

        const ordersQuery = query(
            collection(db, 'orders'),
            where('createdAt', '>=', start),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(ordersQuery);

        // Determine number of days based on period
        const days = period === REVENUE_PERIODS.TODAY ? 1
            : period === REVENUE_PERIODS.YESTERDAY ? 1
                : period === REVENUE_PERIODS.LAST_7_DAYS ? 7
                    : period === REVENUE_PERIODS.LAST_30_DAYS ? 30
                        : period === REVENUE_PERIODS.THIS_MONTH ? new Date().getDate()
                            : period === REVENUE_PERIODS.THIS_YEAR ? Math.floor((new Date() - start) / (1000 * 60 * 60 * 24)) + 1
                                : 7;

        // Initialize daily map
        const dailyMap = {};
        const dayNames = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const dateStr = d.toISOString().split('T')[0];
            dailyMap[dateStr] = {
                date: dateStr,
                dayName: dayNames[d.getDay()],
                dayOfMonth: d.getDate(),
                revenue: 0,
                orders: 0,
            };
        }

        // Populate with real data
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const dateStr = createdAt.toISOString().split('T')[0];

            if (dailyMap[dateStr]) {
                dailyMap[dateStr].revenue += parseFloat(data.total || data.amount || 0);
                dailyMap[dateStr].orders += 1;
            }
        });

        return Object.values(dailyMap);
    } catch (error) {
        console.error('Error fetching revenue over time:', error);
        return [];
    }
};

/**
 * Get Revenue By Category (الإيرادات حسب الفئة)
 */
export const getRevenueByCategory = async (period = REVENUE_PERIODS.LAST_7_DAYS) => {
    try {
        const { start } = getDateRange(period);

        const ordersQuery = query(
            collection(db, 'orders'),
            where('createdAt', '>=', start),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(ordersQuery);

        const categoryMap = {};
        let totalRevenue = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach(item => {
                    const category = item.category || 'أخرى';
                    const itemRevenue = parseFloat(item.price || 0) * parseInt(item.quantity || 1);

                    if (!categoryMap[category]) {
                        categoryMap[category] = { name: category, revenue: 0, count: 0 };
                    }
                    categoryMap[category].revenue += itemRevenue;
                    categoryMap[category].count += parseInt(item.quantity || 1);
                    totalRevenue += itemRevenue;
                });
            }
        });

        const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#6366F1', '#EF4444'];

        return Object.values(categoryMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 7)
            .map((cat, index) => ({
                ...cat,
                revenueFormatted: currencyService.formatAdminPrice(cat.revenue),
                percentage: totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 100) : 0,
                color: colors[index % colors.length],
            }));
    } catch (error) {
        console.error('Error fetching revenue by category:', error);
        return [];
    }
};

/**
 * Get Top Products by Revenue (أفضل المنتجات)
 */
export const getTopProductsByRevenue = async (period = REVENUE_PERIODS.LAST_7_DAYS, topN = 10) => {
    try {
        const { start } = getDateRange(period);

        const ordersQuery = query(
            collection(db, 'orders'),
            where('createdAt', '>=', start),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(ordersQuery);

        const productMap = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach(item => {
                    const id = item.id || item.productId || item.name;
                    const itemRevenue = parseFloat(item.price || 0) * parseInt(item.quantity || 1);

                    if (!productMap[id]) {
                        productMap[id] = {
                            id,
                            name: item.name || 'منتج',
                            image: item.image || null,
                            revenue: 0,
                            unitsSold: 0,
                            price: parseFloat(item.price || 0),
                        };
                    }
                    productMap[id].revenue += itemRevenue;
                    productMap[id].unitsSold += parseInt(item.quantity || 1);
                });
            }
        });

        return Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, topN)
            .map((product, index) => ({
                ...product,
                rank: index + 1,
                revenueFormatted: currencyService.formatAdminPrice(product.revenue),
            }));
    } catch (error) {
        console.error('Error fetching top products:', error);
        return [];
    }
};

/**
 * Get Revenue Summary for a quick overview
 */
export const getRevenueSummary = async (period = REVENUE_PERIODS.LAST_7_DAYS) => {
    try {
        const [kpis, revenueOverTime, byCategory, topProducts] = await Promise.all([
            getRevenueKPIs(period),
            getRevenueOverTime(period),
            getRevenueByCategory(period),
            getTopProductsByRevenue(period, 5),
        ]);

        return {
            kpis,
            revenueOverTime,
            byCategory,
            topProducts,
            period,
            periodLabel: PERIOD_LABELS[period],
        };
    } catch (error) {
        console.error('Error fetching revenue summary:', error);
        return null;
    }
};

/**
 * Format number with K/M suffix for display
 */
export const formatNumber = (value) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
};

/**
 * Get change indicator info
 */
export const getChangeIndicator = (change) => ({
    text: `${change >= 0 ? '+' : ''}${change}%`,
    color: change >= 0 ? '#10B981' : '#EF4444',
    icon: change >= 0 ? 'trending-up' : 'trending-down',
    isPositive: change >= 0,
});
