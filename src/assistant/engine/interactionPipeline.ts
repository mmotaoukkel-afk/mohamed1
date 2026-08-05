/**
 * InteractionPipeline — تنفيذ الطلبات المركّبة كخطوات مرتّبة
 *
 * يُستخدم عند اكتشاف أوامر مركّبة مثل:
 *   "اكتب تعليق بأن المنتج ممتاز وقيمه بخمس نجوم وضفه للمفضلة"
 *
 * ينفّذ كل خطوة بالترتيب — إذا فشلت خطوة يُسجّل الخطأ ويكمل الباقي.
 *
 * الاستخدام:
 *   const pipeline = new InteractionPipeline(ctx, steps);
 *   await pipeline.run();
 */

import { InteractionRegistry } from './interactionRegistry';
import type { RegistryContext } from './interactionRegistry';

// ─── Pipeline Step ─────────────────────────────────────────────────────────────

export interface PipelineStep {
  /** اسم النية المرتبطة بهذه الخطوة */
  intent: string;
  /** البيانات المطلوبة لهذه الخطوة */
  payload: Record<string, any>;
  /** توقف عند الفشل بدلاً من الاستمرار (اختياري — افتراضياً: false) */
  stopOnFailure?: boolean;
}

// ─── Pipeline Result ───────────────────────────────────────────────────────────

export interface PipelineStepResult {
  intent: string;
  success: boolean;
  error?: string;
}

// ─── InteractionPipeline ───────────────────────────────────────────────────────

export class InteractionPipeline {
  private steps: PipelineStep[];
  private ctx: RegistryContext;

  constructor(ctx: RegistryContext, steps: PipelineStep[]) {
    this.ctx = ctx;
    this.steps = steps;
  }

  /**
   * تنفيذ جميع الخطوات بالترتيب.
   * @returns نتائج كل خطوة
   */
  async run(): Promise<PipelineStepResult[]> {
    const results: PipelineStepResult[] = [];

    if (__DEV__) {
      console.log(`[InteractionPipeline] بدء تنفيذ Pipeline بـ ${this.steps.length} خطوات:`,
        this.steps.map(s => s.intent).join(' → '));
    }

    for (const step of this.steps) {
      const handler = InteractionRegistry.resolve(step.intent);

      if (!handler) {
        const errorMsg = `[InteractionPipeline] لا يوجد Handler مسجّل لـ "${step.intent}"`;
        if (__DEV__) console.warn(errorMsg);

        results.push({ intent: step.intent, success: false, error: errorMsg });

        if (step.stopOnFailure) break;
        continue;
      }

      try {
        await handler(this.ctx, step.payload);
        results.push({ intent: step.intent, success: true });

        if (__DEV__) {
          console.log(`[InteractionPipeline] ✅ "${step.intent}" نُفّذت بنجاح`);
        }

        // أضف مهلة زمنية صغيرة للسماح لواجهة المستخدم (React) بتحديث الحالة ومعالجة الخطوة
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (err: any) {
        const errorMsg = err?.message ?? String(err);
        if (__DEV__) {
          console.error(`[InteractionPipeline] ❌ فشل "${step.intent}":`, errorMsg);
        }

        results.push({ intent: step.intent, success: false, error: errorMsg });

        if (step.stopOnFailure) break;
      }
    }

    const successCount = results.filter(r => r.success).length;
    if (__DEV__) {
      console.log(`[InteractionPipeline] انتهى: ${successCount}/${results.length} خطوات ناجحة`);
    }

    return results;
  }

  /**
   * بناء Pipeline من entities.pipelineSteps (مُستخدَم في useAssistant)
   */
  static fromEntities(
    ctx: RegistryContext,
    steps: Array<{ intent: string; payload: Record<string, any> }>
  ): InteractionPipeline {
    return new InteractionPipeline(ctx, steps);
  }
}
