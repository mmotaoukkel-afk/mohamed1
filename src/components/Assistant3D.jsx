import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { Text } from './ui';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const MODEL_VIEWER_URL =
  'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
const LOCAL_MODEL_PATH = 'assistant_model.glb';
const LOCAL_SCRIPT_PATH = 'model-viewer.min.js';

// ─────────────────────────────────────────────────────────
// HTML Template for model-viewer WebView
// ─────────────────────────────────────────────────────────
const getModelHtml = (modelFileName, scriptFileName) => `
<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
body,html{width:100%;height:100%;margin:0;padding:0;overflow:hidden;background:transparent}
model-viewer{width:100%;height:100%;background-color:transparent;outline:none;}
</style>
<script>
  (function() {
    function send(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      } else { setTimeout(() => send(msg), 100); }
    }
    window.send = send;

    window.onerror = function(message, source, lineno) {
      send({ type: 'error', message: String(message) + ' (line ' + lineno + ')' });
      return false;
    };

    let currentAnim = 'Wave';
    const startTime = Date.now();

    function handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'setAnimation') { currentAnim = data.name; }
      } catch(e) {}
    }
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    function tick() {
      requestAnimationFrame(tick);
      const viewer = document.querySelector('model-viewer');
      if (!viewer || !viewer.loaded) return;
      const elapsed = (Date.now() - startTime) / 1000;
      let roll = 0, pitch = 0, translateY = 0;
      if (currentAnim === 'Wave') {
        roll = Math.sin(elapsed * 8) * 0.15;
        pitch = Math.sin(elapsed * 4) * 0.05;
        translateY = Math.sin(elapsed * 6) * 0.08;
      } else {
        translateY = Math.sin(elapsed * 1.5) * 0.04;
        roll = Math.sin(elapsed * 0.8) * 0.02;
      }
      viewer.setAttribute('orientation', pitch + 'rad 0rad ' + roll + 'rad');
      viewer.setAttribute('translation', '0m ' + translateY + 'm 0m');
    }
    tick();

    function setupLoader() {
      const viewer = document.querySelector('model-viewer');
      if (viewer) {
        if (viewer.loaded) {
          send({ type: 'modelLoaded' });
        } else {
          viewer.addEventListener('load', () => send({ type: 'modelLoaded' }));
          viewer.addEventListener('error', (e) => send({ type: 'modelError', message: 'model-viewer load error' }));
        }
      } else { setTimeout(setupLoader, 50); }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupLoader);
    } else { setupLoader(); }
  })();
</script>
<script type="module" src="${scriptFileName}"></script>
</head><body>
<model-viewer
    src="${modelFileName}"
    autoplay
    camera-controls
    disable-zoom
    disable-pan
    shadow-intensity="1.5"
    environment-image="neutral"
    exposure="1.0"
    interaction-prompt="none"
></model-viewer>
</body></html>
`;

// ─────────────────────────────────────────────────────────
// Preloader (called from _layout.jsx on app start)
// ─────────────────────────────────────────────────────────
export async function preloadAssistantAssets() {
  try {
    if (Platform.OS === 'web') return;
    const asset = Asset.fromModule(require('../../assets/Model_1781099916662.glb'));
    const modelUri = asset.uri;
    const isDev = modelUri.startsWith('http://') || modelUri.startsWith('https://');
    if (isDev) return;

    // 1. Download & copy GLB model
    await asset.downloadAsync();
    const localUri = asset.localUri || asset.uri;
    const targetModelPath = `${FileSystem.documentDirectory}${LOCAL_MODEL_PATH}`;
    const modelInfo = await FileSystem.getInfoAsync(targetModelPath);
    if (!modelInfo.exists || (asset.size && modelInfo.size !== asset.size)) {
      if (modelInfo.exists) await FileSystem.deleteAsync(targetModelPath, { idempotent: true });
      await FileSystem.copyAsync({ from: localUri, to: targetModelPath });
    }

    // 2. Download model-viewer script
    const targetScriptPath = `${FileSystem.documentDirectory}${LOCAL_SCRIPT_PATH}`;
    const scriptInfo = await FileSystem.getInfoAsync(targetScriptPath);
    if (!scriptInfo.exists || scriptInfo.size === 0) {
      await FileSystem.downloadAsync(MODEL_VIEWER_URL, targetScriptPath);
    }
  } catch (err) {
    // Silent fail — the component will handle its own loading
    console.warn('[Assistant3D] Preload warning:', err?.message || err);
  }
}

