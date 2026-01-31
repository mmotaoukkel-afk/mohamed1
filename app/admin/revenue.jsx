/**
 * Admin Revenue - Kataraa
 * Financial Analytics & Reporting
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { getRevenueStats, getTopProducts, getWeeklyRevenue } from '../../src/services/adminAnalytics';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

export default function AdminRevenue() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    const loadData = useCallback(async () => {
        try {
            const [revenueData, weekly, topProducts] = await Promise.all([
                getRevenueStats(),
                getWeeklyRevenue(),
                getTopProducts()
            ]);
            setStats(revenueData);
            setWeeklyData(weekly);
            setTopProducts(topProducts);
        } catch (error) {
            console.error('Failed to load revenue data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={{ color: theme.text }}>جاري التحميل...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F8FAFC' }]}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>الإيرادات والأرباح</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {/* Income Overview */}
                <View style={[styles.revenueCard, { backgroundColor: theme.primary }]}>
                    <Text style={styles.cardLabel}>إجمالي الإيرادات (KWD)</Text>
                    <Text style={styles.cardValue}>
                        {currencyService.formatKWD(stats?.totalRevenueKWD || 0)}
                    </Text>
                    <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>الطلبات</Text>
                            <Text style={styles.footerValue}>{stats?.orderCount || 0}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>متوسط الطلب</Text>
                            <Text style={styles.footerValue}>
                                {currencyService.formatKWD(stats?.aovKWD || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Net Profit Card */}
                <View style={[styles.revenueCard, { backgroundColor: '#10B981', marginTop: -8 }]}>
                    <Text style={styles.cardLabel}>صافي الربح التقديري (~40%)</Text>
                    <Text style={styles.cardValue}>
                        {stats?.profit?.value || currencyService.formatAdminPrice(0)}
                    </Text>
                    <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>هامش الربح</Text>
                            <Text style={styles.footerValue}>40%</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>حالة الهدف</Text>
                            <Text style={styles.footerValue}>ممتاز</Text>
                        </View>
                    </View>
                </View>

                {/* Progress Chart */}
                <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>النمو الأسبوعي</Text>
                    <View style={styles.barChart}>
                        {weeklyData.map((item, index) => (
                            <View key={index} style={styles.barItem}>
                                <View style={styles.barContainer}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: `${(item.value / (Math.max(...weeklyData.map(d => d.value)) || 1)) * 100}%`,
                                                backgroundColor: theme.primary
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.day}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Selling Products */}
                <View style={[styles.listCard, { backgroundColor: theme.backgroundCard, marginBottom: 16 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>المنتجات الأكثر مبيعاً</Text>
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
                                    <Text style={[styles.listDate, { color: theme.text }]} numberOfLines={1}>
                                        {product.name}
                                    </Text>
                                    <Text style={[styles.listSub, { color: theme.textSecondary }]}>
                                        {product.count} مبيعات
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.listAmount, { color: theme.primary, fontSize: 14 }]}>
                                {currencyService.formatAdminPrice(currencyService.convertToAdmin(product.revenue, 'MAD'))}
                            </Text>
                        </View>
                    ))}
                    {topProducts.length === 0 && (
                        <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>
                            جاري جمع بيانات المنتجات...
                        </Text>
                    )}
                </View>

                {/* Daily Breakdown List */}
                <View style={[styles.listCard, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>تفاصيل المبيعات اليومية</Text>
                    {Object.entries(stats?.dailyRevenue || {}).sort((a, b) => b[0].localeCompare(a[0])).map(([date, value]) => (
                        <View key={date} style={styles.listItem}>
                            <View>
                                <Text style={[styles.listDate, { color: theme.text }]}>{date}</Text>
                                <Text style={[styles.listSub, { color: theme.textSecondary }]}>مبيعات مكتملة</Text>
                            </View>
                            <Text style={[styles.listAmount, { color: theme.primary }]}>
                                {currencyService.formatKWD(value)}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    revenueCard: { margin: 16, borderRadius: 24, padding: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
    cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
    cardValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    cardFooter: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    footerItem: { flex: 1, alignItems: 'center' },
    footerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 },
    footerValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
    divider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.1)' },
    chartCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 24, padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
    barChart: { flexDirection: 'row', height: 150, alignItems: 'flex-end', justifyContent: 'space-between' },
    barItem: { flex: 1, alignItems: 'center' },
    barContainer: { width: 12, height: 100, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
    bar: { width: '100%', borderRadius: 6 },
    barLabel: { fontSize: 10, marginTop: 8 },
    listCard: { marginHorizontal: 16, borderRadius: 24, padding: 20 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    listDate: { fontSize: 14, fontWeight: '600' },
    listSub: { fontSize: 11, marginTop: 2 },
    listAmount: { fontSize: 16, fontWeight: 'bold' },
    rankBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    productThumb: { width: 40, height: 40, borderRadius: 8 },
});
