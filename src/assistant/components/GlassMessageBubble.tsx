/**
 * GlassMessageBubble — فقاعة رسالة زجاجية
 *
 * نوعان:
 *   role='assistant' → BlurView + gold border + shimmer داخلي
 *   role='user'      → زجاج داكن + حدود بيضاء خفيفة
 *
 * كل فقاعة تدخل بـ Fade + SlideUp animation
 */

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { MessageRole } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlassMessageBubbleProps {
  role:    MessageRole;
  content: string;
  /** Delay before entrance animation starts (ms) */
  animDelay?: number;
}

// ─── Entrance Animation Wrapper ───────────────────────────────────────────────

const EntranceView: React.FC<{
  isUser:   boolean;
  delay:    number;
  children: React.ReactNode;
}> = ({ isUser, delay, children }) => {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(18);
  const translateX = useSharedValue(isUser ? -12 : 12);

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 180 }));
    translateX.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 180 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
};

// ─── Assistant Bubble ─────────────────────────────────────────────────────────

const AssistantBubble: React.FC<{ content: string }> = ({ content }) => (
  <BlurView intensity={28} tint="dark" style={styles.assistantBlur}>
    {/* Inner gold shimmer */}
    <LinearGradient
      colors={['rgba(212,175,118,0.1)', 'rgba(212,175,118,0.03)', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
    {/* Top highlight line */}
    <LinearGradient
      colors={['rgba(255,255,255,0.12)', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.topHighlight}
    />
    <Text style={styles.assistantText}>{content}</Text>
  </BlurView>
);

// ─── User Bubble ──────────────────────────────────────────────────────────────

const UserBubble: React.FC<{ content: string }> = ({ content }) => (
  <BlurView intensity={20} tint="dark" style={styles.userBlur}>
    {/* Subtle purple-dark shimmer */}
    <LinearGradient
      colors={['rgba(140,100,220,0.12)', 'rgba(80,60,140,0.06)', 'transparent']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
    <LinearGradient
      colors={['rgba(255,255,255,0.1)', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.topHighlight}
    />
    <Text style={styles.userText}>{content}</Text>
  </BlurView>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const GlassMessageBubble: React.FC<GlassMessageBubbleProps> = ({
  role,
  content,
  animDelay = 0,
}) => {
  const isUser = role === 'user';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      <EntranceView isUser={isUser} delay={animDelay}>
        <View style={isUser ? styles.userOuter : styles.assistantOuter}>
          {isUser
            ? <UserBubble content={content} />
            : <AssistantBubble content={content} />
          }
        </View>
      </EntranceView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const RADIUS = 22;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginVertical:     4,
  },
  wrapperUser: {
    alignItems: 'flex-start',   // RTL: user on left visually
  },
  wrapperAssistant: {
    alignItems: 'flex-end',     // RTL: assistant on right
  },

  // ── Assistant ──────────────────────────────────────────────────
  assistantOuter: {
    maxWidth:      '80%',
    borderRadius:  RADIUS,
    borderBottomRightRadius: 5,
    borderWidth:   1,
    borderColor:   'rgba(212,175,118,0.32)',
    overflow:      'hidden',
    // Outer glow shadow
    shadowColor:   '#D4AF76',
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius:  10,
    elevation:     6,
  },
  assistantBlur: {
    paddingHorizontal: 18,
    paddingVertical:   12,
  },
  assistantText: {
    color:            '#F0EBF4',
    fontSize:         15,
    lineHeight:       23,
    textAlign:        'right',
    writingDirection: 'rtl',
    fontWeight:       '400',
  },

  // ── User ────────────────────────────────────────────────────────
  userOuter: {
    maxWidth:      '80%',
    borderRadius:  RADIUS,
    borderBottomLeftRadius: 5,
    borderWidth:   1,
    borderColor:   'rgba(255,255,255,0.1)',
    overflow:      'hidden',
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius:  8,
    elevation:     4,
  },
  userBlur: {
    paddingHorizontal: 18,
    paddingVertical:   12,
    backgroundColor:   'rgba(30,24,44,0.6)',
  },
  userText: {
    color:            '#F0EBF4',
    fontSize:         15,
    lineHeight:       23,
    textAlign:        'right',
    writingDirection: 'rtl',
    fontWeight:       '400',
  },

  // Top highlight line on both bubbles
  topHighlight: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   30,
  },
});

export default GlassMessageBubble;
