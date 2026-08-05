/**
 * TelemetryLogger — نظام تسجيل تفاعلات المساعد
 *
 * يسجل كل تفاعل مستخدم لتحسين المساعد مستقبلاً:
 *  - input: النص الأصلي
 *  - intent: النية المحددة
 *  - action: الأمر المنفذ
 *  - confidence: مستوى الثقة
 *  - success: هل نجح التنفيذ
 *
 * يتيح للفريق تحليل الأنماط الشائعة وإضافة مرادفات جديدة
 * بناءً على بيانات المستخدمين الحقيقيين.
 */

import type { ActionType, IntentType, TelemetryEntry, AssistantCategory } from '../types';
import { getLanguageMetrics } from './languageGuard';

// ─── مخزن التسجيلات (في الذاكرة — يمكن ربطه بـ API لاحقاً) ────────────────

const MAX_LOG_SIZE = 500;
let _logs: TelemetryEntry[] = [];

// ─── تسجيل تفاعل جديد ────────────────────────────────────────────────────────

export const logInteraction = (
  input: string,
  category: AssistantCategory,
  intent: IntentType,
  action: ActionType,
  confidence: number,
  success: boolean,
  failureReason?: string,
  lastIntent?: IntentType,
  matchedPattern?: string,
  locale?: string,
  validationError?: string,
  originalResponse?: string,
): void => {
  const entry: TelemetryEntry = {
    timestamp: Date.now(),
    input,
    category,
    intent,
    action,
    confidence,
    success,
    failureReason,
    lastIntent,
    matchedPattern,
    locale,
    validationError,
    originalResponse,
  };

  _logs.push(entry);

  // الحد من حجم السجل في الذاكرة
  if (_logs.length > MAX_LOG_SIZE) {
    _logs = _logs.slice(-MAX_LOG_SIZE);
  }

  // طباعة في Console للتطوير
  if (__DEV__) {
    const emoji = success ? '✅' : '❌';
    console.log(
      `[Telemetry] ${emoji} "${input}" → ${category}/${intent}/${action} (${(confidence * 100).toFixed(0)}%)` +
      (matchedPattern ? ` [Pattern: ${matchedPattern}]` : '') +
      (locale ? ` [Locale: ${locale}]` : '') +
      (validationError ? ` [ValErr: ${validationError}]` : '') +
      (failureReason ? ` — ${failureReason}` : ''),
    );
  }
};

// ─── استعلامات التحليل ────────────────────────────────────────────────────────

/** إرجاع جميع السجلات */
export const getLogs = (): TelemetryEntry[] => [..._logs];

/** إرجاع السجلات حسب النية */
export const getLogsByIntent = (intent: IntentType): TelemetryEntry[] =>
  _logs.filter(e => e.intent === intent);

/** إرجاع السجلات الفاشلة */
export const getFailedLogs = (): TelemetryEntry[] =>
  _logs.filter(e => !e.success);

/** إرجاع نسبة النجاح */
export const getSuccessRate = (): number => {
  if (_logs.length === 0) return 0;
  const successCount = _logs.filter(e => e.success).length;
  return (successCount / _logs.length) * 100;
};

/** إرجاع أكثر النوايا الفاشلة */
export const getTopFailedIntents = (): Record<IntentType, number> => {
  const failed = _logs.filter(e => !e.success);
  const counts: Partial<Record<IntentType, number>> = {};
  for (const entry of failed) {
    counts[entry.intent] = (counts[entry.intent] || 0) + 1;
  }
  return counts as Record<IntentType, number>;
};

/** إرجاع الطلبات التي صُنفت كـ UNKNOWN */
export const getUnknownInputs = (): string[] =>
  _logs.filter(e => e.intent === 'UNKNOWN').map(e => e.input);

/** مسح السجلات (للاختبارات) */
export const clearLogs = (): void => {
  _logs = [];
};

/** تصدير السجلات كـ JSON (لإرسالها لـ API مستقبلاً) */
export const exportLogs = (): string => JSON.stringify(_logs, null, 2);

/** إحصائيات ملخصة — تشمل مقاييس اللغة */
export const getStats = (): {
  total: number;
  successRate: number;
  unknownRate: number;
  topIntents: Record<string, number>;
  language: {
    validationPasses: number;
    validationFailures: number;
    fallbackCount: number;
    retryCount: number;
    invalidMixedLanguageCount: number;
    dialectDetectedCount: number;
  };
} => {
  const total = _logs.length;
  const baseStats = total === 0
    ? { total: 0, successRate: 0, unknownRate: 0, topIntents: {} }
    : {
      total,
      successRate: (_logs.filter(e => e.success).length / total) * 100,
      unknownRate: (_logs.filter(e => e.intent === 'UNKNOWN').length / total) * 100,
      topIntents: _logs.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.intent] = (acc[entry.intent] || 0) + 1;
        return acc;
      }, {}),
    };

  return {
    ...baseStats,
    language: getLanguageMetrics(),
  };
};
