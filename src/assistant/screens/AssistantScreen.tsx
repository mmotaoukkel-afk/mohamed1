import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import { useAssistant } from '../hooks/useAssistant';
import { useAssistantContext } from '../context/AssistantProvider';
import { getLogs, clearLogs, getStats } from '../engine/telemetryLogger';
import { ProductCardMessage } from '../components/messages/ProductCardMessage';
import { TypingIndicator } from '../components/messages/TypingIndicator';
import { GlassMessageBubble } from '../components/GlassMessageBubble';
import type { ChatMessage, AssistantProduct } from '../types';
import { AssistantAvatar } from '../components/AssistantAvatar';

const GOLD = '#D4AF76';
const BG_DARK = '#0D0A12';
const TEXT_LIGHT = 'rgba(240,235,244,0.85)';
const TEXT_DIM = 'rgba(240,235,244,0.5)';

type TabName = 'chat' | 'telemetry' | 'context';

export const AssistantScreen: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>('chat');
  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // ── Core assistant hook
  const {
    messages,
    isTyping,
    status,
    sendMessage,
    addProductToCart,
    setFocusedProduct,
  } = useAssistant();

  const { activeContext, focusedProduct, sessionContextRef } = useAssistantContext();

  // Telemetry logs state
  const [logs, setLogs] = useState(getLogs());
  const [stats, setStats] = useState(getStats());

  // Refresh logs periodically or on message send
  const refreshLogs = useCallback(() => {
    setLogs(getLogs());
    setStats(getStats());
  }, []);

  useEffect(() => {
    refreshLogs();
  }, [messages, status, refreshLogs]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text);
  };

  const handleClearLogs = () => {
    clearLogs();
    refreshLogs();
  };

  const scrollToBottom = () => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#140F1E', '#0D0A12', '#0D0A12']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={GOLD} />
        </Pressable>
        <Text style={styles.headerTitle}>كتارا — لوحة المطورين 🛠️</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Stats Bar ── */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.total}</Text>
          <Text style={styles.statLabel}>إجمالي الطلبات</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: stats.successRate >= 80 ? '#4CAF50' : '#FFB300' }]}>
            {stats.successRate.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>نسبة النجاح</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>
            {logs.filter(e => e.intent === 'UNKNOWN').length}
          </Text>
          <Text style={styles.statLabel}>غير المفهوم</Text>
        </View>
      </View>

      {/* ── Tabs Navigator ── */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Ionicons name="chatbubbles-outline" size={16} color={activeTab === 'chat' ? '#0D0A12' : GOLD} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>الشات التجريبي</Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'telemetry' && styles.activeTab]}
          onPress={() => setActiveTab('telemetry')}
        >
          <Ionicons name="analytics-outline" size={16} color={activeTab === 'telemetry' ? '#0D0A12' : GOLD} />
          <Text style={[styles.tabText, activeTab === 'telemetry' && styles.activeTabText]}>التتبع والـ Telemetry</Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'context' && styles.activeTab]}
          onPress={() => setActiveTab('context')}
        >
          <Ionicons name="git-branch-outline" size={16} color={activeTab === 'context' ? '#0D0A12' : GOLD} />
          <Text style={[styles.tabText, activeTab === 'context' && styles.activeTabText]}>سياق الجلسة</Text>
        </Pressable>
      </View>

      {/* ── Tab Content ── */}
      <View style={styles.tabContentContainer}>
        {/* 1. Interactive Chat Tab */}
        {activeTab === 'chat' && (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={scrollToBottom}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.livePreviewContainer}>
                  <AssistantAvatar size={85} status={status} />
                  <Text style={styles.livePreviewText}>معاينة المساعد ثلاثي الأبعاد المباشرة (حالة: {status})</Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <View>
                  <GlassMessageBubble role={item.role} content={item.content} />
                  {item.products && item.products.length > 0 && (
                    <View style={styles.cardsContainer}>
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
                </View>
              )}
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <Pressable onPress={handleSend} style={styles.sendBtn}>
                <LinearGradient
                  colors={['#F0D090', '#D4AF76', '#A07840']}
                  style={styles.sendBtnGradient}
                >
                  <Ionicons name="send" size={16} color="#0D0A12" />
                </LinearGradient>
              </Pressable>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                placeholder="اكتب أمراً تجريبياً..."
                placeholderTextColor="rgba(240,235,244,0.3)"
                textAlign="right"
              />
            </View>
          </KeyboardAvoidingView>
        )}

        {/* 2. Telemetry Logs Tab */}
        {activeTab === 'telemetry' && (
          <View style={styles.flex}>
            <View style={styles.logHeader}>
              <Text style={styles.logHeaderTitle}>سجل طلبات المستخدم وتحليل النوايا:</Text>
              <Pressable onPress={handleClearLogs} style={styles.clearBtn}>
                <Ionicons name="trash-outline" size={14} color="#FF6B6B" />
                <Text style={styles.clearBtnText}>مسح السجل</Text>
              </Pressable>
            </View>

            {logs.length === 0 ? (
              <View style={styles.emptyLogs}>
                <Ionicons name="folder-open-outline" size={48} color="rgba(212,175,118,0.2)" />
                <Text style={styles.emptyLogsText}>لا توجد تفاعلات مسجلة حالياً</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.logList}>
                {[...logs].reverse().map((entry, idx) => (
                  <View key={String(entry.timestamp) + idx} style={styles.logCard}>
                    <View style={styles.logCardHeader}>
                      <Text style={styles.logTime}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </Text>
                      <View style={styles.logSuccessRow}>
                        {entry.success ? (
                          <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: '700' }}>نجح ✅</Text>
                        ) : (
                          <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '700' }}>
                            فشل ❌ {entry.failureReason ? `(${entry.failureReason})` : ''}
                          </Text>
                        )}
                      </View>
                    </View>

                    <Text style={styles.logInput}>"{entry.input}"</Text>

                    <View style={styles.divider} />

                    <View style={styles.logMetaGrid}>
                      <View style={styles.logMetaBox}>
                        <Text style={styles.logMetaLabel}>Category</Text>
                        <Text style={styles.logMetaVal}>{entry.category}</Text>
                      </View>
                      <View style={styles.logMetaBox}>
                        <Text style={styles.logMetaLabel}>Intent</Text>
                        <Text style={styles.logMetaVal}>{entry.intent}</Text>
                      </View>
                      <View style={styles.logMetaBox}>
                        <Text style={styles.logMetaLabel}>Action</Text>
                        <Text style={styles.logMetaVal}>{entry.action}</Text>
                      </View>
                      <View style={styles.logMetaBox}>
                        <Text style={styles.logMetaLabel}>Confidence</Text>
                        <Text style={styles.logMetaVal}>{(entry.confidence * 100).toFixed(0)}%</Text>
                      </View>
                    </View>

                    {entry.matchedPattern && (
                      <View style={styles.patternBox}>
                        <Text style={styles.patternLabel}>Pattern:</Text>
                        <Text style={styles.patternText}>{entry.matchedPattern}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* 3. Session Context Memory Tab */}
        {activeTab === 'context' && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.contextContainer}>
            <Text style={styles.contextSectionTitle}>حالة الذاكرة الحالية (short-term memory):</Text>

            {/* Focused Product Info */}
            <View style={styles.contextCard}>
              <Text style={styles.contextLabel}>المنتج المركز عليه حالياً (Focused Product):</Text>
              {focusedProduct ? (
                <View style={styles.focusedProductView}>
                  <Text style={styles.productName}>{focusedProduct.name}</Text>
                  <Text style={styles.productPrice}>{focusedProduct.price} درهم</Text>
                  <Text style={styles.productId}>ID: {focusedProduct.id}</Text>
                </View>
              ) : (
                <Text style={styles.noContextVal}>لا يوجد منتج في حيز التركيز</Text>
              )}
            </View>

            {/* Active Context details */}
            <View style={styles.contextCard}>
              <Text style={styles.contextLabel}>السياق النشط (Active App State):</Text>
              <View style={styles.contextRow}>
                <Text style={styles.contextSubLabel}>الشاشة الحالية:</Text>
                <Text style={styles.contextVal}>{activeContext.screen}</Text>
              </View>
              <View style={styles.contextRow}>
                <Text style={styles.contextSubLabel}>آخر قسم مزار:</Text>
                <Text style={styles.contextVal}>{activeContext.category || 'لا يوجد'}</Text>
              </View>
            </View>

            {/* Short term session ref variables */}
            <View style={styles.contextCard}>
              <Text style={styles.contextLabel}>متغيرات الجلسة الداخلية (internal context ref):</Text>
              <View style={styles.contextRow}>
                <Text style={styles.contextSubLabel}>آخر كلمة بحث:</Text>
                <Text style={styles.contextVal}>"{sessionContextRef.current.lastQuery || ''}"</Text>
              </View>
              <View style={styles.contextRow}>
                <Text style={styles.contextSubLabel}>آخر نية تم تحديدها:</Text>
                <Text style={styles.contextVal}>{sessionContextRef.current.lastIntent || 'لا يوجد'}</Text>
              </View>
              <View style={styles.contextRow}>
                <Text style={styles.contextSubLabel}>إجراء معلق بالانتظار (pendingAction):</Text>
                <Text style={styles.contextVal}>
                  {sessionContextRef.current.pendingAction
                    ? JSON.stringify(sessionContextRef.current.pendingAction)
                    : 'لا يوجد'}
                </Text>
              </View>
              <View style={styles.contextRow}>
                <Text style={styles.contextSubLabel}>عدد نتائج البحث الأخيرة:</Text>
                <Text style={styles.contextVal}>
                  {sessionContextRef.current.lastSearchResults?.length || 0} منتجات
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 118, 0.15)',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 118, 0.08)',
    paddingVertical: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_DIM,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 118, 0.08)',
    backgroundColor: 'rgba(13, 10, 18, 0.3)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(212, 175, 118, 0.12)',
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  tabText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#F0EBF4',
  },
  tabContentContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    paddingHorizontal: 8,
    marginTop: 4,
    gap: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 118, 0.08)',
    backgroundColor: '#0D0A12',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 118, 0.18)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F0EBF4',
    fontSize: 14,
    maxHeight: 44,
  },
  sendBtn: {
    borderRadius: 21,
    overflow: 'hidden',
  },
  sendBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  logHeaderTitle: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  clearBtnText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyLogs: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyLogsText: {
    fontSize: 14,
    color: TEXT_DIM,
  },
  logList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.1)',
    padding: 12,
    marginVertical: 6,
    gap: 8,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTime: {
    color: TEXT_DIM,
    fontSize: 11,
  },
  logSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logInput: {
    color: '#F0EBF4',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212,175,118,0.08)',
  },
  logMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  logMetaBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 6,
    borderRadius: 6,
    gap: 2,
  },
  logMetaLabel: {
    fontSize: 10,
    color: TEXT_DIM,
  },
  logMetaVal: {
    fontSize: 11,
    color: GOLD,
    fontWeight: '600',
  },
  patternBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212,175,118,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    alignItems: 'center',
  },
  patternLabel: {
    fontSize: 10,
    color: TEXT_DIM,
  },
  patternText: {
    fontSize: 11,
    color: GOLD,
    fontWeight: '500',
  },
  contextContainer: {
    flex: 1,
    padding: 16,
  },
  contextSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 12,
  },
  contextCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.1)',
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  contextLabel: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,118,0.08)',
    paddingBottom: 6,
  },
  focusedProductView: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  productName: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    textAlign: 'right',
  },
  productPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '700',
    textAlign: 'right',
  },
  productId: {
    fontSize: 10,
    color: TEXT_DIM,
    textAlign: 'right',
  },
  noContextVal: {
    fontSize: 12,
    color: TEXT_DIM,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  contextRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextSubLabel: {
    fontSize: 12,
    color: TEXT_DIM,
  },
  contextVal: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
  },
  livePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 118, 0.12)',
  },
  livePreviewText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default AssistantScreen;
