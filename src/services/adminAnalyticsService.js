/**
 * Admin Analytics Service - Kataraa
 * Service for analytics, KPIs, and reporting
 * 🔐 Admin only
 */

// Date range options
export const DATE_RANGES = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_YEAR: 'this_year',
    CUSTOM: 'custom',
};

export const DATE_RANGE_CONFIG = {
    today: { label: 'اليوم', days: 1 },
    yesterday: { label: 'أمس', days: 1 },
    last_7_days: { label: '7 أيام', days: 7 },
    last_30_days: { label: '30 يوم', days: 30 },
    this_month: { label: 'هذا الشهر', days: 30 },
    last_month: { label: 'الشهر الماضي', days: 30 },
    this_year: { label: 'هذه السنة', days: 365 },
    custom: { label: 'مخصص', days: 0 },
};

/**
 * Generate mock analytics data for a date range
 * @param {string} range
 * @returns {Object}
 */
export const getAnalyticsData = (range = DATE_RANGES.LAST_7_DAYS) => {
    const config = DATE_RANGE_CONFIG[range];
    const days = config?.days || 7;

    // Generate daily data
    const dailyData = generateDailyData(days);

    // Calculate totals
    const totals = calculateTotals(dailyData);

    // Get comparisons with previous period
    const comparisons = calculateComparisons(totals);

    return {
        range,
        days,
        daily: dailyData,
        totals,
        comparisons,
        topProducts: getTopProducts(),
        categorySales: getCategorySales(),
        conversionFunnel: getConversionFunnel(),
        hourlyDistribution: getHourlyDistribution(),
    };
};

/**
 * Generate daily data for charts
 * @param {number} days
 * @returns {Array}
 */
const generateDailyData = (days) => {
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Generate realistic-looking data with some randomness
        const baseOrders = 15 + Math.floor(Math.random() * 10);
        const baseRevenue = baseOrders * (180 + Math.floor(Math.random() * 80));
        const visitors = baseOrders * (15 + Math.floor(Math.random() * 10));

        data.push({
            date: date.toISOString().split('T')[0],
            dayName: getDayName(date),
            orders: baseOrders,
            revenue: baseRevenue,
            visitors: visitors,
            conversion: ((baseOrders / visitors) * 100).toFixed(1),
            avgOrderValue: Math.round(baseRevenue / baseOrders),
        });
    }

    return data;
};

/**
 * Get day name in Arabic
 * @param {Date} date
 * @returns {string}
 */
const getDayName = (date) => {
    const days = ['أحد', 'إثن', 'ثلا', 'أربع', 'خمي', 'جمع', 'سبت'];
    return days[date.getDay()];
};

/**
 * Calculate totals from daily data
 * @param {Array} dailyData
 * @returns {Object}
 */
const calculateTotals = (dailyData) => {
    return {
        orders: dailyData.reduce((sum, d) => sum + d.orders, 0),
        revenue: dailyData.reduce((sum, d) => sum + d.revenue, 0),
        visitors: dailyData.reduce((sum, d) => sum + d.visitors, 0),
        avgOrderValue: Math.round(
            dailyData.reduce((sum, d) => sum + d.revenue, 0) /
            dailyData.reduce((sum, d) => sum + d.orders, 0)
        ),
        avgConversion: (
            (dailyData.reduce((sum, d) => sum + d.orders, 0) /
                dailyData.reduce((sum, d) => sum + d.visitors, 0)) * 100
        ).toFixed(1),
    };
};

/**
 * Calculate comparisons with previous period
 * @param {Object} totals
 * @returns {Object}
 */
const calculateComparisons = (totals) => {
    // Simulate previous period (slightly lower)
    const factor = 0.85 + Math.random() * 0.3;

    return {
        ordersChange: Math.round((1 - factor) * 100 * (Math.random() > 0.3 ? 1 : -1)),
        revenueChange: Math.round((1 - factor) * 100 * (Math.random() > 0.3 ? 1 : -1)),
        visitorsChange: Math.round((1 - factor * 0.9) * 100 * (Math.random() > 0.4 ? 1 : -1)),
        conversionChange: ((1 - factor) * 2 * (Math.random() > 0.5 ? 1 : -1)).toFixed(1),
    };
};

