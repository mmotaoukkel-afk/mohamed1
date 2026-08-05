/**
 * InteractionRegistry — نظام التسجيل الديناميكي للتفاعلات
 *
 * قلب الـ InteractionFramework الجديد.
 * بدل إضافة `case 'NEW_INTENT':` في useAssistant عند كل Skill جديدة،
 * كل Handler يُسجّل نفسه هنا مرة واحدة فقط.
 *
 * الاستخدام:
 *   InteractionRegistry.register('RATING', RatingHandler);
 *   InteractionRegistry.register('COMMENT', CommentHandler);
 *
 * في useAssistant:
 *   const handler = InteractionRegistry.resolve(result.intent);
 *   if (handler) await handler(ctx, result.entities);
 */

import type { AssistantContext, ParsedIntent } from '../types';

// ─── Handler Context ───────────────────────────────────────────────────────────

/**
 * السياق الذي يُمرَّر لكل Handler عند التنفيذ.
 * يحتوي على كل الأدوات التي قد يحتاجها أي Handler.
 */
export interface RegistryContext {
  /** ذاكرة الجلسة الحالية */
  context: { current: AssistantContext };
  /** إلحاق رسالة جديدة من المساعد */
  appendMsg: (msg: any) => void;
  /** إنشاء رسالة مساعد */
  makeAssistantMsg: (text: string) => any;
  /** تحديث حالة المساعد */
  setStatus: (status: string) => void;
  /** خدمة النطق بالصوت */
  voiceOutputService: { speak: (text: string) => Promise<void> };
  /** لغة الواجهة الحالية */
  locale: 'ar' | 'en';
  /** المنتج المركّز عليه حالياً */
  focusedProduct?: any;
  /** دالة الحماية من ردود فارغة */
  guardResponse: (raw: string, intent: string, retry?: () => string) => string;
  /** سجل التحليل الأصلي */
  result: ParsedIntent;
  /** النص الأصلي المُدخَل */
  trimmed: string;
  /** سياق الشاشة الحالية (العناصر المرئية والمنتج المركّز) */
  activeContext?: any;
  /** تعديل سياق الشاشة (لتعيين pendingInteraction / triggerAction) */
  setActiveContext: (updater: (prev: any) => any) => void;
}

// ─── Handler Type ──────────────────────────────────────────────────────────────

/**
 * نوع Handler الموحّد.
 * كل Skill تُنفّذ هذه الدالة وتُسجّلها في InteractionRegistry.
 */
export type InteractionHandler = (
  ctx: RegistryContext,
  payload: Record<string, any>
) => Promise<void>;

// ─── Registry Core ─────────────────────────────────────────────────────────────

const registry = new Map<string, InteractionHandler>();

export const InteractionRegistry = {
  /**
   * تسجيل Handler لنية معيّنة.
   * يُستدعى عادةً عند استيراد ملف Handler في بداية التطبيق.
   *
   * @param intent - اسم النية (case-insensitive): 'RATING', 'COMMENT', 'LIKE'...
   * @param handler - الدالة المُنفّذة
   */
  register(intent: string, handler: InteractionHandler): void {
    const key = intent.toUpperCase().trim();
    registry.set(key, handler);
  },

  /**
   * استرجاع Handler مسجّل.
   * إذا لم يوجد Handler → يُعيد undefined (للسماح بالـ fallback للـ switch القديم).
   */
  resolve(intent: string): InteractionHandler | undefined {
    return registry.get(intent.toUpperCase().trim());
  },

  /**
   * التحقق من وجود Handler لنية معيّنة.
   */
  has(intent: string): boolean {
    return registry.has(intent.toUpperCase().trim());
  },

  /**
   * قائمة بجميع النوايا المسجّلة (للتطوير والاختبار).
   */
  list(): string[] {
    return Array.from(registry.keys());
  },

  /**
   * إلغاء تسجيل Handler (للاختبار فقط).
   */
  unregister(intent: string): void {
    registry.delete(intent.toUpperCase().trim());
  },

  /**
   * مسح جميع الـ Handlers (للاختبار فقط).
   */
  clear(): void {
    registry.clear();
  },
};

// تسجيل جسر افتراضي لـ ADD_TO_FAVORITES ليصبح متوفراً في جميع البيئات (بما في ذلك بيئة الاختبارات)
InteractionRegistry.register('ADD_TO_FAVORITES', async (ctx, payload) => {
  if (__DEV__) {
    console.log('[InteractionRegistry] ADD_TO_FAVORITES placeholder invoked with:', payload);
  }
});

