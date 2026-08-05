import type { IntentType, AssistantCategory, AnalyzedMessage, AssistantContext } from '../types';
import {
  containsAny,
  GREETING_ALIASES,
  THANKS_ALIASES,
  POSITIVE_ALIASES,
  HOW_ARE_YOU_ALIASES,
  NAVIGATE_ALIASES,
  ADD_ALIASES,
  REMOVE_ALIASES,
  RECOMMENDATION_ALIASES,
  SUPPORT_ALIASES,
  CONFIRM_YES_ALIASES,
  CONFIRM_NO_ALIASES,
  PRICE_QUESTION_ALIASES,
  DELIVERY_QUESTION_ALIASES,
  WARRANTY_QUESTION_ALIASES,
  AVAILABILITY_QUESTION_ALIASES,
  COMPARISON_QUESTION_ALIASES,
} from '../engine/aliasResolver';

/**
 * Classifies the intent of an analyzed message.
 */
export const classifyIntent = (
  analyzed: AnalyzedMessage,
  context?: AssistantContext
): { intent: IntentType; confidence: number; category: AssistantCategory } => {
  const text = analyzed.originalText;
  const tokens = analyzed.tokens;
  const entities = analyzed.entities;

  // 1. Check for OUT_OF_SCOPE topics (General Knowledge, Math, Geography, etc.)
  const outOfScopeKeywords = [
    'عاصمة', 'رئيس', 'ملك', 'دولة', 'بلد', 'جغرافيا', 'تاريخ', 'رياضة', 'كرة', 'طقس',
    'سياسة', 'حكومة', 'كوكب', 'شمس', 'قمر', 'نجوم', 'رياضيات', 'حسابي الجغرافي',
    'capital', 'president', 'king', 'country', 'weather', 'news', 'sports', 'football',
    'politics', 'math', 'calculator', 'capital of', 'who is', 'who was'
  ];
  const hasOutOfScopeWord = outOfScopeKeywords.some(w => text.toLowerCase().includes(w));
  // If query is a question word but has no shopping/skincare/product entities
  const hasQuestionWord = ['شكون', 'فين', 'كيفاش', 'من هو', 'أين', 'كيف', 'لماذا', 'متى', 'who', 'where', 'how', 'why', 'when'].some(q => text.includes(q));
  const hasNoShoppingContext = !entities.products && !entities.brands && !entities.category && !entities.screen &&
                               !containsAny(text, [...ADD_ALIASES, ...REMOVE_ALIASES, ...PRICE_QUESTION_ALIASES, ...DELIVERY_QUESTION_ALIASES, ...WARRANTY_QUESTION_ALIASES, ...AVAILABILITY_QUESTION_ALIASES, ...CONFIRM_YES_ALIASES, ...CONFIRM_NO_ALIASES]);

  if (hasOutOfScopeWord || (hasQuestionWord && hasNoShoppingContext)) {
    return {
      intent: 'OUT_OF_SCOPE',
      confidence: 0.95,
      category: 'OUT_OF_SCOPE',
    };
  }

  // 2. HELP / INFO
  const helpKeywords = ['ساعدني', 'مساعدة', 'شنو كدير', 'ماذا تفعل', 'شنو كتدير', 'شنو كتعرف تدير', 'help', 'what can you do', 'info', 'guide'];
  if (helpKeywords.some(w => text.includes(w))) {
    return {
      intent: 'HELP',
      confidence: 0.95,
      category: 'CONVERSATION',
    };
  }

  // 3. CONFIRMATION & NEGATION
  const isYes = containsAny(text, CONFIRM_YES_ALIASES, false);
  const isNo = containsAny(text, CONFIRM_NO_ALIASES, false);
  if (context?.pendingAction) {
    if (isYes) {
      return { intent: 'CONFIRMATION', confidence: 0.98, category: 'CONFIRMATION' };
    }
    if (isNo) {
      return { intent: 'NEGATION', confidence: 0.98, category: 'CONFIRMATION' };
    }
  }

  // 4. GREETINGS & SMALL TALK
  const isGreeting = containsAny(text, GREETING_ALIASES, false);
  const isThanks = containsAny(text, THANKS_ALIASES, false);
  const isPositive = containsAny(text, POSITIVE_ALIASES, false);
  const isHowAreYou = containsAny(text, HOW_ARE_YOU_ALIASES, false);

  if (isGreeting) {
    return { intent: 'GREETING', confidence: 0.95, category: 'CONVERSATION' };
  }
  if (isHowAreYou || isThanks || isPositive) {
    return { intent: 'SMALL_TALK', confidence: 0.92, category: 'CONVERSATION' };
  }

  // 5. COMPARE_PRODUCTS
  const isCompare = containsAny(text, COMPARISON_QUESTION_ALIASES, false) ||
                    (entities.products && entities.products.length > 1) ||
                    (entities.brands && entities.brands.length > 1);
  if (isCompare) {
    return {
      intent: 'COMPARE_PRODUCTS',
      confidence: entities.products && entities.products.length > 1 ? 0.95 : 0.85,
      category: 'QUESTION',
    };
  }

  // 6. QUESTION (Price, Availability, Delivery, Warranty)
  if (containsAny(text, PRICE_QUESTION_ALIASES, false)) {
    return { intent: 'QUESTION', confidence: 0.95, category: 'QUESTION' }; // Maps to ASK_PRICE
  }
  if (containsAny(text, AVAILABILITY_QUESTION_ALIASES, false)) {
    return { intent: 'QUESTION', confidence: 0.95, category: 'QUESTION' }; // Maps to ASK_AVAILABILITY
  }
  if (containsAny(text, DELIVERY_QUESTION_ALIASES, false)) {
    return { intent: 'QUESTION', confidence: 0.95, category: 'QUESTION' }; // Maps to ASK_DELIVERY
  }
  if (containsAny(text, WARRANTY_QUESTION_ALIASES, false)) {
    return { intent: 'QUESTION', confidence: 0.95, category: 'QUESTION' }; // Maps to ASK_WARRANTY
  }

  // 7. ADD_TO_CART / REMOVE_FROM_CART
  const isAdd = containsAny(text, ADD_ALIASES, false);
  const isRemove = containsAny(text, REMOVE_ALIASES, false);
  if (isAdd && (entities.products || entities.brands || context?.currentFocusedProduct)) {
    return {
      intent: 'ADD_TO_CART',
      confidence: 0.95,
      category: 'ACTION',
    };
  }
  if (isRemove && (entities.products || entities.brands || entities.productRef !== undefined)) {
    return {
      intent: 'CART_MANAGEMENT', // Maps to REMOVE_FROM_CART/CART_MANAGEMENT
      confidence: 0.95,
      category: 'ACTION',
    };
  }

  // 8. OPEN_CART / NAVIGATION
  const hasNavigate = containsAny(text, NAVIGATE_ALIASES, false);
  if (entities.screen === 'Cart' || (hasNavigate && text.includes('سلة'))) {
    return {
      intent: 'OPEN_CART',
      confidence: 0.95,
      category: 'ACTION',
    };
  }
  if (entities.screen) {
    return {
      intent: 'NAVIGATE_SCREEN',
      confidence: 0.95,
      category: 'ACTION',
    };
  }

  // 9. RECOMMEND_PRODUCTS
  const isRecommend = containsAny(text, RECOMMENDATION_ALIASES, false);
  if (isRecommend) {
    return {
      intent: 'RECOMMEND_PRODUCTS',
      confidence: 0.92,
      category: 'PRODUCT_QUERY',
    };
  }

  // 10. PRODUCT_DETAILS
  const detailKeywords = ['معلومات', 'تفاصيل', 'شنو هو', 'شنو هي', 'دواعي الاستعمال', 'details', 'about', 'info on'];
  if (detailKeywords.some(w => text.includes(w)) && (entities.products || entities.brands || context?.currentFocusedProduct)) {
    return {
      intent: 'PRODUCT_DETAILS',
      confidence: 0.90,
      category: 'QUESTION',
    };
  }

  // 11. SEARCH_PRODUCT
  // General search context (has product or brand keyword)
  if (entities.products || entities.brands || entities.category) {
    return {
      intent: 'SEARCH_PRODUCT',
      confidence: 0.90,
      category: 'PRODUCT_QUERY',
    };
  }

  // 12. Fallbacks
  if (isYes) {
    return { intent: 'CONFIRMATION', confidence: 0.70, category: 'CONFIRMATION' };
  }
  if (isNo) {
    return { intent: 'NEGATION', confidence: 0.70, category: 'CONFIRMATION' };
  }

  // If nothing matched, it's UNKNOWN
  return {
    intent: 'UNKNOWN',
    confidence: 0.30,
    category: 'UNKNOWN',
  };
};
