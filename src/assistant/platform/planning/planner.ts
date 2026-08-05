import { ExecutionPlan, ExecutionStep, WorldState, CapabilityDefinition } from '../core/types';
import { CapabilityEngine } from '../capabilities/capabilityEngine';

export interface PlannerInput {
  goalId: string;
  goalText: string;
  worldState: WorldState;
  strategy: string;
  constraints: string[];
}

export class Planner {
  private static instance: Planner;
  private capabilityEngine: CapabilityEngine;

  private constructor() {
    this.capabilityEngine = CapabilityEngine.getInstance();
  }

  public static getInstance(): Planner {
    if (!Planner.instance) {
      Planner.instance = new Planner();
    }
    return Planner.instance;
  }

  /**
   * إنشاء خطة تنفيذية مهيكلة ومتتابعة بناءً على استراتيجية التفكير
   */
  public async generatePlan(input: PlannerInput): Promise<ExecutionPlan> {
    const steps: ExecutionStep[] = [];
    const { strategy, goalText, goalId, worldState } = input;

    if (__DEV__) {
      console.log(`[Planner] 📋 Planning for Goal: "${goalText}" using Strategy: "${strategy}"`);
    }

    // 1. تحديد القدرات المناسبة
    const capabilities = this.capabilityEngine.resolveCapabilities(goalText, worldState);

    // 2. تفكيك الهدف وصياغة الخطوات بناءً على الاستراتيجية والقدرات المتاحة
    if (strategy === 'CreateRoutineFlow') {
      // روتين العناية يتطلب:
      // خطوة 1: البحث عن غسول (Cleanser) متوافق مع البشرة
      // خطوة 2: البحث عن مرطب (Moisturizer) متوافق مع البشرة
      // خطوة 3: إضافة المنتجات للسلة
      // خطوة 4: فتح سلة التسوق للمستخدم لعرض النتائج

      steps.push({
        id: `step_${goalId}_1`,
        name: 'SearchCleanser',
        capabilityName: 'Shopping',
        toolName: 'search_products',
        status: 'PENDING',
        inputParameters: { query: 'غسول للبشرة', category: 'cleanser' },
        dependencies: [],
        retryCount: 0,
        maxRetries: 2,
        onFailure: 'SKIP',
      });

      steps.push({
        id: `step_${goalId}_2`,
        name: 'SearchMoisturizer',
        capabilityName: 'Shopping',
        toolName: 'search_products',
        status: 'PENDING',
        inputParameters: { query: 'مرطب للبشرة', category: 'moisturizer' },
        dependencies: [],
        retryCount: 0,
        maxRetries: 2,
        onFailure: 'SKIP',
      });

      steps.push({
        id: `step_${goalId}_3`,
        name: 'AddProductsToCart',
        capabilityName: 'Shopping',
        toolName: 'cart_management',
        status: 'PENDING',
        // نعتمد على مخرجات الخطوتين السابقتين لحقنهما هنا
        inputParameters: { 
          productIds: ['$steps.1.output.id', '$steps.2.output.id'], 
          action: 'add_multiple' 
        },
        dependencies: [`step_${goalId}_1`, `step_${goalId}_2`],
        retryCount: 0,
        maxRetries: 1,
        onFailure: 'ABORT',
      });

      steps.push({
        id: `step_${goalId}_4`,
        name: 'ShowCartScreen',
        capabilityName: 'Shopping',
        toolName: 'navigation',
        status: 'PENDING',
        inputParameters: { screen: 'Cart' },
        dependencies: [`step_${goalId}_3`],
        retryCount: 0,
        maxRetries: 1,
        onFailure: 'SKIP',
      });

    } else {
      // استراتيجية افتراضية للأوامر البسيطة (مثلاً فتح السلة، تفريغ السلة، التقييم)
      // نقوم بمطابقة الإجراء والقدرة الأنسب
      const primaryCap = capabilities[0]?.name || 'Shopping';
      let toolAction = 'navigation';
      let params: Record<string, any> = {};

      if (goalText.includes('سلة') || goalText.includes('سلت')) {
        toolAction = 'cart_management';
        if (goalText.includes('فرغ') || goalText.includes('مسح')) {
          params = { action: 'clear' };
        } else {
          toolAction = 'navigation';
          params = { screen: 'Cart' };
        }
      } else if (goalText.includes('تقييم') || goalText.includes('قيم')) {
        toolAction = 'ratings';
        // استخراج عدد النجوم
        const starsMatch = goalText.match(/(\d+)/);
        const rating = starsMatch ? parseInt(starsMatch[1]) : 5;
        params = { action: 'rate', rating };
      } else if (goalText.includes('مفضلة') || goalText.includes('عجبني')) {
        toolAction = 'wishlist';
        params = { action: 'add' };
      }

      steps.push({
        id: `step_${goalId}_1`,
        name: 'DefaultStep',
        capabilityName: primaryCap,
        toolName: toolAction,
        status: 'PENDING',
        inputParameters: params,
        dependencies: [],
        retryCount: 0,
        maxRetries: 1,
        onFailure: 'ABORT',
      });
    }

    return {
      id: `plan_${goalId}`,
      goalId,
      steps,
      status: 'IDLE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
    };
  }

  /**
   * إعادة تخطيط ديناميكي عند حدوث فشل في خطوة معينة
   */
  public async replan(
    currentPlan: ExecutionPlan,
    failedStep: ExecutionStep,
    worldState: WorldState
  ): Promise<ExecutionPlan> {
    if (__DEV__) {
      console.log(`[Planner] 🔄 Replanning requested due to failure of step: ${failedStep.name}`);
    }

    // استراتيجية إعادة تخطيط مبسطة: إزالة الخطوة الفاشلة وجميع الخطوات المعتمدة عليها لتفادي التعليق،
    // أو إيجاد بديل (مثلاً إذا فشل البحث في فئة معينة، نقوم بالبحث بالاسم)
    const updatedSteps = currentPlan.steps.map((step) => {
      if (step.id === failedStep.id) {
        return { ...step, status: 'SKIPPED' as const };
      }
      // إذا كانت هناك خطوة تعتمد على الخطوة الفاشلة، نقوم بتعليمها كـ SKIPPED أيضاً
      if (step.dependencies.includes(failedStep.id)) {
        return { ...step, status: 'SKIPPED' as const };
      }
      return step;
    });

    return {
      ...currentPlan,
      steps: updatedSteps,
      updatedAt: Date.now(),
    };
  }
}
