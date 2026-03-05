/**
 * Admin Reviews - Kataraa
 * Moderate product comments and ratings
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ADMIN_COLORS,
    ADMIN_SHADOWS,
    BORDER_RADIUS
} from '../../src/constants/adminDesignTokens';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { db } from '../../src/services/firebaseConfig';

export default function AdminReviews() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(theme, isDark);

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadReviews = useCallback(async () => {
        try {
            const q = query(collection(db, 'comments'), orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleAction = (reviewId, action) => {
        const title = action === 'delete' ? t('deleteComment') : t('updateCommentStatus');
        const msg = action === 'delete' ? t('deleteCommentConfirm') : t('changeCommentStatus');

        Alert.alert(title, msg, [
            { text: t('cancel'), style: 'cancel' },
            {
                text: action === 'delete' ? t('delete') : t('confirm'),
                style: action === 'delete' ? 'destructive' : 'default',
                onPress: async () => {
                    try {
                        const docRef = doc(db, 'comments', reviewId);
                        if (action === 'delete') {
                            await deleteDoc(docRef);
                            setReviews(prev => prev.filter(r => r.id !== reviewId));
                        } else {
                            // Example: Toggle approval if requested (adding 'approved' field)
                            await updateDoc(docRef, { status: action });
                            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: action } : r));
                        }
                    } catch (error) {
                        Alert.alert(t('error'), t('actionFailed'));
                    }
                }
            }
        ]);
    };

    const renderReview = ({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.userName, { color: theme.text }]}>{item.userName || t('anonymousUser')}</Text>
                    <Text style={[styles.date, { color: theme.textMuted }]}>
                        {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString(t('locale') === 'ar' ? 'ar' : 'en-US') : t('unknownDate')}
                    </Text>
                </View>
                <View style={styles.ratingBox}>
                    <Text style={[styles.ratingText, { color: theme.primary }]}>{item.rating}</Text>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                </View>
            </View>
            <Text style={[styles.comment, { color: theme.textSecondary }]}>{item.text}</Text>
            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
                    onPress={() => handleAction(item.id, 'delete')}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>{t('delete')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.primary + '20' }]}
                    onPress={() => router.push(`/product/${item.productId}`)}
                >
                    <Ionicons name="eye-outline" size={18} color={theme.primary} />
                    <Text style={[styles.actionText, { color: theme.primary }]}>{t('viewProduct')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('manageReviews')}</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                data={reviews}
                keyExtractor={item => item.id}
                renderItem={renderReview}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReviews(); }} tintColor={theme.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ color: theme.textMuted }}>{t('noReviewsYet')}</Text>
                    </View>
                }
            />
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[900] : ADMIN_COLORS.neutral[50],
    },
    header: {
        paddingBottom: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...ADMIN_SHADOWS.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
        paddingTop: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        padding: 20,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: 16,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.md,
    },
    cardHeader: {
        flexDirection: 'row-reverse', // RTL
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 15,
        textAlign: 'right',
        color: isDark ? '#fff' : ADMIN_COLORS.neutral[900],
    },
    date: {
        fontSize: 11,
        marginTop: 2,
        textAlign: 'right',
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[500],
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
    },
    ratingText: {
        fontWeight: 'bold',
        color: ADMIN_COLORS.warning.dark,
        fontSize: 13,
    },
    comment: {
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'right',
        color: isDark ? ADMIN_COLORS.neutral[300] : ADMIN_COLORS.neutral[700],
        marginBottom: 16,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // RTL left alignment for buttons
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[200],
        paddingTop: 16,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BORDER_RADIUS.lg,
        gap: 8,
    },
    actionText: {
        fontWeight: '600',
        fontSize: 13,
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
});