/**
 * Get top selling products
 * @returns {Array}
 */
const getTopProducts = () => [
    { id: '1', name: 'سيروم فيتامين C', sales: 156, revenue: 39000, growth: 12 },
    { id: '2', name: 'كريم مرطب', sales: 132, revenue: 23760, growth: 8 },
    { id: '3', name: 'واقي شمس SPF50', sales: 98, revenue: 21560, growth: 15 },
    { id: '4', name: 'غسول الوجه', sales: 87, revenue: 10440, growth: -3 },
    { id: '5', name: 'ماسك الطين', sales: 76, revenue: 11400, growth: 5 },
];

/**
 * Get sales by category
 * @returns {Array}
 */
const getCategorySales = () => [
    { category: 'العناية بالبشرة', value: 45, color: '#8B5CF6' },
    { category: 'المكياج', value: 25, color: '#F59E0B' },
    { category: 'العناية بالشعر', value: 15, color: '#10B981' },
    { category: 'العطور', value: 10, color: '#3B82F6' },
    { category: 'أخرى', value: 5, color: '#6B7280' },
];

/**
 * Get conversion funnel data
 * @returns {Array}
 */
const getConversionFunnel = () => [
    { stage: 'الزوار', count: 2450, percent: 100 },
    { stage: 'شاهدوا المنتجات', count: 1820, percent: 74 },
    { stage: 'أضافوا للسلة', count: 580, percent: 24 },
    { stage: 'بدأوا الدفع', count: 320, percent: 13 },
    { stage: 'أكملوا الشراء', count: 156, percent: 6.4 },
];

/**
 * Get hourly order distribution
 * @returns {Array}
 */
const getHourlyDistribution = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
        // Peak hours: 10-12, 18-21
        let value = 5;
        if (i >= 10 && i <= 12) value = 15 + Math.random() * 10;
        else if (i >= 18 && i <= 21) value = 20 + Math.random() * 15;
        else if (i >= 8 && i <= 22) value = 8 + Math.random() * 5;
        else value = 2 + Math.random() * 3;

        hours.push({
            hour: i,
            label: `${i}:00`,
            orders: Math.round(value),
        });
    }
    return hours;
};

/**
 * Format currency
 * @param {number} value
 * @returns {string}
 */
export const formatCurrency = (value) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
};

/**
 * Format percentage change
 * @param {number} value
 * @returns {Object}
 */
export const formatChange = (value) => {
    const isPositive = value >= 0;
    return {
        text: `${isPositive ? '+' : ''}${value}%`,
        color: isPositive ? '#10B981' : '#EF4444',
        icon: isPositive ? 'trending-up' : 'trending-down',
    };
};

/**
 * Get KPI cards data
 * @param {Object} totals
 * @param {Object} comparisons
 * @returns {Array}
 */
export const getKPICards = (totals, comparisons) => [
    {
        id: 'revenue',
        title: 'الإيرادات',
        value: `${formatCurrency(totals.revenue)} MAD`,
        change: comparisons.revenueChange,
        icon: 'cash-outline',
        color: '#10B981',
    },
    {
        id: 'orders',
        title: 'الطلبات',
        value: totals.orders.toString(),
        change: comparisons.ordersChange,
        icon: 'receipt-outline',
        color: '#3B82F6',
    },
    {
        id: 'visitors',
        title: 'الزوار',
        value: formatCurrency(totals.visitors),
        change: comparisons.visitorsChange,
        icon: 'eye-outline',
        color: '#8B5CF6',
    },
    {
        id: 'conversion',
        title: 'التحويل',
        value: `${totals.avgConversion}%`,
        change: parseFloat(comparisons.conversionChange),
        icon: 'trending-up-outline',
        color: '#F59E0B',
    },
];
