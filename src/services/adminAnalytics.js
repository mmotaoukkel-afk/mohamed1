/**
 * Admin Analytics Service
 * Fetches real-time KPIs and statistics for the Admin Dashboard
 */

import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

import currencyService from './currencyService';
import { db } from './firebaseConfig';

const COLLECTIONS = {
    USERS: 'users',
    ORDERS: 'orders',
    PRODUCTS: 'products'
};

/**
 * Get Dashboard KPI Data
 * Fetches: Total Users, Total Orders, Total Revenue, Total Products
 */
export async function getDashboardStats() {
    try {
        // 1. Users Count
        const userColl = collection(db, COLLECTIONS.USERS);
        const userSnapshot = await getCountFromServer(userColl);
        const userCount = userSnapshot.data().count;

        // 2. Orders & Revenue
        // Note: For large datasets, keep a running total in a metadata doc.
        // For MVP, we fetch all orders (be careful with reads if > 1000 orders)
        // Optimization: Fetch only orders from this month/year if needed.
        const ordersColl = collection(db, COLLECTIONS.ORDERS);
        const ordersSnapshot = await getDocs(ordersColl); // Getting all for revenue calc

        let totalRevenueKWD = 0;
        let pendingOrders = 0;

        ordersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const orderTotal = parseFloat(data.total || data.amount || 0);
            const orderCurrency = data.currency || 'KWD';

            // Convert to KWD for unified dashboard
            const amountKWD = currencyService.convertToAdmin(orderTotal, orderCurrency);
            totalRevenueKWD += amountKWD;

            if (data.status === 'pending') pendingOrders++;
        });

        const orderCount = ordersSnapshot.size;

        // 3. Products Count
        // For products we might check our Mock Data size if we haven't migrated products to Firestore yet.
        // But let's assume we check Firestore 'products' logs or just use a placeholder if empty.
        const productColl = collection(db, COLLECTIONS.PRODUCTS);
        const productSnapshot = await getCountFromServer(productColl);
        const productCount = productSnapshot.data().count;

        return {
            customers: { value: userCount.toString(), change: '+New', isPositive: true },
            orders: { value: orderCount.toString(), change: pendingOrders > 0 ? `${pendingOrders} Pending` : 'All Clear', isPositive: true },
            revenue: { value: currencyService.formatKWD(totalRevenueKWD), change: 'Total', isPositive: true },
            products: { value: productCount > 0 ? productCount.toString() : '0', change: '', isPositive: true },
            profit: { value: currencyService.formatKWD(totalRevenueKWD * 0.4), change: 'Est. Margin', isPositive: true } // Estimated 40% margin
        };

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
    }
}

/**
 * Get Recent Orders
 * Fetches last 5 orders
 */
export async function getRecentOrders() {
    try {
        const q = query(
            collection(db, COLLECTIONS.ORDERS),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Handle Firestore timestamp
            let timeStr = '';
            if (data.createdAt?.toDate) {
                timeStr = data.createdAt.toDate().toLocaleDateString('ar-MA');
            } else if (data.createdAt) {
                timeStr = new Date(data.createdAt).toLocaleDateString('ar-MA');
            }

            return {
                id: doc.id,
                customer: data.customerName || data.shippingAddress?.name || data.fullName || data.name || data.email || 'زبون مجهول',
                amount: currencyService.formatAdminPrice(data.total || data.amount || 0),
                status: data.status || 'pending',
                time: timeStr
            };
        });
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        return [];
    }
}
/**
 * Get Weekly Revenue for Chart
 * Fetches revenue for the last 7 days
 */
