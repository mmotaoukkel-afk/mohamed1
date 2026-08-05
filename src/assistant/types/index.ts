/**
 * Assistant Module — Type Definitions (v2 — Production Ready)
 *
 * يحدد جميع الأنواع المطلوبة للمعمارية ذات 4 طبقات:
 *  - IntentType  (9 نوايا)
 *  - ActionType  (جميع الأوامر القابلة للتنفيذ)
 *  - ParsedIntent (مخرج IntentEngine)
 *  - AssistantContext (ذاكرة الجلسة قصيرة المدى)
 *  - TelemetryEntry (تسجيل التفاعلات)
 */

// ─── Screen Names ─────────────────────────────────────────────────────────────

export type ScreenName =
  | 'Home'
  | 'Products'
  | 'Profile'
  | 'Cart'
  | 'Favorites'
  | 'Orders'
  | 'Settings'
  | 'Back';

// ─── Voice Status ─────────────────────────────────────────────────────────────

export type VoiceStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'executing'
  | 'speaking'
  | 'error';

export type AssistantCategory =
  | 'ACTION'
  | 'QUESTION'
  | 'CONFIRMATION'
  | 'CONVERSATION'
  | 'PRODUCT_QUERY'
  | 'OUT_OF_SCOPE'
  | 'UNKNOWN';

// ─── Intent Types ────────────────────────────────────────────────────────────

export type IntentType =
  | 'PRODUCT_SEARCH'
  | 'NAVIGATION'
  | 'CART_MANAGEMENT'
  | 'CATEGORY_BROWSING'
  | 'RECOMMENDATIONS'
  | 'BRAND_INFORMATION'
  | 'SMALL_TALK'
  | 'HUMAN_HANDOFF'
  | 'CONFIRM_YES'
  | 'CONFIRM_NO'
  | 'ASK_PRICE'
  | 'ASK_AVAILABILITY'
  | 'ASK_DELIVERY'
  | 'ASK_WARRANTY'
  | 'ASK_COMPARISON'
  | 'UNKNOWN'
  // New Intents:
  | 'NAVIGATE_SCREEN'
  | 'HELP'
  | 'CONFIRMATION'
  | 'NEGATION'
  | 'OUT_OF_SCOPE'
  | 'ADD_TO_FAVORITES'
  | 'REMOVE_FROM_FAVORITES'
  | 'INCREASE_QUANTITY'
  | 'DECREASE_QUANTITY'
  | 'SHARE_PRODUCT'
  | 'UNDO'
  | 'REPEAT_LAST'
  | 'CLICK_ELEMENT'
  // Classifier Intents:
  | 'GREETING'
  | 'COMPARE_PRODUCTS'
  | 'QUESTION'
  | 'ADD_TO_CART'
  | 'OPEN_CART'
  | 'RECOMMEND_PRODUCTS'
  | 'PRODUCT_DETAILS'
  | 'SEARCH_PRODUCT'
  // Interaction Intents (قابلة للتوسع — InteractionRegistry يستقبلها كلها)
  | 'COMMENT'
  | 'RATING';

// ─── Action Types ─────────────────────────────────────────────────────────────

export type ActionType =
  // Navigation
  | 'OPEN_HOME'
  | 'OPEN_CART'
  | 'OPEN_PROFILE'
  | 'OPEN_PRODUCTS'
  | 'OPEN_FAVORITES'
  | 'OPEN_ORDERS'
  | 'OPEN_SETTINGS'
  | 'GO_BACK'
  // Product
  | 'SEARCH_PRODUCTS'
  | 'BROWSE_CATEGORY'
  | 'SHOW_RECOMMENDATIONS'
  // Cart & Favorites
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'CLEAR_CART'
  | 'CLEAR_FAVORITES'
  | 'ADD_TO_FAVORITES'
  | 'REMOVE_FROM_FAVORITES'
  | 'INCREASE_QUANTITY'
  | 'DECREASE_QUANTITY'
  | 'SHARE_PRODUCT'
  | 'UNDO'
  | 'REPEAT_LAST'
  | 'CLICK_ELEMENT'
  // Info
  | 'SHOW_BRAND_INFO'
  | 'ESCALATE_TO_SUPPORT'
  // Meta
  | 'CLARIFY'
  | 'NONE'
  // Confirmations
  | 'CONFIRM_YES'
  | 'CONFIRM_NO'
  // Questions
  | 'ASK_PRICE'
  | 'ASK_AVAILABILITY'
  | 'ASK_DELIVERY'
  | 'ASK_WARRANTY'
  | 'ASK_COMPARISON'
  // Interaction Actions (تعليق، تقييم، إعجاب...)
  | 'WRITE_COMMENT'
  | 'SUBMIT_COMMENT'
  | 'RATE_PRODUCT'
  | 'REMOVE_RATING';

