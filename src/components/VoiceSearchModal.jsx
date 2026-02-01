/**
 * Voice Search Modal Component
 * Full-screen modal for voice search interaction
 * Dark Mode Supported 🌙
 */

import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "@jamsch/expo-speech-recognition";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { searchByVoice } from '../services/voiceProductSearch';
import { generateResponse, speakResponse, stopSpeaking } from '../services/voiceResponseService';
import ProductCardSoko from './ProductCardSoko';

const { width, height } = Dimensions.get('window');

export default function VoiceSearchModal({ visible, onClose }) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { addToCart } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const { user } = useAuth();
    const styles = getStyles(theme, isDark);

    const [state, setState] = useState('idle'); // idle, listening, processing, speaking, results, error
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [products, setProducts] = useState([]);
    const [searchInfo, setSearchInfo] = useState(null);
    const [recording, setRecording] = useState(null);

    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (visible && state === 'idle') {
            startListening();
        }

        return () => {
            if (visible) {
                stopListening();
                stopSpeaking();
            }
        };
    }, [visible]);

    useEffect(() => {
        if (state === 'listening' || state === 'speaking') {
            // Pulsing animation
            scale.value = withRepeat(
                withSpring(1.2, { damping: 2 }),
                -1,
                true
            );
            opacity.value = withRepeat(
                withTiming(0.5, { duration: 1000 }),
                -1,
                true
            );
        } else {
            scale.value = withSpring(1);
            opacity.value = withSpring(1);
        }
    }, [state]);

    // --- Speech Recognition Events ---
    useSpeechRecognitionEvent("start", () => {
        setState('listening');
        setTranscript('');
        setAiResponse('');
    });

    useSpeechRecognitionEvent("result", (event) => {
        const text = event.results[0]?.transcript;
        if (text) {
            setTranscript(text);
        }
    });

    useSpeechRecognitionEvent("end", () => {
        if (state === 'listening' && transcript && visible) {
            processVoiceSearch(transcript);
        } else if (state === 'listening') {
            setState('idle');
        }
    });

    useSpeechRecognitionEvent("error", (event) => {
        console.error("Speech recognition error:", event.error, event.message);
        if (visible) setState('error');
    });

    const startListening = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) {
            Alert.alert(t('micPermission'), t('micPermissionDesc'));
            return;
        }

        stopSpeaking();
        try {
            ExpoSpeechRecognitionModule.start({
                lang: "ar-SA",
                interimResults: true,
                maxAlternatives: 1,
                continuous: false,
            });
        } catch (e) {
            console.error(e);
            setState('error');
        }
    };

    const stopListening = () => {
        ExpoSpeechRecognitionModule.stop();
        setState('idle');
    };

    const handleTryAgain = () => {
        setTranscript('');
        setProducts([]);
        setAiResponse('');
        setState('idle');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        startListening();
    };

    const processVoiceSearch = async (text) => {
        setState('processing');
        stopSpeaking();
        try {
            const result = await searchByVoice(text);
            setProducts(result.products);
            setSearchInfo(result);

            // Log search to analytics (Firestore)
            logQuery(text, result.keywords, result.products.length);

            if (result.products.length > 0) {
                const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : null);
                const response = generateResponse(result.products, result.keywords, null, userName);
                setTranscript(text);
                setAiResponse(response);

                // Switch to results immediately for better UX while assistant talks
                setState('results');

                // Talk back in background
                await speakResponse(response);
            } else {
                const failMsg = "عذراً، لم أجد ما تبحثين عنه. هل يمكنكِ المحاولة بكلمات أخرى؟";
                setTranscript(failMsg);
                setState('speaking');
                await speakResponse(failMsg);
                setState('error');
            }
        } catch (error) {
            console.error('Search error:', error);
            setState('error');
        }
    };

    const handleProductPress = (item) => {
        onClose();
        router.push(`/product/${item.id}`);
    };

    const handleAddToCart = (item) => {
        addToCart({
            id: item.id,
            name: item.name,
            price: item.sale_price || item.price,
            image: item.images?.[0]?.src,
            quantity: 1,
        });
    };

    const handleFavorite = (item) => {
        toggleFavorite({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.images?.[0]?.src,
        });
    };

    const animatedMicStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const renderProduct = ({ item }) => (
        <View style={styles.gridItem}>
            <ProductCardSoko
                item={item}
                onPress={() => handleProductPress(item)}
                onAddToCart={handleAddToCart}
                onFavorite={handleFavorite}
                isFavorite={isFavorite(item.id)}
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <LinearGradient
                    colors={[theme.primary, theme.primaryDark]}
                    style={StyleSheet.absoluteFill}
                />

                <SafeAreaView style={styles.safeArea}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={styles.content}>
                        {state === 'listening' && (
                            <View style={styles.centerContent}>
                                <Animated.View style={[styles.micContainer, animatedMicStyle]}>
                                    <Ionicons name="mic" size={60} color="#fff" />
                                </Animated.View>
                                <Text style={styles.stateText}>{t('listeningPrompt')}</Text>
                                <Text style={styles.hintText}>{t('speakNow')}</Text>
                            </View>
                        )}

                        {state === 'processing' && (
                            <View style={styles.centerContent}>
                                <ActivityIndicator size="large" color="#fff" />
                                <Text style={styles.stateText}>{t('processingPrompt')}</Text>
                                {transcript && (
                                    <View style={styles.transcriptBox}>
                                        <Text style={styles.transcriptText}>"{transcript}"</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {state === 'speaking' && (
                            <View style={styles.centerContent}>
                                <Animated.View style={[styles.micContainer, animatedMicStyle, { backgroundColor: '#4CAF50' }]}>
                                    <Ionicons name="volume-high" size={60} color="#fff" />
                                </Animated.View>
                                <Text style={styles.stateText}>{t('assistantSpeaking')}</Text>
                                {aiResponse && (
                                    <View style={styles.transcriptBox}>
                                        <Text style={styles.transcriptText}>{aiResponse}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {state === 'error' && (
                            <View style={styles.centerContent}>
                                <Ionicons name="alert-circle-outline" size={60} color="#fff" />
                                <Text style={styles.stateText}>{transcript || t('noSpeechDetected')}</Text>
                                <TouchableOpacity style={styles.retryBtn} onPress={handleTryAgain}>
                                    <Text style={styles.retryText}>{t('tryAgain')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {state === 'results' && (
                            <View style={styles.resultsContainer}>
                                <View style={styles.resultsHeader}>
                                    <Text style={styles.resultsTitle}>
                                        {t('foundProducts', { count: products.length })}
                                    </Text>
                                    {aiResponse ? (
                                        <View style={styles.aiBubble}>
                                            <Text style={styles.aiBubbleText}>{aiResponse}</Text>
                                        </View>
                                    ) : transcript && (
                                        <Text style={styles.searchQuery}>"{transcript}"</Text>
                                    )}
                                </View>
                                <FlatList
                                    data={products}
                                    renderItem={renderProduct}
                                    keyExtractor={(item) => item.id.toString()}
                                    numColumns={2}
                                    contentContainerStyle={styles.listContent}
                                    columnWrapperStyle={styles.row}
                                />
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    content: {
        flex: 1,
        paddingTop: 100,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    micContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    stateText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
    },
    hintText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
    },
    transcriptBox: {
        marginTop: 30,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
    },
    transcriptText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 30,
        paddingHorizontal: 30,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 25,
    },
    retryText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary,
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: theme.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
    },
    resultsHeader: {
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 5,
    },
    searchQuery: {
        fontSize: 14,
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
    listContent: {
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    gridItem: {
        width: (width - 48) / 2,
    },
    aiBubble: {
        backgroundColor: theme.primary + '10',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
    },
    aiBubbleText: {
        fontSize: 14,
        color: theme.text,
        lineHeight: 20,
        fontWeight: '500',
    },
});
