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
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getRevenueStats, getTopProducts, getWeeklyRevenue } from '../../src/services/adminAnalyticsService';
import { addExpense, getExpenses } from '../../src/services/adminFinanceService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

const TIMEFRAMES = [
    { key: 'today', labelKey: 'today' },
    { key: 'last_7_days', labelKey: 'week' },
    { key: 'this_month', labelKey: 'month' },
    { key: 'this_year', labelKey: 'year' },
];

export default function AdminRevenue() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [timeframe, setTimeframe] = useState('this_month');

    const [expenses, setExpenses] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: t('general') });
    const [addingExpense, setAddingExpense] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const now = new Date();
            let start = new Date();
            let end = new Date();

            switch (timeframe) {
                case 'today':
                    start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999); break;
                case 'last_7_days':
                    start.setDate(start.getDate() - 7); break;
                case 'this_month':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0); break;
                case 'this_year':
                    start = new Date(now.getFullYear(), 0, 1);
                    end = new Date(now.getFullYear(), 11, 31); break;
            }

            const [revenueData, weekly, topProductsData, expensesData] = await Promise.all([
                getRevenueStats(timeframe),
                getWeeklyRevenue(),
                getTopProducts(timeframe),
                getExpenses(start, end)
            ]);

            setStats(revenueData);
            setWeeklyData(weekly);
            setTopProducts(topProductsData);
            setExpenses(expensesData);
            setTotalExpenses(expensesData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0));
        } catch (error) {
            console.error('Failed to load revenue data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [timeframe]);

    useEffect(() => { loadData(); }, [loadData]);
    const onRefresh = () => { setRefreshing(true); loadData(); };

    const handleAddExpense = async () => {
        if (!newExpense.title || !newExpense.amount) return;
        setAddingExpense(true);
        try {
            await addExpense({ title: newExpense.title, amount: parseFloat(newExpense.amount), category: newExpense.category, date: new Date() });
            setModalVisible(false);
            setNewExpense({ title: '', amount: '', category: t('general') });
            onRefresh();
        } catch {
            alert(t('errorAddingExpense'));
        } finally {
            setAddingExpense(false);
        }
    };

    const revenue = stats?.totalRevenueKWD || 0;
    const cogsEstimate = revenue * 0.3;
    const netProfit = revenue - cogsEstimate - totalExpenses;
    const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
            {/* ═══ HEADER ═══ */}
            <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.glassBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('revenueAndExpenses')}</Text>
                        <TouchableOpacity style={styles.glassBtn} onPress={() => setModalVisible(true)}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* ═══ TIMEFRAME TABS ═══ */}
            <View style={[styles.tabsRow, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                {TIMEFRAMES.map((tf) => {
                    const active = timeframe === tf.key;
                    return (
                        <TouchableOpacity
                            key={tf.key}
                            onPress={() => setTimeframe(tf.key)}
                            style={[styles.tab, active && styles.tabActive]}
                        >
                            <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                {t(tf.labelKey)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
                contentContainerStyle={{ paddingBottom: 110, paddingTop: 16 }}
            >
                {/* ═══ STAT CARDS ROW ═══ */}
                <View style={styles.statRow}>
                    {/* Total Income */}
                    <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#fff', shadowColor: '#10B981' }]}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="cash" size={22} color="#10B981" />
                        </View>
                        <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t('totalIncome')}</Text>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{currencyService.formatKWD(revenue)}</Text>
                    </View>

                    {/* Orders */}
                    <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#fff', shadowColor: '#4F46E5' }]}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="cart-outline" size={22} color="#4F46E5" />
                        </View>
                        <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t('orderCount')}</Text>
                        <Text style={[styles.statValue, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{stats?.orderCount || 0}</Text>
                        <Text style={[styles.statSub, { color: isDark ? '#475569' : '#94A3B8' }]}>{t('orderCountSuffix')}</Text>
                    </View>

                    {/* Avg Order */}
                    <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#fff', shadowColor: '#F59E0B' }]}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="analytics-outline" size={22} color="#F59E0B" />
                        </View>
                        <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t('averageOrderValue')}</Text>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{currencyService.formatKWD(stats?.aovKWD || 0)}</Text>
                        <Text style={[styles.statSub, { color: isDark ? '#475569' : '#94A3B8' }]}>{t('perOrder')}</Text>
                    </View>
                </View>

                {/* ═══ NET PROFIT PREMIUM CARD ═══ */}
                <LinearGradient
                    colors={['#10B981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.profitCard}
                >
                    <View style={styles.profitDecor} />
                    <View style={styles.profitTopRow}>
                        <View>
                            <Text style={styles.profitLabel}>{t('netProfitActual')}</Text>
                            <Text style={styles.profitValue}>{currencyService.formatKWD(netProfit)}</Text>
                        </View>
                        <View style={styles.marginPill}>
                            <Ionicons name={netProfit >= 0 ? 'trending-up' : 'trending-down'} size={14} color="#fff" />
                            <Text style={styles.marginPillText}>{netProfit >= 0 ? '+' : ''}{profitMargin}%</Text>
                        </View>
                    </View>
                    <View style={styles.profitDivider} />
                    <View style={styles.profitFooter}>
                        <View style={styles.profitFooterItem}>
                            <Text style={styles.profitFooterLabel}>{t('cogsEstimate')}</Text>
                            <Text style={styles.profitFooterValue}>-{currencyService.formatKWD(cogsEstimate)}</Text>
                        </View>
                        <View style={styles.profitFooterDivider} />
                        <View style={styles.profitFooterItem}>
                            <Text style={styles.profitFooterLabel}>{t('expenses')}</Text>
                            <Text style={styles.profitFooterValue}>-{currencyService.formatKWD(totalExpenses)}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* ═══ WEEKLY CHART ═══ */}
                {weeklyData.length > 0 && (
                    <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                        <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{t('weeklyRevenue')}</Text>
                        <View style={styles.miniBarChart}>
                            {weeklyData.map((item, index) => {
                                const maxVal = Math.max(...weeklyData.map(d => d.value)) || 1;
                                const pct = (item.value / maxVal) * 100;
                                return (
                                    <View key={index} style={styles.miniBarItem}>
                                        <View style={[styles.miniBarBg, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                                            <LinearGradient colors={['#F59E0B', '#EF4444']} style={[styles.miniBarFill, { height: `${pct}%` }]} />
                                        </View>
                                        <Text style={[styles.miniBarLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>{item.day}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ═══ CATEGORY SALES ═══ */}
                {stats?.categorySales?.length > 0 && (
                    <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                        <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{t('salesByCategory')}</Text>
                        {stats.categorySales.map((cat, index) => {
                            const colors = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];
                            const c = colors[index % colors.length];
                            return (
                                <View key={index} style={{ marginBottom: 14 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ color: isDark ? '#CBD5E1' : '#334155', fontSize: 12, fontWeight: '600' }}>{t(cat.name.toLowerCase())}</Text>
                                        <Text style={{ color: c, fontSize: 12, fontWeight: '700' }}>{cat.percentage}%</Text>
                                    </View>
                                    <View style={{ height: 8, backgroundColor: isDark ? '#334155' : '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
                                        <View style={{ height: '100%', width: `${cat.percentage}%`, backgroundColor: c, borderRadius: 8 }} />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* ═══ EXPENSES LIST ═══ */}
                <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#0F172A', marginBottom: 0 }]}>{t('expensesHistory')}</Text>
                        <TouchableOpacity
                            style={[styles.addExpenseBtn, { backgroundColor: '#EF444420' }]}
                            onPress={() => setModalVisible(true)}
                        >
                            <Ionicons name="add-circle" size={14} color="#EF4444" />
                            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>+ {t('add')}</Text>
                        </TouchableOpacity>
                    </View>

                    {expenses.length > 0 ? expenses.map((exp, index) => (
                        <View key={index} style={[styles.expenseRow, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderLeftColor: '#EF4444' }]}>
                            <View style={[styles.expenseDot, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="card-outline" size={14} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 13, fontWeight: '700' }}>{exp.title}</Text>
                                <Text style={{ color: isDark ? '#475569' : '#94A3B8', fontSize: 11, marginTop: 2 }}>
                                    {exp.category} • {new Date(exp.date).toLocaleDateString('ar-MA')}
                                </Text>
                            </View>
                            <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '800' }}>-{currencyService.formatKWD(exp.amount)}</Text>
                        </View>
                    )) : (
                        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                            <Ionicons name="receipt-outline" size={36} color={isDark ? '#334155' : '#CBD5E1'} />
                            <Text style={{ color: isDark ? '#475569' : '#94A3B8', marginTop: 10, fontSize: 13 }}>{t('noExpensesRecorded')}</Text>
                        </View>
                    )}
                </View>

                {/* ═══ TOP PRODUCTS ═══ */}
                {topProducts.length > 0 && (
                    <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                        <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{t('topPerformingProducts')}</Text>
                        {topProducts.map((product, index) => {
                            const rankColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];
                            const rankColor = index < 3 ? rankColors[index] : '#64748B';
                            return (
                                <View key={product.id} style={[styles.productRow, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
                                    <View style={[styles.rankBadge, { backgroundColor: rankColor + '25' }]}>
                                        <Text style={{ color: rankColor, fontSize: 12, fontWeight: '800' }}>#{index + 1}</Text>
                                    </View>
                                    {product.image ? (
                                        <Image source={{ uri: product.image }} style={styles.productThumb} />
                                    ) : (
                                        <View style={[styles.productThumb, { backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 10 }]} />
                                    )}
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{product.name}</Text>
                                        <Text style={{ color: isDark ? '#475569' : '#94A3B8', fontSize: 11, marginTop: 2 }}>{product.count} {t('salesCountSuffix')}</Text>
                                    </View>
                                    <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '800' }}>
                                        {currencyService.formatAdminPrice(currencyService.convertToAdmin(product.revenue, 'MAD'))}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* ═══ ADD EXPENSE MODAL ═══ */}
            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                        <View style={styles.modalHandle} />

                        <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTitle}>{t('addNewExpense')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <View style={{ padding: 24 }}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t('expenseTitle')}</Text>
                            <TextInput
                                style={[styles.input, { borderColor: isDark ? '#334155' : '#E2E8F0', color: isDark ? '#F1F5F9' : '#0F172A', backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
                                placeholder={t('expenseTitlePlaceholder')}
                                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                                value={newExpense.title}
                                onChangeText={v => setNewExpense({ ...newExpense, title: v })}
                            />

                            <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B', marginTop: 16 }]}>{t('amountKWD')}</Text>
                            <TextInput
                                style={[styles.input, { borderColor: isDark ? '#334155' : '#E2E8F0', color: isDark ? '#F1F5F9' : '#0F172A', backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
                                placeholder="0.000"
                                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                                keyboardType="numeric"
                                value={newExpense.amount}
                                onChangeText={v => setNewExpense({ ...newExpense, amount: v })}
                            />

                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9', flex: 1 }]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: '700' }}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, { flex: 2 }]}
                                    onPress={handleAddExpense}
                                    disabled={addingExpense}
                                >
                                    <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.modalBtnGradient}>
                                        {addingExpense ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('save')}</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },

    // Header
    header: { paddingBottom: 24, overflow: 'hidden' },
    headerDecor1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -30 },
    headerDecor2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -20, left: 40 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
    glassBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },

    // Tabs
    tabsRow: {
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
    tabActive: { backgroundColor: '#F59E0B' + '18' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
    tabTextActive: { color: '#F59E0B', fontWeight: '800' },

    // Stat Cards Row
    statRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    statCard: {
        flex: 1, borderRadius: 18, padding: 14,
        shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
    },
    statIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '800' },
    statSub: { fontSize: 9, marginTop: 3 },

    // Profit Card
    profitCard: {
        marginHorizontal: 16, marginBottom: 16, borderRadius: 22, padding: 22,
        shadowColor: '#10B981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 10,
        overflow: 'hidden',
    },
    profitDecor: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)', top: -40, right: -30 },
    profitTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    profitLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginBottom: 6 },
    profitValue: { color: '#fff', fontSize: 34, fontWeight: '800' },
    marginPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    marginPillText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    profitDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 18 },
    profitFooter: { flexDirection: 'row' },
    profitFooterItem: { flex: 1, alignItems: 'center' },
    profitFooterLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 },
    profitFooterValue: { color: '#fff', fontSize: 15, fontWeight: '800' },
    profitFooterDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Card
    card: {
        marginHorizontal: 16, marginBottom: 16, borderRadius: 22, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    },
    cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 18 },

    // Mini bar chart
    miniBarChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
    miniBarItem: { flex: 1, alignItems: 'center' },
    miniBarBg: { width: 20, height: 80, borderRadius: 7, overflow: 'hidden', justifyContent: 'flex-end' },
    miniBarFill: { width: '100%', borderRadius: 7 },
    miniBarLabel: { fontSize: 9, marginTop: 5, fontWeight: '600' },

    // Expense row
    expenseRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 14, padding: 12, marginBottom: 8,
        borderLeftWidth: 3,
    },
    expenseDot: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    addExpenseBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },

    // Product row
    productRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, marginBottom: 8 },
    rankBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    productThumb: { width: 40, height: 40, borderRadius: 10 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 4, alignSelf: 'center', marginTop: 12, marginBottom: 0 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    modalHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
    inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
    input: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 15 },
    modalBtn: { borderRadius: 14, overflow: 'hidden' },
    modalBtnGradient: { padding: 16, alignItems: 'center', justifyContent: 'center' },
});
