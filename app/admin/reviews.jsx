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
import { useTheme } from '../../src/context/ThemeContext';
import { db } from '../../src/services/firebaseConfig';

export default function AdminReviews() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
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
        const title = action === 'delete' ? 'حذف التعليق' : 'تعديل حالة التعليق';
        const msg = action === 'delete' ? 'هل أنت متأكد من حذف هذا التعليق نهائياً؟' : 'تغيير حالة التعليق؟';

        Alert.alert(title, msg, [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: action === 'delete' ? 'حذف' : 'تأكيد',
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
                        Alert.alert('خطأ', 'فشل الإجراء');
                    }
                }
            }
        ]);
    };

    const renderReview = ({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.userName, { color: theme.text }]}>{item.userName || 'مستخدم مجهول'}</Text>
                    <Text style={[styles.date, { color: theme.textMuted }]}>
                        {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString('ar') : 'تاريخ غير معروف'}
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
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>حذف</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.primary + '20' }]}
                    onPress={() => router.push(`/product/${item.productId}`)}
                >
                    <Ionicons name="eye-outline" size={18} color={theme.primary} />
                    <Text style={[styles.actionText, { color: theme.primary }]}>عرض المنتج</Text>
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
                        <Text style={styles.headerTitle}>إدارة التقييمات</Text>
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
                        <Text style={{ color: theme.textMuted }}>لا توجد تقييمات حالياً</Text>
                    </View>
                }
            />
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    list: { padding: 16 },
    card: { padding: 16, borderRadius: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    userName: { fontWeight: 'bold', fontSize: 15 },
    date: { fontSize: 11, marginTop: 2 },
    ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontWeight: 'bold' },
    comment: { fontSize: 14, lineHeight: 20, textAlign: 'right' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, gap: 6 },
    actionText: { fontWeight: '600', fontSize: 13 },
    empty: { alignItems: 'center', marginTop: 100 },
});
