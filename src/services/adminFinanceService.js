import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const CLN = {
    EXPENSES: 'expenses',
    CAMPAIGNS: 'campaigns'
};

/**
 * Add a new expense
 * @param {Object} expenseData { title, amount, category, date, notes }
 */
export const addExpense = async (expenseData) => {
    try {
        await addDoc(collection(db, CLN.EXPENSES), {
            ...expenseData,
            amount: parseFloat(expenseData.amount),
            createdAt: serverTimestamp(),
            date: expenseData.date ? new Date(expenseData.date) : new Date()
        });
        return true;
    } catch (error) {
        console.error('Error adding expense:', error);
        throw error;
    }
};

/**
 * Get expenses filtered by date range
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
export const getExpenses = async (startDate, endDate) => {
    try {
        const q = query(
            collection(db, CLN.EXPENSES),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
        }));
    } catch (error) {
        console.error('Error getting expenses:', error);
        return [];
    }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (id) => {
    try {
        await deleteDoc(doc(db, CLN.EXPENSES, id));
        return true;
    } catch (error) {
        console.error('Error deleting expense:', error);
        throw error;
    }
};

/**
 * Calculate Net Profit Stats
 * Revenue - (COGS + Expenses)
 */
export const getNetProfitStats = async (revenueData) => {
    try {
        // 1. Get Expenses for the current month (or same period as revenue)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const expenses = await getExpenses(startOfMonth, endOfMonth);
        const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        // 2. Calculate COGS (Cost of Goods Sold)
        // Ideally, this comes from product purchase price * quantity sold.
        // For MVP, if purchase price isn't tracked, we might estimate or sum it if available in orders.
        // Let's assume 'revenueData' has 'totalRevenueKWD'.
        // We need to fetch orders to calculate COGS accurately if 'purchasePrice' exists in items.

        // Placeholder COGS logic: Average COGS in cosmetics/skincare industry is around 30%.
        // TODO: Replace this 30% estimate with real tracked product costs from inventory when implemented.
        const estimatedCOGS = revenueData.totalRevenueKWD * 0.3;

        const netProfit = revenueData.totalRevenueKWD - estimatedCOGS - totalExpenses;
        const margin = revenueData.totalRevenueKWD > 0
            ? ((netProfit / revenueData.totalRevenueKWD) * 100).toFixed(1)
            : 0;

        return {
            grossRevenue: revenueData.totalRevenueKWD,
            cogs: estimatedCOGS,
            expenses: totalExpenses,
            netProfit: netProfit,
            margin: margin,
            expensesBreakdown: expenses
        };
    } catch (error) {
        console.error('Error calculating net profit:', error);
        return null;
    }
};
