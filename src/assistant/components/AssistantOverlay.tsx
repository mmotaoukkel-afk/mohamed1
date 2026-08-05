/**
 * AssistantOverlay — الواجهة الرئيسية لمساعد كتارا (v2 — Multimodal)
 *
 * يدعم وضعين للإدخال:
 *  🎤 Voice Mode  — Voice Orb + Speech Recognition (الافتراضي)
 *  ⌨️  Text Mode   — TextInputBar مع اقتراحات سريعة
 *
 * كلا الوضعين يرسلان النص إلى نفس sendMessage → IntentEngine → ActionExecutor
 * بدون أي منطق منفصل لكل نوع إدخال.
 *
 * السياق يُحفظ عبر AssistantContext فلا يُفقد عند التبديل بين الوضعين.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
  Platform,
  Keyboard,
  KeyboardEvent,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAssistantContext } from '../context/AssistantProvider';
import { useAssistant } from '../hooks/useAssistant';
import { useVoiceInput } from '../hooks/useVoiceInput';
import voiceOutputService from '../services/voiceOutputService';
import OrbFallback from './OrbFallback';
import { TextInputBar } from './TextInputBar';
import { SuggestionChips } from './SuggestionChips';
import { ProductCardMessage } from './messages/ProductCardMessage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAssistantLocale } from '../core/localeService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GOLD = '#D4AF76';

// ─── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<'ar' | 'en', Record<string, string>> = {
  ar: {
    idle:       'اضغط للتحدث مع كتارا 🎤',
    listening:  'أستمع إليك...',
    processing: 'جاري التفكير...',
    executing:  'جاري التنفيذ...',
    speaking:   'كتارا تتحدث...',
    error:      'حدث خطأ، عاود المحاولة',
    keyboard:   'اكتب طلبك أو تحدث 🎤',
  },
  en: {
    idle:       'Tap to speak with Kataraa 🎤',
    listening:  'Listening to you...',
    processing: 'Thinking...',
    executing:  'Executing...',
    speaking:   'Kataraa is speaking...',
    error:      'An error occurred, try again',
    keyboard:   'Type or speak your request 🎤',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AssistantOverlay: React.FC = () => {
  const {
    overlayVisible,
    closeAssistant,
    status,
    setStatus,
    messages,
    lastCommand,
    setLastCommand,
  } = useAssistantContext();

  const { sendMessage, addProductToCart, setFocusedProduct } = useAssistant();
  const insets = useSafeAreaInsets();
  const locale = getAssistantLocale();

  // ── Keyboard / Text mode state ───────────────────────────────────────────
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [inputText, setInputText]           = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Secret dev-console tap counter
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Voice recognition ────────────────────────────────────────────────────
  const { interimText, toggleVoice, stopListening } = useVoiceInput({
    status,
    setStatus,
    onResult: (transcript) => {
      setLastCommand(transcript);
      sendMessage(transcript);
    },
    onInterimResult: () => {},
    onError: (msg) => {
      console.warn('[Overlay Voice Error]:', msg);
    },
    onSilenceTimeout: async () => {
      setStatus('speaking');
      try {
        const silenceMsg = locale === 'ar'
          ? 'لم أسمعك جيداً، يرجى المحاولة مرة أخرى.'
          : 'I did not hear you clearly, please try again.';
        await voiceOutputService.speak(silenceMsg);
      } catch (_) {}
      setStatus('idle');
    },
  });

  // ── Switch to keyboard mode ──────────────────────────────────────────────
  const switchToKeyboard = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Stop any active voice session
    stopListening();
    voiceOutputService.stop();
    setIsKeyboardMode(true);
  }, [stopListening]);

  // ── Switch to voice mode ─────────────────────────────────────────────────
  const switchToVoice = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsKeyboardMode(false);
    setInputText('');
    // Auto-start listening after a short delay
    setTimeout(() => toggleVoice(), 300);
  }, [toggleVoice]);

  // ── Handle text send ─────────────────────────────────────────────────────
  const handleTextSubmit = useCallback((text: string) => {
    if (!text.trim()) return;
    setLastCommand(text.trim());
    setInputText('');
    sendMessage(text.trim());
  }, [sendMessage, setLastCommand]);

  // ── Handle suggestion chip tap ───────────────────────────────────────────
  const handleSuggestionSelect = useCallback((message: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setLastCommand(message);
    sendMessage(message);
  }, [sendMessage, setLastCommand]);

  // ── Secret dev-console tap ───────────────────────────────────────────────
  const handleSecretTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      stopListening();
      voiceOutputService.stop();
      closeAssistant();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  }, [stopListening, closeAssistant]);

  // (تم إزالة التشغيل التلقائي للصوت بناء على طلب المستخدم)

  // ── Auto-close after speaking (Voice mode only) ──────────────────────────
  const prevStatusRef = useRef<string>('idle');
  useEffect(() => {
    // Check if any message in the history contains products to be safe
    const hasProducts = messages.some(m => m.products && m.products.length > 0);

    // Do NOT auto-close when in keyboard mode OR when product cards are shown to choose from
    if (!isKeyboardMode && !hasProducts && prevStatusRef.current === 'speaking' && status === 'idle') {
      const t = setTimeout(() => closeAssistant(), 6000); // 6 seconds for standard text replies
      return () => clearTimeout(t);
    }
    prevStatusRef.current = status;
  }, [status, closeAssistant, isKeyboardMode, messages]);

  // ── Reset keyboard mode on close ────────────────────────────────────────
  useEffect(() => {
    if (!overlayVisible) {
      setIsKeyboardMode(false);
      setInputText('');
    }
  }, [overlayVisible]);

  if (!overlayVisible) return null;

  // ── Handle orb press ────────────────────────────────────────────────────
  const handleOrbPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isKeyboardMode) {
      // Tapping the Orb in keyboard mode → switch to voice
      switchToVoice();
    } else {
      toggleVoice();
    }
  };

  const handleBackgroundPress = () => {
    stopListening();
    voiceOutputService.stop();
    closeAssistant();
  };

  const dirStyle: { writingDirection: 'ltr' | 'rtl' } = {
    writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
  };

  // Determine if we should show suggestion chips
  const userMessages = messages.filter(m => m.role === 'user');
  const showSuggestions = isKeyboardMode && userMessages.length === 0;

  // Status label: in keyboard mode show a different hint
  const statusKey = isKeyboardMode ? 'keyboard' : status;
  const statusLabel = STATUS_LABELS[locale][statusKey] || STATUS_LABELS[locale].idle;

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={styles.absoluteContainer}
    >
      {/* Dimmed glass background */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleBackgroundPress}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.ambientGlow} pointerEvents="none" />
      </Pressable>

      <View
        style={styles.kavContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          entering={FadeIn.duration(150)}
          style={[
            styles.contentContainer,
            {
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 8 : (insets.bottom + 12),
              paddingTop: insets.top + 24,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Glass handle */}
          <View style={styles.glassHandle} />

          <View style={styles.flexSpacer} pointerEvents="none" />

          {/* Subtitles & Transcription Bubble */}
          <View style={styles.dialogWrapper}>
            {(interimText || messages.length > 0 || (lastCommand && status === 'processing')) && (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <BlurView intensity={20} tint="light" style={styles.dialogGlass}>
                  {status === 'listening' && interimText ? (
                    <Text style={[styles.interimText, dirStyle]}>"{interimText}"</Text>
                  ) : status === 'speaking' && messages.length > 0 ? (
                    <Text style={[styles.spokenText, dirStyle]}>
                      {messages[messages.length - 1]?.content || ''}
                    </Text>
                  ) : lastCommand && status === 'processing' ? (
                    <Text style={[styles.interimText, dirStyle]}>"{lastCommand}"</Text>
                  ) : null}
                </BlurView>

                {/* Render product cards OUTSIDE dialogGlass for full width vertical stacking */}
                {status === 'speaking' && messages.length > 0 && messages[messages.length - 1]?.products && messages[messages.length - 1]!.products!.length > 0 && (
                  <ScrollView
                    style={{ marginTop: 12, width: '100%', maxHeight: 260 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
                  >
                    {messages[messages.length - 1]!.products!.map((p) => (
                      <ProductCardMessage
                        key={String(p.id)}
                        product={p}
                        onAddToCart={addProductToCart}
                        onPress={setFocusedProduct}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Suggestion chips — shown when no user messages yet */}
          {showSuggestions && (
            <Animated.View
              entering={FadeIn.duration(300).delay(150)}
              style={styles.suggestionsWrapper}
            >
              <SuggestionChips onSelect={handleSuggestionSelect} />
            </Animated.View>
          )}

          {/* Voice Orb — always visible (smaller when keyboard is up) */}
          <Pressable onPress={handleSecretTap} style={styles.statusPressable}>
            <Text style={[styles.statusText, dirStyle]}>{statusLabel}</Text>
          </Pressable>

          {isKeyboardMode ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Pressable
                onPress={handleOrbPress}
                style={({ pressed }) => [
                  styles.orbPressable,
                  pressed && styles.orbPressed,
                  { height: 100 },
                ]}
                accessibilityLabel={locale === 'ar' ? 'تشغيل المساعد' : 'Activate assistant'}
                accessibilityRole="button"
              >
                <OrbFallback size={80} status={status} />
              </Pressable>
              <TextInputBar
                value={inputText}
                onChangeText={setInputText}
                onSubmit={handleTextSubmit}
                onVoiceToggle={switchToVoice}
                placeholder={locale === 'ar' ? 'اكتب طلبك لكتارا...' : 'Type your request...'}
                isLoading={status === 'processing' || status === 'executing'}
              />
            </View>
          ) : (
            <View style={styles.orbRow}>
              {/* Left: keyboard mode toggle */}
              <Pressable
                onPress={switchToKeyboard}
                style={({ pressed }) => [
                  styles.modeToggleBtn,
                  pressed && styles.modeTogglePressed,
                ]}
                accessibilityLabel={
                  locale === 'ar' ? 'الكتابة' : 'Switch to keyboard'
                }
                accessibilityRole="button"
              >
                <BlurView intensity={30} tint="dark" style={styles.modeToggleBlur}>
                  <Ionicons
                    name="keypad-outline"
                    size={22}
                    color={GOLD}
                  />
                </BlurView>
              </Pressable>

              {/* Center: Voice Orb */}
              <Pressable
                onPress={handleOrbPress}
                style={({ pressed }) => [
                  styles.orbPressable,
                  pressed && styles.orbPressed,
                ]}
                accessibilityLabel={locale === 'ar' ? 'تشغيل المساعد' : 'Activate assistant'}
                accessibilityRole="button"
              >
                <OrbFallback size={140} status={status} />
              </Pressable>

              {/* Right: symmetric spacer */}
              <View style={styles.orbRowSpacer} />
            </View>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  kavContainer: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    bottom: -150,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: (SCREEN_WIDTH * 1.2) / 2,
    backgroundColor: 'rgba(212, 175, 118, 0.08)',
    transform: [{ scaleY: 0.5 }],
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  glassHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
  },
  flexSpacer: {
    flex: 1,
  },
  dialogWrapper: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 48,
  },
  dialogGlass: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(20, 16, 28, 0.5)',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  interimText: {
    fontSize: 16,
    color: GOLD,
    textAlign: 'center',
    fontWeight: '600',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  spokenText: {
    fontSize: 16,
    color: '#F0EBF4',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  suggestionsWrapper: {
    width: '100%',
    marginBottom: 8,
  },
  statusPressable: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    writingDirection: 'rtl',
    textShadowColor: 'rgba(212, 175, 118, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // ── Controls Row ──────────────────────────────────────────────────────────
  orbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 200,
    paddingHorizontal: 24,
  },
  modeToggleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.3)',
  },
  modeTogglePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  modeToggleBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12,9,18,0.5)',
  },
  orbPressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  orbPressed: {
    transform: [{ scale: 0.95 }],
  },
  orbRowSpacer: {
    width: 52,
  },
});
