/**
 * VoiceButton — زر الصوت ثلاثي الحالات
 *
 * idle       → ميكروفون ساكن مع توهج خفيف
 * listening  → حلقات متوسعة + نقطة حمراء متحركة
 * processing → قرص دوار بـ gradient ذهبي
 *
 * واجهة فقط — بدون Speech Recognition
 */

import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { VoiceStatus } from '../types';

export interface VoiceButtonProps {
  status:  VoiceStatus;
  onPress: () => void;
  /** حجم الزر (default: 60) */
  size?:   number;
}

// ─── Expanding Ring (listening state) ─────────────────────────────────────────

const ListeningRing: React.FC<{ size: number; delay: number; color?: string }> = ({ size, delay, color = '#FF4444' }) => {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(2.2, { duration: 1400, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 1400 }),
        -1,
        false
      )
    );
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.listeningRing,
        style,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
      ]}
    />
  );
};

// ─── Spinning Arc (processing state) ─────────────────────────────────────────

const ProcessingArc: React.FC<{ size: number; color?: string }> = ({ size, color = '#D4AF76' }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.processingArc,
        style,
        {
          width:        size + 8,
          height:       size + 8,
          borderRadius: (size + 8) / 2,
          borderTopColor: color,
        },
      ]}
    />
  );
};

// ─── Idle Glow ────────────────────────────────────────────────────────────────

const IdleGlow: React.FC<{ size: number; color?: string }> = ({ size, color = 'rgba(212,175,118,0.15)' }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.idleGlow,
        style,
        {
          width:        size + 20,
          height:       size + 20,
          borderRadius: (size + 20) / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
};

// ─── Red Recording Dot (listening) ────────────────────────────────────────────

const RecordingDot: React.FC<{ color?: string }> = ({ color = '#FF4444' }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 500 }),
        withTiming(1,   { duration: 500 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.recordingDot, style, { backgroundColor: color }]} />;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  status  = 'idle',
  onPress,
  size    = 60,
}) => {
  const pressScale = useSharedValue(1);

  const handlePressIn = () => {
    pressScale.value = withSpring(0.92, { damping: 12, stiffness: 300 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Icon based on state
  const iconName =
    status === 'listening'  ? 'mic'         :
    status === 'processing' ? 'ellipsis-horizontal' :
    status === 'executing'  ? 'sync'        :
    status === 'speaking'   ? 'volume-high' :
    status === 'error'      ? 'alert-circle' :
    'mic-outline';

  const iconColor =
    status === 'listening'  ? '#FFFFFF' :
    status === 'speaking'   ? '#FFFFFF' :
    status === 'error'      ? '#FFFFFF' :
    '#D4AF76';

  const buttonColors =
    status === 'listening'  ? ['#FF6666', '#CC2222'] :
    status === 'speaking'   ? ['#4CAF50', '#2E7D32'] :
    status === 'error'      ? ['#F44336', '#D32F2F'] :
    status === 'processing' || status === 'executing'
      ? ['#FFD54F', '#FFB300']
      : ['#F0D090', '#D4AF76', '#A07840'];

  return (
    <View style={[styles.wrapper, { width: size + 28, height: size + 28 }]}>
      {/* Idle / Speaking glow */}
      {status === 'idle' && <IdleGlow size={size} />}
      {status === 'speaking' && <IdleGlow size={size} color="rgba(76,175,80,0.15)" />}

      {/* Listening / Speaking rings */}
      {status === 'listening' && (
        <>
          <ListeningRing size={size} delay={0} color="#FF4444" />
          <ListeningRing size={size} delay={500} color="#FF4444" />
        </>
      )}
      {status === 'speaking' && (
        <>
          <ListeningRing size={size} delay={0} color="#4CAF50" />
          <ListeningRing size={size} delay={500} color="#4CAF50" />
        </>
      )}

      {/* Processing / Executing spinning arc */}
      {(status === 'processing' || status === 'executing') && (
        <ProcessingArc size={size} color={status === 'executing' ? '#FFB300' : '#D4AF76'} />
      )}

      {/* Main button */}
      <Animated.View style={pressStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          accessibilityLabel={
            status === 'idle'       ? 'ابدأ الإدخال الصوتي' :
            status === 'listening'  ? 'إيقاف الاستماع'      :
            status === 'speaking'   ? 'المساعد يتحدث'      :
            status === 'executing'  ? 'جاري التنفيذ'        :
            'جاري المعالجة'
          }
          accessibilityRole="button"
        >
          <LinearGradient
            colors={buttonColors as any}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
          >
            {/* Inner shimmer */}
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.6 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
            />
            <Ionicons name={iconName as any} size={size * 0.42} color={iconColor} />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Recording indicator dot */}
      {status === 'listening' && <RecordingDot />}
      {status === 'speaking' && <RecordingDot color="#4CAF50" />}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems:     'center',
  },

  // Idle glow
  idleGlow: {
    position:        'absolute',
    backgroundColor: 'rgba(212,175,118,0.15)',
  },

  // Listening rings
  listeningRing: {
    position:    'absolute',
    borderWidth: 1.5,
    borderColor: '#FF4444',
  },

  // Processing arc
  processingArc: {
    position:         'absolute',
    borderWidth:       3,
    borderColor:       'transparent',
    borderTopColor:    '#D4AF76',
    borderRightColor:  'rgba(212,175,118,0.4)',
  },

  // Button
  button: {
    justifyContent: 'center',
    alignItems:     'center',
    overflow:       'hidden',
    shadowColor:    '#D4AF76',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.5,
    shadowRadius:   14,
    elevation:      10,
  },

  // Recording dot
  recordingDot: {
    position:        'absolute',
    top:              2,
    right:            2,
    width:            10,
    height:           10,
    borderRadius:      5,
    backgroundColor:  '#FF4444',
    borderWidth:       1.5,
    borderColor:      '#1A1420',
  },
});

export default VoiceButton;