// ─── Sort Options ─────────────────────────────────────────────────────────────

export type SortOption = 'best_selling' | 'newest' | 'price_asc' | 'price_desc';

// ─── Conversation Stages ──────────────────────────────────────────────────────

export type ConversationStage =
  | 'SEARCHING'
  | 'CLARIFYING'
  | 'RECOMMENDING'
  | 'CHECKOUT'
  | 'GREETING'
  | 'UNKNOWN'
  | 'OUT_OF_SCOPE';

// ─── Parsed Intent (مخرج IntentEngine) ────────────────────────────────────────

export interface ParsedIntent {
  /** الفئة الأساسية للطلب */
  category: AssistantCategory;
  /** النية المحددة */
  intent: IntentType;
  /** الأمر المطلوب تنفيذه */
  action: ActionType;
  /** مستوى الثقة (0.0 → 1.0) */
  confidence: number;
  /** الكيانات المستخرجة */
  entities: {
    query?: string;
    screen?: ScreenName;
    category?: string;
    productRef?: number;
    limit?: number;
    sort?: SortOption;
    elementName?: string;
    amount?: number;
    quantity?: number;
    // Support multiple entities for comparisons & dynamic extraction
    products?: string[];
    brands?: string[];
    sizes?: string[];
    // ── Interaction entities (COMMENT / RATING / LIKE...) ──
    /** نوع عملية التفاعل */
    interactionAction?: 'write' | 'generate' | 'submit' | 'edit' | 'delete' | 'rate' | 'change' | 'remove';
    /** النص المباشر المملى من المستخدم */
    commentText?: string;
    /** نبرة التعليق المطلوبة */
    commentTone?: 'positive' | 'negative' | 'neutral';
    /** طول التعليق المطلوب */
    commentLength?: 'short' | 'long';
    /** إجراء مرتبط يُنفَّذ بعد الإجراء الرئيسي (مثل: اكتب ثم انشر) */
    chainedAction?: 'submit' | 'edit';
    /** عدد النجوم المطلوب (1-5) */
    ratingValue?: number;
    /** خطوات Pipeline للطلبات المركّبة */
    pipelineSteps?: Array<{ intent: string; payload: Record<string, any> }>;
  };
  /** نمط المطابقة المستخدم للمطورين */
  matchedPattern?: string;
  /** النص الأصلي */
  raw: string;
}

// ─── Unified Analyzed Message ───────────────────────────────────────────────

export interface AnalyzedMessage {
  originalText: string;
  language: 'ar' | 'en' | 'darija';
  tokens: string[];
  entities: {
    query?: string;
    screen?: ScreenName;
    category?: string;
    productRef?: number;
    limit?: number;
    sort?: SortOption;
    elementName?: string;
    products?: string[];
    brands?: string[];
    sizes?: string[];
  };
  intent?: IntentType;
  confidence?: number;
}

// ─── Pipeline Result ─────────────────────────────────────────────────────────

export interface PipelineResult {
  analyzedMessage: AnalyzedMessage;
  contextState: AssistantContext;
}

// ─── Product Shape ────────────────────────────────────────────────────────────

export interface AssistantProduct {
  id: number | string;
  name: string;
  /** WooCommerce يُرجع الأسعار كـ string — نقبل كليهما */
  price: number | string;
  regular_price?: number | string;
  on_sale?: boolean;
  image?: string | null;
  images?: Array<{ src: string }>;
  thumbnail?: string | null;
  description?: string;
}

// ─── Chat Message ─────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  /** النص الظاهر للمستخدم */
  content: string;
  /** كروت المنتجات (تظهر فقط في رسائل المساعد بعد البحث) */
  products?: AssistantProduct[];
  timestamp: number;
}

// ─── Action History ───────────────────────────────────────────────────────────

export interface HistoricAction {
  type: ActionType;
  productId?: number | string;
  quantity?: number;
  undo?: (ctx: any) => Promise<void>;
  timestamp: number;
}

// ─── PendingInteraction (نظام التفاعل المعلق — قابل للتوسع بالكامل) ──────────

/**
 * يمثل تفاعلاً معلقاً بين المساعد والشاشة النشطة.
 *
 * مصمم بشكل Generic ليشمل أي نوع تفاعل مستقبلي:
 * comment | rating | favorite | cart | share | follow | like | reply | custom...
 *
 * `type` حقل مفتوح (string) — لا قيود على القيم لتدعم أي InteractionHandler جديد.
 */
export interface PendingInteraction {
  /**
   * نوع التفاعل — مفتوح بالكامل ليدعم أي Handler مسجّل في InteractionRegistry.
   * أمثلة: 'comment' | 'rating' | 'favorite' | 'share' | 'like' | 'follow' | 'reply'
   */
  type: string;