// ─────────────────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────────────────
const SkeletonPulse = React.memo(() => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonCircle, { opacity }]} />
      <Animated.View style={[styles.skeletonBar, styles.skeletonBarShort, { opacity }]} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────────────────
const ErrorState = React.memo(({ onRetry, retryCount }) => (
  <View style={styles.center}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorText}>
      {retryCount >= MAX_RETRIES ? 'تعذّر التحميل' : 'خطأ في التحميل'}
    </Text>
    {retryCount < MAX_RETRIES && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.7}>
        <Text style={styles.retryText}>إعادة المحاولة</Text>
      </TouchableOpacity>
    )}
  </View>
));

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
const Assistant3D = React.memo(({ onLoad, animation = 'Wave' }) => {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const webViewRef = useRef(null);
  const mountedRef = useRef(true);

  const asset = useMemo(() => Asset.fromModule(require('../../assets/Model_1781099916662.glb')), []);
  const isDev = useMemo(() => {
    const uri = asset.uri;
    return uri.startsWith('http://') || uri.startsWith('https://');
  }, [asset]);

  // Prepare assets with retry support
  const prepareAssets = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoadError(null);

    try {
      if (Platform.OS === 'web' || isDev) {
        if (mountedRef.current) setIsReady(true);
        return;
      }
      await preloadAssistantAssets();
      if (mountedRef.current) setIsReady(true);
    } catch (err) {
      if (!mountedRef.current) return;
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      if (nextRetry < MAX_RETRIES) {
        // Auto-retry after delay
        setTimeout(() => { if (mountedRef.current) prepareAssets(); }, RETRY_DELAY_MS);
      } else {
        setLoadError(err?.message || 'Failed to load assets');
      }
    }
  }, [isDev, retryCount]);

  useEffect(() => {
    mountedRef.current = true;
    prepareAssets();
    return () => { mountedRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Send animation change message to WebView
  useEffect(() => {
    if (isReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'setAnimation', name: animation }));
    }
  }, [animation, isReady]);

  const config = useMemo(() => {
    if (Platform.OS === 'web') {
      return {
        baseUrl: '',
        modelSrc: asset.uri,
        scriptSrc: MODEL_VIEWER_URL,
      };
    }
    if (isDev) {
      const match = asset.uri.match(/^(https?:\/\/[^/]+)\/(.*)$/);
      if (match) return { baseUrl: match[1] + '/', modelSrc: match[2], scriptSrc: MODEL_VIEWER_URL };
    }
    return {
      baseUrl: FileSystem.documentDirectory,
      modelSrc: LOCAL_MODEL_PATH,
      scriptSrc: LOCAL_SCRIPT_PATH,
    };
  }, [isDev, asset]);

  const htmlContent = useMemo(() => getModelHtml(config.modelSrc, config.scriptSrc), [config]);

  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'modelLoaded') {
        if (onLoad) onLoad();
      } else if (data.type === 'modelError') {
        // WebView reported a model loading error
        if (mountedRef.current) setLoadError(data.message || 'Model viewer error');
      }
    } catch (e) { /* ignore parse errors */ }
  }, [onLoad]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setIsReady(false);
    setLoadError(null);
    setTimeout(() => prepareAssets(), 100);
  }, [prepareAssets]);

  // ── Web platform: use iframe ──
  if (Platform.OS === 'web') {
    return (
      <View style={styles.viewer}>
        <iframe
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
          title="AI Assistant"
        />
      </View>
    );
  }

  // ── Error state ──
  if (loadError) {
    return <ErrorState onRetry={handleRetry} retryCount={retryCount} />;
  }

  // ── Loading skeleton ──
  if (!isReady) {
    return <SkeletonPulse />;
  }

  // ── Main WebView ──
  return (
    <View style={styles.viewer}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent, baseUrl: config.baseUrl }}
        style={styles.webview}
        originWhitelist={['*']}
        bounces={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        transparent={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        injectedJavaScript="document.body.style.background='transparent';document.documentElement.style.background='transparent';true;"
        onMessage={handleWebViewMessage}
        onError={() => {
          if (mountedRef.current) setLoadError('WebView failed to load');
        }}
        renderLoading={() => <SkeletonPulse />}
        startInLoadingState={false}
      />
    </View>
  );
});

Assistant3D.displayName = 'Assistant3D';
export default Assistant3D;

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  viewer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  skeletonCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D4AF7640',
  },
  skeletonBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4AF7630',
  },
  skeletonBarShort: {
    width: 60,
  },
  errorIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 10,
    color: '#ff6b6b',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  retryButton: {
    backgroundColor: '#D4AF76',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});
