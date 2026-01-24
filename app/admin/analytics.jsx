/**
 * Admin Analytics - Kataraa
 * Comprehensive Analytics & KPIs Dashboard
 * 🔐 Protected by RequireAdmin
 * Features: Sales, Revenue, Conversion, Charts, Date Range Selector
 */

import React, { useState, useCallback, useMemo } from 'react';
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
    formatCurrency,
    formatChange,
    getKPICards,
} from '../../src/services/adminAnalyticsService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

export default function AdminAnalytics() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const [selectedRange, setSelectedRange] = useState(DATE_RANGES.LAST_7_DAYS);
    const [refreshing, setRefreshing] = useState(false);
    const [activeChart, setActiveChart] = useState('revenue'); // revenue, orders, visitors

    // Get analytics data based on selected range
    const analyticsData = useMemo(() => getAnalyticsData(selectedRange), [selectedRange]);
    const kpiCards = useMemo(() =>
        getKPICards(analyticsData.totals, analyticsData.comparisons),
        [analyticsData]
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // Get max value for chart scaling
    const getChartMax = (data, key) => {
        return Math.max(...data.map(d => d[key]));
    };

    // Render KPI Card
    const renderKPICard = (kpi) => {
        const change = formatChange(kpi.change);
        return (
            <View
                key={kpi.id}
                style={[styles.kpiCard, { backgroundColor: theme.backgroundCard }]}
            >
                <View style={[styles.kpiIcon, { backgroundColor: kpi.color + '20' }]}>
                    <Ionicons name={kpi.icon} size={22} color={kpi.color} />
                </View>
                <Text style={[styles.kpiValue, { color: theme.text }]}>{kpi.value}</Text>
                <Text style={[styles.kpiTitle, { color: theme.textSecondary }]}>{kpi.title}</Text>
                <View style={[styles.kpiChange, { backgroundColor: change.color + '15' }]}>
                    <Ionicons name={change.icon} size={12} color={change.color} />
                    <Text style={[styles.kpiChangeText, { color: change.color }]}>{change.text}</Text>
                </View>
            </View>
        );
    };

    // Render Line Chart (Revenue/Orders trend)
    const renderLineChart = () => {
        const data = analyticsData.daily;
        const key = activeChart;
        const maxValue = getChartMax(data, key);

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
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
                            const prevValue = index > 0 ? data[index - 1][key] : value;

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
        );
    };

    // Render Pie Chart (Category Distribution)
    const renderPieChart = () => {
        const data = analyticsData.categorySales;
        const total = data.reduce((sum, d) => sum + d.value, 0);

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                <Text style={[styles.chartTitle, { color: theme.text, marginBottom: 16 }]}>
                    المبيعات حسب الفئة
                </Text>

                {/* Pie Chart Visualization */}
                <View style={styles.pieChartContainer}>
                    <View style={styles.pieChart}>
                        {data.map((item, index) => {
                            const startAngle = data.slice(0, index).reduce((sum, d) => sum + d.value, 0) / total * 360;
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.pieSlice,
                                        {
                                            backgroundColor: item.color,
                                            transform: [{ rotate: `${startAngle}deg` }],
                                            width: `${item.value}%`,
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>

                    {/* Legend */}
                    <View style={styles.pieLegend}>
                        {data.map((item, index) => (
                            <View key={index} style={styles.pieLegendItem}>
                                <View style={[styles.pieLegendDot, { backgroundColor: item.color }]} />
                                <Text style={[styles.pieLegendText, { color: theme.text }]}>
                                    {item.category}
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
        const data = analyticsData.conversionFunnel;

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
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
            </View>
        );
    };

    // Render Top Products
    const renderTopProducts = () => {
        const data = analyticsData.topProducts;

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
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
            </View>
        );
    };

    // Render Hourly Distribution
    const renderHourlyChart = () => {
        const data = analyticsData.hourlyDistribution;
        const maxOrders = Math.max(...data.map(d => d.orders));

        return (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
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
            </View>
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
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateRangeContainer}
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
    bottomPadding: {
        height: 100,
    },
});
