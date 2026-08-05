/**
 * SuggestionChips — اقتراحات سريعة قابلة للتمرير
 *
 * تصميم مستوحى من Apple Intelligence:
 * - BlurView خلفية زجاجية لكل chip
 * - Gold gradient border
 * - Scale spring animation عند الضغط
 * - Staggered entrance animation
 * - تمرير أفقي ناعم
 */

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
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

import { getAssistantLocale } from '../core/localeService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuggestionChip {
  id:      string;
  icon:    string;
  label:   string;
  message: string;
}

export interface SuggestionChipsProps {
  /** Chips مخصصة — إذا لم تُمرَّر تُستخدم القائمة الافتراضية */
  chips?:    SuggestionChip[];
  onSelect:  (message: string) => void;
}

// ─── Default Chips ────────────────────────────────────────────────────────────

const DEFAULT_CHIPS: Record<'ar' | 'en', SuggestionChip[]> = {
  ar: [
    { id: 'best_products',  icon: '⭐', label: 'أفضل المنتجات',   message: 'أرني أفضل المنتجات' },
    { id: 'offers',         icon: '🏷️', label: 'العروض',           message: 'اعرض العروض والتخفيضات' },
    { id: 'hair_care',      icon: '💆', label: 'عناية بالشعر',    message: 'أرني منتجات عناية بالشعر' },
    { id: 'skin_care',      icon: '✨', label: 'عناية بالبشرة',   message: 'أرني منتجات عناية بالبشرة' },
    { id: 'open_cart',      icon: '🛍️', label: 'افتح السلة',      message: 'افتح السلة' },
  ],
  en: [
    { id: 'best_products',  icon: '⭐', label: 'Top Products',    message: 'Show me the top products' },
    { id: 'offers',         icon: '🏷️', label: 'Offers',          message: 'Show offers and discounts' },
    { id: 'hair_care',      icon: '💆', label: 'Hair Care',       message: 'Show me hair care products' },
    { id: 'skin_care',      icon: '✨', label: 'Skincare',        message: 'Show me skincare products' },
    { id: 'open_cart',      icon: '🛍️', label: 'Open Cart',       message: 'Open the cart' },
  ],
};

// ─── Single Chip ──────────────────────────────────────────────────────────────

const Chip: React.FC<{
  chip:      SuggestionChip;
  index:     number;
  onSelect:  (message: string) => void;
}> = ({ chip, index, onSelect }) => {
  // Entrance animation (staggered)
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(10);
  const scale      = useSharedValue(1);

  useEffect(() => {
    const delay = index * 55;
    opacity.value    = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 200 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 300 });
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    onSelect(chip.message);
  };

  return (
    <Animated.View style={entranceStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityLabel={chip.label}
        accessibilityRole="button"
      >
        {/* Gold gradient border wrapper */}
        <LinearGradient
          colors={['rgba(212,175,118,0.7)', 'rgba(212,175,118,0.2)', 'rgba(212,175,118,0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.borderGradient}
        >
          <BlurView intensity={25} tint="dark" style={styles.chipBlur}>
            {/* Inner subtle shimmer */}
            <LinearGradient
              colors={['rgba(212,175,118,0.12)', 'rgba(212,175,118,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.chipIcon}>{chip.icon}</Text>
            <Text style={styles.chipLabel}>{chip.label}</Text>
          </BlurView>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  chips,
  onSelect,
}) => {
  const locale = getAssistantLocale();
  const activeChips = chips || DEFAULT_CHIPS[locale] || DEFAULT_CHIPS.ar;

  // Section entrance
  const sectionOpacity = useSharedValue(0);
  useEffect(() => {
    sectionOpacity.value = withTiming(1, { duration: 400 });
  }, [sectionOpacity]);

  const sectionStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
  }));

  const labelText = locale === 'ar' ? 'اقتراحات سريعة' : 'Quick Suggestions';
  const labelStyle: { textAlign: 'left' | 'right'; writingDirection: 'ltr' | 'rtl' } = {
    textAlign: locale === 'ar' ? 'right' : 'left',
    writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
  };

  return (
    <Animated.View style={[styles.container, sectionStyle]}>
      {/* Label */}
      <Text style={[styles.label, labelStyle]}>{labelText}</Text>

      {/* Chips scrollable row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {activeChips.map((chip, index) => (
          <Chip
            key={chip.id}
            chip={chip}
            index={index}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    color:          'rgba(240,235,244,0.4)',
    fontSize:       11,
    fontWeight:     '500',
    textAlign:      'right',
    paddingHorizontal: 16,
    paddingBottom:   6,
    letterSpacing:  0.3,
    writingDirection: 'rtl',
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap:              8,
    flexDirection:    'row',
  },

  // Gradient border container
  borderGradient: {
    borderRadius: 22,
    padding:       1,        // 1px border via gradient padding
  },
  chipBlur: {
    flexDirection:    'row',
    alignItems:       'center',
    borderRadius:     21,
    paddingHorizontal: 14,
    paddingVertical:   8,
    gap:               6,
    overflow:          'hidden',
    backgroundColor:  'rgba(13,10,18,0.4)',
  },
  chipIcon: {
    fontSize: 15,
  },
  chipLabel: {
    color:       '#D4AF76',
    fontSize:    13,
    fontWeight:  '600',
    letterSpacing: 0.2,
  },
});

export default SuggestionChips;
