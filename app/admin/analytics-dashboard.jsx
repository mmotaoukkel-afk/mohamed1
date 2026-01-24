/**
 * Voice Analytics Dashboard - Kataraa
 * Admin dashboard for viewing customer voice search insights
 * Dark Mode Supported 🌙
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { getInsights, clearAnalytics, getAnalyticsData } from '../../src/services/voiceAnalytics';

const { width } = Dimensions.get('window');

// Arabic translations for keywords
const ARABIC_LABELS = {
    // Product types
    cream: 'كريم',
    moisturizer: 'مرطب',
    serum: 'سيروم',
    cleanser: 'غسول',
    sunscreen: 'واقي شمس',
    lipstick: 'أحمر شفاه',
    mascara: 'ماسكارا',
    foundation: 'أساس',
    eyeshadow: 'ظلال عيون',

    // Skin types
    oily: 'دهنية',
    dry: 'جافة',
    sensitive: 'حساسة',
    combination: 'مختلطة',
    normal: 'عادية',
    mature: 'ناضجة',

    // Concerns
    acne: 'حب الشباب',
    brightening: 'تفتيح',
    hydration: 'ترطيب',
    'anti-aging': 'مكافحة الشيخوخة',
    'dark spots': 'بقع داكنة',
    'dark circles': 'هالات سوداء',
    pores: 'مسام',
    glow: 'نضارة',
};

const getArabicLabel = (key) => ARABIC_LABELS[key] || key;

export default function AnalyticsDashboard() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadInsights = useCallback(async () => {
        try {
            const data = await getInsights();
            setInsights(data);
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadInsights();
    }, [loadInsights]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadInsights();
    }, [loadInsights]);

    const handleClearData = () => {
        Alert.alert(
            'مسح البيانات',
            'هل أنت متأكد من مسح جميع بيانات التحليلات؟ لا يمكن التراجع عن هذا الإجراء.',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'مسح',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAnalytics();
                        loadInsights();
                    }
                }
            ]
        );
    };

    const renderStatCard = (title, value, icon, color) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statIcon}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
                <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
            </View>
        </View>
    );

    const renderBarChart = (data, title, icon) => {
        if (!data || data.length === 0) return null;

        const maxCount = Math.max(...data.map(d => d.count), 1);

        return (
            <View style={[styles.chartContainer, { backgroundColor: theme.backgroundCard }]}>
                <View style={styles.chartHeader}>
                    <Ionicons name={icon} size={20} color={theme.primary} />
                    <Text style={[styles.chartTitle, { color: theme.text }]}>{title}</Text>
                </View>
                {data.map((item, index) => (
                    <View key={index} style={styles.barRow}>
                        <Text style={[styles.barLabel, { color: theme.text }]}>
                            {getArabicLabel(item.name)}
                        </Text>
                        <View style={styles.barContainer}>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        width: `${(item.count / maxCount) * 100}%`,
                                        backgroundColor: theme.primary
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.barCount, { color: theme.textSecondary }]}>
                            {item.count}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderRecentQueries = () => {
        if (!insights?.recentQueries || insights.recentQueries.length === 0) {
            return null;
        }

        return (
            <View style={[styles.queriesContainer, { backgroundColor: theme.backgroundCard }]}>
                <View style={styles.chartHeader}>
                    <Ionicons name="time-outline" size={20} color={theme.primary} />
                    <Text style={[styles.chartTitle, { color: theme.text }]}>آخر الاستفسارات</Text>
                </View>
                {insights.recentQueries.slice(0, 5).map((query, index) => (
                    <View key={index} style={styles.queryRow}>
                        <View style={styles.queryContent}>
                            <Text style={[styles.queryText, { color: theme.text }]} numberOfLines={1}>
                                "{query.transcript}"
                            </Text>
                            <Text style={[styles.queryMeta, { color: theme.textMuted }]}>
                                {query.resultsCount} نتيجة • {new Date(query.timestamp).toLocaleDateString('ar')}
                            </Text>
                        </View>
                        <View style={[
                            styles.queryBadge,
                            { backgroundColor: query.resultsCount > 0 ? theme.success : theme.error }
                        ]}>
                            <Text style={styles.queryBadgeText}>
                                {query.resultsCount > 0 ? '✓' : '✗'}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderFailedQueries = () => {
        if (!insights?.failedQueries || insights.failedQueries.length === 0) {
            return null;
        }

        return (
            <View style={[styles.failedContainer, { backgroundColor: theme.backgroundCard }]}>
                <View style={styles.chartHeader}>
                    <Ionicons name="alert-circle-outline" size={20} color={theme.error} />
                    <Text style={[styles.chartTitle, { color: theme.text }]}>بحث بدون نتائج</Text>
                </View>
                <Text style={[styles.failedSubtitle, { color: theme.textSecondary }]}>
                    منتجات يبحث عنها العملاء ولا تتوفر حالياً
                </Text>
                {insights.failedQueries.slice(0, 5).map((query, index) => (
                    <View key={index} style={[styles.failedRow, { borderBottomColor: theme.border }]}>
                        <Ionicons name="search-outline" size={16} color={theme.error} />
                        <Text style={[styles.failedText, { color: theme.text }]} numberOfLines={1}>
                            {query.transcript}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>جارٍ تحميل التحليلات...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>تحليلات البحث الصوتي</Text>
                        <TouchableOpacity style={styles.clearBtn} onPress={handleClearData}>
                            <Ionicons name="trash-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* Stats Summary */}
                <View style={styles.statsRow}>
                    {renderStatCard('إجمالي البحث', insights?.totalQueries || 0, 'mic', theme.primary)}
                    {renderStatCard('أنواع المنتجات', insights?.topProductTypes?.length || 0, 'cube', theme.accent)}
                </View>

                {/* Charts */}
                {renderBarChart(insights?.topProductTypes, 'أكثر المنتجات طلباً', 'trending-up')}
                {renderBarChart(insights?.topConcerns, 'أكثر المشاكل شيوعاً', 'heart')}
                {renderBarChart(insights?.topSkinTypes, 'أنواع البشرة', 'color-palette')}

                {/* Recent Queries */}
                {renderRecentQueries()}

                {/* Failed Queries - Important for business insights */}
                {renderFailedQueries()}

                {/* Empty State */}
                {(!insights || insights.totalQueries === 0) && (
                    <View style={styles.emptyState}>
                        <Ionicons name="analytics-outline" size={80} color={theme.textMuted} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            لا توجد بيانات بعد
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                            ستظهر التحليلات هنا بعد أن يبدأ العملاء باستخدام البحث الصوتي
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.backgroundCard,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
    },
    statIcon: {
        marginRight: 12,
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statTitle: {
        fontSize: 12,
        marginTop: 4,
    },
    chartContainer: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    barLabel: {
        width: 80,
        fontSize: 12,
        textAlign: 'right',
        marginRight: 12,
    },
    barContainer: {
        flex: 1,
        height: 24,
        backgroundColor: theme.border,
        borderRadius: 12,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 12,
    },
    barCount: {
        width: 30,
        fontSize: 12,
        textAlign: 'center',
        marginLeft: 8,
    },
    queriesContainer: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    queryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    queryContent: {
        flex: 1,
    },
    queryText: {
        fontSize: 14,
    },
    queryMeta: {
        fontSize: 11,
        marginTop: 4,
    },
    queryBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    queryBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    failedContainer: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    failedSubtitle: {
        fontSize: 12,
        marginBottom: 12,
    },
    failedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        gap: 8,
    },
    failedText: {
        flex: 1,
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
        lineHeight: 22,
    },
});
