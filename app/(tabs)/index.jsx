/**
 * 🌙 COSMIC LUXURY HOME SCREEN - Kataraa
 * Next-Generation Beauty App - Ethereal, Floating, Cinematic
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';

// Services & Context

import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useCategories, useProducts } from '../../src/hooks/useProducts';
import { useTranslation } from '../../src/hooks/useTranslation';

// Components
import DrawerMenu from '../../src/components/DrawerMenu';
import ProductCardSoko from '../../src/components/ProductCardSoko'; // Use Standardized Card
import SearchHeader from '../../src/components/SearchHeader';
import { BannerSkeleton, CategorySkeleton, ProductSkeleton } from '../../src/components/SkeletonLoader';
import { Text } from '../../src/components/ui'; // UI Kit
import AppBackground from '../../src/components/ui/AppBackground';
import { formatForState } from '../../src/utils/productUtils';
import Assistant3D from '../../src/components/Assistant3D';
import AssistantChatModal from '../../src/components/AssistantChatModal';


const { width, height } = Dimensions.get('window');

// ============================================
// 🤖 3D AVATAR HERO + ASSISTANT  
// ============================================

// Hosted Three.js page that loads the model - works on both web & native
const MODEL_VIEWER_URL = 'https://kataraa.com/wp-content/uploads/bot-viewer/index.html';

// Inline HTML with Three.js for native WebView (loads the GLB from asset URI)
const getModelHtml = (modelUri, isDark, isOnWeb) => `
<!DOCTYPE html><html><head>
<meta charset="utf-8">
${isOnWeb && typeof window !== 'undefined' ? '<base href="' + window.location.origin + '/" />' : ''}
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body,html{width:100%;height:100%;overflow:hidden;background:transparent}
canvas{display:block}
#loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  color:${isDark ? '#E6C5C5' : '#B76E79'};font-family:sans-serif;font-size:13px;
  text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.sp{width:28px;height:28px;border:3px solid rgba(183,110,121,0.2);
  border-top-color:#B76E79;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body>
<div id="loading"><div class="sp"></div><span>جاري التحضير...</span></div>
<script>
window.onerror = function(m,s,l,c,e) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({error: m, line: l})); }; let scene,camera,renderer,model,mixer,clock=new THREE.Clock();
function init(){
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,0.1,2000);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.setClearColor(0,0);
  document.body.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff,1.5));
  const d=new THREE.DirectionalLight(0xffffff,1.8);d.position.set(3,5,5);scene.add(d);
  const p=new THREE.PointLight(0xB76E79,2.5,15);p.position.set(-2,1,3);scene.add(p);
  new THREE.GLTFLoader().load('${modelUri}',gltf=>{
    model=gltf.scene;scene.add(model);
    document.getElementById('loading').style.display='none';
    const b=new THREE.Box3().setFromObject(model);
    const c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());
    model.position.set(-c.x,-c.y,-c.z);
    const piv=new THREE.Group();scene.add(piv);piv.add(model);model=piv;
    camera.position.z=Math.max(s.x,s.y,s.z)*1.5;
    if(gltf.animations.length){const mx=new THREE.AnimationMixer(gltf.scene);mx.clipAction(gltf.animations[0]).play();mixer=mx;}
    animate();
  },null,e=>console.error('GLB load error:',e));
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}
function animate(){requestAnimationFrame(animate);if(mixer)mixer.update(clock.getDelta());if(model){model.rotation.y+=0.008;model.position.y=Math.sin(clock.getElapsedTime()*1.2)*0.025;}renderer.render(scene,camera);}
window.onload=init;
</script></body></html>
`;

// Beautiful animated fallback for web (when WebView/model can't load)
const BotAnimationWeb = ({ tokens, isDark, onPress }) => {
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const float = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(withSequence(
      withTiming(1.3, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
    ), -1, false);
    pulse2.value = withRepeat(withSequence(
      withTiming(1.6, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
    ), -1, false);
    float.value = withRepeat(withSequence(
      withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
    ), -1, false);
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: 2.3 - pulse1.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: 2.6 - pulse2.value,
  }));
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const primary = tokens?.colors?.primary || '#D4AF76';

  return (
    <TouchableOpacity style={avatarStyles.botWebContainer} onPress={onPress} activeOpacity={0.9}>
      {/* Pulsing rings */}
      <Animated.View style={[avatarStyles.ring, avatarStyles.ring2, { borderColor: primary + '30' }, ring2Style]} />
      <Animated.View style={[avatarStyles.ring, avatarStyles.ring1, { borderColor: primary + '50' }, ring1Style]} />
      {/* Floating avatar orb */}
      <Animated.View style={floatStyle}>
        <LinearGradient
          colors={[primary, isDark ? '#8B5E7A' : '#C4956A']}
          style={[avatarStyles.botOrb, { shadowColor: primary }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={avatarStyles.botOrbIcon}>🤖</Text>
        </LinearGradient>
      </Animated.View>
      <Text style={[avatarStyles.tapLabel, { color: tokens?.colors?.textMuted }]}>اضغط للتحدث مع المساعد</Text>
    </TouchableOpacity>
  );
};

