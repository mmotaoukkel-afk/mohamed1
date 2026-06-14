/**
 * AssistantChatModal.jsx — Kataraa Smart AI Assistant Chat
 * نظام الشات الذكي المرتبط بالموديل 3D
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Text } from './ui';
import { processUserMessage, detectLanguage } from '../services/assistantEngine';
import { QUICK_REPLIES, WELCOME_MESSAGES } from '../services/assistantKnowledge';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// Typing Indicator (3 نقاط متحركة)
// ─────────────────────────────────────────────────────────
const TypingDots = React.memo(({ color }) => {
  const [dots, setDots] = useState('●');
  useEffect(() => {
    const seq = ['●', '● ●', '● ● ●'];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % seq.length; setDots(seq[i]); }, 400);
    return () => clearInterval(t);
  }, []);
  return <Text style={{ color, fontSize: 16, letterSpacing: 3 }}>{dots}</Text>;
});

// ─────────────────────────────────────────────────────────
// بطاقة رسالة واحدة
// ─────────────────────────────────────────────────────────
const MessageBubble = React.memo(({ item, activeColors, isDark, onNavigate }) => {
  const isBot = item.sender === 'bot';

  return (
    <View style={[styles.messageRow, isBot ? styles.rowBot : styles.rowUser]}>
      {isBot && (
        <View style={[styles.avatarCircle, { backgroundColor: activeColors.primary + '25' }]}>
          <Text style={{ fontSize: 13 }}>🤖</Text>
        </View>
      )}

      <View style={styles.bubbleColumn}>
        {/* فقاعة الرسالة */}
        <View
          style={[
            styles.messageBubble,
            isBot
              ? [styles.bubbleBot, { backgroundColor: isDark ? '#2A2A2A' : '#F4F4F4' }]
              : [styles.bubbleUser, { backgroundColor: activeColors.primary }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isBot ? activeColors.text : '#FFF' },
            ]}
          >
            {item.text}
          </Text>
        </View>

        {/* أزرار التنقل */}
        {isBot && item.buttons && item.buttons.length > 0 && (
          <View style={styles.buttonsContainer}>
            {item.buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.actionButton, { borderColor: activeColors.primary }]}
                onPress={() => onNavigate(btn.route)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionButtonText, { color: activeColors.primary }]}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* بطاقات المنتجات المختصرة */}
        {isBot && item.products && item.products.length > 0 && (
          <View style={styles.productCardsRow}>
            {item.products.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.miniProductCard, { backgroundColor: isDark ? '#333' : '#FFF', borderColor: activeColors.border }]}
                onPress={() => onNavigate(`/product/${p.id}`)}
                activeOpacity={0.8}
              >
                <Text style={[styles.miniProductName, { color: activeColors.text }]} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={[styles.miniProductPrice, { color: activeColors.primary }]}>
                  {parseFloat(p.price).toFixed(2)} د.م
                  {p.on_sale && <Text style={styles.saleTag}> 🔥</Text>}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// المكوّن الرئيسي
// ─────────────────────────────────────────────────────────
const AssistantChatModal = React.memo(({ visible, onClose, onAvatarStateChange }) => {
  const { tokens, isDark } = useTheme();
  const activeColors = tokens.colors;
  const router = useRouter();

  const [lang, setLang] = useState('ma'); // Default Moroccan Arabic
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const mountedRef = useRef(true);

  const quickReplies = useMemo(() => QUICK_REPLIES[lang] || QUICK_REPLIES.ma, [lang]);

  // ── Initialize with welcome message ──
  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: WELCOME_MESSAGES[lang] || WELCOME_MESSAGES.ma,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    }
  }, [visible]);

  // ── Keyboard listener ──
  useEffect(() => {
    mountedRef.current = true;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (mountedRef.current) setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (mountedRef.current) setKeyboardHeight(0);
    });
    return () => {
      mountedRef.current = false;
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Navigate helper ──
  const handleNavigate = useCallback((route) => {
    onClose?.();
    setTimeout(() => {
      try { router.push(route); } catch (e) { console.warn('Navigation error:', e); }
    }, 300);
  }, [onClose, router]);

  // ── Send message ──
  const handleSend = useCallback(async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');
    setShowQuickReplies(false);
    Keyboard.dismiss();

    // Detect language from user message and update
    const detectedLang = detectLanguage(text);
    setLang(detectedLang);

    // Add user message
    const userMsg = {
      id: `u_${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [userMsg, ...prev]);

    // Show typing + set avatar to thinking
    setIsTyping(true);
    onAvatarStateChange?.('Wave');

    try {
      // Simulate processing delay (natural feel)
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 600));

      if (!mountedRef.current) return;
      const response = await processUserMessage(text);

      const botMsg = {
        id: `b_${Date.now()}`,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        buttons: response.buttons || [],
        products: response.products || [],
      };

      setMessages(prev => [botMsg, ...prev]);
      onAvatarStateChange?.(response.avatarState || 'Idle');
    } catch (err) {
      const errorMsgs = {
        ar: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
        ma: 'وقع شي خطأ. عاود جرب من فضلك.',
        fr: 'Une erreur s\'est produite. Réessayez.',
        en: 'An error occurred. Please try again.',
      };
      setMessages(prev => [{
        id: `e_${Date.now()}`,
        text: errorMsgs[lang] || errorMsgs.ma,
        sender: 'bot',
        timestamp: new Date(),
        buttons: [],
        products: [],
      }, ...prev]);
    } finally {
      if (mountedRef.current) {
        setIsTyping(false);
        // Return to idle after 3s
        setTimeout(() => { if (mountedRef.current) onAvatarStateChange?.('Idle'); }, 3000);
      }
    }
  }, [inputText, isTyping, lang, onAvatarStateChange]);

  const renderItem = useCallback(({ item }) => (
    <MessageBubble
      item={item}
      activeColors={activeColors}
      isDark={isDark}
      onNavigate={handleNavigate}
    />
  ), [activeColors, isDark, handleNavigate]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (!visible) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 9000, elevation: 9000 }]}
      pointerEvents="box-none"
    >
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        pointerEvents="box-none"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Chat Panel */}
      <View
        style={[styles.panelWrapper, { paddingBottom: keyboardHeight }]}
        pointerEvents="box-none"
      >
        <Animated.View
          entering={SlideInUp.springify().damping(22).stiffness(100)}
          style={[
            styles.chatContainer,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              borderTopColor: activeColors.primary + '30',
            },
          ]}
        >
          {/* ── Header ── */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
            <View style={styles.headerLeft}>
              <View style={styles.onlineDot} />
              <View>
                <Text style={[styles.headerTitle, { color: activeColors.text }]}>
                  المساعد الذكي
                </Text>
                <Text style={[styles.headerSub, { color: activeColors.textSecondary }]}>
                  Kataraa AI · {isTyping ? '...يكتب' : 'متصل'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={activeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Messages ── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            inverted
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              isTyping ? (
                <View style={[styles.messageRow, styles.rowBot, { marginBottom: 8 }]}>
                  <View style={[styles.avatarCircle, { backgroundColor: activeColors.primary + '25' }]}>
                    <Text style={{ fontSize: 13 }}>🤖</Text>
                  </View>
                  <View style={[styles.messageBubble, styles.bubbleBot, { backgroundColor: isDark ? '#2A2A2A' : '#F4F4F4', paddingVertical: 12 }]}>
                    <TypingDots color={activeColors.primary} />
                  </View>
                </View>
              ) : null
            }
          />

          {/* ── Quick Replies ── */}
          {showQuickReplies && messages.length <= 2 && (
            <View style={[styles.quickRepliesWrapper, { borderTopColor: isDark ? '#2A2A2A' : '#F0F0F0' }]}>
              <FlatList
                horizontal
                data={quickReplies}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickRepliesList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.quickPill, { borderColor: activeColors.primary, backgroundColor: isDark ? '#242424' : '#FFF' }]}
                    onPress={() => handleSend(item.query)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickPillText, { color: activeColors.primary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* ── Input Bar ── */}
          <View style={[styles.inputBar, { backgroundColor: isDark ? '#111' : '#F8F8F8', borderTopColor: isDark ? '#2A2A2A' : '#EBEBEB' }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: activeColors.text, backgroundColor: isDark ? '#222' : '#FFF' }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                lang === 'fr' ? 'Écrivez votre message...' :
                lang === 'en' ? 'Type your message...' :
                lang === 'ma' ? 'كتب رسالتك هنا...' :
                'اكتب رسالتك هنا...'
              }
              placeholderTextColor={isDark ? '#555' : '#BBB'}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              multiline={false}
              textAlign="right"
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              style={[styles.sendBtn, { opacity: (inputText.trim() && !isTyping) ? 1 : 0.4 }]}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[activeColors.primary, isDark ? '#8B5E7A' : '#C4956A']}
                style={styles.sendGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="send" size={16} color="#FFF" style={{ transform: [{ scaleX: -1 }] }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
});

AssistantChatModal.displayName = 'AssistantChatModal';
export default AssistantChatModal;

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  panelWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatContainer: {
    height: SCREEN_HEIGHT * 0.62,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 6,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    maxWidth: '90%',
  },
  rowBot: {
    alignSelf: 'flex-start',
  },
  rowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubbleColumn: {
    flex: 1,
    gap: 6,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleBot: {
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  actionButton: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  miniProductCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    width: (SCREEN_WIDTH - 80) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  miniProductName: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  miniProductPrice: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  saleTag: {
    fontSize: 11,
  },
  quickRepliesWrapper: {
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  quickRepliesList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  quickPill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
    textAlign: 'right',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  sendGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
