/**
 * ChatScreen — شاشة الشات الرئيسية مع مساعد كتارا
 *
 * تصميم WhatsApp / iMessage premium:
 * - خلفية داكنة مع gradient
 * - فقاعات رسائل زجاجية (GlassMessageBubble)
 * - اقتراحات سريعة (SuggestionChips)
 * - حقل إدخال نص + زر صوتي
 * - TypingIndicator
 * - كروت المنتجات داخل الشات
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAssistant } from '../hooks/useAssistant';
import { useAssistantContext } from '../context/AssistantProvider';
import { GlassMessageBubble } from '../components/GlassMessageBubble';
import { TypingIndicator } from '../components/messages/TypingIndicator';
import { ProductCardMessage } from '../components/messages/ProductCardMessage';
import { SuggestionChips } from '../components/SuggestionChips';
import OrbFallback from '../components/OrbFallback';
import type { ChatMessage } from '../types';

import { getAssistantLocale } from '../core/localeService';

const GOLD = '#D4AF76';
const BG = '#0D0A12';

// ─── Header ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<'ar' | 'en', Record<string, string>> = {
  ar: {
    idle: 'متاحة الآن ✨',
    listening: 'تستمع إليك...',
    processing: 'تفكر...',
    executing: 'تنفذ...',
    speaking: 'تتحدث...',
    error: 'خطأ',
  },
  en: {
    idle: 'Online ✨',
    listening: 'Listening...',
    processing: 'Thinking...',
    executing: 'Executing...',
    speaking: 'Speaking...',
    error: 'Error',
  },
};

const ChatHeader: React.FC<{ status: string; onBack: () => void }> = ({ status, onBack }) => {
  const locale = getAssistantLocale();
  const dirStyle: { writingDirection: 'ltr' | 'rtl' } = {
    writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
  };
  const backIcon = locale === 'ar' ? 'arrow-forward' : 'arrow-back';

  const statusColor: Record<string, string> = {
    idle: '#4CAF50',
    listening: '#3b82f6',
    processing: '#8b5cf6',
    executing: '#FF8C00',
    speaking: '#10b981',
    error: '#ef4444',
  };

  return (
    <BlurView intensity={40} tint="dark" style={styles.header}>
      {/* Gold top line */}
      <LinearGradient
        colors={['rgba(212,175,118,0.6)', 'rgba(212,175,118,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerTopLine}
      />

      <View style={styles.headerInner}>
        {/* Back Button */}
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel={locale === 'ar' ? 'رجوع' : 'Back'}
        >
          <Ionicons name={backIcon} size={22} color={GOLD} />
        </Pressable>

        {/* Center: Avatar + Name */}
        <View style={styles.headerCenter}>
          <OrbFallback size={38} status={status as any} />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>
              {locale === 'ar' ? 'كتارا' : 'Kataraa'}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor[status] || '#4CAF50' }]} />
              <Text style={[styles.statusLabel, { color: statusColor[status] || '#4CAF50' }, dirStyle]}>
                {STATUS_LABELS[locale][status] || STATUS_LABELS[locale].idle}
              </Text>
            </View>
          </View>
        </View>

        {/* Right spacer */}
        <View style={{ width: 44 }} />
      </View>
    </BlurView>
  );
};

// ─── Input Bar ────────────────────────────────────────────────────────────────

const InputBar: React.FC<{
  value: string;
  onChange: (t: string) => void;
  onSend: () => void;
  disabled?: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
  const locale = getAssistantLocale();
  const sendScale = useSharedValue(1);
  const sendStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendScale.value = withSpring(0.85, { damping: 8 }, () => {
      sendScale.value = withSpring(1);
    });
    onSend();
  };

  const textInputStyle: { textAlign: 'left' | 'right'; writingDirection: 'ltr' | 'rtl' } = {
    textAlign: locale === 'ar' ? 'right' : 'left',
    writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
  };

  return (
    <BlurView intensity={35} tint="dark" style={styles.inputBar}>
      <LinearGradient
        colors={['rgba(212,175,118,0.08)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={sendStyle}>
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendBtn, { opacity: value.trim() ? 1 : 0.4 }]}
          activeOpacity={0.8}
          disabled={!value.trim() || disabled}
        >
          <LinearGradient
            colors={['#F0D090', '#D4AF76', '#A07840']}
            style={styles.sendBtnGrad}
          >
            <Ionicons name="send" size={18} color="#0D0A12" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <TextInput
        style={[styles.input, textInputStyle]}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={handleSend}
        placeholder={locale === 'ar' ? 'اكتبي رسالة لكتارا...' : 'Type a message for Kataraa...'}
        placeholderTextColor="rgba(240,235,244,0.3)"
        multiline
        maxLength={300}
        editable={!disabled}
      />
    </BlurView>
  );
};

