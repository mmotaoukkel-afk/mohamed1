/**
 * useAssistant — المحرك الرئيسي للمساعد (v3 — Production Ready)
 *
 * يربط الطبقات الأربع:
 *  Layer 0: AliasResolver (المطابقة التقريبية والبحث الاحتياطي)
 *  Layer 1: IntentEngine — تحليل النية وتصنيف الفئات
 *  Layer 2: ActionExecutor — تنفيذ الأوامر والأسئلة والتأكيدات
 *  Layer 3: ResponseGenerator — توليد الردود السياقية
 *
 * Confidence Thresholds:
 *  ≥ 0.85 → تنفيذ مباشر
 *  0.60–0.84 → طلب توضيح
 *  < 0.60 → UNKNOWN
 */

import { useRouter, usePathname, useGlobalSearchParams } from 'expo-router';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import api from '../../services/api';
import { formatForState } from '../../utils/productUtils';
import { analyzeIntent } from '../engine/intentEngine';
import { ActionRegistry } from '../engine/actionRegistry';
import {
  fuzzyMatchProduct,
  normalizeText,
  PRODUCT_INDICATOR_WORDS,
} from '../engine/aliasResolver';
import { useAssistantContext } from '../context/AssistantProvider';
import { getAssistantLocale } from '../core/localeService';
import { initializeShoppingDomain } from '../domains/shopping/config';
import { EventBus } from '../platform/core/eventBus';
import { AgentOrchestrator } from '../platform/core/agentOrchestrator';
import { validateResponse, incrementFallback, incrementRetry } from '../engine/languageGuard';
import { normalizeAndSimplify } from '../engine/responseNormalizer';
import { applyEtiquette } from '../engine/etiquetteEngine';
import { analyzeSentiment, SentimentAnalysisResult } from '../analyzer/sentimentAnalyzer';

// ─── Interaction Registry & Handlers Import (Side-Effects) ───────────────────
import { InteractionRegistry } from '../engine/interactionRegistry';
import { InteractionPipeline } from '../engine/interactionPipeline';
import '../engine/handlers/commentHandler';
import '../engine/handlers/ratingHandler';

// تسجيل جسر تفاعلي لإجراء الإضافة للمفضلة القديم ليسهل تشغيله من الـ Pipeline
InteractionRegistry.register('ADD_TO_FAVORITES', async (ctx, payload) => {
  await ActionRegistry.ADD_TO_FAVORITES(ctx as any, payload as any);
});


const CATEGORY_SLUGS: Record<string, string> = {
  // يجب أن تتطابق القيم مع id في REAL_CATEGORIES بصفحة المنتجات
  'Skincare':   'skincare',
  'Hair Care':  'haircare',    // كان 'hair' — لا يطابق id='haircare'
  'Makeup':     'makeup',
  'Perfume':    'makeup',      // لا يوجد fragrances — أقرب شيء makeup
  'Body Care':  'moisturizer', // body-care → مرطب للبشرة
  'Toner':      'toner',
  'Serum':      'serum',
  'Suncare':    'sunscreen',   // كان 'suncare' — لا يطابق id='sunscreen'
  'Anti-Aging': 'antiaging',   // كان 'anti-aging' — لا يطابق id='antiaging'
  'Acne':       'acne',
  'Tools':      'pads',        // أقرب شيء متاح
  'Cleansers':  'cleanser',    // كان 'cleansers' — لا يطابق id='cleanser'
  'Masks':      'mask',        // كان 'masks' — لا يطابق id='mask'
};


import {
  WELCOME_MESSAGE,
  getBrandInfoResponse,
  getCartAddResponse,
  getCartClearedResponse,
  getCartEmptyResponse,
  getCartNoResultsResponse,
  getCartRemoveResponse,
  getClarifyResponse,
  getHandoffResponse,
  getNavigationResponse,
  getRecommendationsResponse,
  getSearchErrorResponse,
  getSearchFoundResponse,
  getSearchNotFoundResponse,
  getSmallTalkResponse,
  getHelpResponse,
  getUnknownResponse,
  // ردود الأسئلة والتأكيدات الجديدة
  getPriceResponse,
  getDetailsResponse,
  getAvailabilityResponse,
  getDeliveryResponse,
  getWarrantyResponse,
  getComparisonResponse,
  getConfirmationPrompt,
  getConfirmYesResponse,
  getConfirmNoResponse,
  getIntentFallbackResponse,
} from '../engine/responseGenerator';
import { logInteraction } from '../engine/telemetryLogger';
import type {
  AssistantContext,
  AssistantProduct,
  ChatMessage,
  HistoricAction,
  ScreenName,
  VoiceStatus,
  ActionType,
  IntentType,
} from '../types';
import { CONFIDENCE } from '../types';
import voiceOutputService from '../services/voiceOutputService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const makeAssistantMsg = (content: string, products?: AssistantProduct[]): ChatMessage => ({
  id: makeId(),
  role: 'assistant',
  content,
  products,
  timestamp: Date.now(),
});

const makeUserMsg = (content: string): ChatMessage => ({
  id: makeId(),
  role: 'user',
  content,
  timestamp: Date.now(),
});

/**
 * Validates a response text against the current locale.
 *
 * Pipeline per attempt:
 *   raw text → normalizeAndSimplify → validateResponse
 *
 * Retry budget: MAX_RESPONSE_ATTEMPTS (3 attempts) before guaranteed fallback.
 *
 * @param text    - The candidate response text.
 * @param intent  - Current intent (for context-aware fallback).
 * @param retry   - Optional lambda that regenerates a fresh response.
 * @returns       - A guaranteed valid response string.
 */
let currentSentiment: SentimentAnalysisResult | undefined = undefined;

const MAX_RESPONSE_ATTEMPTS = 3;

const guardResponse = (
  text: string,
  intent: IntentType,
  retry?: () => string,
  sentimentResult?: SentimentAnalysisResult
): string => {
  const locale = getAssistantLocale();

  // Step 0 — Apply Customer Etiquette & Politeness rules based on sentiment
  const activeSentiment = sentimentResult || currentSentiment;
  const politeText = applyEtiquette(text, intent, activeSentiment, locale);

  // Attempt 1 — normalize the original text first
  const normalized1 = normalizeAndSimplify(politeText, locale);
  const check1 = validateResponse(normalized1, locale);
  if (check1.isValid) return normalized1;

  if (__DEV__) console.warn(`[LanguageGuard] Attempt 1 invalid (${check1.reason}). Retrying…`);

  // Attempts 2–MAX via retry lambda
  if (retry) {
    for (let attempt = 2; attempt <= MAX_RESPONSE_ATTEMPTS; attempt++) {
      incrementRetry();
      const fresh = retry();
      const politeFresh = applyEtiquette(fresh, intent, sentimentResult, locale);
      const normalized = normalizeAndSimplify(politeFresh, locale);
      const check = validateResponse(normalized, locale);
      if (check.isValid) {
        if (__DEV__) console.warn(`[LanguageGuard] Attempt ${attempt} succeeded.`);
        return normalized;
      }
      if (__DEV__) console.warn(`[LanguageGuard] Attempt ${attempt} invalid (${check.reason}).`);
    }
  }

  // — Guaranteed context-aware fallback —
  if (__DEV__) console.warn(`[LanguageGuard] All attempts exhausted → using intent fallback.`);
  incrementFallback();
  const rawFallback = getIntentFallbackResponse(intent, locale);
  return applyEtiquette(rawFallback, intent, sentimentResult, locale);
};