export async function getWeeklyRevenue() {
    try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6); // Last 7 days including today
        start.setHours(0, 0, 0, 0);

        // Fetch orders from the last 7 days
        // Note: Ideally use a 'createdAt' filter, but for MVP we filter client-side if dataset is small
        // or use a composite index: collection('orders'), where('createdAt', '>=', start)
        const q = query(
            collection(db, COLLECTIONS.ORDERS),
            where('createdAt', '>=', start),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);

        // Initialize last 7 days with 0
        const days = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
        const weeklyData = [];

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            weeklyData.push({
                date: d.toISOString().split('T')[0],
                day: days[d.getDay()], // Arabic Day Name
                value: 0
            });
        }

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const dateStr = createdAt.toISOString().split('T')[0];

            const orderTotal = parseFloat(data.total || data.amount || 0);
            const orderCurrency = data.currency || 'KWD';
            const amountKWD = currencyService.convertToAdmin(orderTotal, orderCurrency);

            const dayEntry = weeklyData.find(d => d.date === dateStr);
            if (dayEntry) {
                dayEntry.value += amountKWD;
            }
        });

        return weeklyData;

    } catch (error) {
        console.error('Error fetching weekly revenue:', error);
        // Return placeholder on error to prevent crash
        return [
            { day: 'سبت', value: 0 }, { day: 'أحد', value: 0 }, { day: 'إثن', value: 0 },
            { day: 'ثلا', value: 0 }, { day: 'أرب', value: 0 }, { day: 'خمي', value: 0 }, { day: 'جمع', value: 0 }
        ];
    }
}
/**
 * Get Sales by Category
 * Aggregates order items by category
 */
export async function getCategorySales() {
    try {
        // Fetch recent orders (e.g., last 100 or all active)
        const q = query(
            collection(db, COLLECTIONS.ORDERS),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
        const snapshot = await getDocs(q);

        const categoryMap = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // detailed items usually in data.items array
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach(item => {
                    const cat = item.category || 'أخرى';
                    const price = parseFloat(item.price || 0);
                    const qty = parseInt(item.quantity || 1);
                    const orderCurrency = data.currency || 'KWD';
                    const itemTotalKWD = currencyService.convertToAdmin(price * qty, orderCurrency);

                    if (categoryMap[cat]) {
                        categoryMap[cat] += itemTotalKWD;
                    } else {
                        categoryMap[cat] = itemTotalKWD;
                    }
                });
            }
        });

        // Convert to array and sort
        const salesData = Object.keys(categoryMap).map(key => ({
            name: key,
            value: categoryMap[key]
        }));

        // Sort by value (descending)
        salesData.sort((a, b) => b.value - a.value);

        // Take top 5 and group others
        const top5 = salesData.slice(0, 5);
        const others = salesData.slice(5).reduce((acc, curr) => acc + curr.value, 0);

        if (others > 0) {
            top5.push({ name: 'أخرى', value: others });
        }

        // Assign Colors
        const colors = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#3B82F6'];
        return top5.map((item, index) => ({
            ...item,
            color: colors[index % colors.length]
        }));

    } catch (error) {
        console.error('Error fetching category sales:', error);
        return [];
    }
}

/**
 * Get Detailed Revenue Stats for Revenue Page
 */
export async function getRevenueStats(timeframe = 'this_month') {
    try {
        const ordersColl = collection(db, COLLECTIONS.ORDERS);
        const snapshot = await getDocs(ordersColl);

        let totalRevenueKWD = 0;
        let orderCount = 0;
        const dailyRevenue = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const orderTotal = parseFloat(data.total || data.amount || 0);
            const orderCurrency = data.currency || 'KWD';
            const amountKWD = currencyService.convertToAdmin(orderTotal, orderCurrency);

            totalRevenueKWD += amountKWD;
            orderCount++;

            // Group by date
            const date = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date(data.createdAt).toISOString().split('T')[0];
            dailyRevenue[date] = (dailyRevenue[date] || 0) + amountKWD;
        });

        const aovKWD = orderCount > 0 ? totalRevenueKWD / orderCount : 0;

        return {
            totalRevenueKWD,
            orderCount,
            aovKWD,
            dailyRevenue
        };
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        return null;
    }
}
/**
 * Get Top Selling Products (for Revenue Page)
 */
export async function getTopProducts() {
    try {
        const q = query(
            collection(db, COLLECTIONS.ORDERS),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
        const snapshot = await getDocs(q);
        const productMap = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach(item => {
                    // Normalize ID
                    const id = item.productId || item.id || item.name;
                    if (!productMap[id]) {
                        productMap[id] = {
                            id,
                            name: item.name || 'منتج',
                            price: item.price || 0,
                            count: 0,
                            revenue: 0,
                            image: item.image || item.thumbnail || null
                        };
                    }
                    productMap[id].count += (item.quantity || 1);
                    productMap[id].revenue += (item.price || 0) * (item.quantity || 1);
                });
            }
        });

        return Object.values(productMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    } catch (error) {
        console.error('Error fetching top products:', error);
        return [];
    }
}
