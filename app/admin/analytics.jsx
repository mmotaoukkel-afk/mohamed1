/**
 * Admin Analytics - Kataraa
 * Comprehensive Analytics & KPIs Dashboard
 * 🔐 Protected by RequireAdmin
 * Features: Sales, Revenue, Conversion, Charts, Date Range Selector
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import {
    DATE_RANGES,
    DATE_RANGE_CONFIG,
    getAnalyticsData,
    fetchRealAnalyticsData,
    formatCurrency,
    formatChange,
    getKPICards,
} from '../../src/services/adminAnalyticsService';
import currencyService from '../../src/services/currencyService';
import Animated, { FadeInDown, FadeInUp, FadeInRight, Layout, FadeIn } from 'react-native-reanimated';
import Surface from '../../src/components/ui/Surface';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

export default function AdminAnalytics() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const [selectedRange, setSelectedRange] = useState(DATE_RANGES.LAST_7_DAYS);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeChart, setActiveChart] = useState('revenue'); // revenue, orders, visitors
    const [analyticsData, setAnalyticsData] = useState(null);

    // Initial load and auto-refresh on range change
    useEffect(() => {
        loadData();
    }, [selectedRange]);

    const loadData = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            const data = await fetchRealAnalyticsData(selectedRange);
            setAnalyticsData(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            if (isRefreshing) setRefreshing(false);
            else setLoading(false);
        }
    };

    const kpiCards = useMemo(() => {
        if (!analyticsData) return [];
        return getKPICards(analyticsData.totals, analyticsData.comparisons);
    }, [analyticsData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData(true);
    }, [selectedRange]);

    // Get max value for chart scaling
    const getChartMax = (data, key) => {
        return Math.max(...data.map(d => d[key]));
    };

    // Render KPI Card
    const renderKPICard = (kpi, index) => {
        const change = formatChange(kpi.change);
        return (
            <Animated.View
                key={kpi.id}
                entering={FadeInDown.delay(index * 100).duration(600)}
                style={styles.kpiCardContainer}
            >
                <Surface variant="glass" padding="md" style={styles.kpiCardGlass}>
                    <View style={[styles.kpiIcon, { backgroundColor: kpi.color + '20' }]}>
                        <Ionicons name={kpi.icon} size={22} color={kpi.color} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.text }]}>{kpi.value}</Text>
                    <Text style={[styles.kpiTitle, { color: theme.textSecondary }]}>{kpi.title}</Text>
                    <View style={[styles.kpiChange, { backgroundColor: change.color + '15' }]}>
                        <Ionicons name={change.icon} size={12} color={change.color} />
                        <Text style={[styles.kpiChangeText, { color: change.color }]}>{change.text}</Text>
                    </View>
                </Surface>
            </Animated.View>
        );
    };

    // Render Line Chart (Revenue/Orders trend)
    const renderLineChart = () => {
        const data = analyticsData.daily;
        const key = activeChart;
        const maxValue = getChartMax(data, key);

        return (
            <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                <Surface variant="glass" padding="none" style={styles.chartCardGlass}>
                    <View style={{ padding: 16 }}>
                        <View style={styles.chartHeader}>
                            <Text style={[styles.chartTitle, { color: theme.text }]}>
                                {activeChart === 'revenue' ? 'الإيرادات' :
                                    activeChart === 'orders' ? 'الطلبات' : 'الزوار'}
                            </Text>
                            <View style={styles.chartTabs}>
                                {['revenue', 'orders', 'visitors'].map(tab => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[
                                            styles.chartTab,
                                            activeChart === tab && { backgroundColor: theme.primary }
                                        ]}
                                        onPress={() => setActiveChart(tab)}
                                    >
                                        <Text style={[
                                            styles.chartTabText,
                                            { color: activeChart === tab ? '#fff' : theme.textSecondary }
                                        ]}>
                                            {tab === 'revenue' ? 'الإيرادات' :
                                                tab === 'orders' ? 'الطلبات' : 'الزوار'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Line Chart */}
                        <View style={styles.lineChart}>
                            <View style={styles.lineChartContent}>
                                {data.map((item, index) => {
                                    const value = item[key];
                                    const height = (value / maxValue) * 100;

                                    return (
                                        <View key={index} style={styles.lineChartBar}>
                                            <View style={styles.lineChartColumn}>
                                                <LinearGradient
                                                    colors={[theme.primary, theme.primaryDark]}
                                                    style={[styles.lineChartFill, { height: `${height}%` }]}
                                                />
                                            </View>
                                            <Text style={[styles.lineChartLabel, { color: theme.textMuted }]}>
                                                {item.dayName}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Chart Legend */}
                        <View style={styles.chartLegend}>
                            <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                                إجمالي: {activeChart === 'revenue'
                                    ? currencyService.formatAdminPrice(analyticsData.totals.revenue)
                                    : formatCurrency(analyticsData.totals[activeChart])
                                }
                            </Text>
                        </View>
                    </View>
                </Surface>
            </Animated.View>
        );
    };

    // Render Categories Chart (Horizontal Bars)
    const renderCategoriesChart = () => {
        const data = analyticsData.categorySales;

        return (
            <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                <Surface variant="glass" padding="md" style={styles.chartCardGlass}>
                    <Text style={[styles.chartTitle, { color: theme.text, marginBottom: 20 }]}>
                        المبيعات حسب الفئة
                    </Text>

                    <View style={styles.categoryList}>
                        {data.map((item, index) => (
                            <View key={index} style={styles.categoryRow}>
                                <View style={styles.categoryInfo}>
                                    <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.categoryName, { color: theme.text }]}>{item.category}</Text>
                                        <Text style={[styles.categoryPercent, { color: theme.textSecondary }]}>{item.value}%</Text>
                                    </View>
                                </View>
                                <View style={styles.categoryBarContainer}>
                                    <View
                                        style={[
                                            styles.categoryBarFill,
                                            {
                                                width: `${item.value}%`,
                                                backgroundColor: item.color
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </Surface>
            </Animated.View>
        );
    };

    // Render Conversion Funnel
    const renderConversionFunnel = () => {
        const data = analyticsData.conversionFunnel;

        return (
            <Animated.View entering={FadeInDown.delay(600).duration(600)}>
                <Surface variant="glass" padding="md" style={styles.chartCardGlass}>
                    <Text style={[styles.chartTitle, { color: theme.text, marginBottom: 16 }]}>
                        قمع التحويل
                    </Text>

                    {data.map((stage, index) => (
                        <View key={index} style={styles.funnelRow}>
                            <Text style={[styles.funnelLabel, { color: theme.text }]}>{stage.stage}</Text>
                            <View style={styles.funnelBarContainer}>
                                <LinearGradient
                                    colors={[theme.primary, theme.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.funnelBar, { width: `${stage.percent}%` }]}
                                />
                            </View>
                            <View style={styles.funnelStats}>
                                <Text style={[styles.funnelCount, { color: theme.text }]}>{stage.count}</Text>
                                <Text style={[styles.funnelPercent, { color: theme.textMuted }]}>{stage.percent}%</Text>
                            </View>
                        </View>
                    ))}
                </Surface>
            </Animated.View>
        );
    };

    // Render Top Products
    const renderTopProducts = () => {
        const data = analyticsData.topProducts;

        return (
            <Animated.View entering={FadeInUp.delay(700).duration(600)}>
                <Surface variant="glass" padding="md" style={styles.chartCardGlass}>
                    <View style={styles.chartHeader}>
                        <Text style={[styles.chartTitle, { color: theme.text }]}>أفضل المنتجات</Text>
                        <TouchableOpacity onPress={() => router.push('/admin/products')}>
                            <Text style={[styles.seeAllBtn, { color: theme.primary }]}>عرض الكل</Text>
                        </TouchableOpacity>
                    </View>

                    {data.map((product, index) => {
                        const growthChange = formatChange(product.growth);
                        return (
                            <View key={index} style={styles.productRow}>
                                <View style={[styles.productRank, { backgroundColor: theme.primary + '20' }]}>
                                    <Text style={[styles.productRankText, { color: theme.primary }]}>
                                        {index + 1}
                                    </Text>
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                                    <Text style={[styles.productSales, { color: theme.textSecondary }]}>
                                        {product.sales} مبيعة
                                    </Text>
                                </View>
                                <View style={styles.productStats}>
                                    <Text style={[styles.productRevenue, { color: theme.text }]}>
                                        {currencyService.formatAdminPrice(product.revenue)}
                                    </Text>
                                    <View style={[styles.productGrowth, { backgroundColor: growthChange.color + '15' }]}>
                                        <Ionicons name={growthChange.icon} size={10} color={growthChange.color} />
                                        <Text style={[styles.productGrowthText, { color: growthChange.color }]}>
                                            {growthChange.text}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </Surface>
            </Animated.View>
        );
    };

    // Render Hourly Distribution
    const renderHourlyChart = () => {
        const data = analyticsData.hourlyDistribution;
        const maxOrders = Math.max(...data.map(d => d.orders));

        return (
            <Animated.View entering={FadeInDown.delay(800).duration(600)}>
                <Surface variant="glass" padding="md" style={styles.chartCardGlass}>
                    <Text style={[styles.chartTitle, { color: theme.text, marginBottom: 16 }]}>
                        توزيع الطلبات بالساعة
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.hourlyChart}>
                            {data.map((hour, index) => (
                                <View key={index} style={styles.hourlyBar}>
                                    <View style={styles.hourlyBarWrapper}>
                                        <View
                                            style={[
                                                styles.hourlyBarFill,
                                                {
                                                    height: `${(hour.orders / maxOrders) * 100}%`,
                                                    backgroundColor: hour.orders > maxOrders * 0.7
                                                        ? theme.primary
                                                        : theme.primary + '60',
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.hourlyLabel, { color: theme.textMuted }]}>
                                        {hour.hour}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </Surface>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>التحليلات</Text>
                        <TouchableOpacity style={styles.exportBtn}>
                            <Ionicons name="download-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Date Range Selector */}
            <View style={{ height: 72 }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateRangeContainer}
                    style={{ flex: 0 }}
                >
                    {Object.entries(DATE_RANGE_CONFIG).filter(([key]) => key !== 'custom').map(([key, config]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.dateRangeChip,
                                {
                                    backgroundColor: selectedRange === key
                                        ? theme.primary
                                        : theme.backgroundCard
                                }
                            ]}
                            onPress={() => setSelectedRange(key)}
                        >
                            <Text style={[
                                styles.dateRangeText,
                                { color: selectedRange === key ? '#fff' : theme.text }
                            ]}>
                                {config.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>جاري تحميل البيانات...</Text>
                    </View>
                ) : !analyticsData ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.errorText, { color: theme.textSecondary }]}>حدث خطأ أثناء تحميل البيانات</Text>
                        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => loadData()}>
                            <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <View style={styles.kpiGrid}>
                            {kpiCards.map((kpi, index) => renderKPICard(kpi, index))}
                        </View>

                        {/* Line Chart - Revenue/Orders Trend */}
                        {renderLineChart()}

                        {/* Category Distribution */}
                        {renderCategoriesChart()}

                        {/* Conversion Funnel */}
                        {renderConversionFunnel()}

                        {/* Top Products */}
                        {renderTopProducts()}

                        {/* Hourly Distribution */}
                        {renderHourlyChart()}
                    </>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    exportBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateRangeContainer: {
        padding: 16,
        gap: 8,
    },
    dateRangeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
    },
    dateRangeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    kpiCardContainer: {
        width: (width - 44) / 2,
    },
    kpiCardGlass: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    kpiIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    kpiValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    kpiTitle: {
        fontSize: 12,
        marginTop: 4,
    },
    kpiChange: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
        gap: 4,
    },
    kpiChangeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    chartCardGlass: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    chartTabs: {
        flexDirection: 'row',
        gap: 4,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
        padding: 4,
        borderRadius: 12,
    },
    chartTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    chartTabText: {
        fontSize: 11,
        fontWeight: '600',
    },
    seeAllBtn: {
        fontSize: 13,
        fontWeight: '600',
    },
    lineChart: {
        height: 160,
        marginTop: 10,
    },
    lineChartContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 140,
    },
    lineChartBar: {
        flex: 1,
        alignItems: 'center',
    },
    lineChartColumn: {
        width: 14,
        height: 120,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    lineChartFill: {
        width: '100%',
        borderRadius: 10,
    },
    lineChartLabel: {
        fontSize: 10,
        marginTop: 8,
    },
    chartLegend: {
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    legendText: {
        fontSize: 14,
        fontWeight: '600',
    },
    categoryList: {
        marginTop: 10,
    },
    categoryRow: {
        marginBottom: 16,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
    },
    categoryPercent: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryBarContainer: {
        height: 8,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    categoryBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    funnelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    funnelLabel: {
        width: 90,
        fontSize: 13,
    },
    funnelBarContainer: {
        flex: 1,
        height: 14,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
        borderRadius: 7,
        overflow: 'hidden',
        marginHorizontal: 12,
    },
    funnelBar: {
        height: '100%',
        borderRadius: 7,
    },
    funnelStats: {
        width: 70,
        alignItems: 'flex-end',
    },
    funnelCount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    funnelPercent: {
        fontSize: 11,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    productRank: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productRankText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    productInfo: {
        flex: 1,
        marginLeft: 14,
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
    },
    productSales: {
        fontSize: 13,
        marginTop: 4,
    },
    productStats: {
        alignItems: 'flex-end',
    },
    productRevenue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    productGrowth: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 6,
        gap: 4,
    },
    productGrowthText: {
        fontSize: 11,
        fontWeight: '700',
    },
    hourlyChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 120,
    },
    hourlyBar: {
        alignItems: 'center',
        marginRight: 6,
    },
    hourlyBarWrapper: {
        width: 20,
        height: 100,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    hourlyBarFill: {
        width: '100%',
        borderRadius: 10,
    },
    hourlyLabel: {
        fontSize: 10,
        marginTop: 6,
    },
    bottomPadding: {
        height: 100,
    },
    loadingContainer: {
        flex: 1,
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        marginTop: 16,
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
