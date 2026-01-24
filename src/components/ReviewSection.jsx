import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import socialService from '../services/socialService';

/**
 * ReviewSection - Premium Social Integration with Likes & Delete
 */
const ReviewSection = ({ productId, user, theme, isDark, t }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [likedComments, setLikedComments] = useState({});

    // Load comments in real-time
    useEffect(() => {
        const unsubscribe = socialService.subscribeToComments(productId, (data) => {
            setComments(prev => {
                const tempComments = prev.filter(c => c.id.startsWith('temp_'));
                if (data.length > 0 || tempComments.length === 0) {
                    return data;
                }
                return [...tempComments, ...data];
            });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [productId]);

    const handleSubmit = async () => {
        if (!user || !user.uid) {
            Alert.alert(t('loginRequired'), t('pleaseLoginToReview'));
            return;
        }
        if (!newComment.trim()) return;

        const tempId = `temp_${Date.now()}`;
        const optimisticComment = {
            id: tempId,
            productId: productId.toString(),
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0] || 'User',
            userPhoto: user.photoURL || null,
            text: newComment.trim(),
            rating: rating,
            createdAt: new Date(),
        };

        setComments(prev => [optimisticComment, ...prev]);
        setNewComment('');
        setRating(5);
        setSubmitting(true);

        try {
            await socialService.addComment(productId, user, optimisticComment.text, rating);
        } catch (error) {
            console.error('Error posting review:', error);
            setComments(prev => prev.filter(c => c.id !== tempId));
            Alert.alert('Error', 'Failed to post review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId, commentUserId) => {
        const isOwner = user?.uid === commentUserId;
        const isAdmin = user?.email === 'admin@kataraa.com' || user?.isAdmin;

        if (!isOwner && !isAdmin) {
            Alert.alert('Error', 'You can only delete your own reviews');
            return;
        }

        Alert.alert(
            t('deleteReview'),
            t('confirmDeleteReview'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await socialService.deleteComment(commentId);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    const handleLikeComment = (commentId) => {
        setLikedComments(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const isAdmin = user?.email === 'admin@kataraa.com' || user?.isAdmin;

    const renderItem = ({ item }) => {
        const isOwner = user?.uid === item.userId;
        const canDelete = isOwner || isAdmin;
        const isLiked = likedComments[item.id];

        // Star rendering helper
        const renderStars = (r) => {
            const stars = [];
            for (let i = 1; i <= 5; i++) {
                stars.push(
                    <Ionicons
                        key={i}
                        name={i <= (r || 0) ? "star" : "star-outline"}
                        size={12}
                        color="#FFD700"
                    />
                );
            }
            return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
        };

        return (
            <Animated.View
                entering={FadeInDown}
                exiting={FadeOut}
                layout={Layout.springify()}
                style={[styles.commentCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}
            >
                <View style={styles.commentHeader}>
                    <View style={styles.userInfo}>
                        <View style={[styles.avatar, { backgroundColor: theme.primary + '30' }]}>
                            {item.userPhoto ? (
                                <Image source={{ uri: item.userPhoto }} style={styles.avatarImg} />
                            ) : (
                                <Text style={[styles.avatarInitial, { color: theme.primary }]}>
                                    {item.userName.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>
                        <View>
                            <Text style={[styles.userName, { color: theme.text }]}>{item.userName}</Text>
                            <View style={styles.ratingRow}>
                                {renderStars(item.rating)}
                                <Text style={[styles.date, { color: theme.textMuted }]}>
                                    • {item.createdAt.toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            onPress={() => handleLikeComment(item.id)}
                            style={styles.likeBtn}
                        >
                            <Ionicons
                                name={isLiked ? 'heart' : 'heart-outline'}
                                size={18}
                                color={isLiked ? '#EF4444' : theme.textMuted}
                            />
                        </TouchableOpacity>
                        {canDelete && (
                            <TouchableOpacity
                                onPress={() => handleDelete(item.id, item.userId)}
                                style={styles.deleteBtn}
                            >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <Text style={[styles.commentText, { color: theme.text }]}>{item.text}</Text>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.title, { color: theme.text }]}>{t('reviews')} ({comments.length})</Text>
                <View style={styles.line} />
            </View>

            {/* Input Section */}
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.inputCard}>
                <View style={styles.inputWrapper}>
                    {/* Star Rating Input */}
                    <View style={styles.ratingInput}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={star <= rating ? "star" : "star-outline"}
                                    size={20}
                                    color="#FFD700"
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder={t('writeReviewPlaceholder')}
                            placeholderTextColor={theme.textMuted}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={[styles.sendBtn, { backgroundColor: theme.primary }]}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="send" size={20} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>

            {/* List Section */}
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={theme.primary} />
            ) : (
                <FlatList
                    data={comments}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>{t('noReviewsYet')}</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 30,
        paddingHorizontal: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        fontSize: 15,
        paddingHorizontal: 10,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    list: {
        gap: 15,
    },
    commentCard: {
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '900',
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
    },
    date: {
        fontSize: 11,
        opacity: 0.6,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.9,
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.5,
        marginTop: 20,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    likeBtn: {
        padding: 5,
    },
    deleteBtn: {
        padding: 5,
    },
    inputWrapper: {
        flex: 1,
        gap: 10,
    },
    ratingInput: {
        flexDirection: 'row',
        gap: 5,
        paddingHorizontal: 5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 6,
    },
});

export default ReviewSection;
