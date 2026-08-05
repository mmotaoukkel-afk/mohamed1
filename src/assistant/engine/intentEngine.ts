/**
 * IntentEngine — Layer 1: محرك تحليل النية والتصنيف الذكي (v3 — Production Ready)
 *
 * البنية الجديدة المقسمة إلى مرحلتين:
 *  1. Classification Layer → تحديد الفئة الكبرى (ACTION, QUESTION, CONFIRMATION, CONVERSATION, PRODUCT_QUERY)
 *  2. Intent & Action Routing → تحديد النية الدقيقة والأمر المناسب للترقية لـ V1.
 *
 * Confidence Thresholds:
 *  ≥ 0.85 → تنفيذ مباشر
 *  0.60–0.84 → طلب توضيح
 *  < 0.60 → UNKNOWN (تسجل كاملة في Telemetry)
 */

import type {
  ActionType,
  IntentType,
  ParsedIntent,
  ScreenName,
  SortOption,
  AssistantCategory,
  AssistantContext,
} from '../types';
import {
  ADD_ALIASES,
  BRAND_ALIASES,
  CART_ALIASES,
  FAVORITES_ALIASES,
  GREETING_ALIASES,
  HOW_ARE_YOU_ALIASES,
  NAVIGATE_ALIASES,
  POSITIVE_ALIASES,
  RECOMMENDATION_ALIASES,
  REMOVE_ALIASES,
  SHOW_ALIASES,
  SUPPORT_ALIASES,
  THANKS_ALIASES,
  UNDO_ALIASES,
  REPEAT_ALIASES,
  CLICK_ALIASES,
  SHARE_ALIASES,
  containsAny,
  extractCategory,
  extractNumber,
  extractOrdinal,
  extractProductQuery,
  extractScreen,
  normalizeText,
  matchWord,
  isGenericCategoryQuery,
  // ثوابت ومساعدات fuzzy/semantic المضافة
  PRODUCT_INDICATOR_WORDS,
  CATEGORY_NAV_WORDS,
  CLEAR_CART_WORDS,
  PRICE_QUESTION_ALIASES,
  DELIVERY_QUESTION_ALIASES,
  WARRANTY_QUESTION_ALIASES,
  AVAILABILITY_QUESTION_ALIASES,
  COMPARISON_QUESTION_ALIASES,
  DETAILS_QUESTION_ALIASES,
  CONFIRM_YES_ALIASES,
  CONFIRM_NO_ALIASES,
  SEARCH_PATTERNS_PREFIXES,
  ACTION_PATTERNS_PREFIXES,
  isFollowUpQuery,
} from './aliasResolver';

import { detectInteractionIntent, injectPendingText, injectPendingRating } from './interactionEngine';

// ─── المحلل الرئيسي ─────────────────────────────────────────────────────────────

