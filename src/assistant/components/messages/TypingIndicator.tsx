/**
 * TypingIndicator — مؤشر "المساعد يكتب..."
 *
 * نسخة محدَّثة بـ Glassmorphism:
 * - BlurView فقاعة زجاجية
 * - AssistantAvatar (24px) بدل الأيقونة النصية
 * - نقاط بحركة ناعمة مع vertical bounce
 */

import { BlurView } from 'expo-blur';
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

import { AssistantAvatar } from '../AssistantAvatar';

// ─── Single Dot ───────────────────────────────────────────────────────────────

const Dot: React.FC<{ delay: number }> = ({ delay }) => {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0.35);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 360, easing: Easing.out(Easing.quad) }),
          withTiming( 0, { duration: 360, easing: Easing.in(Easing.quad)  })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1,    { duration: 360 }),
          withTiming(0.35, { duration: 360 })
        ),
        -1,
        false
      )
    );
  }, [delay, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const TypingIndicator: React.FC = () => (
  <View style={styles.wrapper}>
    {/* Mini avatar */}
    <AssistantAvatar size={24} status="thinking" />

    {/* Glass bubble */}
    <View style={styles.bubbleOuter}>
      <BlurView intensity={22} tint="dark" style={styles.bubbleBlur}>
        {/* Shimmer */}
        <LinearGradient
          colors={['rgba(212,175,118,0.12)', 'rgba(212,175,118,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Top highlight */}
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topHighlight}
        />
        <View style={styles.dotsRow}>
          <Dot delay={0}   />
          <Dot delay={180} />
          <Dot delay={360} />
        </View>
      </BlurView>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    paddingHorizontal: 16,
    marginVertical: 6,
    gap:            10,
  },

  // Bubble outer (border)
  bubbleOuter: {
    borderRadius:           22,
    borderBottomRightRadius: 5,
    borderWidth:             1,
    borderColor:             'rgba(212,175,118,0.28)',
    overflow:                'hidden',
    shadowColor:             '#D4AF76',
    shadowOffset:            { width: 0, height: 2 },
    shadowOpacity:           0.15,
    shadowRadius:            8,
    elevation:               4,
  },
  bubbleBlur: {
    paddingHorizontal: 20,
    paddingVertical:   14,
  },

  // Top highlight
  topHighlight: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   24,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           7,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: '#D4AF76',
  },
});
