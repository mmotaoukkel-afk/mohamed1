import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "@jamsch/expo-speech-recognition";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logQuery } from '../src/services/voiceAnalytics';


import ProductCardSoko from '../src/components/ProductCardSoko';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useFavorites } from '../src/context/FavoritesContext';
import { useTheme } from '../src/context/ThemeContext';
import { useTranslation } from '../src/hooks/useTranslation';
import { searchByVoice } from '../src/services/voiceProductSearch';
import { generateResponse, speakResponse, stopSpeaking } from '../src/services/voiceResponseService';

const getHtmlContent = (modelUri, isDark) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: transparent !important;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #loading {
      position: absolute;
      color: ${isDark ? '#E6C5C5' : '#B76E79'};
      font-family: sans-serif;
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
      transition: opacity 0.5s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(183, 110, 121, 0.2);
      border-top-color: #B76E79;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    #error-msg {
      position: absolute;
      color: #ff4d4d;
      font-family: sans-serif;
      font-size: 12px;
      text-align: center;
      padding: 20px;
      display: none;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <div id="canvas-container">
    <div id="loading">
      <div class="spinner"></div>
      <div id="loading-text">جاري تحضير مساعدكِ الذكي 3D...</div>
    </div>
    <div id="error-msg">فشل تحميل المساعد ثلاثي الأبعاد. تأكد من الاتصال بالإنترنت.</div>
  </div>

  <script>
    let scene, camera, renderer, model;
    let clock = new THREE.Clock();
    let currentAnimationState = 'idle';
    let targetScale = 1;
    let baseScale = 1;
    let pulseSpeed = 1;
    let bobbingAmount = 0.04;
    let bobbingSpeed = 1.5;

    const container = document.getElementById('canvas-container');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-msg');

    function init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(5, 10, 7);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
      fillLight.position.set(-5, 2, -5);
      scene.add(fillLight);

      const pointLight = new THREE.PointLight(0xB76E79, 1.5, 10);
      pointLight.position.set(0, -2, 2);
      scene.add(pointLight);

      const loader = new THREE.GLTFLoader();
      const modelUrl = "${modelUri}";

      loader.load(
        modelUrl,
        function(gltf) {
          model = gltf.scene;
          scene.add(model);
          loadingEl.style.opacity = 0;
          setTimeout(() => loadingEl.remove(), 500);

          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          model.position.x = -center.x;
          model.position.y = -center.y;
          model.position.z = -center.z;

          const pivot = new THREE.Group();
          scene.add(pivot);
          pivot.add(model);
          model = pivot;

          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov / 2));
          cameraZ *= 2.0;
          camera.position.z = cameraZ;
          camera.position.y = 0;
          camera.lookAt(new THREE.Vector3(0, 0, 0));

          baseScale = 1.0;
          model.scale.set(baseScale, baseScale, baseScale);

          animate();
        },
        function(xhr) {
          if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            document.getElementById('loading-text').innerText = "جاري تحميل المساعد ثلاثي الأبعاد... " + percent + "%";
          }
        },
        function(error) {
          console.error('An error happened loading GLTF:', error);
          loadingEl.style.display = 'none';
          errorEl.style.display = 'block';
        }
      );

      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = false;
      controls.autoRotate = false;

      window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          updateAnimationState(data.value);
        }
      } catch (e) {
        console.error("Error parsing postMessage data:", e);
      }
    });

    document.addEventListener("message", function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          updateAnimationState(data.value);
        }
      } catch (e) {
        console.error("Error parsing document message data:", e);
      }
    });

    function updateAnimationState(state) {
      currentAnimationState = state;
      switch(state) {
        case 'listening':
          targetScale = 1.15;
          pulseSpeed = 4.0;
          bobbingAmount = 0.15;
          bobbingSpeed = 4.0;
          break;
        case 'processing':
          targetScale = 1.0;
          pulseSpeed = 6.0;
          bobbingAmount = 0.05;
          bobbingSpeed = 6.0;
          break;
        case 'speaking':
          targetScale = 1.1;
          pulseSpeed = 2.5;
          bobbingAmount = 0.12;
          bobbingSpeed = 2.5;
          break;
        case 'error':
          targetScale = 0.9;
          pulseSpeed = 1.0;
          bobbingAmount = 0.02;
          bobbingSpeed = 1.0;
          break;
        case 'idle':
        default:
          targetScale = 1.0;
          pulseSpeed = 1.0;
          bobbingAmount = 0.04;
          bobbingSpeed = 1.5;
          break;
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      if (model) {
        let roll = 0;   // Z rotation (tilt left/right)
        let pitch = 0;  // X rotation (tilt forward/backward)
        let yaw = 0;    // Y rotation (turn left/right)
        let translateY = 0; // Y translation (bobbing)

        switch(currentAnimationState) {
          case 'listening':
            // Listening: Tilt forward slightly (attentive interest) + gentle tilt
            pitch = 0.15;
            roll = Math.sin(time * 3) * 0.05;
            translateY = Math.sin(time * 3.0) * 0.06;
            break;
          case 'processing':
            // Processing: Rotate left/right slightly (pondering)
            yaw = Math.sin(time * 4) * 0.1;
            translateY = Math.sin(time * 5.0) * 0.04;
            break;
          case 'speaking':
            // Speaking: Happy left-right tilting (welcome/speaking motion) + rapid bobbing
            roll = Math.sin(time * 8) * 0.12; 
            pitch = Math.sin(time * 4) * 0.04; 
            translateY = Math.sin(time * 6.0) * 0.08;
            break;
          case 'error':
            // Error: Shake head side-to-side (shaking "no")
            yaw = Math.sin(time * 12) * 0.25; 
            translateY = Math.sin(time * 1.5) * 0.02;
            break;
          case 'idle':
          default:
            // Idle: Gentle hover float
            translateY = Math.sin(time * 1.5) * 0.03;
            roll = Math.sin(time * 0.8) * 0.02;
            break;
        }

        // Apply rotations and translations
        model.rotation.x = pitch;
        model.rotation.y = yaw;
        model.rotation.z = roll;
        model.position.y = translateY;

        // Scaling interpolation
        const currentScale = model.scale.x;
        const scaleStep = (targetScale - currentScale) * 0.1;
        const newScale = currentScale + scaleStep;
        
        let pulse = 0;
        if (currentAnimationState === 'listening') {
          pulse = Math.sin(time * 10) * 0.02;
        } else if (currentAnimationState === 'speaking') {
          pulse = Math.sin(time * 8) * 0.03;
        }
        
        model.scale.set(newScale + pulse, newScale + pulse, newScale + pulse);
      }

      renderer.render(scene, camera);
    }

    window.onload = init;
  </script>
</body>
</html>
`;
};

const { width, height } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = height * 0.85; // Expanded height
const SHEET_MIN_HEIGHT = height * 0.45; // Collapsed height

export default function VoiceSearchScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { addToCart, triggerAddToCart } = useCart();
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
        if (event.error === 'no-speech') {
            setState('idle');
            return;
        }
        console.warn("Speech recognition error:", event.error, event.message);
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
                // continuous: true causes 'network' error on many Android devices
                continuous: false,
                // Android-specific options to improve stability
                androidIntentOptions: {
                    EXTRA_LANGUAGE_MODEL: 'free_form',
                    EXTRA_PARTIAL_RESULTS: true,
                }
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

            // Log to analytics
            logQuery(text, result.keywords, result.products.length);

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

    const handleAddToCart = (item, ref) => {
        if (ref?.current) {
            ref.current.measureInWindow((x, y, btnWidth, btnHeight) => {
                triggerAddToCart({
                    id: item.id,
                    name: item.name,
                    price: item.sale_price || item.price,
                    image: item.images?.[0]?.src,
                    quantity: 1,
                }, { x: x + btnWidth / 2, y: y + btnHeight / 2 });
            });
        } else {
            triggerAddToCart({
                id: item.id,
                name: item.name,
                price: item.sale_price || item.price,
                image: item.images?.[0]?.src,
                quantity: 1,
            });
        }
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
                            { backgroundColor: theme.primary, zIndex: 10, elevation: 10 },
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
                        <GestureDetector gesture={panGesture}>
                            <View style={styles.dragHandleContainer}>
                                {/* Handle Bar */}
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
        height: height * 0.42,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    webView3D: {
        width: width,
        height: height * 0.38,
        backgroundColor: 'transparent',
    },
    webView3DContainer: {
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 45,
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
        marginBottom: 20,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 10,
        paddingLeft: 10,
    },
    dragHandleContainer: {
        paddingTop: 15,
        paddingBottom: 5,
        width: '100%',
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
