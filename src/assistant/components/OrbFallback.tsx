import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvatarStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'executing'
  | 'speaking'
  | 'error'
  | 'thinking'
  | 'success';

export interface OrbFallbackProps {
  /** حجم الدائرة الرئيسية (default: 56) */
  size?: number;
  /** حالة المساعد الحالية */
  status?: AvatarStatus;
}

// ─── Color Configurations for States ──────────────────────────────────────────

const STATUS_CONFIG: Record<
  AvatarStatus,
  {
    gradient: [string, string, ...string[]];
    glowColor: string;
    ringColor: string;
    pulseDuration: number;
    pulseScale: number;
  }
> = {
  idle: {
    gradient: ['#F0D090', '#D4AF76', '#A07840'],
    glowColor: 'rgba(212, 175, 118, 0.35)',
    ringColor: 'rgba(212, 175, 118, 0.18)',
    pulseDuration: 2200,
    pulseScale: 1.08,
  },
  listening: {
    gradient: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'],
    glowColor: 'rgba(139, 92, 246, 0.6)',
    ringColor: 'rgba(236, 72, 153, 0.3)',
    pulseDuration: 1000,
    pulseScale: 1.22,
  },
  processing: {
    gradient: ['#8b5cf6', '#3b82f6', '#1e1b4b'],
    glowColor: 'rgba(59, 130, 246, 0.45)',
    ringColor: 'rgba(139, 92, 246, 0.25)',
    pulseDuration: 1500,
    pulseScale: 1.06,
  },
  thinking: {
    gradient: ['#8b5cf6', '#3b82f6', '#1e1b4b'],
    glowColor: 'rgba(59, 130, 246, 0.45)',
    ringColor: 'rgba(139, 92, 246, 0.25)',
    pulseDuration: 1500,
    pulseScale: 1.06,
  },
  executing: {
    gradient: ['#FFD700', '#FF8C00', '#FF4500'],
    glowColor: 'rgba(255, 140, 0, 0.6)',
    ringColor: 'rgba(255, 215, 0, 0.35)',
    pulseDuration: 800,
    pulseScale: 1.18,
  },
  speaking: {
    gradient: ['#10b981', '#06b6d4', '#2563eb'],
    glowColor: 'rgba(6, 182, 212, 0.55)',
    ringColor: 'rgba(16, 185, 129, 0.3)',
    pulseDuration: 1300,
    pulseScale: 1.15,
  },
  error: {
    gradient: ['#ef4444', '#b91c1c', '#450a0a'],
    glowColor: 'rgba(239, 68, 68, 0.5)',
    ringColor: 'rgba(185, 28, 28, 0.3)',
    pulseDuration: 2000,
    pulseScale: 1.05,
  },
  success: {
    gradient: ['#10b981', '#34d399', '#D4AF76'],
    glowColor: 'rgba(16, 185, 129, 0.45)',
    ringColor: 'rgba(52, 211, 153, 0.25)',
    pulseDuration: 1200,
    pulseScale: 1.15,
  },
};

// ─── Pulse Ring (outer breathing/active wave ring) ───────────────────────────

const PulseRing: React.FC<{
  size: number;
  delay?: number;
  status: AvatarStatus;
}> = ({ size, delay = 0, status }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  useEffect(() => {
    // Reset values on status change
    scale.value = 1;
    opacity.value = 0.6;

    const duration = config.pulseDuration;
    const maxScale = config.pulseScale + 0.28;

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(maxScale, { duration: duration, easing: Easing.out(Easing.quad) }),
          withTiming(1.0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: duration }),
          withTiming(0.6, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, [status, delay, config]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        animStyle,
        {
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          borderColor: config.ringColor,
        },
      ]}
    />
  );
};

// ─── Spinning Ring (thinking / processing state) ──────────────────────────────

const SpinningRing: React.FC<{ size: number; status: AvatarStatus }> = ({ size, status }) => {
  const rotation = useSharedValue(0);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  useEffect(() => {
    rotation.value = 0;
    const duration = status === 'processing' || status === 'thinking' ? 1400 : 2000;

    rotation.value = withRepeat(
      withTiming(360, { duration: duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [status]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.spinRing,
        animStyle,
        {
          width: size + 10,
          height: size + 10,
          borderRadius: (size + 10) / 2,
          borderColor: 'transparent',
          borderTopColor: config.ringColor,
          borderRightColor: 'rgba(255,255,255,0.05)',
        },
      ]}
    />
  );
};

// ─── Core Orb (the glowing center) ───────────────────────────────────────────

const Orb: React.FC<{ size: number; status: AvatarStatus }> = ({ size, status }) => {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.7);
  const rotation = useSharedValue(0);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  useEffect(() => {
    const duration = config.pulseDuration;
    const targetScale = config.pulseScale;

    // Breath scale animation
    glowScale.value = withRepeat(
      withSequence(
        withTiming(targetScale, { duration: duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Fade animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: duration }),
        withTiming(0.7, { duration: duration })
      ),
      -1,
      false
    );

    // Continuous rotation for fluid, dynamic states (listening, processing, speaking, executing)
    if (status !== 'idle' && status !== 'error') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 800 });
    }
  }, [status, config]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[orbStyle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Animated.View style={[gradientStyle, { width: size, height: size, borderRadius: size / 2 }]}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[
            styles.orbGradient,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          {/* Inner shimmer highlight */}
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
            start={{ x: 0.15, y: 0.1 }}
            end={{ x: 0.85, y: 0.8 }}
            style={[styles.innerShimmer, { borderRadius: size / 2 }]}
          />
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const OrbFallback: React.FC<OrbFallbackProps> = ({
  size = 56,
  status = 'idle',
}) => {
  const containerSize = size + 28; // room for outer rings
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <View
      style={[
        styles.container,
        { width: containerSize, height: containerSize },
      ]}
    >
      {/* Glow backdrop */}
      <View
        style={[
          styles.glowBackdrop,
          {
            width: size + 32,
            height: size + 32,
            borderRadius: (size + 32) / 2,
            backgroundColor: config.glowColor,
          },
        ]}
      />

      {/* Pulse rings (active on listening, speaking, executing, error, or idle breathing) */}
      <PulseRing size={size} delay={0} status={status} />
      {status !== 'error' && <PulseRing size={size} delay={700} status={status} />}

      {/* Spinning ring for processing, thinking, executing */}
      {(status === 'processing' || status === 'thinking' || status === 'executing') && (
        <SpinningRing size={size} status={status} />
      )}

      {/* Outer static ring */}
      <View
        style={[
          styles.staticRing,
          {
            width: size + 10,
            height: size + 10,
            borderRadius: (size + 10) / 2,
            borderColor: config.ringColor,
          },
        ]}
      />

      {/* Core orb */}
      <Orb size={size} status={status} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowBackdrop: {
    position: 'absolute',
    opacity: 0.22,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  spinRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  staticRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  orbGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#D4AF76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  innerShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default OrbFallback;
