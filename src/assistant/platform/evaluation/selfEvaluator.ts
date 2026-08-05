import { ISelfEvaluator, EvaluationResult, ExecutionStep, WorldState, ExecutionPlan } from '../core/types';
import { EventBus } from '../core/eventBus';

export class SelfEvaluator implements ISelfEvaluator {
  private static instance: SelfEvaluator;
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): SelfEvaluator {
    if (!SelfEvaluator.instance) {
      SelfEvaluator.instance = new SelfEvaluator();
    }
    return SelfEvaluator.instance;
  }

  /**
   * تقييم مخرجات الخطوة الحالية ونقدها ذاتياً لكشف الانحرافات
   */
  public async evaluateStep(
    step: ExecutionStep,
    output: any,
    worldState: WorldState
  ): Promise<EvaluationResult> {
    let isSuccessful = step.status === 'COMPLETED';
    let qualityScore = isSuccessful ? 1.0 : 0.0;
    let deviationDetected = false;
    let critique = '';
    let correctiveAction: 'NONE' | 'RETRY' | 'REPLAN' | 'COMPENSATE' = 'NONE';

    // 1. تقييم تفصيلي بناءً على مخرجات الأداة الفردية
    if (step.name.includes('Search') && isSuccessful) {
      // التحقق مما إذا كانت نتائج البحث فارغة
      const results = Array.isArray(output) ? output : (output?.results || []);
      if (results.length === 0) {
        deviationDetected = true;
        qualityScore = 0.5;
        critique = 'عملية البحث نجحت تقنياً ولكنها لم ترجع أي منتجات متطابقة.';
        correctiveAction = 'REPLAN'; // إعادة التخطيط للبحث بكلمة دلالية بديلة
      } else {
        critique = `عملية البحث ناجحة ورجعت ${results.length} منتجات ممتازة للبشرة.`;
      }
    }

    if (step.name.includes('Cart') && isSuccessful) {
      critique = 'تمت إضافة المنتجات المقترحة للسلة بنجاح.';
    }

    // 2. فحص الأخطاء التقنية المرتجعة
    if (!isSuccessful) {
      deviationDetected = true;
      critique = `فشلت الخطوة بسبب: ${step.errorMessage || 'خطأ تقني غير معروف'}.`;
      correctiveAction = step.retryCount < step.maxRetries ? 'RETRY' : 'COMPENSATE';
    }

    const result: EvaluationResult = {
      stepId: step.id,
      isSuccessful,
      qualityScore,
      deviationDetected,
      critique,
      correctiveAction,
    };

    // نشر حدث التقييم الذاتي
    this.eventBus.publish({
      id: `evt_ev_${step.id}_${Date.now()}`,
      type: 'EVALUATION_COMPLETED',
      timestamp: Date.now(),
      payload: { evaluation: result },
      metadata: {
        sessionId: 'default',
        correlationId: `corr_${Date.now()}`,
        actor: 'EVALUATOR',
      },
    });

    return result;
  }

  /**
   * تقييم الخطة بالكامل بعد الانتهاء منها للتأكد من مطابقة النتيجة للهدف الكلي للمستخدم
   */
  public async evaluateFinalOutput(
    plan: ExecutionPlan,
    worldState: WorldState
  ): Promise<{ isGoalAchieved: boolean; overallQuality: number; critique: string; refinementRequired: boolean }> {
    const totalSteps = plan.steps.length;
    const completedSteps = plan.steps.filter((s) => s.status === 'COMPLETED').length;
    const overallQuality = totalSteps > 0 ? completedSteps / totalSteps : 0.0;
    
    let isGoalAchieved = overallQuality >= 0.75; // نعتبر الهدف محققاً إذا اكتملت 75% من الخطوات على الأقل
    let critique = `اكتملت ${completedSteps} من أصل ${totalSteps} خطوات بنجاح.`;
    let refinementRequired = false;

    if (!isGoalAchieved) {
      critique += ' الخطة لم تحقق الهدف المطلوب بالكامل بسبب فشل خطوات حرجة.';
      refinementRequired = true;
    } else {
      critique += ' الهدف العام للمستخدم تم تحقيقه بنجاح تام.';
    }

    return {
      isGoalAchieved,
      overallQuality,
      critique,
      refinementRequired,
    };
  }
}