// ─── Welcome Banner (shown when no messages yet) ──────────────────────────────

const WelcomeBanner: React.FC = () => {
  const locale = getAssistantLocale();
  const dirStyle: { writingDirection: 'ltr' | 'rtl' } = {
    writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
  };
  return (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.welcomeContainer}>
      <OrbFallback size={90} status="idle" />
      <Text style={styles.welcomeTitle}>
        {locale === 'ar' ? 'مرحباً بك مع كتارا ✨' : 'Welcome to Kataraa ✨'}
      </Text>
      <Text style={[styles.welcomeSub, dirStyle]}>
        {locale === 'ar'
          ? 'مساعدتك الذكية لعناية البشرة والجمال\nاكتبي أو تحدثي، وسأساعدك!'
          : 'Your smart skincare and beauty assistant\nType or speak, and I will help you!'}
      </Text>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ChatScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [inputText, setInputText] = useState('');
  const [showChips, setShowChips] = useState(true);

  const { messages, isTyping, status, sendMessage, addProductToCart, setFocusedProduct } = useAssistant();

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    setShowChips(false);
    sendMessage(text);
  }, [inputText, sendMessage]);

  const handleChipSelect = useCallback((msg: string) => {
    setShowChips(false);
    sendMessage(msg);
  }, [sendMessage]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  // Show chips again after conversation is idle and empty input
  useEffect(() => {
    if (status === 'idle' && !inputText && messages.length <= 1) {
      setShowChips(true);
    }
  }, [status, inputText, messages.length]);

  const renderItem = useCallback(({ item, index }: { item: ChatMessage; index: number }) => (
    <Animated.View entering={FadeInDown.delay(30).springify()}>
      <GlassMessageBubble
        role={item.role}
        content={item.content}
        animDelay={index === messages.length - 1 ? 0 : 0}
      />
      {item.products && item.products.length > 0 && (
        <View style={styles.productCards}>
          {item.products.map((p) => (
            <ProductCardMessage
              key={String(p.id)}
              product={p}
              onAddToCart={addProductToCart}
              onPress={setFocusedProduct}
            />
          ))}
        </View>
      )}
    </Animated.View>
  ), [messages.length, addProductToCart, setFocusedProduct]);

  const isProcessing = status === 'processing' || status === 'executing';

  return (
    <View style={styles.root}>
      {/* Background */}
      <LinearGradient
        colors={['#140F1E', '#0D0A12', '#0A080F']}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Ambient orb glow */}
      <View style={styles.ambientOrb} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <ChatHeader status={status} onBack={() => router.back()} />

        {/* Chat list */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={messages.length <= 1 ? <WelcomeBanner /> : null}
            renderItem={renderItem}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />

          {/* Suggestion chips */}
          {showChips && messages.length <= 1 && (
            <Animated.View entering={FadeInDown.delay(400)}>
              <SuggestionChips onSelect={handleChipSelect} />
            </Animated.View>
          )}

          {/* Input bar */}
          <InputBar
            value={inputText}
            onChange={setInputText}
            onSend={handleSend}
            disabled={isProcessing}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  flex: { flex: 1 },

  // Ambient glow orb
  ambientOrb: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(212,175,118,0.07)',
  },

  // ── Header
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,118,0.12)',
    overflow: 'hidden',
  },
  headerTopLine: {
    height: 1,
    width: '100%',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,118,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    alignItems: 'flex-end',
  },
  headerName: {
    color: GOLD,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Welcome Banner
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 16,
  },
  welcomeTitle: {
    color: GOLD,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  welcomeSub: {
    color: 'rgba(240,235,244,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    writingDirection: 'rtl',
  },

  // ── Chat List
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  productCards: {
    paddingHorizontal: 20,
    marginTop: 6,
    gap: 8,
  },

  // ── Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,118,0.12)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.2)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: '#F0EBF4',
    fontSize: 15,
    maxHeight: 100,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sendBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