const FloatingAssistant = React.memo(({ tokens, isDark }) => {
  const router = useRouter();
  const navigation = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: isChatOpen ? 'none' : 'flex' },
    });
  }, [isChatOpen, navigation]);
  const [isAutoOpen, setIsAutoOpen] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelAnimation, setModelAnimation] = useState('Wave');
  
  const autoOpenTimeoutRef = useRef(null);
  const autoCloseTimeoutRef = useRef(null);
  const isAutoOpenedRef = useRef(false);
  
  const primary = tokens?.colors?.primary || '#D4AF76';

  // Gesture Pull states
  const pullX = useSharedValue(0);
  const pullY = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const handleOpen = () => {
    if (!isModelLoaded) return; // Prevent opening if not loaded
    if (autoOpenTimeoutRef.current) clearTimeout(autoOpenTimeoutRef.current);
    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    setIsAutoOpen(false);
    setIsOpen(true);
    setModelAnimation('Wave');
    setTimeout(() => {
      setModelAnimation('Idle');
    }, 3000);
  };

  const dragGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      if (event.translationX < 0) {
        pullX.value = event.translationX;
      }
      pullY.value = offsetY.value + event.translationY;
    })
    .onEnd((event) => {
      isDragging.value = false;
      offsetY.value = pullY.value; // persist vertical position
      
      if (event.translationX < -60) {
        pullX.value = withTiming(0, { duration: 300 });
        if (isModelLoaded) {
           runOnJS(handleOpen)();
        }
      } else {
        pullX.value = withTiming(0, { duration: 300 });
      }
    });

  const tabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pullX.value }, { translateY: pullY.value }],
  }));

  // Animations
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const floatY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const glow = useSharedValue(0.4);

  const handleModelLoaded = () => {
    if (isModelLoaded) return;
    console.log('[FloatingAssistant] 3D Model loaded successfully.');
    setIsModelLoaded(true);

    // Only run the auto-welcome sequence once on first mount
    if (!isAutoOpenedRef.current) {
      isAutoOpenedRef.current = true;
      
      // Wait 800ms after 3D model is ready, then slide open and show bubble
      autoOpenTimeoutRef.current = setTimeout(() => {
        setIsAutoOpen(true);
        setIsOpen(true);
        setModelAnimation('Wave');
      }, 800);

      // Switch animation to Idle after 3.2 seconds from start (visible for 2.4s of waving)
      setTimeout(() => {
        setModelAnimation('Idle');
      }, 3200);

      // Auto-close after 4.8 seconds
      autoCloseTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        setIsAutoOpen(false);
      }, 4800);
    }
  };

  useEffect(() => {
    // Fallback timer: if the model load event hasn't fired in 15 seconds, force-open the welcome intro!
    const fallbackTimer = setTimeout(() => {
      if (!isAutoOpenedRef.current) {
        console.log('[FloatingAssistant] Fallback timer triggered.');
        handleModelLoaded();
      }
    }, 15000);

    // Pulse rings & spin animation
    pulse1.value = withRepeat(withSequence(
      withTiming(1.35, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
    ), -1, false);
    pulse2.value = withRepeat(withSequence(
      withTiming(1.7, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
    ), -1, false);
    floatY.value = withRepeat(withSequence(
      withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
    ), -1, false);
    rotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1, false
    );
    glow.value = withRepeat(withSequence(
      withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
    ), -1, false);

    return () => {
      clearTimeout(fallbackTimer);
      if (autoOpenTimeoutRef.current) clearTimeout(autoOpenTimeoutRef.current);
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setIsAutoOpen(false);
    if (autoOpenTimeoutRef.current) clearTimeout(autoOpenTimeoutRef.current);
    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
  };

  const handleTalk = () => {
    setIsOpen(false);
    setIsAutoOpen(false);
    setIsChatOpen(true);
    if (autoOpenTimeoutRef.current) clearTimeout(autoOpenTimeoutRef.current);
    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
  };

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: 2.35 - pulse1.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: 2.7 - pulse2.value,
  }));
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <>
      {/* Closed State UI: Sleek Side tab with gesture detector */}
      {!isOpen && !isChatOpen && (
        <GestureDetector gesture={dragGesture}>
          <Animated.View style={[avatarStyles.sideTabContainer, tabAnimatedStyle]}>
            <TouchableOpacity
              onPress={handleOpen}
              activeOpacity={0.8}
              style={avatarStyles.sideTabButton}
            >
              <LinearGradient
                colors={[primary, isDark ? '#8B5E7A' : '#C4956A']}
                style={avatarStyles.sideTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                {!isModelLoaded ? (
                  <ActivityIndicator size="small" color="#FFF" style={{ marginBottom: 2 }} />
                ) : (
                  <Text style={avatarStyles.sideTabChevron}>‹</Text>
                )}
                <Text style={avatarStyles.sideTabText}>AI</Text>
                <View style={[avatarStyles.sideTabDot, { backgroundColor: isModelLoaded ? '#4CAF50' : '#FFC107' }]} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      )}

      {/* Open State UI panel */}
      {isOpen && (
        <View style={avatarStyles.floatingWrapperOpen} pointerEvents="box-none">
          {isAutoOpen && (
            <Animated.View 
              entering={FadeInDown.duration(400)}
              style={[
                avatarStyles.speechBubble, 
                { 
                  backgroundColor: isDark ? 'rgba(44, 44, 44, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(212, 175, 118, 0.2)',
                  borderWidth: 1
                }
              ]}
            >
              <Text style={[avatarStyles.speechText, { color: isDark ? '#FFF' : '#2C2C2C' }]}>
                أنا مساعدك الذكي، إذا احتجتني أنا هنا! 🤖✨
              </Text>
              <View style={[avatarStyles.speechPointer, { borderTopColor: isDark ? 'rgba(44, 44, 44, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]} />
            </Animated.View>
          )}
          {!isAutoOpen && (
            <TouchableOpacity
              style={avatarStyles.talkButton}
              onPress={handleTalk}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[primary, isDark ? '#8B5E7A' : '#C4956A']}
                style={avatarStyles.talkButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={avatarStyles.talkButtonText}>تحدث معي 💬</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Persistent 3D WebView component (never unmounts, avoids reloading) */}
      <View 
        style={[
          avatarStyles.modelContainer,
          isOpen 
            ? avatarStyles.modelContainerVisible 
            : isChatOpen
              ? avatarStyles.modelContainerChatOpen
              : avatarStyles.modelContainerHidden
        ]}
        pointerEvents={(isOpen || isChatOpen) ? 'auto' : 'none'}
      >
        <Assistant3D onLoad={handleModelLoaded} animation={modelAnimation} />
        {isOpen && (
          <TouchableOpacity 
            style={avatarStyles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color={tokens.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <AssistantChatModal 
        visible={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onAvatarStateChange={setModelAnimation}
      />
    </>
  );
});

const avatarStyles = StyleSheet.create({
  sideTabContainer: {
    position: 'absolute',
    right: 0,
    top: height * 0.42,
    zIndex: 9999,
  },
  sideTabButton: {
    width: 32,
    height: 76,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4AF76',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  sideTabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    gap: 2,
  },
  sideTabChevron: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  sideTabText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  sideTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#fff',
    marginTop: 2,
  },
  floatingWrapper: {
    position: 'absolute',
    bottom: 110,
    right: 20, // Move to right side
    zIndex: 9999,
    alignItems: 'center',
  },
  floatingWrapperOpen: {
    position: 'absolute',
    bottom: 265, // Position ABOVE the model container (which ends at bottom: 110 + height: 150 = 260)
    right: 20,
    width: 110,
    zIndex: 10000,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5, // Top-right corner of model container
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonOpen: {
    width: 110,
    height: 150,
    backgroundColor: 'transparent',
  },
  modelContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  modelContainerVisible: {
    bottom: 110,
    right: 20,
    width: 110,
    height: 150,
    opacity: 1,
  },
  modelContainerHidden: {
    bottom: 110,
    right: -2000, // Move off-screen to prevent rendering issues and block clicks
    width: 110,
    height: 150,
    opacity: 0,
  },
  modelContainerChatOpen: {
    top: height * 0.05,
    left: width / 2 - 100,
    width: 200,
    height: 250,
    opacity: 1,
    zIndex: 10001,
    elevation: 10001,
  },
  talkButton: {
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#D4AF76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  talkButtonGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  talkButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  speechBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: 160,
    shadowColor: '#D4AF76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  speechText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 15,
  },
  speechPointer: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  pulseRingOuter: {
    width: 110,
    height: 110,
  },
  pulseRingInner: {
    width: 88,
    height: 88,
  },
  glowBg: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  floatingButtonClosed: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#D4AF76',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  spinRingGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  botIcon: {
    fontSize: 26,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  botSubIcon: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginTop: -2,
  },
  activeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  tapLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  // Old BotAnimationWeb styles kept
  botWebContainer: { alignItems: 'center', justifyContent: 'center', height: 180 },
  ring: { position: 'absolute', borderWidth: 2, borderRadius: 999 },
  ring1: { width: 90, height: 90 },
  ring2: { width: 120, height: 120 },
  botOrb: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#D4AF76', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },
  botOrbIcon: { fontSize: 28 },
});



// ============================================
// 🌙 COSMIC HERO SECTION (kept for fallback)
// ============================================
const CosmicHero = ({ onShopNow, tokens, styles, t, isDark }) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(40);

  // Hero background video - Kataraa brand video from website
  const player = useVideoPlayer('https://kataraa.com/wp-content/uploads/2025/07/a-little-magic-for-your-skin-1-1.mp4', (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 1200 });
    slideAnim.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <View style={styles.heroContainer}>
      <VideoView
        player={player}
        style={styles.heroImage}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Cosmic Overlay */}
      <View style={[StyleSheet.absoluteFillObject, styles.heroOverlayContainer]}>
        <LinearGradient
          colors={[
            'rgba(212,184,224,0.1)',
            isDark ? 'rgba(13,10,18,0.7)' : 'rgba(254,251,255,0.6)',
            isDark ? 'rgba(13,10,18,0.95)' : 'rgba(254,251,255,0.95)',
          ].filter(Boolean)}
          style={styles.heroOverlay}
        />

        <Animated.View style={[styles.heroContent, contentStyle]}>
          {/* Ethereal Badge */}
          <View style={styles.heroBadgeContainer}>
            <View style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(26,21,32,0.7)' : 'rgba(255,255,255,0.8)' }]}>
              <Text variant="label" style={{ color: tokens.colors.primary, letterSpacing: 1 }}>
                ✦ {t('heroSubtitle')}
              </Text>
            </View>
          </View>

          {/* Main Title */}
          <Text style={[styles.heroTitle, { color: tokens.colors.text }]}>
            {t('heroTitle')}
          </Text>

          {/* CTA Button */}
          <TouchableOpacity style={styles.heroButton} onPress={onShopNow}>
            <LinearGradient
              colors={[
                tokens?.colors?.primary || '#D4AF76',
                tokens?.colors?.primaryDark || '#B8924F'
              ]}
              style={styles.heroButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroButtonText}>{t('shopNow')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// ============================================
// 💎 FLOATING SKIN TYPE SELECTOR
// ============================================
const SkinTypeSection = ({ onSelect, tokens, styles, t, isDark }) => {
  const skinTypes = [
    { id: 'oily', name: t('oily'), icon: '💧', color: '#A8D8EA' },
    { id: 'dry', name: t('dry'), icon: '🍃', color: '#C9E4CA' },
    { id: 'mixed', name: t('mixed'), icon: '⚖️', color: '#E8DCC8' },
    { id: 'sensitive', name: t('sensitive'), icon: '🌸', color: '#F0D8E6' },
  ];

  return (
    <View style={styles.skinTypeSection}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={{ color: tokens.colors.primary, fontWeight: '600' }}>{t('viewAll')}</Text>
          <Ionicons name="arrow-back" size={14} color={tokens.colors.primary} />
        </TouchableOpacity>
        <Text variant="title" style={{ color: tokens.colors.text }}>
          {t('shopBySkin')} ✨
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.skinTypeList}
      >
        {skinTypes.map((type, index) => (
          <Animated.View
            key={type.id}
            entering={FadeInDown.delay(index * 100).springify()}
          >
            <TouchableOpacity
              style={styles.skinTypeCard}
              onPress={() => onSelect(type)}
            >
              <BlurView
                intensity={isDark ? 30 : 50}
                tint={isDark ? "dark" : "light"}
                style={styles.skinTypeBlur}
              >
                <View style={[styles.skinTypeIcon, { backgroundColor: type.color + '40' }]}>
                  <Text style={styles.skinTypeEmoji}>{type.icon}</Text>
                </View>
                <Text variant="label" style={{ color: tokens.colors.text }}>{type.name}</Text>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

// ============================================
// 🎯 ELEGANT SECTION HEADER
// ============================================
const ElegantSectionHeader = ({ title, subtitle, onViewAll, tokens, styles, t }) => (
  <View style={styles.elegantHeader}>
    <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll}>
      <Text style={{ color: tokens.colors.primary, fontWeight: '600' }}>{t('viewAll')}</Text>
      <Ionicons name="arrow-back" size={14} color={tokens.colors.primary} />
    </TouchableOpacity>
    <View style={styles.elegantTitleContainer}>
      <Text variant="title" style={{ color: tokens.colors.text }}>{title}</Text>
      {subtitle && <Text variant="caption" style={{ color: tokens.colors.textMuted }}>{subtitle}</Text>}
    </View>
  </View>
);

// ============================================
// ✨ COSMIC PROMO BANNER
// ============================================
const CosmicPromoBanner = ({ onPress, styles, tokens, t, isDark }) => (
  <TouchableOpacity style={styles.promoBanner} onPress={onPress}>
    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.promoBlur}>
      <LinearGradient
        colors={[
          (tokens?.colors?.primary || '#D4AF76') + '20',
          (tokens?.colors?.primaryDark || '#B8924F') + '30'
        ]}
        style={styles.promoGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.promoLeft}>
          <Text style={styles.promoEmoji}>✨</Text>
          <View>
            <Text variant="subtitle" style={{ color: tokens.colors.text }}>{t('flashSale')}</Text>
            <Text variant="caption" style={{ color: tokens.colors.textSecondary }}>
              {t('flashSaleSubtitle')}
            </Text>
          </View>
        </View>
        <View style={[styles.promoBtn, { backgroundColor: tokens.colors.primary + '30' }]}>
          <Text style={{ color: tokens.colors.primary, fontWeight: 'bold' }}>
            {t('shopNow')} ←
          </Text>
        </View>
      </LinearGradient>
    </BlurView>
  </TouchableOpacity>
);

// ============================================
// 🧪 COSMIC SKIN QUIZ BANNER
// ============================================
const CosmicQuizBanner = ({ onPress, tokens, styles, t, isDark }) => (
  <TouchableOpacity style={[styles.quizBannerContainer]} onPress={onPress} activeOpacity={0.95}>
    <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={styles.quizBannerBlur}>
      <LinearGradient
        colors={[
          (tokens?.colors?.primary || '#D4AF76') + '30',
          (tokens?.colors?.accent || '#E8B4B8') + '20'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quizBannerContent}
      >
        <View style={styles.quizBannerTxtBox}>
          <Text style={[styles.quizBannerTitle, { color: tokens.colors.text }]}>{t('takeSkinQuiz')}</Text>
          <Text style={[styles.quizBannerSub, { color: tokens.colors.textMuted }]}>{t('discoverYourRoutine')}</Text>
          <View style={[styles.quizBannerBtn, { backgroundColor: tokens.colors.primary }]}>
            <Text style={styles.quizBannerBtnTxt}>{t('shopNow')}</Text>
            <Ionicons name="sparkles" size={16} color="#FFF" />
          </View>
        </View>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.quizBannerIconBox}>
          <View style={[styles.quizIconCircle, { backgroundColor: tokens.colors.primary + '20' }]}>
            <Ionicons name="flask" size={40} color={tokens.colors.primary} />
          </View>
        </Animated.View>
      </LinearGradient>
    </BlurView>
  </TouchableOpacity>
);

// ============================================
// 🛒 PRODUCT CAROUSEL (Horizontal)
// ============================================
const ProductCarousel = React.memo(({ products, onProductPress, onAddToCart, onFavorite, isFavorite, styles }) => (
  <FlatList
    data={products}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.carouselContainer}
    keyExtractor={(item) => item.id.toString()}
    initialNumToRender={3}
    maxToRenderPerBatch={2}
    windowSize={5}
    removeClippedSubviews={Platform.OS === 'android'}
    renderItem={({ item }) => (
      <ProductCardSoko
        item={item}
        onPress={onProductPress}
        onAddToCart={onAddToCart}
        onFavorite={onFavorite}
        isFavorite={isFavorite(item.id)}
      />
    )}
  />
));

// ============================================
// 📦 FLOATING CATEGORY GRID
// ============================================

// Real categories from kataraa.com - Unified with products.jsx
const REAL_CATEGORIES = [
  { id: 'all', name: 'الكل', icon: '📦', color: '#E8D4F0' },
  { id: 'skincare', name: 'عناية بالبشرة', icon: '✨', color: '#D4B8E0' },
  { id: 'serum', name: 'سيروم', icon: '💧', color: '#D4B8E0' },
  { id: 'sunscreen', name: 'واقي الشمس', icon: '☀️', color: '#F0ECD8' },
  { id: 'moisturizer', name: 'مرطب للبشرة', icon: '✨', color: '#D8E6F0' },
  { id: 'cleanser', name: 'غسول', icon: '🧼', color: '#E0D8F0' },
  { id: 'toner', name: 'تونر', icon: '💦', color: '#E6D8F0' },
  { id: 'mask', name: 'ماسك للوجه', icon: '🎭', color: '#F0D8E6' },
  { id: 'eyecare', name: 'العناية بالعين', icon: '👁️', color: '#E8E4EC' },
  { id: 'haircare', name: 'العناية بالشعر', icon: '💇', color: '#E8DCC8' },
  { id: 'acne', name: 'حب الشباب', icon: '🎯', color: '#D4B8E0' },
  { id: 'antiaging', name: 'التجاعيد', icon: '⏳', color: '#F0D8E6' },
  { id: 'pads', name: 'مسحات', icon: '🧴', color: '#D8E6F0' },
  { id: 'makeup', name: 'المكياج', icon: '💄', color: '#F0D8E6' },
];

const CategoryGrid = ({ categories, onSelect, styles, tokens, t, isDark }) => {

  return (
    <View style={styles.categorySection}>
      <ElegantSectionHeader
        title={t('shopByCategory')}
        onViewAll={() => onSelect({ id: 'all' })}
        styles={styles}
        tokens={tokens}
        t={t}
      />
      <View style={styles.categoryGrid}>
        {REAL_CATEGORIES.map((cat, index) => (
          <Animated.View
            key={cat.id}
            entering={FadeInDown.delay(index * 50).springify()}
          >
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => onSelect(cat)}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={isDark ? 25 : 45}
                tint={isDark ? "dark" : "light"}
                style={styles.categoryBlur}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '50' }]}>
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                </View>
                <Text variant="label" style={{ color: tokens.colors.text, textAlign: 'center' }}>{cat.name}</Text>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// ============================================
// 🌟 WHY SHOP WITH US
// ============================================
const WhyShopWithUs = ({ tokens, styles, t, isDark }) => {
  const features = [
    { icon: 'shield-checkmark', title: t('guaranteed'), desc: t('guaranteedDesc') },
    { icon: 'cube', title: t('variety'), desc: t('varietyDesc') },
    { icon: 'star', title: t('experience'), desc: t('experienceDesc') },
    { icon: 'car', title: t('delivery'), desc: t('deliveryDesc') },
  ];

  return (
    <View style={styles.whySection}>
      <Text variant="title" style={{ color: tokens.colors.text, textAlign: 'center', marginBottom: 20 }}>
        {t('whyShop')} ✨
      </Text>
      <View style={styles.whyGrid}>
        {features.map((f, i) => (
          <Animated.View
            key={i}
            style={styles.whyCardContainer}
            entering={FadeInDown.delay(i * 100).springify()}
          >
            <BlurView intensity={isDark ? 25 : 45} tint={isDark ? "dark" : "light"} style={styles.whyCard}>
              <View style={[styles.whyIconContainer, { backgroundColor: tokens.colors.primary + '20' }]}>
                <Ionicons name={f.icon} size={22} color={tokens.colors.primary} />
              </View>
              <Text variant="body" weight="bold" style={{ color: tokens.colors.text, marginBottom: 4, textAlign: 'center' }}>{f.title}</Text>
              <Text variant="caption" style={{ color: tokens.colors.textMuted, textAlign: 'center' }}>{f.desc}</Text>
            </BlurView>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// ============================================
// 📱 MAIN HOME SCREEN
// ============================================

export default function HomeScreen() {
  const router = useRouter();
  const { cartItems, triggerAddToCart } = useCart();

  const { toggleFavorite, isFavorite } = useFavorites();
  const { tokens, isDark } = useTheme(); // Use tokens
  const { t } = useTranslation();
  const { addNotification, notifications } = useNotifications();

  const styles = getStyles(tokens, isDark);

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProducts(1, 100);
  const { data: categoriesData, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();

  const products = productsData || [];
  const categories = categoriesData?.filter(cat => cat.count > 0) || [];
  const loading = productsLoading || categoriesLoading;

  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && products.length > 0) {
      const hasArrivalNotif = notifications.some(n => n.type === 'arrival');
      if (!hasArrivalNotif) {
        addNotification('notifArrivalTitle', 'notifArrivalMsg', 'arrival');
      }
    }
  }, [loading, products.length, notifications.length]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchCategories()]);
    setRefreshing(false);
  }, [refetchProducts, refetchCategories]);



  const handleSearch = React.useCallback((query) => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  }, [router]);

  const handleProductPress = React.useCallback((item) => {
    router.push(`/product/${item.id}`);
  }, [router]);

  const handleAddToCart = React.useCallback((item, ref) => {
    const productData = formatForState(item);

    if (ref?.current) {
      ref.current.measureInWindow((x, y, btnWidth, btnHeight) => {
        triggerAddToCart(productData, { x: x + btnWidth / 2, y: y + btnHeight / 2 });
      });
    } else {
      triggerAddToCart(productData);
    }
  }, [triggerAddToCart]);

  const handleFavorite = React.useCallback((item) => {
    toggleFavorite(formatForState(item));
  }, [toggleFavorite]);

  // Memoized Filter functions
  const saleProducts = useMemo(() => products.filter(p => p.on_sale).slice(0, 12), [products]);
  const newArrivals = useMemo(() => products.slice(0, 12), [products]);
  const popularProducts = useMemo(() => [...products].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 12), [products]);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ✨ Cosmic Background Elements - hidden */}
      <AppBackground />

      {/* Drawer Menu */}
      <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Header */}
      <SearchHeader
        onSearch={handleSearch}
        onCartPress={() => router.push('/cart')}
        onNotificationPress={() => router.push('/notifications')}
        onMenuPress={() => router.push('/profile')}
        cartCount={cartItems.length}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tokens.colors.primary} />
        }
      >
        {/* 💎 Shop by Skin Type */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <SkinTypeSection onSelect={(type) => router.push(`/products?skin=${type.id}`)} tokens={tokens} styles={styles} t={t} isDark={isDark} />
        </Animated.View>

        {/* 🧪 Skin Quiz Banner */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <CosmicQuizBanner onPress={() => router.push('/skin-quiz')} tokens={tokens} styles={styles} t={t} isDark={isDark} />
        </Animated.View>

        {/* ✨ Promo Banner */}
        <Animated.View entering={FadeInDown.delay(400)}>
          {loading ? <BannerSkeleton /> : <CosmicPromoBanner onPress={() => router.push('/products?sale=true')} styles={styles} tokens={tokens} t={t} isDark={isDark} />}
        </Animated.View>

        {/* 🆕 New Arrivals */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <ElegantSectionHeader
            title={t('newArrivals')}
            subtitle={t('newArrivalsSub')}
            onViewAll={() => router.push('/products')}
            tokens={tokens}
            styles={styles}
            t={t}
          />
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
              {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
            </ScrollView>
          ) : (
            <ProductCarousel
              products={newArrivals}
              onProductPress={handleProductPress}
              onAddToCart={handleAddToCart}
              onFavorite={handleFavorite}
              isFavorite={isFavorite}
              styles={styles}
            />
          )}
        </Animated.View>

        {/* 🔥 On Sale */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <ElegantSectionHeader
            title={t('onSale')}
            subtitle={t('onSaleSub')}
            onViewAll={() => router.push('/products?sale=true')}
            tokens={tokens}
            styles={styles}
            t={t}
          />
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
              {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
            </ScrollView>
          ) : (
            <ProductCarousel
              products={saleProducts}
              onProductPress={handleProductPress}
              onAddToCart={handleAddToCart}
              onFavorite={handleFavorite}
              isFavorite={isFavorite}
              styles={styles}
            />
          )}
        </Animated.View>

        {/* 📦 Shop by Category */}
        <Animated.View entering={FadeInDown.delay(700)}>
          {loading ? (
            <View style={styles.categorySection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                {[1, 2, 3, 4, 5].map(i => <CategorySkeleton key={i} />)}
              </ScrollView>
            </View>
          ) : (
            <CategoryGrid
              categories={categories}
              onSelect={(cat) => {
                if (cat.id === 'all') {
                  router.push('/products');
                } else {
                  router.push(`/products?category=${cat.id}`);
                }
              }}
              styles={styles}
              tokens={tokens}
              t={t}
              isDark={isDark}
            />
          )}
        </Animated.View>

        {/* ⭐ Popular Products */}
        <Animated.View entering={FadeInDown.delay(800)} style={styles.section}>
          <ElegantSectionHeader
            title={t('bestSellers')}
            subtitle={t('bestSellersSub')}
            onViewAll={() => router.push('/products')}
            tokens={tokens}
            styles={styles}
            t={t}
          />
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
              {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
            </ScrollView>
          ) : (
            <ProductCarousel
              products={popularProducts}
              onProductPress={handleProductPress}
              onAddToCart={handleAddToCart}
              onFavorite={handleFavorite}
              isFavorite={isFavorite}
              styles={styles}
            />
          )}
        </Animated.View>

        {/* 🌟 Why Shop With Us */}
        <WhyShopWithUs tokens={tokens} styles={styles} t={t} isDark={isDark} />

        {/* Newsletter CTA - Glass Style */}
        <View style={styles.newsletterSection}>
          <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.newsletterBlur}>
            <LinearGradient
              colors={[tokens.colors.primary + '20', tokens.colors.primaryDark + '30']}
              style={styles.newsletterGradient}
            >
              <Text style={styles.newsletterEmoji}>💌</Text>
              <Text variant="title" style={{ color: tokens.colors.text, marginBottom: 8 }}>{t('joinFamily')}</Text>
              <Text variant="body" style={{ color: tokens.colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>{t('joinFamilySub')}</Text>
              <TouchableOpacity style={styles.newsletterBtn}>
                <LinearGradient
                  colors={[tokens.colors.primary, tokens.colors.primaryDark]}
                  style={styles.newsletterBtnGradient}
                >
                  <Text style={styles.newsletterBtnText}>{t('subscribe')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Footer Space */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating 3D Assistant */}
      <FloatingAssistant tokens={tokens} isDark={isDark} />
    </View>
  );
}

// ============================================
// 🎨 COSMIC LUXURY STYLES
// ============================================
const getStyles = (tokens, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // ✨ Premium Background Pattern - HIGHLY VISIBLE
  bgOrb1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: isDark ? 'rgba(102, 126, 234, 0.35)' : 'rgba(102, 126, 234, 0.45)', // Purple - VERY VISIBLE
    zIndex: 0, // Above background
  },
  bgOrb2: {
    position: 'absolute',
    bottom: 50,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: isDark ? 'rgba(212, 175, 118, 0.30)' : 'rgba(212, 175, 118, 0.40)', // Gold - VERY VISIBLE
    zIndex: 0, // Above background
  },
  bgOrb3: {
    position: 'absolute',
    top: height * 0.4,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: isDark ? 'rgba(138, 104, 148, 0.25)' : 'rgba(184, 146, 79, 0.35)', // Accent - VERY VISIBLE
    zIndex: 0, // Above background
  },

  // Hero
  heroContainer: {
    height: height * 0.48,
    position: 'relative',
    backgroundColor: '#000',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlayContainer: {
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  heroBadgeContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 24,
  },
  heroButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 16,
    gap: 10,
  },
  heroButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Skin Type Section
  skinTypeSection: {
    marginTop: 28,
    marginBottom: 20,
  },
  skinTypeList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  skinTypeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  skinTypeBlur: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.15)' : 'rgba(212,184,224,0.3)',
    borderRadius: 24,
  },
  skinTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  skinTypeEmoji: {
    fontSize: 26,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Elegant Header
  elegantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  elegantTitleContainer: {
    alignItems: 'flex-end',
  },

  // Promo Banner
  promoBanner: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  promoBlur: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.15)' : 'rgba(212,184,224,0.3)',
  },
  promoGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  promoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  promoEmoji: {
    fontSize: 32,
  },
  promoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },

  // Section
  section: {
    marginVertical: 12,
  },
  carouselContainer: {
    paddingHorizontal: 20,
  },

  // Category Grid
  categorySection: {
    marginVertical: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 48) / 4,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryBlur: {
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.1)' : 'rgba(212,184,224,0.2)',
    borderRadius: 20,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 22,
  },

  // Why Shop Section
  whySection: {
    marginHorizontal: 20,
    marginVertical: 24,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  whyCardContainer: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  whyCard: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.1)' : 'rgba(212,184,224,0.2)',
    borderRadius: 24,
  },
  whyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Newsletter
  newsletterSection: {
    marginHorizontal: 20,
    marginVertical: 28,
    borderRadius: 28,
    overflow: 'hidden',
  },
  newsletterBlur: {
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.15)' : 'rgba(212,184,224,0.3)',
    borderRadius: 28,
  },
  newsletterGradient: {
    padding: 36,
    alignItems: 'center',
  },
  newsletterEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  newsletterBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  newsletterBtnGradient: {
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  newsletterBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  // Quiz Banner Styles
  quizBannerContainer: { marginHorizontal: 20, marginBottom: 28, borderRadius: 28, overflow: 'hidden' },
  quizBannerBlur: { borderRadius: 28 },
  quizBannerContent: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingVertical: 28 },
  quizBannerTxtBox: { flex: 1, gap: 4 },
  quizBannerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  quizBannerSub: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  quizBannerBtn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start'
  },
  quizBannerBtnTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  quizBannerIconBox: { marginLeft: 16 },
  quizIconCircle: { width: 80, height: 80, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});
