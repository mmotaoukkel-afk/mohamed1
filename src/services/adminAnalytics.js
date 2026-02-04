/**
 * Admin Analytics Service
 * Fetches real-time KPIs and statistics for the Admin Dashboard
 */

import { collection, query, getDocs, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';

import { db } from './firebaseConfig';
import currencyService from './currencyService';

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

        let totalRevenue = 0;
        let pendingOrders = 0;

        ordersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Assuming amount is a number or string like "100 MAD"
            const amount = parseFloat(data.total || data.amount || 0);
            totalRevenue += amount;

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
            customers: { value: userCount.toString(), change: 'إجمالي المشتركين', isPositive: true },
            orders: { value: orderCount.toString(), change: pendingOrders > 0 ? `${pendingOrders} قيد الانتظار` : 'جميعها مكتملة', isPositive: true },
            revenue: { value: currencyService.formatAdminPrice(totalRevenue), change: 'إجمالي المبيعات', isPositive: true },
            products: { value: productCount.toString(), change: 'في الكتالوج', isPositive: true }
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
                customer: data.customerName || data.shippingAddress?.name || data.email || 'زبون',
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
            const amount = parseFloat(data.total || data.amount || 0);

            const dayEntry = weeklyData.find(d => d.date === dateStr);
            if (dayEntry) {
                dayEntry.value += amount;
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
            // detailed items usually in data.line_items or data.items array
            const items = data.line_items || data.items;
            if (items && Array.isArray(items)) {
                items.forEach(item => {
                    const cat = item.category || 'أخرى'; // Default to 'Other' if missing
                    const price = parseFloat(item.price || 0);
                    const qty = parseInt(item.quantity || 1);
                    const total = price * qty;

                    if (categoryMap[cat]) {
                        categoryMap[cat] += total;
                    } else {
                        categoryMap[cat] = total;
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
 * Get Top Selling Products
 * Aggregates product sales and revenue from recent orders
 */
export async function getTopSellingProducts(limitCount = 5) {
    try {
        const q = query(
            collection(db, COLLECTIONS.ORDERS),
            orderBy('createdAt', 'desc'),
            limit(100) // Analyze last 100 orders
        );
        const snapshot = await getDocs(q);

        const productMap = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const items = data.line_items || data.items;
            if (items && Array.isArray(items)) {
                items.forEach(item => {
                    const id = item.product_id || item.id || item.productId;
                    const name = item.name || 'منتج';
                    const price = parseFloat(item.price || 0);
                    const qty = parseInt(item.quantity || 1);
                    const image = item.image || item.imageURL;

                    if (productMap[name]) {
                        productMap[name].sales += qty;
                        productMap[name].revenue += (price * qty);
                    } else {
                        productMap[name] = {
                            id,
                            name,
                            sales: qty,
                            revenue: price * qty,
                            image: image || null
                        };
                    }
                });
            }
        });

        const sortedProducts = Object.values(productMap)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, limitCount);

        return sortedProducts;

    } catch (error) {
        console.error('Error fetching top selling products:', error);
        return [];
    }
}
