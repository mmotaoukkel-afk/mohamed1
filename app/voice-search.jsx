import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSpring,
    useSharedValue,
    withTiming,
    FadeIn,
    SlideInDown,
    runOnJS,
    useDerivedValue,
    interpolate
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';


import { useTheme } from '../src/context/ThemeContext';
import { useTranslation } from '../src/hooks/useTranslation';
import { searchByVoice } from '../src/services/voiceProductSearch';
import { speakResponse, stopSpeaking, generateResponse } from '../src/services/voiceResponseService';
import ProductCardSoko from '../src/components/ProductCardSoko';
import { useCartAnimation } from '../src/context/CartAnimationContext';
import { useFavorites } from '../src/context/FavoritesContext';
import { useAuth } from '../src/context/AuthContext';

const { width, height } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = height * 0.85; // Expanded height
const SHEET_MIN_HEIGHT = height * 0.45; // Collapsed height

export default function VoiceSearchScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { triggerAddToCart } = useCartAnimation();
    const { toggleFavorite, isFavorite } = useFavorites();
    const { user } = useAuth();

    const [state, setState] = useState('idle'); // idle, listening, processing, speaking, results, error
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [products, setProducts] = useState([]);
    const [keywords, setKeywords] = useState(null);
    const [inputQuery, setInputQuery] = useState('');

    const scale = useSharedValue(1);
    const pulseScale = useSharedValue(1);

    // Draggable Sheet Shared Value
    const sheetHeight = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    useEffect(() => {
        // Initial Greeting
        const welcome = async () => {
            setState('idle');
            // Small delay to let the screen load
            setTimeout(async () => {
                const welcomeMsg = "أهلاً بكِ في كتارا! أنا مساعدتكِ الذكية للجمال. كيف يمكنني مساعدتكِ اليوم؟";
                setAiResponse(welcomeMsg);
                setState('speaking');
                await speakResponse(welcomeMsg);
                setState('idle');
            }, 1000);
        };
        welcome();

        return () => stopSpeaking();
    }, []);

    useEffect(() => {
        if (state === 'listening' || state === 'speaking') {
            pulseScale.value = withRepeat(
                withTiming(1.5, { duration: 1000 }),
                -1,
                true
            );
        } else {
            pulseScale.value = withSpring(1);
        }
    }, [state]);

    // Creating a separate derived value or just setting it when results appear
    useEffect(() => {
        if (state === 'results' && products.length > 0) {
            sheetHeight.value = withTiming(SHEET_MIN_HEIGHT, { duration: 300 });
        }
    }, [state, products]);

    const silenceTimer = useRef(null);

    // --- Speech Recognition Events ---
    useSpeechRecognitionEvent("start", () => {
        setState('listening');
        setTranscript('');
        setAiResponse('');
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
    });

    useSpeechRecognitionEvent("result", (event) => {
        const text = event.results[0]?.transcript;
        if (text) {
            setTranscript(text);

            // Reset silence timer on every new result
            if (silenceTimer.current) clearTimeout(silenceTimer.current);

            // Wait for 2 seconds of silence before processing
            silenceTimer.current = setTimeout(() => {
                stopListeningAndProcess();
            }, 2000);
        }
    });

    useSpeechRecognitionEvent("end", () => {
        // Only process if we haven't already processed via timer (handled by state check)
        if (state === 'listening' && transcript) {
            // handleVoiceInput(transcript); 
            // Don't auto-process on 'end' if continuous is true, relying on timer or manual stop
        } else if (state === 'listening') {
            setState('idle');
        }
    });

    useSpeechRecognitionEvent("error", (event) => {
        console.error("Speech recognition error:", event.error, event.message);
        setState('error');
    });

    const startListening = async () => {
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) {
            alert(t('micPermissionDesc'));
            return;
        }

        stopSpeaking();
        if (silenceTimer.current) clearTimeout(silenceTimer.current);

        try {
            ExpoSpeechRecognitionModule.start({
                lang: "ar-SA", // Standard Arabic
                interimResults: true,
                maxAlternatives: 1,
                continuous: true, // Enable continuous to prevent early cut-off
            });
        } catch (e) {
            console.error(e);
            setState('error');
        }
    };

    const stopListening = () => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        ExpoSpeechRecognitionModule.stop();
        // If we have text, process it
        if (transcript) {
            handleVoiceInput(transcript);
        } else {
            setState('idle');
        }
    };

    const stopListeningAndProcess = () => {
        ExpoSpeechRecognitionModule.stop();
        if (transcript) {
            handleVoiceInput(transcript);
        }
    };

    const handleDemoScenario = (text) => {
        handleVoiceInput(text);
    };

    const handleVoiceInput = async (text) => {
        setTranscript(text);
        setState('processing');
        stopSpeaking();

        try {
            const result = await searchByVoice(text);
            setProducts(result.products);
            setKeywords(result.keywords);

            const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : null);

            // Pass the cleaned query (result.searchQuery) so the AI can speak it back specificially
            const response = generateResponse(result.products, result.keywords, result.searchQuery, userName);
            setAiResponse(response);

            if (result.products.length > 0) {
                setState('speaking');
                // AI Talks back!
                await speakResponse(response);
                setState('results');
            } else {
                setState('speaking');
                await speakResponse(response);
                setState('error');
            }

        } catch (error) {
            console.error('Voice search failed:', error);
            setState('error');
        }
    };

    const handleAddToCart = (item) => {
        triggerAddToCart({
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

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: (state === 'listening' || state === 'speaking') ? withTiming(0.4) : 0,
    }));

    // --- Gesture Logic for Bottom Sheet ---
    const panGesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: sheetHeight.value };
        })
        .onUpdate((event) => {
            // Dragging up increases height (inverted logic because we set height)
            // event.translationY is negative when dragging up
            const newHeight = context.value.y - event.translationY;

            // Clamp value
            if (newHeight >= SHEET_MIN_HEIGHT && newHeight <= SHEET_MAX_HEIGHT) {
                sheetHeight.value = newHeight;
            }
        })
        .onEnd((event) => {
            // Snap logic based on velocity and position
            if (event.velocityY < -500 || sheetHeight.value > (SHEET_MAX_HEIGHT + SHEET_MIN_HEIGHT) / 2) {
                sheetHeight.value = withTiming(SHEET_MAX_HEIGHT, { duration: 300 });
            } else {
                sheetHeight.value = withTiming(SHEET_MIN_HEIGHT, { duration: 300 });
            }
        });

    const sheetStyle = useAnimatedStyle(() => ({
        height: sheetHeight.value,
    }));

    const renderProduct = ({ item }) => (
        <View style={styles.gridItem}>
            <ProductCardSoko
                item={item}
                onPress={() => router.push(`/product/${item.id}`)}
                onAddToCart={handleAddToCart}
                onFavorite={handleFavorite}
                isFavorite={isFavorite(item.id)}
            />
        </View>
    );

    return (
        <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Cinematic Background Gradient */}
            <LinearGradient
                colors={isDark ? ['#1A1A2E', '#16213E'] : ['#FFF0F5', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                        style={styles.backBtn}
                    >
                        <Ionicons name="chevron-back" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>الخبير الذكي</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* AI Assistant Visualizer */}
                <View style={styles.visualizerContainer}>
                    <Animated.View style={[
                        styles.pulseCircle,
                        pulseStyle,
                        state === 'speaking' && { backgroundColor: '#4CAF50' },
                        state === 'processing' && { backgroundColor: '#FFC107' }
                    ]} />
                    <TouchableOpacity
                        style={[
                            styles.micButton,
                            { backgroundColor: theme.primary },
                            state === 'speaking' && { backgroundColor: '#4CAF50' },
                            state === 'processing' && { backgroundColor: '#FFC107' }
                        ]}
                        onPress={state === 'listening' ? stopListening : startListening}
                    >
                        {state === 'processing' ? (
                            <ActivityIndicator color="#fff" />
                        ) : state === 'speaking' ? (
                            <Ionicons name="volume-high" size={40} color="#fff" />
                        ) : (
                            <Ionicons name={state === 'listening' ? 'stop' : 'mic'} size={40} color="#fff" />
                        )}
                    </TouchableOpacity>
                    <Text style={[styles.statusUnderMic, { color: theme.textSecondary }]}>
                        {state === 'listening' ? t('listeningPrompt') :
                            state === 'processing' ? t('processingPrompt') :
                                state === 'speaking' ? t('assistantSpeaking') :
                                    t('tapToSpeak')}
                    </Text>
                </View>

                {/* Response / Transcript Area */}
                <View style={styles.textContainer}>
                    {aiResponse ? (
                        <Animated.View entering={FadeIn.delay(200)} style={styles.aiBubble}>
                            <Text style={[styles.aiText, { color: theme.text }]}>{aiResponse}</Text>
                        </Animated.View>
                    ) : null}

                    {transcript ? (
                        <View style={styles.userBubble}>
                            <Text style={styles.userText}>{transcript}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Results Section (Draggable) */}
                {products.length > 0 && (state === 'results' || state === 'speaking' || state === 'idle') && (
                    <Animated.View style={[styles.resultsWrapper, sheetStyle]}>
                        {/* Handle Bar - Only this area is draggable */}
                        <GestureDetector gesture={panGesture}>
                            <View style={styles.handleArea}>
                                <View style={styles.resultsHandle} />
                                <Text style={[styles.resultsTitle, { color: theme.text }]}>منتجات مقترحة لكِ ✨</Text>
                            </View>
                        </GestureDetector>

                        <FlatList
                            data={products}
                            renderItem={renderProduct}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            showsVerticalScrollIndicator={true}
                            columnWrapperStyle={styles.productRow}
                            contentContainerStyle={styles.listPadding}
                            scrollEnabled={true}
                            nestedScrollEnabled={true}
                        />
                    </Animated.View>
                )}

                {state === 'idle' && products.length === 0 && (
                    <View style={styles.demoControls}>
                        <Text style={[styles.demoLabel, { color: theme.textSecondary }]}>اختبار سريع (تجريبي):</Text>
                        <View style={styles.demoButtons}>
                            <TouchableOpacity
                                style={[styles.demoBtn, { borderColor: theme.primary }]}
                                onPress={() => handleDemoScenario("أريد سيروم للبشرة الدهنية")}
                            >
                                <Text style={[styles.demoBtnText, { color: theme.primary }]}>سيروم دهني</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.demoBtn, { borderColor: theme.primary }]}
                                onPress={() => handleDemoScenario("كريم مرطب للبشرة الجافة")}
                            >
                                <Text style={[styles.demoBtnText, { color: theme.primary }]}>مرطب جاف</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.demoBtn, { borderColor: theme.primary }]}
                                onPress={() => handleDemoScenario("شيء لمكافحة التجاعيد")}
                            >
                                <Text style={[styles.demoBtnText, { color: theme.primary }]}>تجاعيد</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Manual Input Fallback */}
                        <View style={styles.inputArea}>
                            <TextInput
                                style={[styles.manualInput, { color: theme.text, borderColor: theme.border }]}
                                placeholder="اكتبي سؤالكِ هنا..."
                                placeholderTextColor={theme.textMuted}
                                value={inputQuery}
                                onChangeText={setInputQuery}
                                onSubmitEditing={() => {
                                    if (inputQuery.trim()) {
                                        handleVoiceInput(inputQuery);
                                        setInputQuery('');
                                    }
                                }}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: theme.primary }]}
                                onPress={() => {
                                    if (inputQuery.trim()) {
                                        handleVoiceInput(inputQuery);
                                        setInputQuery('');
                                    }
                                }}
                            >
                                <Ionicons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {state === 'idle' && !transcript && products.length === 0 && (
                    <View style={styles.hintBox}>
                        <Text style={[styles.hintText, { color: theme.textMuted }]}>
                            اضغطي على الميكروفون للحدث أو استعملي الأزرار أعلاه للاختبار
                        </Text>
                    </View>
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    visualizerContainer: {
        height: height * 0.28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusUnderMic: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
    },
    pulseCircle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#B76E79',
    },
    micButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    textContainer: {
        paddingHorizontal: 25,
        alignItems: 'center',
        marginTop: 20,
    },
    aiBubble: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 20,
        borderRadius: 25,
        borderBottomLeftRadius: 5,
        maxWidth: '90%',
        marginBottom: 15,
    },
    aiText: {
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'center',
        fontWeight: '600',
    },
    userBubble: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderBottomRightRadius: 2,
    },
    userText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#666',
    },
    resultsWrapper: {
        position: 'absolute', // Added absolute position
        bottom: 0,            // Anchored to bottom
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
        zIndex: 100, // Ensure it's on top
    },
    resultsHandle: {
        width: 60, // Wider handle
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    handleArea: {
        paddingBottom: 10,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 15,
        paddingLeft: 10,
    },
    productRow: {
        justifyContent: 'space-between',
    },
    gridItem: {
        width: (width - 50) / 2,
        marginBottom: 15,
    },
    listPadding: {
        paddingBottom: 40,
    },
    hintBox: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        alignItems: 'center',
    },
    hintText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    demoControls: {
        marginHorizontal: 30,
        marginTop: 20,
        alignItems: 'center',
    },
    demoLabel: {
        fontSize: 12,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    demoButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    demoBtn: {
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    demoBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 25,
        width: '100%',
        gap: 10,
    },
    manualInput: {
        flex: 1,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        borderWidth: 1,
    },
    sendBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    }
});
