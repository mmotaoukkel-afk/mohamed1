import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import socialService from '../services/socialService';

/**
 * ReviewSection - Premium Social Integration with Likes, Delete & Image Upload
 */
const ReviewSection = ({ productId, user, theme, isDark, t }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [likedComments, setLikedComments] = useState({});

    // Load comments in real-time
    useEffect(() => {
        const unsubscribe = socialService.subscribeToComments(productId, (data) => {
            setComments(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [productId]);

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.7,
            selectionLimit: 3,
        });

        if (!result.canceled) {
            const selectedUris = result.assets.map(asset => asset.uri);
            setImages(prev => [...prev, ...selectedUris].slice(0, 3));
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user || !user.uid) {
            Alert.alert(t('loginRequired'), t('pleaseLoginToReview'));
            return;
        }
        if (!newComment.trim()) return;

        setSubmitting(true);

        try {
            await socialService.addComment(productId, user, newComment.trim(), rating, images);
            setNewComment('');
            setRating(5);
            setImages([]);
        } catch (error) {
            console.error('Error posting review:', error);
            Alert.alert('Error', 'Failed to post review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId, commentUserId) => {
        const isOwner = user?.uid === commentUserId;
        const isAdminUser = user?.email === 'admin@kataraa.com' || user?.isAdmin;

        if (!isOwner && !isAdminUser) {
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

    const isAdminUser = user?.email === 'admin@kataraa.com' || user?.isAdmin;

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

    const renderItem = ({ item }) => {
        const isOwner = user?.uid === item.userId;
        const canDelete = isOwner || isAdminUser;
        const isLiked = likedComments[item.id];

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
                                <Image
                                    source={{ uri: item.userPhoto }}
                                    style={styles.avatarImg}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
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
                                    • {item.createdAt instanceof Date ? item.createdAt.toLocaleDateString() : 'Just now'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={() => handleLikeComment(item.id)} style={styles.likeBtn}>
                            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? '#EF4444' : theme.textMuted} />
                        </TouchableOpacity>
                        {canDelete && (
                            <TouchableOpacity onPress={() => handleDelete(item.id, item.userId)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <Text style={[styles.commentText, { color: theme.text }]}>{item.text}</Text>

                {item.images && item.images.length > 0 && (
                    <View style={styles.commentImagesScroll}>
                        {item.images.slice(0, 3).map((img, idx) => (
                            <Image
                                key={idx}
                                source={{ uri: img }}
                                style={styles.commentImage}
                                contentFit="cover"
                                transition={300}
                                cachePolicy="memory-disk"
                            />
                        ))}
                    </View>
                )}
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
                    <View style={styles.ratingInput}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons name={star <= rating ? "star" : "star-outline"} size={22} color="#FFD700" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t('writeReviewPlaceholder')}
                        placeholderTextColor={theme.textMuted}
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                    />

                    {/* Image Previews */}
                    {images.length > 0 && (
                        <View style={styles.imagePreviewRow}>
                            {images.map((uri, index) => (
                                <View key={index} style={styles.previewContainer}>
                                    <Image
                                        source={{ uri }}
                                        style={styles.previewImage}
                                        contentFit="cover"
                                    />
                                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.inputActions}>
                        <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImages}>
                            <Ionicons name="camera-outline" size={24} color={theme.primary} />
                            <Text style={{ color: theme.primary, marginLeft: 4, fontWeight: '600' }}>{t('addPhotos') || 'Add Photos'}</Text>
                        </TouchableOpacity>

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
    container: { marginTop: 30 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
    title: { fontSize: 20, fontWeight: '900' },
    line: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
    inputCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', padding: 16, marginBottom: 24 },
    inputWrapper: { gap: 12 },
    ratingInput: { flexDirection: 'row', gap: 6 },
    input: { fontSize: 15, paddingVertical: 8, minHeight: 60, textAlignVertical: 'top' },
    inputActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    imageUploadBtn: { flexDirection: 'row', alignItems: 'center' },
    imagePreviewRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    previewContainer: { position: 'relative' },
    previewImage: { width: 60, height: 60, borderRadius: 12 },
    removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 10 },
    sendBtn: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    list: { gap: 16 },
    commentCard: { padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarInitial: { fontSize: 18, fontWeight: '900' },
    userName: { fontSize: 14, fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    date: { fontSize: 11, opacity: 0.6 },
    actionButtons: { flexDirection: 'row', gap: 10 },
    likeBtn: { padding: 5 },
    deleteBtn: { padding: 5 },
    commentText: { fontSize: 14, lineHeight: 22, opacity: 0.9 },
    commentImagesScroll: { marginTop: 12, flexDirection: 'row', gap: 10 },
    commentImage: { width: 100, height: 100, borderRadius: 16 },
    emptyText: { textAlign: 'center', opacity: 0.5, marginTop: 20, fontStyle: 'italic' },
});

export default ReviewSection;
