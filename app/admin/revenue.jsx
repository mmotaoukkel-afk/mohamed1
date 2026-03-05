import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ADMIN_COLORS,
    ADMIN_GRADIENTS,
    ADMIN_SHADOWS,
    BORDER_RADIUS
} from '../../src/constants/adminDesignTokens';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getRevenueStats, getTopProducts, getWeeklyRevenue } from '../../src/services/adminAnalyticsService';
import { addExpense, getExpenses } from '../../src/services/adminFinanceService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

export default function AdminRevenue() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(theme, isDark);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [timeframe, setTimeframe] = useState('this_month');

    // Expenses State
    const [expenses, setExpenses] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: t('general') });
    const [addingExpense, setAddingExpense] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            // Calculate Dates for Expenses based on Timeframe
            const now = new Date();
            let start = new Date();
            let end = new Date();

            switch (timeframe) {
                case 'today':
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'last_7_days':
                    start.setDate(start.getDate() - 7);
                    break;
                case 'this_month':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case 'this_year':
                    start = new Date(now.getFullYear(), 0, 1);
                    end = new Date(now.getFullYear(), 11, 31);
                    break;
            }

            const [revenueData, weekly, topProductsData, expensesData] = await Promise.all([
                getRevenueStats(timeframe),
                getWeeklyRevenue(), // Weekly chart always shows last 7 days usually, or could be updated too. Keeping as is for trend.
                getTopProducts(timeframe),
                getExpenses(start, end)
            ]);

            setStats(revenueData);
            setWeeklyData(weekly);
            setTopProducts(topProductsData);
            setExpenses(expensesData);

            const totalExp = expensesData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            setTotalExpenses(totalExp);

        } catch (error) {
            console.error('Failed to load revenue data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [timeframe]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleAddExpense = async () => {
        if (!newExpense.title || !newExpense.amount) return;
        setAddingExpense(true);
        try {
            await addExpense({
                title: newExpense.title,
                amount: parseFloat(newExpense.amount),
                category: newExpense.category,
                date: new Date()
            });
            setModalVisible(false);
            setNewExpense({ title: '', amount: '', category: t('general') });
            onRefresh(); // Reload data
        } catch (error) {
            alert(t('errorAddingExpense'));
        } finally {
            setAddingExpense(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Calculations
    const revenue = stats?.totalRevenueKWD || 0;
    const cogsEstimate = revenue * 0.3; // 30% Estimate until real product costs are tracked
    const netProfit = revenue - cogsEstimate - totalExpenses;
    const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F8FAFC' }]}>
            <LinearGradient
                colors={ADMIN_GRADIENTS.primary}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('revenueAndExpenses')}</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Timeframe Selector */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10, paddingHorizontal: 16 }}>
                {['today', 'last_7_days', 'this_month', 'this_year'].map((range) => {
                    const labels = { today: t('today'), last_7_days: t('week'), this_month: t('month'), this_year: t('year') };
                    const isActive = timeframe === range;
                    return (
                        <TouchableOpacity
                            key={range}
                            onPress={() => setTimeframe(range)}
                            style={{
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                backgroundColor: isActive ? ADMIN_COLORS.primary.main : (isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF'),
                                borderRadius: BORDER_RADIUS.xl,
                                marginHorizontal: 4,
                                borderWidth: 1,
                                borderColor: isActive ? ADMIN_COLORS.primary.main : 'transparent',
                                ...ADMIN_SHADOWS.sm,
                            }}
                        >
                            <Text style={{ color: isActive ? '#fff' : (isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600]), fontWeight: isActive ? 'bold' : 'normal' }}>
                                {labels[range]}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* Main Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Revenue */}
                    <View style={[styles.statCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={[styles.statLabel, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600] }]}>{t('totalIncome')}</Text>
                                <Text style={[styles.statValue, { color: ADMIN_COLORS.success.main, fontSize: 28 }]}>{currencyService.formatKWD(revenue)}</Text>
                            </View>
                            <View style={{ backgroundColor: ADMIN_COLORS.success.bg, padding: 10, borderRadius: 12, height: 48, width: 48, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="cash" size={24} color={ADMIN_COLORS.success.main} />
                            </View>
                        </View>
                    </View>

                    {/* Orders (New) */}
                    <View style={[styles.statCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                        <Text style={[styles.statLabel, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600] }]}>{t('orderCount')}</Text>
                        <Text style={[styles.statValue, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900] }]}>{stats?.orderCount || 0}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="cart-outline" size={14} color={ADMIN_COLORS.secondary.main} />
                            <Text style={{ color: isDark ? ADMIN_COLORS.neutral[500] : ADMIN_COLORS.neutral[400], fontSize: 10, marginLeft: 4 }}>{t('orderCountSuffix')}</Text>
                        </View>
                    </View>

                    {/* AOV (New) */}
                    <View style={[styles.statCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                        <Text style={[styles.statLabel, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600] }]}>{t('averageOrderValue')}</Text>
                        <Text style={[styles.statValue, { color: ADMIN_COLORS.primary.main }]}>{currencyService.formatKWD(stats?.aovKWD || 0)}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="analytics-outline" size={14} color={ADMIN_COLORS.primary.light} />
                            <Text style={{ color: isDark ? ADMIN_COLORS.neutral[500] : ADMIN_COLORS.neutral[400], fontSize: 10, marginLeft: 4 }}>{t('perOrder')}</Text>
                        </View>
                    </View>
                </View>

                {/* Net Profit Card */}
                <LinearGradient
                    colors={ADMIN_GRADIENTS.success}
                    style={[styles.revenueCard, { marginTop: 16 }]}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={styles.cardLabel}>{t('netProfitActual')}</Text>
                            <Text style={styles.cardValue}>{currencyService.formatKWD(netProfit)}</Text>
                        </View>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 8 }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{netProfit >= 0 ? '+' : ''}{profitMargin}%</Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>{t('cogsEstimate')}</Text>
                            <Text style={styles.footerValue}>-{currencyService.formatKWD(cogsEstimate)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>{t('expenses')}</Text>
                            <Text style={styles.footerValue}>-{currencyService.formatKWD(totalExpenses)}</Text>
                        </View>
                    </View>
                </LinearGradient>


                {/* Category Breakdown (New) */}
                {stats?.categorySales?.length > 0 && (
                    <View style={[styles.listCard, { backgroundColor: theme.backgroundCard, marginTop: 16 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('salesByCategory')}</Text>
                        {stats.categorySales.map((cat, index) => (
                            <View key={index} style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ color: theme.text, fontSize: 12 }}>{t(cat.name.toLowerCase())}</Text>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 12 }}>{cat.percentage}%</Text>
                                </View>
                                <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}>
                                    <View style={{ height: '100%', width: `${cat.percentage}%`, backgroundColor: theme.primary }} />
                                </View>
                                <Text style={{ textAlign: 'right', fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    {currencyService.formatKWD(cat.value)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Expenses List */}
                <View style={[styles.listCard, { backgroundColor: theme.backgroundCard, marginTop: 16 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>{t('expensesHistory')}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <Text style={{ color: theme.primary, fontSize: 13 }}>+ {t('add')}</Text>
                        </TouchableOpacity>
                    </View>

                    {expenses.length > 0 ? expenses.map((exp, index) => (
                        <View key={index} style={styles.listItem}>
                            <View>
                                <Text style={[styles.listDate, { color: theme.text }]}>{exp.title}</Text>
                                <Text style={[styles.listSub, { color: theme.textSecondary }]}>{exp.category} • {new Date(exp.date).toLocaleDateString('ar-MA')}</Text>
                            </View>
                            <Text style={[styles.listAmount, { color: '#EF4444' }]}>
                                -{currencyService.formatKWD(exp.amount)}
                            </Text>
                        </View>
                    )) : (
                        <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 20 }}>{t('noExpensesRecorded')}</Text>
                    )}
                </View>

                {/* Top Products */}
                <View style={[styles.listCard, { backgroundColor: theme.backgroundCard, marginBottom: 16, marginTop: 16 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>{t('topPerformingProducts')}</Text>
                    {topProducts.map((product, index) => (
                        <View key={product.id} style={styles.listItem}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={[styles.rankBadge, { backgroundColor: index < 3 ? theme.primary : theme.border }]}>
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{index + 1}</Text>
                                </View>
                                {product.image ? (
                                    <Image source={{ uri: product.image }} style={styles.productThumb} />
                                ) : (
                                    <View style={[styles.productThumb, { backgroundColor: theme.border }]} />
                                )}
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={[styles.listDate, { color: theme.text }]} numberOfLines={1}>{product.name}</Text>
                                    <Text style={[styles.listSub, { color: theme.textSecondary }]}>{product.count} {t('salesCountSuffix')}</Text>
                                </View>
                            </View>
                            <Text style={[styles.listAmount, { color: theme.primary, fontSize: 14 }]}>
                                {currencyService.formatAdminPrice(currencyService.convertToAdmin(product.revenue, 'MAD'))}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Expense Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundCard }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('addNewExpense')}</Text>

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('expenseTitle')}</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                            placeholder={t('expenseTitlePlaceholder')}
                            placeholderTextColor={theme.textMuted}
                            value={newExpense.title}
                            onChangeText={t => setNewExpense({ ...newExpense, title: t })}
                        />

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('amountKWD')}</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                            placeholder="0.00"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={newExpense.amount}
                            onChangeText={t => setNewExpense({ ...newExpense, amount: t })}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: theme.text }}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                                onPress={handleAddExpense}
                                disabled={addingExpense}
                            >
                                {addingExpense ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('save')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

    revenueCard: { margin: 16, borderRadius: BORDER_RADIUS.xl, padding: 24, ...ADMIN_SHADOWS.md },
    cardLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 8 },
    cardValue: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
    cardFooter: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    footerItem: { flex: 1, alignItems: 'center' },
    footerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 },
    footerValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
    divider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.1)' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', gap: 16, marginTop: 10 },
    statCard: { width: '48%', padding: 20, borderRadius: BORDER_RADIUS.xl, marginBottom: 16, ...ADMIN_SHADOWS.sm },
    statLabel: { fontSize: 13, marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: 'bold' },

    listCard: { marginHorizontal: 16, borderRadius: BORDER_RADIUS.xl, padding: 20, marginBottom: 16, ...ADMIN_SHADOWS.sm },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    listDate: { fontSize: 14, fontWeight: '600' },
    listSub: { fontSize: 11, marginTop: 2 },
    listAmount: { fontSize: 16, fontWeight: 'bold' },
    rankBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    productThumb: { width: 40, height: 40, borderRadius: 8 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    inputLabel: { fontSize: 12, marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
    modalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
    modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
});