export const analyzeIntent = (rawText: string, context?: AssistantContext): ParsedIntent => {
  const normalized = normalizeText(rawText);

  // نص فارغ
  if (!normalized) {
    return buildResult('UNKNOWN', 'UNKNOWN', 'NONE', 1.0, {}, rawText, 'empty_text');
  }

  // ─── مرحلة -1: الاستجابة لـ pendingInteraction (Short Memory) ──────────────
  if (context?.pendingInteraction?.status === 'awaiting_text' ||
      (context?.pendingInteraction?.status === 'awaiting_input' && context?.pendingInteraction?.awaitingInputType === 'text')) {
    return injectPendingText(normalized, rawText, context);
  }
  if (context?.pendingInteraction?.status === 'awaiting_input' && context?.pendingInteraction?.awaitingInputType === 'stars') {
    return injectPendingRating(normalized, rawText, context);
  }


  // ─── مرحلة 0.5: كشف التفاعلات (InteractionIntent) ─────────────────────────
  const interactionResult = detectInteractionIntent(normalized, rawText, context);
  if (interactionResult) {
    return interactionResult;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // المرحلة 1: التصنيف الذكي للتأكيدات (CONFIRMATION) بناءً على سياق الجلسة
  // ════════════════════════════════════════════════════════════════════════════
  const isYes = containsAny(normalized, CONFIRM_YES_ALIASES, false);
  const isNo = containsAny(normalized, CONFIRM_NO_ALIASES, false);

  if (context?.pendingAction && (isYes || isNo)) {
    return buildResult(
      'CONFIRMATION',
      isYes ? 'CONFIRM_YES' : 'CONFIRM_NO',
      isYes ? 'CONFIRM_YES' : 'CONFIRM_NO',
      0.95,
      {},
      rawText,
      isYes ? 'confirm_yes_pending' : 'confirm_no_pending'
    );
  }

  const tokens = normalized.split(' ');

  // ─── 0. التحقق من التراجع والتكرار والمشاركة والنقر ────────────────────────────────
  const isUndo = containsAny(normalized, UNDO_ALIASES, false);
  if (isUndo) {
    return buildResult('ACTION', 'UNDO', 'UNDO', 0.98, {}, rawText, 'undo_command');
  }

  const isRepeat = containsAny(normalized, REPEAT_ALIASES, false);
  if (isRepeat) {
    return buildResult('ACTION', 'REPEAT_LAST', 'REPEAT_LAST', 0.98, {}, rawText, 'repeat_command');
  }

  const isShare = containsAny(normalized, SHARE_ALIASES, false);
  if (isShare && (context?.currentScreen === 'Product' || context?.currentFocusedProduct !== undefined)) {
    return buildResult('ACTION', 'SHARE_PRODUCT', 'SHARE_PRODUCT', 0.98, {}, rawText, 'share_product_command');
  }

  const isClick = containsAny(normalized, CLICK_ALIASES, false);
  if (isClick) {
    let elementName = normalized;
    const stripWords = [...CLICK_ALIASES, 'على', 'الـ', 'ال', 'on', 'the', 'button', 'زر', 'الزر'];
    for (const word of stripWords) {
      const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('(^|\\s)' + escaped + '(\\s|$)', 'gi');
      elementName = elementName.replace(regex, ' ');
    }
    elementName = elementName.replace(/\s+/g, ' ').trim();

    const genericPronouns = [
      'داك', 'دلك', 'ذلك', 'هاد', 'هادا', 'هاد الزر', 'داك الزر', 'الزر', 'البطن', 'البوطون', 'الخانة', 'الخانه',
      'it', 'this', 'that', 'the button', 'button', 'عليه', 'عليها', 'الزرار', 'الجنب', 'البلاصة'
    ];
    const isGeneric = genericPronouns.some(p => elementName === p || elementName.includes(p)) || elementName.length <= 1;

    if (isGeneric) {
      return buildResult('ACTION', 'CLICK_ELEMENT', 'CLICK_ELEMENT', 0.95, { elementName: '__default__' }, rawText, 'click_generic_pronoun');
    }

    const elements = context?.screenElements || {};
    const matchesElement = Object.keys(elements).find(key => 
      elementName.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(elementName.toLowerCase())
    );

    if (matchesElement && elementName) {
      return buildResult('ACTION', 'CLICK_ELEMENT', 'CLICK_ELEMENT', 0.95, { elementName }, rawText, 'click_element_command');
    }
  }

  // Confirmation checked at the start of analyzeIntent

  // ════════════════════════════════════════════════════════════════════════════
  // المرحلة 2: التحقق من التصفية السياقية التتبعية (Contextual Follow-up)
  // ════════════════════════════════════════════════════════════════════════════
  if (context?.lastQuery && isFollowUpQuery(normalized, context.lastQuery)) {
    const cleanFollowUp = normalized.replace(/غير|فقط|just|only/g, '').trim();
    const combinedQuery = `${context.lastQuery} ${cleanFollowUp}`;
    const detectedCategory = extractCategory(combinedQuery);

    return buildResult(
      'PRODUCT_QUERY',
      'PRODUCT_SEARCH',
      'SEARCH_PRODUCTS',
      0.90,
      { query: combinedQuery, category: detectedCategory },
      rawText,
      'contextual_follow_up'
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // المرحلة 3: التحقق من المحادثة العامة والإرشاد (CONVERSATION / HELP)
  // ════════════════════════════════════════════════════════════════════════════
  const isGreeting = containsAny(normalized, GREETING_ALIASES, true);
  const isThanks = containsAny(normalized, THANKS_ALIASES, true);
  const isPositive = containsAny(normalized, POSITIVE_ALIASES, true);
  const isHowAreYou = containsAny(normalized, HOW_ARE_YOU_ALIASES, true);

  const helpKeywords = ['ساعدني', 'مساعدة', 'شنو كدير', 'ماذا تفعل', 'شنو كتدير', 'شنو كتعرف تدير', 'help', 'what can you do', 'info', 'guide', 'كيف ستساعدني', 'ما الذي تستطيع فعله', 'كيفاش تعاوني', 'شنو كتعرف تعمل'];
  const isHelp = helpKeywords.some(w => normalized.includes(w));

  const hasProductWord = PRODUCT_INDICATOR_WORDS.some(w => tokens.some(t => matchWord(t, w)) || normalized.includes(w));
  const hasNavigate = containsAny(normalized, NAVIGATE_ALIASES, false);
  const hasShow = containsAny(normalized, SHOW_ALIASES, false);
  const hasNavOrShow = hasNavigate || hasShow;

  if ((isGreeting || isThanks || isPositive || isHowAreYou || isHelp) && !hasNavOrShow && !hasProductWord) {
    let intent: IntentType = 'SMALL_TALK';
    if (isHelp) intent = 'HELP';
    return buildResult('CONVERSATION', intent, 'NONE', 0.95, {}, rawText, isHelp ? 'help_info' : 'greeting_or_chit_chat');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // المرحلة 4: التحقق من الأسئلة والاستفسارات (QUESTION)
  // ════════════════════════════════════════════════════════════════════════════
  const isPriceQuestion = containsAny(normalized, PRICE_QUESTION_ALIASES, false);
  const isDeliveryQuestion = containsAny(normalized, DELIVERY_QUESTION_ALIASES, false);
  const isWarrantyQuestion = containsAny(normalized, WARRANTY_QUESTION_ALIASES, false);
  const isAvailabilityQuestion = containsAny(normalized, AVAILABILITY_QUESTION_ALIASES, false);
  const isComparisonQuestion = containsAny(normalized, COMPARISON_QUESTION_ALIASES, false);
  const isBrandInfo = containsAny(normalized, BRAND_ALIASES, false);

  const isDetailsQuestion = containsAny(normalized, DETAILS_QUESTION_ALIASES, false);

  if (isPriceQuestion) {
    const query = extractProductQuery(normalized);
    return buildResult('QUESTION', 'ASK_PRICE', 'ASK_PRICE', 0.92, { query: query || undefined }, rawText, 'price_question');
  }
  if (isBrandInfo) {
    return buildResult('QUESTION', 'BRAND_INFORMATION', 'SHOW_BRAND_INFO', 0.95, {}, rawText, 'brand_info_question');
  }
  if (isDetailsQuestion) {
    const query = extractProductQuery(normalized);
    return buildResult('QUESTION', 'PRODUCT_DETAILS', 'NONE', 0.95, { query: query || undefined }, rawText, 'product_details_question');
  }
  if (isDeliveryQuestion) {
    return buildResult('QUESTION', 'ASK_DELIVERY', 'ASK_DELIVERY', 0.92, {}, rawText, 'delivery_question');
  }
  if (isWarrantyQuestion) {
    return buildResult('QUESTION', 'ASK_WARRANTY', 'ASK_WARRANTY', 0.92, {}, rawText, 'warranty_question');
  }
  if (isAvailabilityQuestion) {
    const query = extractProductQuery(normalized);
    return buildResult('QUESTION', 'ASK_AVAILABILITY', 'ASK_AVAILABILITY', 0.92, { query: query || undefined }, rawText, 'availability_question');
  }
  if (isComparisonQuestion) {
    const query = extractProductQuery(normalized);
    return buildResult('QUESTION', 'ASK_COMPARISON', 'ASK_COMPARISON', 0.92, { query: query || undefined }, rawText, 'comparison_question');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // المرحلة 4.5: التحقق من التوصيات (PRODUCT_QUERY)
  // نسمح بوجود كلمة منتج إذا كانت مصحوبة بكلمة توصية قوية
  // مثل: "المنتجات المميزة" / "أفضل المنتجات"
  // ════════════════════════════════════════════════════════════════════════════
  const isRecommendation = containsAny(normalized, RECOMMENDATION_ALIASES, false);
  // كلمات توصية قوية تتجاوز فلتر hasProductWord
  const STRONG_REC_WORDS = [
    'مميزة', 'مميزه', 'المميزة', 'المميزه', 'مميز',
    'بارزة', 'بارزه', 'مشهورة', 'مشهوره', 'مختارة', 'مختاره',
    'منتجات مميزة', 'المنتجات المميزة', 'featured', 'highlights',
    'اكثر مبيعا', 'الاكثر مبيعا', 'bestseller', 'best selling',
    'اعرضلي احسن', 'اعرض لي احسن', 'ورني احسن', 'وريني احسن',
    'اعرضلي افضل', 'اعرض لي افضل', 'ورني افضل', 'وريني افضل',
  ];
  const hasStrongRec = containsAny(normalized, STRONG_REC_WORDS, false);

  if (isRecommendation && (!hasProductWord || hasStrongRec)) {
    const limit = extractNumber(normalized) || 5;
    const sort = extractSort(normalized);
    return buildResult('PRODUCT_QUERY', 'RECOMMENDATIONS', 'SHOW_RECOMMENDATIONS', 0.92, { limit, sort }, rawText, 'recommendations');
  }


  // ════════════════════════════════════════════════════════════════════════════
  // المرحلة 5: التحقق من الإجراءات (ACTION)
  // ════════════════════════════════════════════════════════════════════════════

  // أ. تفريغ السلة أو المفضلات
  if (containsAny(normalized, CLEAR_CART_WORDS, false) && containsAny(normalized, CART_ALIASES, false)) {
    return buildResult('ACTION', 'CART_MANAGEMENT', 'CLEAR_CART', 0.92, {}, rawText, 'clear_cart_command');
  }
  if (containsAny(normalized, CLEAR_CART_WORDS, false) && containsAny(normalized, FAVORITES_ALIASES, false)) {
    return buildResult('ACTION', 'CART_MANAGEMENT', 'CLEAR_FAVORITES', 0.92, {}, rawText, 'clear_favorites_command');
  }

  // ب. الدعم الفني / Handoff
  if (containsAny(normalized, SUPPORT_ALIASES, false)) {
    const hasClearNavContext = containsAny(normalized, ['صفحه', 'شاشه', 'للخلف'], false);
    if (!hasClearNavContext) {
      return buildResult('ACTION', 'HUMAN_HANDOFF', 'ESCALATE_TO_SUPPORT', 0.95, {}, rawText, 'support_handoff');
    }
  }

  // ج. تصفح الفئات
  const hasCategoryWord = CATEGORY_NAV_WORDS.some(w => normalized.includes(w));
  const categoryFromText = extractCategory(normalized);

  if (hasCategoryWord) {
    if (categoryFromText) {
      return buildResult('ACTION', 'CATEGORY_BROWSING', 'BROWSE_CATEGORY', 0.92, { category: categoryFromText }, rawText, 'browse_category');
    }
    return buildResult('ACTION', 'CATEGORY_BROWSING', 'BROWSE_CATEGORY', 0.70, {}, rawText, 'browse_category_unspecified');
  }

  if (hasNavigate && categoryFromText && !extractScreen(normalized)) {
    return buildResult('ACTION', 'CATEGORY_BROWSING', 'BROWSE_CATEGORY', 0.90, { category: categoryFromText }, rawText, 'navigate_category');
  }

  if (hasShow && categoryFromText && isGenericCategoryQuery(normalized, categoryFromText)) {
    return buildResult('ACTION', 'CATEGORY_BROWSING', 'BROWSE_CATEGORY', 0.92, { category: categoryFromText }, rawText, 'show_category');
  }

  // د. التنقل بين الشاشات
  const screen = extractScreen(normalized);
  
  if (screen === 'Back') {
    return buildResult('ACTION', 'NAVIGATION', 'GO_BACK', 0.95, { screen }, rawText, 'go_back_command');
  }

  if (screen && !hasNavOrShow && !containsAny(normalized, RECOMMENDATION_ALIASES, false) && !containsAny(normalized, ADD_ALIASES, false) && !containsAny(normalized, REMOVE_ALIASES, false)) {
    if (tokens.length <= 3) {
      const action = screenToAction(screen);
      return buildResult('ACTION', 'NAVIGATION', action, 0.90, { screen }, rawText, 'screen_shortcut');
    }
  }

  if (hasNavigate && screen) {
    const action = screenToAction(screen);
    return buildResult('ACTION', 'NAVIGATION', action, 0.95, { screen }, rawText, 'navigate_screen');
  }

  if (hasShow && screen && !hasProductWord && !categoryFromText) {
    const action = screenToAction(screen);
    return buildResult('ACTION', 'NAVIGATION', action, 0.90, { screen }, rawText, 'show_screen');
  }

  const hasPronoun = containsAny(normalized, ['اليه', 'ليه', 'ليها', 'اليها'], false);
  if (hasNavigate && hasPronoun && !screen) {
    return buildResult('ACTION', 'NAVIGATION', 'OPEN_PRODUCTS', 0.90, { screen: 'Products' }, rawText, 'navigate_pronoun');
  }

  if (hasNavigate && !screen && !hasProductWord && !categoryFromText) {
    return buildResult('ACTION', 'NAVIGATION', 'CLARIFY', 0.60, {}, rawText, 'navigate_unspecified');
  }

  // دلالات الضمائر للمنتج الحالي
  const PRONOUNS = [
    'هذا', 'هذا المنتج', 'المنتج الحالي', 'هاد', 'هادا', 'هاد المنتج', 'المنتوج', 'المنتوج الحالي', 'هاد المنتوج',
    'it', 'this', 'current product', 'the product', 'المنتج', 'به', 'هو', 'ها', 'هي'
  ];

  const isAboutCurrentProduct = (text: string, ctx?: AssistantContext) => {
    const hasCurrentProduct = ctx?.currentScreen === 'Product' || ctx?.currentFocusedProduct !== undefined;
    if (!hasCurrentProduct) return false;

    const query = extractProductQuery(text);
    const mentionsOtherProduct = query && query.length > 2 && !PRONOUNS.some(p => query === p || query.includes(p));
    return !mentionsOtherProduct || PRONOUNS.some(p => text.includes(p));
  };

  // التحقق من زيادة/نقص الكمية
  const hasQuantityIndicator = containsAny(normalized, [
    'الكمية', 'الكميه', 'حبة', 'حبه', 'حبات', 'وحدة', 'وحده', 'عدد', 'العدد', 'مرات', 'مرة', 'اضعاف', 'ضعف'
  ], false) || /\d+/.test(normalized);

  const isIncreaseQty = containsAny(normalized, [
    'زيد الكمية', 'زيد حبة', 'زيد وحده', 'زيد وحدة', 'زيد من هذا', 'زيد منه', 'أضف حبة', 'اضف حبة',
    'اكثر', 'أكثر', 'كثر', 'زيد الكميه', 'اضافة حبة', 'إضافة حبة', 'زيد عدد', 'زيد حبات',
    'increase quantity', 'add more', 'more of this', 'increase', 'double'
  ], false) || (
    (normalized.includes('زيد') || normalized.includes('تزيد') || normalized.includes('انزيد') || normalized.includes('كثر') || normalized.includes('ضاعف')) && hasQuantityIndicator
  );

  const isDecreaseQty = containsAny(normalized, [
    'نقص الكمية', 'نقص حبة', 'نقص وحده', 'نقص وحدة', 'نقص من هذا', 'نقص منه',
    'اقل', 'أقل', 'قلل', 'نقص الكميه', 'انقاص حبة', 'إنقاص حبة', 'نقص عدد',
    'decrease quantity', 'less of this', 'decrease'
  ], false) || (
    (normalized.includes('نقص') || normalized.includes('انقص') || normalized.includes('قلل') || normalized.includes('حيد') || normalized.includes('احذف') || normalized.includes('أزل') || normalized.includes('ازل')) && hasQuantityIndicator
  );

  if (isIncreaseQty) {
    const productRef = extractOrdinal(normalized);
    const query = extractProductQuery(normalized);
    const amount = extractNumber(normalized) || 1;
    return buildResult('ACTION', 'INCREASE_QUANTITY', 'INCREASE_QUANTITY', 0.95, { productRef, query: isAboutCurrentProduct(normalized, context) ? undefined : query, amount }, rawText, 'increase_quantity');
  }

  if (isDecreaseQty) {
    const productRef = extractOrdinal(normalized);
    const query = extractProductQuery(normalized);
    const amount = extractNumber(normalized) || 1;
    return buildResult('ACTION', 'DECREASE_QUANTITY', 'DECREASE_QUANTITY', 0.95, { productRef, query: isAboutCurrentProduct(normalized, context) ? undefined : query, amount }, rawText, 'decrease_quantity');
  }

  // هـ. إدارة السلة والمفضلات
  const hasAdd = containsAny(normalized, ADD_ALIASES, false);
  const hasRemove = containsAny(normalized, REMOVE_ALIASES, false);
  const hasFav = containsAny(normalized, FAVORITES_ALIASES, false);
  const hasCart = containsAny(normalized, CART_ALIASES, false);

  // التحقق من المفضلة
  const isAddToFav = (
    (hasAdd && hasFav) ||
    containsAny(normalized, ['احفظ', 'احفظه', 'اعجبني', 'أعجبني', 'احتفظ به', 'حفظ للمفضلة', 'حفظ في المفضلة', 'حفظ فالمفضلة', 'ضيف للمفضلة', 'ضيفو للمفضلة', 'أضف للمفضلة', 'اضف للمفضلة', 'save', 'favorite', 'like', 'wishlist', 'add to wishlist', 'add to favorites'], false)
  );

  const isRemoveFromFav = (
    (hasRemove && hasFav) ||
    containsAny(normalized, ['حيد من المفضلة', 'حيد من مفضلتي', 'أزل من المفضلة', 'ازل من المفضلة', 'احذف من المفضلة', 'امسح من المفضلة', 'حيدو من المفضلة', 'حيدها من المفضلة', 'remove from wishlist', 'remove from favorites', 'unlike', 'delete from wishlist'], false)
  );

  if (isAddToFav) {
    const isCurrent = isAboutCurrentProduct(normalized, context);
    if (isCurrent) {
      return buildResult('ACTION', 'ADD_TO_FAVORITES', 'ADD_TO_FAVORITES', 0.95, { query: undefined, isCurrentProduct: true } as any, rawText, 'add_current_to_fav');
    }
    const productRef = extractOrdinal(normalized);
    const query = extractProductQuery(normalized);
    return buildResult('ACTION', 'ADD_TO_FAVORITES', 'ADD_TO_FAVORITES', 0.90, { productRef, query }, rawText, 'add_to_fav_query');
  }

  if (isRemoveFromFav) {
    const isCurrent = isAboutCurrentProduct(normalized, context);
    if (isCurrent) {
      return buildResult('ACTION', 'REMOVE_FROM_FAVORITES', 'REMOVE_FROM_FAVORITES', 0.95, { query: undefined, isCurrentProduct: true } as any, rawText, 'remove_current_from_fav');
    }
    const productRef = extractOrdinal(normalized);
    const query = extractProductQuery(normalized);
    return buildResult('ACTION', 'REMOVE_FROM_FAVORITES', 'REMOVE_FROM_FAVORITES', 0.90, { productRef, query }, rawText, 'remove_from_fav_query');
  }

  if (hasAdd || hasRemove) {
    const productRef = extractOrdinal(normalized);
    const query = extractProductQuery(normalized);

    const hasSpecificProduct = productRef !== undefined || hasProductWord || (query && query.length > 1 && !hasCart && !hasFav);

    if (hasRemove) {
      if (!hasSpecificProduct && hasCart) {
        return buildResult('ACTION', 'CART_MANAGEMENT', 'CLEAR_CART', 0.92, {}, rawText, 'clear_cart_short');
      }
      if (!hasSpecificProduct && hasFav) {
        return buildResult('ACTION', 'CART_MANAGEMENT', 'CLEAR_FAVORITES', 0.92, {}, rawText, 'clear_fav_short');
      }

      const isCurrent = isAboutCurrentProduct(normalized, context);
      if (isCurrent) {
        return buildResult(
          'ACTION',
          'CART_MANAGEMENT',
          'REMOVE_FROM_CART',
          0.95,
          { query: undefined, isCurrentProduct: true } as any,
          rawText,
          'remove_current_product_from_cart'
        );
      }

      return buildResult(
        'ACTION',
        'CART_MANAGEMENT',
        'REMOVE_FROM_CART',
        productRef !== undefined || query ? 0.93 : 0.85,
        { productRef, query: hasSpecificProduct ? query : undefined },
        rawText,
        'remove_product'
      );
    }

    if (hasAdd) {
      const isCurrent = isAboutCurrentProduct(normalized, context);
      const quantity = extractNumber(normalized) || 1;
      if (isCurrent) {
        return buildResult(
          'ACTION',
          'CART_MANAGEMENT',
          'ADD_TO_CART',
          0.95,
          { query: undefined, isCurrentProduct: true, quantity } as any,
          rawText,
          'add_current_product_to_cart'
        );
      }

      return buildResult(
        'ACTION',
        'CART_MANAGEMENT',
        'ADD_TO_CART',
        productRef !== undefined || query ? 0.93 : 0.85,
        { productRef, query: hasSpecificProduct ? query : undefined, quantity },
        rawText,
        'add_product'
      );
    }
  }

  // Recommendation checked in Phase 4.5

  // ════════════════════════════════════════════════════════════════════════════
  // المرحلة 7: التحقق من البحث عن المنتجات (PRODUCT_QUERY)
  // ════════════════════════════════════════════════════════════════════════════
  // لا يتم تفعيل البحث إلا إذا كان هناك كلمة دالة على منتج أو نمط بحث صريح
  const hasSearchPrefix = containsAny(normalized, SEARCH_PATTERNS_PREFIXES, false);
  if (hasSearchPrefix || hasProductWord || categoryFromText) {
    const query = extractProductQuery(normalized);
    const detectedCategory = categoryFromText || extractCategory(query);

    let confidence = 0.78;
    if (hasShow && (query.length > 1 || hasProductWord)) confidence = 0.92;
    else if (hasProductWord) confidence = 0.88;
    else if (categoryFromText && query.length > 1) confidence = 0.88;

    return buildResult(
      'PRODUCT_QUERY',
      'PRODUCT_SEARCH',
      'SEARCH_PRODUCTS',
      confidence,
      { query: query || normalized, category: detectedCategory },
      rawText,
      hasSearchPrefix ? 'search_prefix_pattern' : 'product_word_indicator'
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // المرحلة 8: نظام النقاط البديل (Scoring Fallback)
  // ════════════════════════════════════════════════════════════════════════════
  return scoringFallback(normalized, tokens, rawText);
};

// ─── نظام النقاط (Scoring Fallback) ──────────────────────────────────────────

const scoringFallback = (normalized: string, tokens: string[], raw: string): ParsedIntent => {
  const scores = {
    PRODUCT_SEARCH: 0,
    NAVIGATION: 0,
    CART_MANAGEMENT: 0,
    CATEGORY_BROWSING: 0,
    RECOMMENDATIONS: 0,
    BRAND_INFORMATION: 0,
    SMALL_TALK: 0,
    HUMAN_HANDOFF: 0,
    CONFIRM_YES: 0,
    CONFIRM_NO: 0,
    ASK_PRICE: 0,
    ASK_AVAILABILITY: 0,
    ASK_DELIVERY: 0,
    ASK_WARRANTY: 0,
    ASK_COMPARISON: 0,
    UNKNOWN: 0,
  } as Record<IntentType, number>;

  // نقاط للمنتجات (فقط إذا كانت تحتوي على كلمة منتج حقيقية)
  if (PRODUCT_INDICATOR_WORDS.some(w => tokens.includes(w) || normalized.includes(w))) {
    scores.PRODUCT_SEARCH += 0.70;
  }

  // نقاط للتنقل
  if (extractScreen(normalized)) {
    scores.NAVIGATION += 0.65;
  }

  let bestIntent: IntentType = 'UNKNOWN';
  let maxScore = 0.35; // عتبة أدنى

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent as IntentType;
    }
  }

  if (bestIntent === 'UNKNOWN') {
    return buildResult('UNKNOWN', 'UNKNOWN', 'NONE', 0.30, {}, raw, 'fallback_unknown');
  }

  const entities: ParsedIntent['entities'] = {};
  if (bestIntent === 'PRODUCT_SEARCH') {
    entities.query = extractProductQuery(normalized) || normalized;
    entities.category = extractCategory(normalized);
  } else if (bestIntent === 'NAVIGATION') {
    entities.screen = extractScreen(normalized);
  }

  const action = intentToDefaultAction(bestIntent, entities);
  const category = intentToCategory(bestIntent);

  return buildResult(category, bestIntent, action, Math.min(0.80, maxScore), entities, raw, 'fallback_scoring');
};

// ─── مساعدات داخلية ──────────────────────────────────────────────────────────

const buildResult = (
  category: AssistantCategory,
  intent: IntentType,
  action: ActionType,
  confidence: number,
  entities: ParsedIntent['entities'],
  raw: string,
  matchedPattern?: string,
): ParsedIntent => ({
  category,
  intent,
  action,
  confidence,
  entities,
  raw,
  matchedPattern,
});

const screenToAction = (screen: ScreenName): ActionType => {
  const map: Record<ScreenName, ActionType> = {
    Home: 'OPEN_HOME',
    Cart: 'OPEN_CART',
    Profile: 'OPEN_PROFILE',
    Products: 'OPEN_PRODUCTS',
    Favorites: 'OPEN_FAVORITES',
    Orders: 'OPEN_ORDERS',
    Settings: 'OPEN_SETTINGS',
    Back: 'GO_BACK',
  };
  return map[screen] || 'OPEN_HOME';
};

const intentToDefaultAction = (intent: IntentType, entities: ParsedIntent['entities']): ActionType => {
  switch (intent) {
    case 'PRODUCT_SEARCH':    return 'SEARCH_PRODUCTS';
    case 'NAVIGATION':        return entities.screen ? screenToAction(entities.screen) : 'CLARIFY';
    case 'CART_MANAGEMENT':   return 'ADD_TO_CART';
    case 'CATEGORY_BROWSING': return 'BROWSE_CATEGORY';
    case 'RECOMMENDATIONS':   return 'SHOW_RECOMMENDATIONS';
    case 'BRAND_INFORMATION': return 'SHOW_BRAND_INFO';
    case 'HUMAN_HANDOFF':     return 'ESCALATE_TO_SUPPORT';
    case 'CONFIRM_YES':       return 'CONFIRM_YES';
    case 'CONFIRM_NO':        return 'CONFIRM_NO';
    case 'ASK_PRICE':         return 'ASK_PRICE';
    case 'ASK_AVAILABILITY':  return 'ASK_AVAILABILITY';
    case 'ASK_DELIVERY':      return 'ASK_DELIVERY';
    case 'ASK_WARRANTY':      return 'ASK_WARRANTY';
    case 'ASK_COMPARISON':    return 'ASK_COMPARISON';
    default:                  return 'NONE';
  }
};

const intentToCategory = (intent: IntentType): AssistantCategory => {
  switch (intent) {
    case 'PRODUCT_SEARCH':
    case 'RECOMMENDATIONS':
      return 'PRODUCT_QUERY';
    case 'NAVIGATION':
    case 'CART_MANAGEMENT':
    case 'CATEGORY_BROWSING':
    case 'HUMAN_HANDOFF':
      return 'ACTION';
    case 'BRAND_INFORMATION':
    case 'ASK_PRICE':
    case 'ASK_AVAILABILITY':
    case 'ASK_DELIVERY':
    case 'ASK_WARRANTY':
    case 'ASK_COMPARISON':
      return 'QUESTION';
    case 'SMALL_TALK':
    case 'HELP':
      return 'CONVERSATION';
    case 'CONFIRM_YES':
    case 'CONFIRM_NO':
      return 'CONFIRMATION';
    default:
      return 'UNKNOWN';
  }
};

const extractSort = (text: string): SortOption => {
  if (text.includes('مبيعا') || text.includes('مبيع') || text.includes('best') || text.includes('popular')) {
    return 'best_selling';
  }
  if (text.includes('جديد') || text.includes('اجدد') || text.includes('new') || text.includes('latest')) {
    return 'newest';
  }
  if (text.includes('ارخص') || text.includes('رخيص') || text.includes('cheap') || text.includes('lowest')) {
    return 'price_asc';
  }
  if (text.includes('اغلي') || text.includes('غالي') || text.includes('expensive') || text.includes('highest')) {
    return 'price_desc';
  }
  return 'best_selling';
};
