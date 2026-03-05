/**
 * Admin Analytics - Kataraa
 * Comprehensive Analytics & KPIs Dashboard
 * 🔐 Protected by RequireAdmin
 * Features: Sales, Revenue, Conversion, Charts, Date Range Selector
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, I18nManager, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
    DATE_RANGES,
    DATE_RANGE_CONFIG,
    formatChange,
    formatCurrency,
    getAnalyticsData,
    getKPICards,
    getLowStockProducts,
} from '../../src/services/adminAnalyticsService';
import currencyService from '../../src/services/currencyService';

// Top-level width removed to avoid ReferenceError


export default function AdminAnalytics() {
    const { t } = useTranslation();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark, I18nManager.isRTL);

    const [selectedRange, setSelectedRange] = useState(DATE_RANGES.LAST_7_DAYS);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [activeChart, setActiveChart] = useState('revenue');

    // Fetch analytics data asynchronously
    const fetchData = useCallback(async (range) => {
        try {
            setLoading(true);
            setError(null);
            const [data, lowStock] = await Promise.all([
                getAnalyticsData(range),
                getLowStockProducts(5)
            ]);
            setAnalyticsData(data);
            setLowStockProducts(lowStock);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
            setError(t('failedToLoadData') || 'فشل تحميل البيانات. حاول مرة أخرى.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData(selectedRange);
    }, [selectedRange, fetchData]);

    const kpiCards = React.useMemo(() => {
        if (!analyticsData) return [];
        return getKPICards(analyticsData.totals, analyticsData.comparisons);
    }, [analyticsData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(selectedRange);
    }, [selectedRange, fetchData]);

    // Get max value for chart scaling
    const getChartMax = (data, key) => {
        if (!data || data.length === 0) return 1;
        const max = Math.max(...data.map(d => d[key] || 0));
        return max === 0 ? 1 : max;
    };

    // Render KPI Card
    const renderKPICard = (kpi) => {
        const change = formatChange(kpi.change || 0);
        return (
            <View
                key={kpi.id}
                style={[styles.kpiCard, { backgroundColor: theme.backgroundCard }]}
            >
                <View style={[styles.kpiIcon, { backgroundColor: kpi.color + '20', alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Ionicons name={kpi.icon} size={22} color={kpi.color} />
                </View>
                <Text style={[styles.kpiValue, { color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{kpi.value}</Text>
                <Text style={[styles.kpiTitle, { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t(kpi.id) || kpi.title}</Text>
                <View style={[styles.kpiChange, { backgroundColor: change.color + '15', flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                    <Ionicons name={change.icon} size={12} color={change.color} />
                    <Text style={[styles.kpiChangeText, { color: change.color }]}>{change.text}</Text>
                </View>
            </View>
        );
    };

    // Render Line Chart
    const renderLineChart = () => {
        if (!analyticsData) return null;
        const data = analyticsData.daily;
        const key = activeChart;
        const maxValue = getChartMax(data, key);

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                <View style={styles.chartHeader}>
                    <Text style={[styles.chartTitle, { color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                        {activeChart === 'revenue' ? t('revenue') :
                            activeChart === 'orders' ? t('orders') : t('visitors')}
                    </Text>
                    <View style={[styles.chartTabs, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
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
                                    {tab === 'revenue' ? t('revenue') :
                                        tab === 'orders' ? t('orders') : t('visitors')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Line Chart */}
                <View style={styles.lineChart}>
                    <View style={[styles.lineChartContent, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                        {(I18nManager.isRTL ? [...data].reverse() : data).map((item, index) => {
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

                <View style={[styles.chartLegend, { alignItems: 'center' }]}>
                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                        {t('total')}: {activeChart === 'revenue'
                            ? currencyService.formatKWD(analyticsData.totals.revenue)
                            : formatCurrency(analyticsData.totals[activeChart])
                        }
                    </Text>
                </View>
            </View>
        );
    };

    // Render Pie Chart
    const renderPieChart = () => {
        if (!analyticsData) return null;
        const data = analyticsData.categorySales;
        const total = data.reduce((sum, d) => sum + d.value, 0);

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                <Text style={[styles.chartTitle, { color: theme.text, marginBottom: 16, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                    {t('salesDistribution')} (%)
                </Text>

                <View style={[styles.pieChartContainer, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.pieChart, { [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 20 }]}>
                        {data.map((item, index) => {
                            const startAngle = data.slice(0, index).reduce((sum, d) => sum + d.value, 0) / (total || 1) * 360;
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.pieSlice,
                                        {
                                            backgroundColor: item.color,
                                            transform: [{ rotate: `${startAngle}deg` }],
                                            width: `${item.value}%`,
                                            position: 'absolute',
                                            height: '100%'
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>

                    <View style={styles.pieLegend}>
                        {data.map((item, index) => (
                            <View key={index} style={[styles.pieLegendItem, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                                <View style={[styles.pieLegendDot, { backgroundColor: item.color, [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 8 }]} />
                                <Text style={[styles.pieLegendText, { color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                                    {t(item.category.toLowerCase()) || item.category}
                                </Text>
                                <Text style={[styles.pieLegendValue, { color: theme.textSecondary }]}>
                                    {item.value}%
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    // Render Conversion Funnel
    const renderConversionFunnel = () => {
        if (!analyticsData) return null;
        const data = analyticsData.conversionFunnel;

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                <Text style={[styles.chartTitle, { color: theme.text, marginBottom: 16, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                    {t('conversionFunnel')}
                </Text>

                {data.map((stage, index) => (
                    <View key={index} style={[styles.funnelRow, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.funnelLabel, { color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t(stage.stage.toLowerCase().replace(/ /g, '_')) || stage.stage}</Text>
                        <View style={[styles.funnelBarContainer, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                            <LinearGradient
                                colors={[theme.primary, theme.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.funnelBar, { width: `${stage.percent}%` }]}
                            />
                        </View>
                        <View style={[styles.funnelStats, { alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end' }]}>
                            <Text style={[styles.funnelCount, { color: theme.text }]}>{stage.count}</Text>
                            <Text style={[styles.funnelPercent, { color: theme.textMuted }]}>{stage.percent}%</Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    // Render Top Products
    const renderTopProducts = () => {
        if (!analyticsData) return null;
        const data = analyticsData.topProducts;

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                <View style={[styles.chartHeader, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.chartTitle, { color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('topProducts')}</Text>
                    <TouchableOpacity onPress={() => router.push('/admin/products')}>
                        <Text style={[styles.seeAllBtn, { color: theme.primary }]}>{t('seeAll')}</Text>
                    </TouchableOpacity>
                </View>

                {data.length === 0 ? (
                    <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>{t('noSalesPeriod')}</Text>
                ) : data.map((product, index) => {
                    const growthChange = formatChange(product.growth || 0);
                    return (
                        <View key={index} style={[styles.productRow, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={[styles.productRank, { backgroundColor: theme.primary + '20', [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 0 }]}>
                                <Text style={[styles.productRankText, { color: theme.primary }]}>
                                    {index + 1}
                                </Text>
                            </View>
                            <View style={[styles.productInfo, { [I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 12, alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }]}>
                                <Text style={[styles.productName, { color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{product.name}</Text>
                                <Text style={[styles.productSales, { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                                    {product.sales} {t('sale')}
                                </Text>
                            </View>
                            <View style={[styles.productStats, { alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end' }]}>
                                <Text style={[styles.productRevenue, { color: theme.text }]}>
                                    {currencyService.formatAdminPrice(product.revenue)}
                                </Text>
                                <View style={[styles.productGrowth, { backgroundColor: growthChange.color + '15', flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                                    <Ionicons name={growthChange.icon} size={10} color={growthChange.color} />
                                    <Text style={[styles.productGrowthText, { color: growthChange.color }]}>
                                        {growthChange.text}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    // Render Low Stock Alerts
    const renderLowStockAlerts = () => {
        if (!lowStockProducts || lowStockProducts.length === 0) return null;

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard, borderColor: '#EF4444', borderWidth: 1 }]}>
                <View style={[styles.chartHeader, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="warning-outline" size={20} color="#EF4444" />
                        <Text style={[styles.chartTitle, { color: '#EF4444', textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('stockAlerts')} ( {t('lessThan')} 5)</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/admin/products')}>
                        <Text style={[styles.seeAllBtn, { color: theme.primary }]}>{t('edit')}</Text>
                    </TouchableOpacity>
                </View>

                {lowStockProducts.map((product, index) => (
                    <View key={product.id} style={[styles.productRow, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.productInfo, { alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.productName, { color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{product.name}</Text>
                            <Text style={[styles.productSales, { color: '#EF4444', fontWeight: 'bold', textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                                {t('remainingQuantity')}: {product.stock_quantity}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.quickAddBtn, { backgroundColor: theme.primary }]}
                            onPress={() => router.push(`/admin/products?edit=${product.id}`)}
                        >
                            <Ionicons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        );
    };

    // Render Hourly Distribution
    const renderHourlyChart = () => {
        if (!analyticsData) return null;
        const data = analyticsData.hourlyDistribution;
        const maxOrders = Math.max(...data.map(d => d.orders)) || 1;

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                <Text style={[styles.chartTitle, { color: theme.text, marginBottom: 16, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                    {t('hourlyOrderDistribution')}
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
                    <View style={[styles.hourlyChart, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                        {(I18nManager.isRTL ? [...data].reverse() : data).map((hour, index) => (
                            <View key={index} style={[styles.hourlyBar, { [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 4 }]}>
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
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>جاري تحميل البيانات الحقيقية...</Text>
            </View>
        );
    }

    if (error && !analyticsData) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <Ionicons name="cloud-offline-outline" size={64} color={theme.textMuted} />
                <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => fetchData(selectedRange)}>
                    <Text style={styles.retryText}>إعادة المحاولة</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={[styles.backBtn, { transform: [{ rotate: I18nManager.isRTL ? '180deg' : '0deg' }] }]} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('analytics')}</Text>
                        <TouchableOpacity style={styles.exportBtn}>
                            <Ionicons name="download-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Date Range Selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.dateRangeContainer, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}
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
                            {t(config.label.toLowerCase().replace(/ /g, '_')) || config.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {/* KPI Cards */}
                <View style={styles.kpiGrid}>
                    {kpiCards.map(renderKPICard)}
                </View>

                {/* Low Stock Alerts */}
                {renderLowStockAlerts()}

                {/* Line Chart - Revenue/Orders Trend */}
                {renderLineChart()}

                {/* Category Distribution */}
                {renderPieChart()}

                {/* Conversion Funnel */}
                {renderConversionFunnel()}

                {/* Top Products */}
                {renderTopProducts()}

                {/* Hourly Distribution */}
                {renderHourlyChart()}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const getStyles = (theme, isDark, isRTL) => {
    const { width } = Dimensions.get('window');
    return StyleSheet.create({
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
        kpiCard: {
            width: (width - 44) / 2,
            padding: 16,
            borderRadius: 16,
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
            fontSize: 24,
            fontWeight: 'bold',
        },
        kpiTitle: {
            fontSize: 13,
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
            fontSize: 12,
            fontWeight: '600',
        },
        chartCard: {
            margin: 16,
            marginTop: 0,
            padding: 16,
            borderRadius: 16,
        },
        chartHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        chartTitle: {
            fontSize: 16,
            fontWeight: 'bold',
        },
        chartTabs: {
            flexDirection: 'row',
            gap: 4,
        },
        chartTab: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
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
            width: 24,
            height: 120,
            backgroundColor: theme.border,
            borderRadius: 12,
            overflow: 'hidden',
            justifyContent: 'flex-end',
        },
        lineChartFill: {
            width: '100%',
            borderRadius: 12,
        },
        lineChartLabel: {
            fontSize: 10,
            marginTop: 6,
        },
        chartLegend: {
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        legendText: {
            fontSize: 13,
        },
        pieChartContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        pieChart: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.border,
            overflow: 'hidden',
            marginRight: 20,
        },
        pieLegend: {
            flex: 1,
        },
        pieLegendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        pieLegendDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            marginRight: 8,
        },
        pieLegendText: {
            flex: 1,
            fontSize: 13,
        },
        pieLegendValue: {
            fontSize: 13,
            fontWeight: '600',
        },
        funnelRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        funnelLabel: {
            width: 100,
            fontSize: 12,
        },
        funnelBarContainer: {
            flex: 1,
            height: 20,
            backgroundColor: theme.border,
            borderRadius: 10,
            overflow: 'hidden',
            marginHorizontal: 8,
        },
        funnelBar: {
            height: '100%',
            borderRadius: 10,
        },
        funnelStats: {
            width: 60,
            alignItems: 'flex-end',
        },
        funnelCount: {
            fontSize: 13,
            fontWeight: '600',
        },
        funnelPercent: {
            fontSize: 11,
        },
        productRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        productRank: {
            width: 28,
            height: 28,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
        },
        productRankText: {
            fontSize: 14,
            fontWeight: 'bold',
        },
        productInfo: {
            flex: 1,
            marginLeft: 12,
        },
        productName: {
            fontSize: 14,
            fontWeight: '500',
        },
        productSales: {
            fontSize: 12,
            marginTop: 2,
        },
        productStats: {
            alignItems: 'flex-end',
        },
        productRevenue: {
            fontSize: 14,
            fontWeight: 'bold',
        },
        productGrowth: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            marginTop: 4,
            gap: 2,
        },
        productGrowthText: {
            fontSize: 10,
            fontWeight: '600',
        },
        hourlyChart: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: 100,
        },
        hourlyBar: {
            alignItems: 'center',
            marginRight: 4,
        },
        hourlyBarWrapper: {
            width: 16,
            height: 80,
            backgroundColor: theme.border,
            borderRadius: 8,
            overflow: 'hidden',
            justifyContent: 'flex-end',
        },
        hourlyBarFill: {
            width: '100%',
            borderRadius: 8,
        },
        hourlyLabel: {
            fontSize: 9,
            marginTop: 4,
        },
        quickAddBtn: {
            width: 32,
            height: 32,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
        },
        bottomPadding: {
            height: 100,
        },
        center: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            marginTop: 16,
            fontSize: 15,
        },
        errorText: {
            marginTop: 16,
            fontSize: 16,
            textAlign: 'center',
            paddingHorizontal: 40,
        },
        retryBtn: {
            marginTop: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
        },
        retryText: {
            color: '#fff',
            fontWeight: 'bold',
        },
    });
};
