/**
 * AssistantHeader — رأس شاشة المساعد
 *
 * تصميم Apple Glass Header:
 * - BlurView خلفية زجاجية شفافة
 * - AssistantAvatar صغير (36px)
 * - اسم المساعد مع gradient shimmer
 * - مؤشر Online متحرك
 * - زر رجوع دائري
 */

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AssistantAvatar } from './AssistantAvatar';
import type { AvatarStatus } from './AssistantAvatar';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssistantHeaderProps {
  /** حالة المساعد الحالية */
  avatarStatus?: AvatarStatus;
  /** مخصص: استدعاء بديل لزر الرجوع */
  onBack?: () => void;
  /** نقر على الأفاتار (للحركة السرية) */
  onAvatarTap?: () => void;
}

// ─── Online Dot (pulsing green) ───────────────────────────────────────────────

const OnlineDot: React.FC = () => {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      false
    );
  }, [opacity, scale]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <View style={styles.dotContainer}>
      {/* Static dot */}
      <View style={styles.dotCore} />
      {/* Animated ring */}
      <Animated.View style={[styles.dotRing, dotStyle]} />
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  avatarStatus = 'idle',
  onBack,
  onAvatarTap,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
      {/* Subtle gold top border */}
      <LinearGradient
        colors={['rgba(212,175,118,0.5)', 'rgba(212,175,118,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorderLine}
      />

      <View style={styles.inner}>
        {/* ── Back Button ─────────────────────────────────────────── */}
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed,
          ]}
          accessibilityLabel="العودة"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-forward" size={20} color="#D4AF76" />
        </Pressable>

        {/* ── Center: Avatar + Name + Status ──────────────────────── */}
        <Pressable
          onPress={onAvatarTap}
          disabled={!onAvatarTap}
          style={styles.centerBlock}
        >
          <AssistantAvatar size={36} status={avatarStatus} />

          <View style={styles.nameBlock}>
            {/* Gradient name */}
            <LinearGradient
              colors={['#F0D090', '#D4AF76', '#B8942A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nameGradientWrap}
            >
              <Text style={styles.nameText}>كتارا</Text>
            </LinearGradient>

            {/* Status row */}
            <View style={styles.statusRow}>
              <OnlineDot />
              <Text style={styles.statusText}>متاح الآن</Text>
            </View>
          </View>
        </Pressable>

        {/* ── Right spacer (mirrors back button width) ─────────────── */}
        <View style={styles.spacer} />
      </View>
    </BlurView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  blurContainer: {
    borderBottomWidth:  1,
    borderBottomColor: 'rgba(212,175,118,0.1)',
    overflow:          'hidden',
  },
  topBorderLine: {
    height:   1,
    width:    '100%',
    opacity:  0.5,
  },
  inner: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   10,
  },

  // Back button
  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(212,175,118,0.1)',
    borderWidth:     1,
    borderColor:     'rgba(212,175,118,0.2)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  backBtnPressed: {
    backgroundColor: 'rgba(212,175,118,0.22)',
    transform:       [{ scale: 0.93 }],
  },

  // Center
  centerBlock: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  nameBlock: {
    alignItems: 'flex-end',
  },
  nameGradientWrap: {
    borderRadius: 4,
  },
  nameText: {
    fontSize:     17,
    fontWeight:   '700',
    color:        '#D4AF76',      // fallback (gradient clips the text)
    letterSpacing: 0.4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginTop:     3,
  },
  statusText: {
    color:      '#4CAF50',
    fontSize:   11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Online dot
  dotContainer: {
    width:          10,
    height:         10,
    justifyContent: 'center',
    alignItems:     'center',
  },
  dotCore: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: '#4CAF50',
    position:        'absolute',
  },
  dotRing: {
    width:        10,
    height:       10,
    borderRadius: 5,
    borderWidth:  1.5,
    borderColor:  '#4CAF50',
    position:     'absolute',
  },

  // Spacer
  spacer: {
    width: 40,
  },
});

export default AssistantHeader;
