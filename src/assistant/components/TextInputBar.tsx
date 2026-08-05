/**
 * TextInputBar — شريط الإدخال النصي لمساعد كتارا
 *
 * تصميم زجاجي (Glassmorphism) يتناسق مع هوية التطبيق.
 *
 * الميزات:
 *  - ظهور بـ SlideInUp animation ناعمة
 *  - Placeholder بالعربية مع إشارة RTL
 *  - زر إرسال يضيء عند وجود نص
 *  - Submit بـ Return key على لوحة المفاتيح
 *  - تنظيف الحقل بعد الإرسال
 *  - دعم كامل لـ KeyboardAvoidingView (يُدار من الـ Parent)
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  SlideInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const GOLD = '#D4AF76';

interface TextInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  onVoiceToggle?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TextInputBar: React.FC<TextInputBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  isLoading = false,
  placeholder,
  onVoiceToggle,
}) => {
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);
  const hasText = value.trim().length > 0;

  // Focus the input when the bar mounts
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale animation on send button
    sendScale.value = withSpring(0.85, { damping: 10 }, () => {
      sendScale.value = withSpring(1, { damping: 12 });
    });

    onSubmit(trimmed);
  };

  const sendBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
    opacity: withTiming(hasText ? 1 : 0.4, { duration: 180 }),
  }));

  const localePlaceholder = placeholder ?? 'اكتب ما تبحث عنه...';

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20).stiffness(180)}
      style={styles.container}
    >
      {/* Gold gradient border */}
      <LinearGradient
        colors={['rgba(212,175,118,0.65)', 'rgba(212,175,118,0.15)', 'rgba(212,175,118,0.45)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderGradient}
      >
        <BlurView intensity={40} tint="dark" style={styles.blurInner}>
          {/* Subtle inner shimmer */}
          <LinearGradient
            colors={['rgba(212,175,118,0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Voice Toggle Button */}
          {onVoiceToggle && (
            <Pressable
              onPress={onVoiceToggle}
              style={styles.voiceToggleBtn}
              accessibilityLabel="تحدث بصوتك"
              accessibilityRole="button"
            >
              <Ionicons
                name="mic-outline"
                size={20}
                color={GOLD}
              />
            </Pressable>
          )}

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={localePlaceholder}
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            textAlign="right"
            selectionColor={GOLD}
            editable={!isLoading}
          />

          {/* Send Button */}
          <AnimatedPressable
            onPress={handleSubmit}
            disabled={!hasText || isLoading}
            style={[styles.sendBtn, sendBtnStyle]}
            accessibilityLabel="إرسال"
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={GOLD} />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={hasText ? GOLD : 'rgba(212,175,118,0.35)'}
              />
            )}
          </AnimatedPressable>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  borderGradient: {
    borderRadius: 26,
    padding: 1.5,
  },
  blurInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(12, 9, 18, 0.55)',
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: '#F0EBF4',
    fontSize: 15,
    fontWeight: '500',
    textAlignVertical: 'center',
    paddingVertical: 0,
    writingDirection: 'rtl',
    letterSpacing: 0.2,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 8,
    backgroundColor: 'rgba(212,175,118,0.1)',
  },
  voiceToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 8,
    backgroundColor: 'rgba(212,175,118,0.1)',
  },
});

export default TextInputBar;