// ─── خريطة التنقل ─────────────────────────────────────────────────────────────

const SCREEN_ROUTES: Record<string, { route: string; label: string }> = {
  Home:      { route: '/',               label: 'الرئيسية' },
  Products:  { route: '/products',       label: 'المنتجات' },
  Profile:   { route: '/profile',        label: 'الملف الشخصي' },
  Cart:      { route: '/cart',           label: 'السلة' },
  Favorites: { route: '/favorites',      label: 'المفضلة' },
  Orders:    { route: '/orders',         label: 'الطلبات' },
  Settings:  { route: '/admin/settings', label: 'الإعدادات' },
};

// ─── Hook الرئيسي ─────────────────────────────────────────────────────────────

export const useAssistant = () => {
  const router = useRouter();
  const { triggerAddToCart, removeFromCart, clearCart, cartItems, updateQuantity } = useCart();
  const { clearFavorites, favorites, toggleFavorite, isFavorite } = useFavorites() as any;

  const {
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    status,
    setStatus,
    focusedProduct,
    setFocusedProduct,
    activeContext,
    setActiveContext,
    closeAssistant,
    sessionContextRef: context,
  } = useAssistantContext();

  const activeContextRef = useRef(activeContext);
  useEffect(() => {
    activeContextRef.current = activeContext;
  }, [activeContext]);

  // ── تتبع مسار التنقلات لمعالجة مشكلة الرجوع (Tab Navigation) ────────────
  const pathname = usePathname();
  const searchParams = useGlobalSearchParams();
  
  useEffect(() => {
    if (!context.current.screenHistory) context.current.screenHistory = [];
    
    // بناء المسار الكامل
    const paramsString = new URLSearchParams(searchParams as any).toString();
    const fullPath = paramsString ? `${pathname}?${paramsString}` : pathname;
    
    // أضف المسار إلى السجل فقط إذا لم يكن هو نفسه المسار الأخير
    const history = context.current.screenHistory;
    if (history.length === 0 || history[history.length - 1] !== fullPath) {
      history.push(fullPath);
      // الاحتفاظ بآخر 10 مسارات فقط
      if (history.length > 10) history.shift();
    }
  }, [pathname, searchParams, context]);

  const pushActionToHistory = useCallback((action: Omit<HistoricAction, 'timestamp'>) => {
    if (!context.current.actionHistory) context.current.actionHistory = [];
    context.current.actionHistory.push({
      ...action,
      timestamp: Date.now()
    });
  }, [context]);

  const popActionFromHistory = useCallback(() => {
    if (!context.current.actionHistory || context.current.actionHistory.length === 0) return undefined;
    return context.current.actionHistory.pop();
  }, [context]);

  const peekActionFromHistory = useCallback(() => {
    if (!context.current.actionHistory || context.current.actionHistory.length === 0) return undefined;
    return context.current.actionHistory[context.current.actionHistory.length - 1];
  }, [context]);

  // ── تهيئة رسالة الترحيب إذا كانت القائمة فارغة ──────────────────────────
  useEffect(() => {
    if (messages.length === 0) {
      const locale = getAssistantLocale();
      const welcomeText = WELCOME_MESSAGE[locale] ?? WELCOME_MESSAGE.ar;
      setMessages([makeAssistantMsg(welcomeText)]);
    }
  }, [messages, setMessages]);

  // ── تهيئة منصة الوكلاء والربط بالأحداث (Sprint 4 Agent Platform) ─────────
  useEffect(() => {
    // 1. تهيئة نطاق التسوق
    initializeShoppingDomain();

    // 2. الاشتراك في ناقل الأحداث لتحديث واجهة React وتأدية العمليات الفعلية
    const subId = EventBus.getInstance().subscribe('STEP_COMPLETED', async (event) => {
      const { payload } = event;
      if (payload && payload.domain === 'shopping') {
        if (payload.type === 'cart') {
          if (payload.action === 'clear') {
            clearCart();
          } else if (payload.action === 'add_multiple' && payload.productIds) {
            for (const pid of payload.productIds) {
              try {
                const product = await api.getProduct(pid);
                if (product) {
                  triggerAddToCart(formatForState(product), undefined);
                }
              } catch (e) {
                console.error('Failed to add product to cart from agent event:', e);
              }
            }
          }
        } else if (payload.type === 'navigation' && payload.screen) {
          const targetScreen = payload.screen === 'Cart' ? '/cart' : '/';
          router.push(targetScreen as any);
        }
      }
    });

    return () => {
      EventBus.getInstance().unsubscribe(subId);
    };
  }, [triggerAddToCart, clearCart, router]);

  // ── إضافة رسالة ────────────────────────────────────────────────────────
  const appendMsg = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, [setMessages]);

  // ════════════════════════════════════════════════════════════════════════
  // Layer 2: Action Executor — تنفيذ الأوامر
  // ════════════════════════════════════════════════════════════════════════

  // ── التنقل للشاشات ─────────────────────────────────────────────────────
  const executeNavigation = useCallback(async (screen: ScreenName, category?: string) => {
    setStatus('executing');
    const locale = getAssistantLocale();
    
    if (screen === 'Back') {
      const raw = getNavigationResponse('Back', undefined, locale);
      const response = guardResponse(raw, 'NAVIGATION', () => getNavigationResponse('Back', undefined, locale));
      appendMsg(makeAssistantMsg(response));
      
      setStatus('speaking');
      await voiceOutputService.speak(response);
      setStatus('idle');
      
      // الاعتماد أولاً على سجل المسارات المخصص للتعامل مع مشاكل Tab Navigation
      const history = context.current.screenHistory;
      if (history && history.length > 1) {
        history.pop(); // إزالة المسار الحالي
        const prevScreen = history.pop(); // سحب المسار السابق (سيُضاف مجدداً عبر useEffect)
        if (prevScreen) {
          router.push(prevScreen as any);
          return;
        }
      }

      // الرجوع الاحتياطي باستخدام Expo Router
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/');
      }
      return;
    }

    const target = SCREEN_ROUTES[screen] || SCREEN_ROUTES.Home;
    context.current.currentScreen = screen;

    let finalRoute = target.route;
    if (screen === 'Products' && category) {
      const slug = CATEGORY_SLUGS[category] || category.toLowerCase();
      finalRoute = `/products?category=${encodeURIComponent(slug)}`;
    }

    const raw = getNavigationResponse(screen, category, locale);
    const response = guardResponse(raw, 'NAVIGATION', () => getNavigationResponse(screen, category, locale));
    appendMsg(makeAssistantMsg(response));
    
    setStatus('speaking');
    await voiceOutputService.speak(response);
    setStatus('idle');
    
    router.push(finalRoute as any);
  }, [appendMsg, router]);

  // ── البحث عن المنتجات ─────────────────────────────────────────────────
  const executeSearch = useCallback(async (query: string) => {
    setStatus('executing');
    setIsTyping(true);
    const locale = getAssistantLocale();
    try {
      let results: AssistantProduct[] = await api.searchProducts(query, 1, 5);

      // آلية البحث الاحتياطي (Fallback Search) في حال عدم مطابقة الكلمة بدقة
      if (results.length === 0) {
        const words = query.split(' ').filter(w => w.length > 2);
        const indicator = words.find(w => PRODUCT_INDICATOR_WORDS.includes(normalizeText(w))) ||
                          words.sort((a, b) => b.length - a.length)[0];
        if (indicator && indicator !== query) {
          console.log(`[Assistant] Direct search got 0 results. Trying fallback with: "${indicator}"`);
          const fallbackResults = await api.searchProducts(indicator, 1, 10);
          results = fallbackResults.filter(p => fuzzyMatchProduct(p.name, query)).slice(0, 5);
        }
      }

      context.current.lastSearchResults = results;
      context.current.lastQuery = query;

      let responseText = '';
      if (results.length === 0) {
        const raw = getSearchNotFoundResponse(query, locale);
        responseText = guardResponse(raw, 'PRODUCT_SEARCH', () => getSearchNotFoundResponse(query, locale));
        appendMsg(makeAssistantMsg(responseText));
        logInteraction(query, 'PRODUCT_QUERY', 'PRODUCT_SEARCH', 'SEARCH_PRODUCTS', 0.92, true, undefined, undefined, 'no_results');
      } else {
        // تعيين المنتج الأول كمركز عليه تلقائياً
        setFocusedProduct(results[0]);

        const raw = getSearchFoundResponse(results.length, locale);
        responseText = guardResponse(raw, 'PRODUCT_SEARCH', () => getSearchFoundResponse(results.length, locale));
        appendMsg(makeAssistantMsg(responseText, results));
        logInteraction(query, 'PRODUCT_QUERY', 'PRODUCT_SEARCH', 'SEARCH_PRODUCTS', 0.92, true, undefined, undefined, 'results_found');
      }
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      
      // التوجيه الفوري لنتائج البحث
      router.push(`/search?q=${encodeURIComponent(query)}` as any);
    } catch {
      const raw = getSearchErrorResponse(locale);
      const responseText = guardResponse(raw, 'PRODUCT_SEARCH', () => getSearchErrorResponse(locale));
      appendMsg(makeAssistantMsg(responseText));
      logInteraction(query, 'PRODUCT_QUERY', 'PRODUCT_SEARCH', 'SEARCH_PRODUCTS', 0.92, false, 'API error');
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } finally {
      setIsTyping(false);
    }
  }, [appendMsg, router, setFocusedProduct]);

  // ── إضافة منتج للسلة ──────────────────────────────────────────────────
  const executeAddToCart = useCallback(async (productRef: number | undefined, query?: string, quantity: number = 1) => {
    setStatus('executing');
    const locale = getAssistantLocale();
    let product: AssistantProduct | null = null;

    // Bug fix: استخدم focusedProduct من state أيضاً كمصدر (يشمل صفحة المنتج)
    const currentFocused = focusedProduct ?? context.current.currentFocusedProduct;

    if (!query && productRef === undefined && currentFocused) {
      product = currentFocused;
    } else if (query) {
      // مطابقة تقريبية (Fuzzy Match) في نتائج البحث السابقة
      product = context.current.lastSearchResults.find(p => 
        fuzzyMatchProduct(p.name, query)
      ) || null;

      if (!product) {
        setIsTyping(true);
        try {
          let results = await api.searchProducts(query, 1, 5);
          if (results.length === 0) {
            // البحث الاحتياطي بالكلمة الدلالية
            const words = query.split(' ').filter(w => w.length > 2);
            const indicator = words.find(w => PRODUCT_INDICATOR_WORDS.includes(normalizeText(w))) ||
                              words.sort((a, b) => b.length - a.length)[0];
            if (indicator && indicator !== query) {
              console.log(`[Assistant Add] Trying fallback indicator: "${indicator}"`);
              const fallbackResults = await api.searchProducts(indicator, 1, 10);
              results = fallbackResults.filter(p => fuzzyMatchProduct(p.name, query));
            }
          }
          if (results && results.length > 0) {
            product = results[0];
          }
        } catch (e) {
          console.error('Error during automatic product search:', e);
        } finally {
          setIsTyping(false);
        }
      }

      if (!product) {
        const raw = locale === 'ar'
          ? `لم أجد منتجاً باسم "${query}" لإضافته للسلة. 😕`
          : `Could not find a product named "${query}" to add to the cart. 😕`;
        const responseText = guardResponse(raw, 'CART_MANAGEMENT');
        appendMsg(makeAssistantMsg(responseText));
        
        setStatus('speaking');
        await voiceOutputService.speak(responseText);
        setStatus('idle');
        return;
      }
    } else {
      const products = context.current.lastSearchResults;
      if (products.length === 0) {
        // Bug fix: إذا طلب المستخدم "المنتج الأول" ولا توجد نتائج بحث سابقة، نجلب المنتجات من الـ API
        if (productRef !== undefined) {
          setIsTyping(true);
          try {
            const fetched: AssistantProduct[] = await api.getProducts(1, Math.max(productRef + 2, 5));
            if (fetched && fetched.length > productRef) {
              context.current.lastSearchResults = fetched;
              product = fetched[productRef];
            } else {
              const raw = locale === 'ar'
                ? `لم أجد منتجاً رقم ${productRef + 1}. جرّب قل اسم المنتج الذي تريده. 😊`
                : `Could not find product #${productRef + 1}. Try saying the product name instead. 😊`;
              const responseText = guardResponse(raw, 'CART_MANAGEMENT');
              appendMsg(makeAssistantMsg(responseText));
              setStatus('speaking');
              await voiceOutputService.speak(responseText);
              setStatus('idle');
              return;
            }
          } catch {
            const raw = getCartNoResultsResponse(locale);
            const responseText = guardResponse(raw, 'CART_MANAGEMENT', () => getCartNoResultsResponse(locale));
            appendMsg(makeAssistantMsg(responseText));
            setStatus('speaking');
            await voiceOutputService.speak(responseText);
            setStatus('idle');
            return;
          } finally {
            setIsTyping(false);
          }
        } else {
          const raw = getCartNoResultsResponse(locale);
          const responseText = guardResponse(raw, 'CART_MANAGEMENT', () => getCartNoResultsResponse(locale));
          appendMsg(makeAssistantMsg(responseText));
          
          setStatus('speaking');
          await voiceOutputService.speak(responseText);
          setStatus('idle');
          return;
        }
      } else {
        const index = productRef ?? 0;
        product = products[index];

        if (!product) {
          const raw = locale === 'ar'
            ? `لم أجد المنتج رقم ${index + 1}. لدي فقط ${products.length} منتجات في نتائج البحث.`
            : `Could not find product #${index + 1}. I only have ${products.length} results.`;
          const responseText = guardResponse(raw, 'CART_MANAGEMENT');
          appendMsg(makeAssistantMsg(responseText));
          
          setStatus('speaking');
          await voiceOutputService.speak(responseText);
          setStatus('idle');
          return;
        }
      }
    }


    try {
      const cartItem = formatForState(product);
      // إضافة المنتج بالكمية المطلوبة
      for (let i = 0; i < quantity; i++) {
        triggerAddToCart(cartItem, undefined);
      }
      
      // تعيينه كمنتج مركز عليه
      setFocusedProduct(product);

      const qtyText = quantity > 1
        ? (locale === 'ar' ? ` (${quantity} حبات)` : ` (${quantity} items)`)
        : '';
      const raw = locale === 'ar'
        ? `تمت إضافة "${product.name}"${qtyText} إلى السلة. 🛒`
        : `Added "${product.name}"${qtyText} to cart. 🛒`;
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      logInteraction(product.name, 'ACTION', 'CART_MANAGEMENT', 'ADD_TO_CART', 0.93, true);
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } catch {
      const raw = locale === 'ar'
        ? 'تعذّرت الإضافة إلى السلة. يرجى المحاولة مرة أخرى.'
        : 'Failed to add item to cart. Please try again.';
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      logInteraction(product.name, 'ACTION', 'CART_MANAGEMENT', 'ADD_TO_CART', 0.93, false, 'Cart error');
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    }
  }, [appendMsg, triggerAddToCart, setFocusedProduct]);

  // ── حذف منتج من السلة ─────────────────────────────────────────────────
  const executeRemoveFromCart = useCallback(async (productRef: number | undefined, query?: string) => {
    setStatus('executing');
    const locale = getAssistantLocale();
    if (cartItems.length === 0) {
      const raw = getCartEmptyResponse(locale);
      const responseText = guardResponse(raw, 'CART_MANAGEMENT', () => getCartEmptyResponse(locale));
      appendMsg(makeAssistantMsg(responseText));
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      return;
    }

    let itemToRemove = null;

    if (!query && productRef === undefined && context.current.currentFocusedProduct) {
      const focused = context.current.currentFocusedProduct;
      itemToRemove = cartItems.find((item: any) => item.id === focused.id);
    } else if (query) {
      itemToRemove = cartItems.find((item: any) => 
        fuzzyMatchProduct(item.name, query)
      );
      
      if (!itemToRemove) {
        const raw = locale === 'ar'
          ? `لم أجد منتجاً باسم "${query}" في سلة مشترياتك. 😕`
          : `Could not find a product named "${query}" in your cart. 😕`;
        const responseText = guardResponse(raw, 'CART_MANAGEMENT');
        appendMsg(makeAssistantMsg(responseText));
        
        setStatus('speaking');
        await voiceOutputService.speak(responseText);
        setStatus('idle');
        return;
      }
    } else {
      const index = productRef ?? 0;
      itemToRemove = cartItems[index];
      
      if (!itemToRemove) {
        const raw = locale === 'ar'
          ? `لم أجد المنتج رقم ${index + 1} في السلة. لديك ${cartItems.length} منتجات حالياً.`
          : `Could not find product #${index + 1} in the cart. You have ${cartItems.length} items currently.`;
        const responseText = guardResponse(raw, 'CART_MANAGEMENT');
        appendMsg(makeAssistantMsg(responseText));
        
        setStatus('speaking');
        await voiceOutputService.speak(responseText);
        setStatus('idle');
        return;
      }
    }

    try {
      removeFromCart(itemToRemove.id);
      
      const raw = getCartRemoveResponse(itemToRemove.name, locale);
      const responseText = guardResponse(raw, 'CART_MANAGEMENT', () => getCartRemoveResponse(itemToRemove.name, locale));
      appendMsg(makeAssistantMsg(responseText));
      logInteraction(itemToRemove.name, 'ACTION', 'CART_MANAGEMENT', 'REMOVE_FROM_CART', 0.93, true);
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } catch {
      const raw = locale === 'ar'
        ? 'تعذّر حذف المنتج. يرجى المحاولة مرة أخرى.'
        : 'Failed to remove product. Please try again.';
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      logInteraction(itemToRemove.name, 'ACTION', 'CART_MANAGEMENT', 'REMOVE_FROM_CART', 0.93, false, 'Remove error');
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    }
  }, [appendMsg, cartItems, removeFromCart]);

  // ── تفريغ السلة (مع طبقة التأكيد) ──────────────────────────────────────
  const executeClearCart = useCallback(async () => {
    const locale = getAssistantLocale();
    if (cartItems.length === 0) {
      const raw = getCartEmptyResponse(locale);
      const responseText = guardResponse(raw, 'CART_MANAGEMENT', () => getCartEmptyResponse(locale));
      appendMsg(makeAssistantMsg(responseText));
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      return;
    }

    // تعيين الإجراء كمعلق وطلب التأكيد
    context.current.pendingAction = { type: 'CLEAR_CART' };
    const rawPrompt = getConfirmationPrompt('CLEAR_CART', locale);
    const promptText = guardResponse(rawPrompt, 'CART_MANAGEMENT', () => getConfirmationPrompt('CLEAR_CART', locale));
    appendMsg(makeAssistantMsg(promptText));

    setStatus('speaking');
    await voiceOutputService.speak(promptText);
    setStatus('listening'); // تشغيل المايك فوراً لتلقي الإجابة (نعم/لا)
  }, [appendMsg, cartItems]);

  // ── تفريغ المفضلات (مع طبقة التأكيد) ───────────────────────────────────
  const executeClearFavorites = useCallback(async () => {
    const locale = getAssistantLocale();
    if (!favorites || favorites.length === 0) {
      const raw = locale === 'ar'
        ? 'قائمة المفضلات فارغة بالفعل. 💜'
        : 'Your favorites list is already empty. 💜';
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      return;
    }

    // تعيين الإجراء كمعلق وطلب التأكيد
    context.current.pendingAction = { type: 'CLEAR_FAVORITES' };
    const rawPrompt = getConfirmationPrompt('CLEAR_FAVORITES', locale);
    const promptText = guardResponse(rawPrompt, 'CART_MANAGEMENT', () => getConfirmationPrompt('CLEAR_FAVORITES', locale));
    appendMsg(makeAssistantMsg(promptText));

    setStatus('speaking');
    await voiceOutputService.speak(promptText);
    setStatus('listening');
  }, [appendMsg, favorites]);

  // ── إضافة منتج للمفضلة ────────────────────────────────────────────────
  const executeAddToFavorites = useCallback(async (productRef: number | undefined, query?: string) => {
    setStatus('executing');
    const locale = getAssistantLocale();
    let product: AssistantProduct | null = null;

    if (!query && productRef === undefined && context.current.currentFocusedProduct) {
      product = context.current.currentFocusedProduct;
    } else if (query) {
      product = context.current.lastSearchResults.find(p => 
        fuzzyMatchProduct(p.name, query)
      ) || null;

      if (!product) {
        try {
          setIsTyping(true);
          let results = await api.searchProducts(query, 1, 5);
          if (results && results.length > 0) {
            product = results[0];
          }
        } catch {} finally {
          setIsTyping(false);
        }
      }
    } else {
      const products = context.current.lastSearchResults;
      const index = productRef ?? 0;
      product = products[index];
    }

    if (!product) {
      const raw = locale === 'ar'
        ? `لم أجد هذا المنتج لإضافته للمفضلة. 😕`
        : `Could not find this product to add to favorites. 😕`;
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      return;
    }

    try {
      const favItem = formatForState(product);
      if (!isFavorite(product.id)) {
        toggleFavorite(favItem);
      }
      
      const raw = locale === 'ar'
        ? `تمت إضافة "${product.name}" إلى مفضلتك. 💜`
        : `Added "${product.name}" to your favorites. 💜`;
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } catch {
      const raw = locale === 'ar'
        ? 'تعذر إضافة المنتج للمفضلة.'
        : 'Failed to add product to favorites.';
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    }
  }, [appendMsg, toggleFavorite, isFavorite]);

  // ── إزالة منتج من المفضلة ───────────────────────────────────────────────
  const executeRemoveFromFavorites = useCallback(async (productRef: number | undefined, query?: string) => {
    setStatus('executing');
    const locale = getAssistantLocale();
    let product: AssistantProduct | null = null;

    if (!query && productRef === undefined && context.current.currentFocusedProduct) {
      product = context.current.currentFocusedProduct;
    } else if (query) {
      product = favorites.find((item: any) => 
        fuzzyMatchProduct(item.name, query)
      ) || null;
    } else {
      const index = productRef ?? 0;
      product = favorites[index];
    }

    if (!product) {
      const raw = locale === 'ar'
        ? `لم أجد هذا المنتج في قائمة المفضلات. 😕`
        : `Could not find this product in your favorites. 😕`;
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      return;
    }

    try {
      if (isFavorite(product.id)) {
        toggleFavorite(product);
      }
      
      const raw = locale === 'ar'
        ? `تمت إزالة "${product.name}" من مفضلتك. 💜`
        : `Removed "${product.name}" from your favorites. 💜`;
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } catch {
      const raw = locale === 'ar'
        ? 'تعذر إزالة المنتج من المفضلة.'
        : 'Failed to remove product from favorites.';
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    }
  }, [appendMsg, toggleFavorite, isFavorite, favorites]);

  // ── زيادة الكمية ─────────────────────────────────────────────────────
  const executeIncreaseQuantity = useCallback(async (productRef: number | undefined, query?: string) => {
    setStatus('executing');
    const locale = getAssistantLocale();
    let item: any = null;

    if (!query && productRef === undefined && context.current.currentFocusedProduct) {
      const focused = context.current.currentFocusedProduct;
      item = cartItems.find((p: any) => p.id === focused.id);
    } else if (query) {
      item = cartItems.find((p: any) => fuzzyMatchProduct(p.name, query));
    } else {
      const index = productRef ?? 0;
      item = cartItems[index];
    }

    if (!item) {
      const focused = context.current.currentFocusedProduct;
      if (focused) {
        const cartItem = formatForState(focused, 2);
        triggerAddToCart(cartItem, undefined);
        const raw = locale === 'ar'
          ? `أضفت "${focused.name}" إلى السلة مع زيادة الكمية إلى 2. 🛒`
          : `Added "${focused.name}" to cart and set quantity to 2. 🛒`;
        const responseText = guardResponse(raw, 'CART_MANAGEMENT');
        appendMsg(makeAssistantMsg(responseText));
        setStatus('speaking');
        await voiceOutputService.speak(responseText);
        setStatus('idle');
        return;
      }

      const raw = locale === 'ar'
        ? `هذا المنتج غير موجود في سلتك حالياً. 😕`
        : `This product is not in your cart currently. 😕`;
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      return;
    }

    try {
      const newQty = item.quantity + 1;
      updateQuantity(item.id, newQty);
      const raw = locale === 'ar'
        ? `تمت زيادة كمية "${item.name}" في السلة إلى ${newQty}. 📈`
        : `Increased quantity of "${item.name}" in your cart to ${newQty}. 📈`;
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } catch {
      const raw = locale === 'ar' ? 'تعذر تعديل الكمية.' : 'Failed to update quantity.';
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    }
  }, [appendMsg, cartItems, updateQuantity, triggerAddToCart]);

  // ── إنقاص الكمية ─────────────────────────────────────────────────────
  const executeDecreaseQuantity = useCallback(async (productRef: number | undefined, query?: string) => {
    setStatus('executing');
    const locale = getAssistantLocale();
    let item: any = null;

    if (!query && productRef === undefined && context.current.currentFocusedProduct) {
      const focused = context.current.currentFocusedProduct;
      item = cartItems.find((p: any) => p.id === focused.id);
    } else if (query) {
      item = cartItems.find((p: any) => fuzzyMatchProduct(p.name, query));
    } else {
      const index = productRef ?? 0;
      item = cartItems[index];
    }

    if (!item) {
      const raw = locale === 'ar'
        ? `هذا المنتج غير موجود في سلتك حالياً. 😕`
        : `This product is not in your cart currently. 😕`;
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      return;
    }

    try {
      const newQty = item.quantity - 1;
      updateQuantity(item.id, newQty);
      
      let raw = '';
      if (newQty <= 0) {
        raw = locale === 'ar'
          ? `تمت إزالة "${item.name}" من السلة. 🗑️`
          : `Removed "${item.name}" from your cart. 🗑️`;
      } else {
        raw = locale === 'ar'
          ? `تم تقليل كمية "${item.name}" في السلة إلى ${newQty}. 📉`
          : `Decreased quantity of "${item.name}" in your cart to ${newQty}. 📉`;
      }
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } catch {
      const raw = locale === 'ar' ? 'تعذر تعديل الكمية.' : 'Failed to update quantity.';
      const responseText = guardResponse(raw, 'CART_MANAGEMENT');
      appendMsg(makeAssistantMsg(responseText));
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    }
  }, [appendMsg, cartItems, updateQuantity]);

  // ── التوصيات ───────────────────────────────────────────────────────────
  // Bug fix: لا نتنقل لصفحة أخرى — نعرض الكروت مباشرة في المحادثة
  const executeRecommendations = useCallback(async (limit: number) => {
    setStatus('executing');
    setIsTyping(true);
    const locale = getAssistantLocale();
    try {
      const allProducts: AssistantProduct[] = await api.getProducts(1, limit);

      context.current.lastRecommendations = allProducts;
      context.current.lastSearchResults = allProducts;

      let responseText = '';
      if (allProducts.length === 0) {
        const raw = locale === 'ar' ? 'لا توجد توصيات متاحة حالياً. 😕' : 'No recommendations available at the moment. 😕';
        responseText = guardResponse(raw, 'RECOMMENDATIONS');
        appendMsg(makeAssistantMsg(responseText));
      } else {
        // تعيين المنتج الأول كمركز عليه
        setFocusedProduct(allProducts[0]);

        const raw = getRecommendationsResponse(allProducts.length, locale);
        responseText = guardResponse(raw, 'RECOMMENDATIONS', () => getRecommendationsResponse(allProducts.length, locale));
        // عرض الكروت مباشرة في المحادثة — لا تنقل للصفحة
        appendMsg(makeAssistantMsg(responseText, allProducts));
      }
      logInteraction(`recommendations:${limit}`, 'PRODUCT_QUERY', 'RECOMMENDATIONS', 'SHOW_RECOMMENDATIONS', 0.92, true);
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
      // ✅ لا يوجد router.push هنا — المنتجات تُعرض كـ cards في المحادثة مباشرة
    } catch {
      const raw = getSearchErrorResponse(locale);
      const responseText = guardResponse(raw, 'RECOMMENDATIONS', () => getSearchErrorResponse(locale));
      appendMsg(makeAssistantMsg(responseText));
      logInteraction(`recommendations:${limit}`, 'PRODUCT_QUERY', 'RECOMMENDATIONS', 'SHOW_RECOMMENDATIONS', 0.92, false, 'API error');
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } finally {
      setIsTyping(false);
    }
  }, [appendMsg, setFocusedProduct]);

  // ── تصفح الفئات ───────────────────────────────────────────────────────
  const executeCategoryBrowse = useCallback(async (category: string) => {
    setStatus('executing');
    setIsTyping(true);
    const locale = getAssistantLocale();
    try {
      const slug = CATEGORY_SLUGS[category] || category.toLowerCase();
      // جلب المنتجات لتحديث السياق فقط (بدون عرض كروت)
      const results: AssistantProduct[] = await api.getProducts(1, 5, slug as any);

      context.current.lastSearchResults = results;
      context.current.lastCategory = category;

      let responseText = '';
      if (results.length === 0) {
        const raw = locale === 'ar'
          ? `لم أجد منتجات في قسم "${category}". 😕`
          : `No products found in the "${category}" category. 😕`;
        responseText = guardResponse(raw, 'CATEGORY_BROWSING');
        appendMsg(makeAssistantMsg(responseText));
        logInteraction(category, 'ACTION', 'CATEGORY_BROWSING', 'BROWSE_CATEGORY', 0.90, true);
        setStatus('speaking');
        await voiceOutputService.speak(responseText);
        setStatus('idle');
      } else {
        // تحديث السياق بالمنتج المركز عليه
        setFocusedProduct(results[0]);

        // رسالة نصية مختصرة فقط — بدون كروت (المستخدم سيرى المنتجات في الصفحة)
        const raw = locale === 'ar'
          ? `جاري نقلك لقسم "${category}" 📂`
          : `Taking you to the "${category}" section 📂`;
        responseText = guardResponse(raw, 'CATEGORY_BROWSING');
        appendMsg(makeAssistantMsg(responseText));
        logInteraction(category, 'ACTION', 'CATEGORY_BROWSING', 'BROWSE_CATEGORY', 0.90, true);

        setStatus('speaking');
        await voiceOutputService.speak(responseText);
        setStatus('idle');

        // التوجيه لصفحة القسم + إغلاق المساعد
        router.push(`/products?category=${encodeURIComponent(slug)}` as any);
        closeAssistant();
      }
    } catch {
      const raw = getSearchErrorResponse(locale);
      const responseText = guardResponse(raw, 'CATEGORY_BROWSING', () => getSearchErrorResponse(locale));
      appendMsg(makeAssistantMsg(responseText));
      logInteraction(category, 'ACTION', 'CATEGORY_BROWSING', 'BROWSE_CATEGORY', 0.90, false, 'API error');
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    } finally {
      setIsTyping(false);
    }
  }, [appendMsg, router, setFocusedProduct, closeAssistant]);

  // ════════════════════════════════════════════════════════════════════════
  // بناء سياق التسجيل لـ ActionRegistry
  // ════════════════════════════════════════════════════════════════════════

  const buildRegistryContext = useCallback(() => ({
    locale: getAssistantLocale(),
    router,
    cart: {
      items: cartItems,
      add: (product: any, source?: any) => triggerAddToCart(product, source),
      remove: removeFromCart,
      updateQty: updateQuantity,
      clear: clearCart,
    },
    favorites: {
      items: favorites,
      toggle: toggleFavorite,
      isFav: isFavorite,
      clear: clearFavorites,
    },
    activeContext,
    setActiveContext,
    focusedProduct,
    setFocusedProduct,
    appendMsg,
    makeAssistantMsg,
    setStatus,
    setIsTyping,
    closeAssistant,
    guardResponse,
    voiceOutputService,
    contextRef: context,
    pushActionToHistory,
    popActionFromHistory,
    peekActionFromHistory,
    searchProducts: async (query: string) => {
      try {
        let results: AssistantProduct[] = await api.searchProducts(query, 1, 5);
        if (results.length === 0) {
          const words = query.split(' ').filter((w: string) => w.length > 2);
          const indicator = words.sort((a: string, b: string) => b.length - a.length)[0];
          if (indicator && indicator !== query) {
            const fallback: AssistantProduct[] = await api.searchProducts(indicator, 1, 10);
            results = fallback.filter((p: AssistantProduct) => fuzzyMatchProduct(p.name, query)).slice(0, 5);
          }
        }
        return results;
      } catch { return []; }
    },
    formatForState,
    fuzzyMatchProduct,
  }), [
    router, cartItems, triggerAddToCart, removeFromCart, updateQuantity, clearCart,
    favorites, toggleFavorite, isFavorite, clearFavorites,
    activeContext, setActiveContext, focusedProduct, setFocusedProduct,
    appendMsg, setStatus, setIsTyping, closeAssistant,
    context, pushActionToHistory, popActionFromHistory, peekActionFromHistory,
  ]);

  // ════════════════════════════════════════════════════════════════════════
  // نقطة الدخول الرئيسية لجدولة الطلبات
  // ════════════════════════════════════════════════════════════════════════

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Analyze and store sentiment of current user message
      currentSentiment = analyzeSentiment(trimmed);

      const locale = getAssistantLocale();

      // 1. إضافة رسالة المستخدم
      appendMsg(makeUserMsg(trimmed));

      // 1.5 توجيه الأهداف العامة المعقدة لمحرك تخطيط الوكيل الذكي (Sprint 4 Agent Platform)
      // ملاحظة: نتحقق أولاً من أن IntentEngine لا يتعرف على نية واضحة (تنقل، إضافة، حذف، تصفح...)
      // لأن كلمات مثل "عناية" تتقاطع مع أسماء الأقسام ("العناية بالشعر")
      const GOAL_KEYWORDS = ['روتين', 'routine', 'عناية', 'بميزانية'];
      const hasGoalKeyword = GOAL_KEYWORDS.some(kw => trimmed.includes(kw));
      if (hasGoalKeyword) {
        const quickCheck = analyzeIntent(trimmed, context.current);
        const isActionableIntent = quickCheck.confidence >= 0.85 && (
          quickCheck.category === 'ACTION' ||
          quickCheck.category === 'PRODUCT_QUERY'
        );
        if (!isActionableIntent) {
          // فعلاً هدف معقد → نوجه للـ Agent
          setStatus('processing');
          try {
            const agentResponse = await AgentOrchestrator.getInstance().handleUserInput(trimmed);
            
            appendMsg(makeAssistantMsg(agentResponse));
            
            setStatus('speaking');
            await voiceOutputService.speak(agentResponse);
          } catch (err) {
            console.error('[useAssistant] Agent platform error:', err);
            const fallbackMsg = locale === 'ar' 
              ? 'تعذر معالجة الهدف بواسطة منصة الوكيل حالياً. 😕' 
              : 'Failed to process goal via agent platform. 😕';
            appendMsg(makeAssistantMsg(fallbackMsg));
          } finally {
            setStatus('idle');
          }
          return;
        }
        // إذا كانت نية واضحة (مثل تصفح قسم)، نتابع التنفيذ العادي أدناه
      }

      // 2. تحليل النية وتصنيف الفئات عبر IntentEngine المحدث
      setStatus('processing');
      const result = analyzeIntent(trimmed, context.current);
      console.log('[Assistant] Classification & Intent:', JSON.stringify(result, null, 2));

      // حفظ آخر نية كمرجع
      const lastIntentRef = context.current.lastIntent;
      context.current.lastIntent = result.intent;

      // 3. التحقق من مستويات الثقة الذكية
      if (result.confidence < CONFIDENCE.CLARIFY) {
        // UNKNOWN < 0.60
        const raw = getUnknownResponse(locale);
        const responseText = guardResponse(raw, 'UNKNOWN', () => getUnknownResponse(locale));
        appendMsg(makeAssistantMsg(responseText));
        logInteraction(trimmed, 'UNKNOWN', 'UNKNOWN', 'NONE', result.confidence, false, 'Low confidence', lastIntentRef, result.matchedPattern);
        
        setStatus('speaking');
        await voiceOutputService.speak(responseText);
        setStatus('idle');
        return;
      }

      if (result.confidence < CONFIDENCE.EXECUTE) {
        // CLARIFY 0.60 - 0.84
        const raw = getClarifyResponse(locale);
        const responseText = guardResponse(raw, 'UNKNOWN', () => getClarifyResponse(locale));
        appendMsg(makeAssistantMsg(responseText));
        logInteraction(trimmed, result.category, result.intent, 'CLARIFY', result.confidence, false, 'Needs clarification', lastIntentRef, result.matchedPattern);
        
        setStatus('speaking');
        await voiceOutputService.speak(responseText);
        setStatus('idle');
        return;
      }

      // 4. توجيه الطلبات حسب الفئة الكبرى (Category Router)
      switch (result.category) {
        
        // ── 1. CONFIRMATION (التأكيد والرفض) ─────────────────────────────
        case 'CONFIRMATION': {
          const pending = context.current.pendingAction;
          if (pending) {
            if (result.intent === 'CONFIRM_YES') {
              // تنفيذ الإجراء المعلق
              if (pending.type === 'CLEAR_CART') {
                clearCart();
              } else if (pending.type === 'CLEAR_FAVORITES') {
                clearFavorites();
              }
              const raw = getConfirmYesResponse(pending.type, locale);
              const responseText = guardResponse(raw, 'CONFIRM_YES', () => getConfirmYesResponse(pending.type, locale));
              appendMsg(makeAssistantMsg(responseText));
              logInteraction(trimmed, 'CONFIRMATION', 'CONFIRM_YES', pending.type, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              
              setStatus('speaking');
              await voiceOutputService.speak(responseText);
              setStatus('idle');
            } else {
              // إلغاء الإجراء المعلق
              const raw = getConfirmNoResponse(locale);
              const responseText = guardResponse(raw, 'CONFIRM_NO', () => getConfirmNoResponse(locale));
              appendMsg(makeAssistantMsg(responseText));
              logInteraction(trimmed, 'CONFIRMATION', 'CONFIRM_NO', 'NONE', result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              
              setStatus('speaking');
              await voiceOutputService.speak(responseText);
              setStatus('idle');
            }
            context.current.pendingAction = undefined;
          } else {
            // تأكيد بلا سياق
            const raw = locale === 'ar'
              ? 'حسناً! هل يمكنني مساعدتك في شيء آخر؟ 😊'
              : 'Sure! Can I help you with anything else? 😊';
            const responseText = guardResponse(raw, 'CONFIRM_YES');
            appendMsg(makeAssistantMsg(responseText));
            logInteraction(trimmed, 'CONFIRMATION', result.intent, 'NONE', result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
            
            setStatus('speaking');
            await voiceOutputService.speak(responseText);
            setStatus('idle');
          }
          break;
        }

        // ── 2. CONVERSATION (المحادثات العامة والإرشاد) ──────────────────
        case 'CONVERSATION': {
          let raw: string;
          if (result.intent === 'HELP') {
            raw = getHelpResponse(locale);
          } else {
            raw = getSmallTalkResponse(trimmed, locale);
          }
          const responseText = guardResponse(raw, result.intent === 'HELP' ? 'HELP' : 'SMALL_TALK', () =>
            result.intent === 'HELP' ? getHelpResponse(locale) : getSmallTalkResponse(trimmed, locale)
          );
          appendMsg(makeAssistantMsg(responseText));
          logInteraction(trimmed, 'CONVERSATION', result.intent, 'NONE', result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
          
          setStatus('speaking');
          await voiceOutputService.speak(responseText);
          setStatus('idle');
          break;
        }

        // ── 3. QUESTION (الاستفسارات والأسئلة) ───────────────────────────
        case 'QUESTION': {
          let focused = focusedProduct ?? context.current.currentFocusedProduct;

          // إذا كان السؤال يحتوي على اسم منتج معين (مثل: بشحال شامبو الكيراتين)
          const query = result.entities.query;
          if (query && query.trim().length > 1) {
            // التحقق من المطابقة في نتائج البحث السابقة أولاً لتسريع الاستجابة
            let product = context.current.lastSearchResults.find(p => 
              fuzzyMatchProduct(p.name, query)
            ) || null;

            if (!product) {
              setIsTyping(true);
              try {
                const results = await api.searchProducts(query, 1, 3);
                if (results && results.length > 0) {
                  product = results[0];
                }
              } catch (e) {
                console.warn('[Assistant Question] Product search failed:', e);
              } finally {
                setIsTyping(false);
              }
            }

            if (product) {
              focused = product;
              setFocusedProduct(product);
            }
          }

          let raw = '';
          let retryFn: (() => string) | undefined;

          switch (result.intent) {
            case 'ASK_PRICE':
              raw = getPriceResponse(focused?.name, focused?.price, locale);
              retryFn = () => getPriceResponse(focused?.name, focused?.price, locale);
              break;
            case 'PRODUCT_DETAILS':
              raw = getDetailsResponse(focused, locale);
              retryFn = () => getDetailsResponse(focused, locale);
              break;
            case 'ASK_AVAILABILITY':
              raw = getAvailabilityResponse(focused?.name, locale);
              retryFn = () => getAvailabilityResponse(focused?.name, locale);
              break;
            case 'ASK_DELIVERY':
              raw = getDeliveryResponse(locale);
              retryFn = () => getDeliveryResponse(locale);
              break;
            case 'ASK_WARRANTY':
              raw = getWarrantyResponse(locale);
              retryFn = () => getWarrantyResponse(locale);
              break;
            case 'ASK_COMPARISON':
              raw = getComparisonResponse(locale);
              retryFn = () => getComparisonResponse(locale);
              break;
            case 'BRAND_INFORMATION':
              raw = getBrandInfoResponse(locale);
              retryFn = () => getBrandInfoResponse(locale);
              break;
            default:
              raw = getUnknownResponse(locale);
              retryFn = () => getUnknownResponse(locale);
          }

          const responseText = guardResponse(raw, result.intent as IntentType, retryFn);
          appendMsg(makeAssistantMsg(responseText));
          logInteraction(trimmed, 'QUESTION', result.intent, result.action, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
          
          setStatus('speaking');
          await voiceOutputService.speak(responseText);
          setStatus('idle');
          break;
        }

        // ── 4. ACTION (الأوامر والتنفيذ الفعلي) ──────────────────────────
        case 'ACTION': {
          const ctxReg = {
            ...buildRegistryContext(),
            result,
            trimmed,
          } as any;

          // أ. تحقق من وجود طلبات مركبة (Pipeline)
          if (result.entities.pipelineSteps) {
            const pipeline = InteractionPipeline.fromEntities(ctxReg, result.entities.pipelineSteps);
            await pipeline.run();
            logInteraction(trimmed, 'ACTION', result.intent, result.action, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
            break;
          }

          // ب. تحقق من التسجيل الديناميكي (InteractionRegistry)
          const handler = InteractionRegistry.resolve(result.intent);
          if (handler) {
            await handler(ctxReg, result.entities);
            logInteraction(trimmed, 'ACTION', result.intent, result.action, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
            break;
          }

          // ج. الأوامر التقليدية القديمة (Fallback Switch)
          switch (result.intent) {
            case 'NAVIGATION': {
              const screen = result.entities.screen;
              if (screen) {
                const hasPronoun = ['اليه', 'ليه', 'ليها', 'اليها'].some(p => trimmed.toLowerCase().includes(p));
                if (hasPronoun && context.current.lastCategory) {
                  await executeNavigation(screen, context.current.lastCategory);
                } else {
                  await executeNavigation(screen);
                }
                logInteraction(trimmed, 'ACTION', 'NAVIGATION', result.action, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              } else {
                const raw = getClarifyResponse(locale);
                const responseText = guardResponse(raw, 'NAVIGATION', () => getClarifyResponse(locale));
                appendMsg(makeAssistantMsg(responseText));
                logInteraction(trimmed, 'ACTION', 'NAVIGATION', 'CLARIFY', result.confidence, false, 'No screen', lastIntentRef, result.matchedPattern);
                
                setStatus('speaking');
                await voiceOutputService.speak(responseText);
                setStatus('idle');
              }
              break;
            }

            case 'CART_MANAGEMENT': {
              switch (result.action) {
                case 'ADD_TO_CART':
                  await executeAddToCart(result.entities.productRef, result.entities.query, result.entities.quantity);
                  break;
                case 'REMOVE_FROM_CART':
                  await executeRemoveFromCart(result.entities.productRef, result.entities.query);
                  break;
                case 'CLEAR_CART':
                  await executeClearCart();
                  break;
                case 'CLEAR_FAVORITES':
                  await executeClearFavorites();
                  break;
                default:
                  await executeAddToCart(result.entities.productRef, result.entities.query, result.entities.quantity);
              }
              break;
            }

            case 'ADD_TO_FAVORITES': {
              const ctx3 = buildRegistryContext();
              await ActionRegistry.ADD_TO_FAVORITES(ctx3, {
                productRef: result.entities.productRef,
                query: result.entities.query,
              });
              logInteraction(trimmed, 'ACTION', 'ADD_TO_FAVORITES', result.action, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              break;
            }

            case 'REMOVE_FROM_FAVORITES': {
              const ctx4 = buildRegistryContext();
              await ActionRegistry.REMOVE_FROM_FAVORITES(ctx4, {
                productRef: result.entities.productRef,
                query: result.entities.query,
              });
              logInteraction(trimmed, 'ACTION', 'REMOVE_FROM_FAVORITES', result.action, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              break;
            }

            case 'INCREASE_QUANTITY': {
              const ctx5 = buildRegistryContext();
              await ActionRegistry.INCREASE_QUANTITY(ctx5, {
                productRef: result.entities.productRef,
                query: result.entities.query,
                amount: result.entities.amount,
              });
              logInteraction(trimmed, 'ACTION', 'INCREASE_QUANTITY', result.action, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              break;
            }

            case 'DECREASE_QUANTITY': {
              const ctx6 = buildRegistryContext();
              await ActionRegistry.DECREASE_QUANTITY(ctx6, {
                productRef: result.entities.productRef,
                query: result.entities.query,
                amount: result.entities.amount,
              });
              logInteraction(trimmed, 'ACTION', 'DECREASE_QUANTITY', result.action, result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              break;
            }

            case 'CATEGORY_BROWSING': {
              const category = result.entities.category;
              if (category) {
                await executeCategoryBrowse(category);
              } else {
                const rawCat = locale === 'ar'
                  ? 'أي قسم تريد تصفحه؟ 🤔\n\nمثلاً: العناية بالبشرة، الشعر، المكياج، العطور'
                  : 'Which category would you like to browse? 🤔\n\nFor example: Skincare, Hair Care, Makeup, Perfume';
                const responseText = guardResponse(rawCat, 'CATEGORY_BROWSING');
                appendMsg(makeAssistantMsg(responseText));
                logInteraction(trimmed, 'ACTION', 'CATEGORY_BROWSING', 'BROWSE_CATEGORY', result.confidence, false, 'No category', lastIntentRef, result.matchedPattern);
                
                setStatus('speaking');
                await voiceOutputService.speak(responseText);
                setStatus('idle');
              }
              break;
            }

            case 'HUMAN_HANDOFF': {
              const raw = getHandoffResponse(locale);
              const responseText = guardResponse(raw, 'HUMAN_HANDOFF', () => getHandoffResponse(locale));
              appendMsg(makeAssistantMsg(responseText));
              logInteraction(trimmed, 'ACTION', 'HUMAN_HANDOFF', 'ESCALATE_TO_SUPPORT', result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              
              setStatus('speaking');
              await voiceOutputService.speak(responseText);
              setStatus('idle');
              break;
            }

            case 'UNDO': {
              const ctxUndo = buildRegistryContext();
              await ActionRegistry.UNDO(ctxUndo, {});
              logInteraction(trimmed, 'ACTION', 'UNDO', 'UNDO', result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              break;
            }

            case 'REPEAT_LAST': {
              const ctxRepeat = buildRegistryContext();
              await ActionRegistry.REPEAT_LAST(ctxRepeat, {});
              logInteraction(trimmed, 'ACTION', 'REPEAT_LAST', 'REPEAT_LAST', result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              break;
            }

            case 'SHARE_PRODUCT': {
              const ctxShare = buildRegistryContext();
              await ActionRegistry.SHARE_PRODUCT(ctxShare, {});
              logInteraction(trimmed, 'ACTION', 'SHARE_PRODUCT', 'SHARE_PRODUCT', result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              break;
            }

            case 'CLICK_ELEMENT': {
              const ctxClick = buildRegistryContext();
              await ActionRegistry.CLICK_ELEMENT(ctxClick, {
                query: result.entities.elementName || result.entities.query,
              });
              logInteraction(trimmed, 'ACTION', 'CLICK_ELEMENT', 'CLICK_ELEMENT', result.confidence, true, undefined, lastIntentRef, result.matchedPattern);
              break;
            }

            default: {
              const rawErr = getUnknownResponse(locale);
              const errResponse = guardResponse(rawErr, 'UNKNOWN', () => getUnknownResponse(locale));
              appendMsg(makeAssistantMsg(errResponse));
              setStatus('speaking');
              await voiceOutputService.speak(errResponse);
              setStatus('idle');
            }
          }
          break;
        }

        // ── 5. PRODUCT_QUERY (البحث والتوصيات) ───────────────────────────
        case 'PRODUCT_QUERY': {
          if (result.intent === 'PRODUCT_SEARCH') {
            const query = result.entities.query || trimmed;
            context.current.lastQuery = query;
            await executeSearch(query);
          } else if (result.intent === 'RECOMMENDATIONS') {
            const limit = result.entities.limit || 5;
            await executeRecommendations(limit);
          }
          break;
        }

        // ── 6. UNKNOWN (النوايا الغامضة) ─────────────────────────────────
        default: {
          const raw = getUnknownResponse(locale);
          const responseText = guardResponse(raw, 'UNKNOWN', () => getUnknownResponse(locale));
          appendMsg(makeAssistantMsg(responseText));
          logInteraction(trimmed, 'UNKNOWN', 'UNKNOWN', 'NONE', result.confidence, false, 'Unknown category fallback', lastIntentRef, result.matchedPattern);
          
          setStatus('speaking');
          await voiceOutputService.speak(responseText);
          setStatus('idle');
        }
      }
    },
    [
      appendMsg,
      executeNavigation,
      executeSearch,
      executeAddToCart,
      executeRemoveFromCart,
      executeClearCart,
      executeClearFavorites,
      executeAddToFavorites,
      executeRemoveFromFavorites,
      executeIncreaseQuantity,
      executeDecreaseQuantity,
      executeRecommendations,
      executeCategoryBrowse,
      clearCart,
      clearFavorites,
      setFocusedProduct,
      buildRegistryContext,
    ]
  );

  return {
    messages,
    isTyping,
    status,
    setStatus,
    sendMessage,
    focusedProduct,
    setFocusedProduct,
    /** إضافة المنتج مباشرة من بطاقة الشات */
    addProductToCart: async (product: AssistantProduct) => {
      const locale = getAssistantLocale();
      const cartItem = formatForState(product);
      triggerAddToCart(cartItem, undefined);

      setFocusedProduct(product);
      
      const raw = getCartAddResponse(product, locale);
      const responseText = guardResponse(raw, 'CART_MANAGEMENT', () => getCartAddResponse(product, locale));
      appendMsg(makeAssistantMsg(responseText));
      logInteraction(product.name, 'ACTION', 'CART_MANAGEMENT', 'ADD_TO_CART', 1.0, true, undefined, undefined, 'direct_add');
      
      setStatus('speaking');
      await voiceOutputService.speak(responseText);
      setStatus('idle');
    },
  };
};