  /**
   * البيانات المرتبطة بالتفاعل — Generic بالكامل.
   * كل Handler يقرأ الحقول التي يحتاجها فقط.
   */
  payload?: {
    // ── Comment fields ──
    text?: string;
    tone?: 'positive' | 'negative' | 'neutral';
    length?: 'short' | 'long';
    // ── Rating fields ──
    rating?: number;
    // ── Shared fields ──
    targetId?: string;
    action?: string;
    // ── Extension (أي Handler يضيف حقوله هنا) ──
    [key: string]: any;
  };

  /** اسم الحقل المستهدف في الشاشة (semantic label / testID / role) */
  targetField?: string;

  /**
   * حالة التفاعل:
   * - 'pending'        → اكتشفنا النية لكن لم ننفذها بعد
   * - 'in_progress'    → جارٍ التنفيذ
   * - 'awaiting_input' → المساعد ينتظر مدخلاً محدداً من المستخدم
   * - 'done'           → تم التنفيذ بنجاح
   * - 'failed'         → فشل التنفيذ
   * الحالات القديمة محفوظة للتوافق:
   * - 'awaiting_text'  → (مُحاذٍ لـ awaiting_input)
   * - 'injected'       → تم حقن النص
   * - 'submitted'      → تم الإرسال
   */
  status: 'pending' | 'in_progress' | 'awaiting_input' | 'awaiting_text' | 'injected' | 'submitted' | 'done' | 'failed';

  /**
   * نوع المدخل المنتظَر من المستخدم (عند status === 'awaiting_input' أو 'awaiting_text')
   * - 'text'         → نص حر (تعليق، وصف...)
   * - 'stars'        → عدد النجوم (1-5)
   * - 'choice'       → اختيار من قائمة
   * - 'confirmation' → تأكيد نعم/لا
   */
  awaitingInputType?: 'text' | 'stars' | 'choice' | 'confirmation';

  /** توقيت إنشاء التفاعل (ms) */
  createdAt?: number;
}

// ─── Assistant Context (ذاكرة الجلسة قصيرة المدى) ────────────────────────────

export interface AssistantContext {
  /** آخر نتائج بحث (للإشارة بـ "الأول" / "الثاني") */
  lastSearchResults: AssistantProduct[];
  /** آخر نية تم تنفيذها */
  lastIntent?: IntentType;
  /** آخر كلمة بحث */
  lastQuery?: string;
  /** آخر فئة تمت زيارتها */
  lastCategory?: string;
  /** آخر توصيات تم عرضها */
  lastRecommendations: AssistantProduct[];
  /** الشاشة الحالية */
  currentScreen?: string;
  /** المنتج المركز عليه حالياً */
  currentFocusedProduct?: AssistantProduct;
  /** الإجراء المعلق بانتظار التأكيد */
  pendingAction?: {
    type: ActionType;
    entities?: ParsedIntent['entities'];
  };
  /** التفاعل المعلق (تعليق / تقييم / إعجاب...) */
  pendingInteraction?: PendingInteraction;
  /** حالة الحوار الحالية */
  conversationStage?: ConversationStage;
  /** توقيت آخر تحديث للجلسة (TTL) */
  lastUpdated?: number;
  /** عدد الرسائل في الجلسة الحالية */
  messageCount?: number;
  /** سجل العمليات للتراجع */
  actionHistory?: HistoricAction[];
  /** قدرات الشاشة النشطة */
  capabilities?: string[];
  /** ربط الكلمات بالعناصر التفاعلية للشاشة */
  screenElements?: Record<string, string>;
  /** سجل مسار التنقلات لمعالجة مشكلة الرجوع (Tab Navigation) */
  screenHistory?: string[];
}

// ─── Telemetry Entry ──────────────────────────────────────────────────────────

export interface TelemetryEntry {
  timestamp: number;
  input: string;
  category: AssistantCategory;
  intent: IntentType;
  action: ActionType;
  confidence: number;
  success: boolean;
  /** سبب الفشل إن وجد */
  failureReason?: string;
  /** النية السابقة في الجلسة */
  lastIntent?: IntentType;
  /** نمط المطابقة الدلالي */
  matchedPattern?: string;
  /** لغة المساعد عند التسجيل */
  locale?: string;
  /** نوع خطأ التحقق من اللغة إن وجد */
  validationError?: string;
  /** الرد الأصلي قبل استبداله بالرد البديل */
  originalResponse?: string;
}

// ─── Confidence Thresholds ────────────────────────────────────────────────────

export const CONFIDENCE = {
  /** تنفيذ مباشر */
  EXECUTE: 0.85,
  /** طلب توضيح */
  CLARIFY: 0.65,
  /** UNKNOWN — أقل من هذا */
} as const;
