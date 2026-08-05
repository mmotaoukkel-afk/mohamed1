import { ThoughtProcess, ReasoningResult, WorldState } from '../core/types';
import { MemorySystem } from '../memory/memorySystem';

export class ReasoningEngine {
  private static instance: ReasoningEngine;

  private constructor() {}

  public static getInstance(): ReasoningEngine {
    if (!ReasoningEngine.instance) {
      ReasoningEngine.instance = new ReasoningEngine();
    }
    return ReasoningEngine.instance;
  }

  /**
   * إجراء عملية التفكير والتحليل المنطقي للهدف الحالي للمستخدم
   */
  public async reason(
    goal: string,
    worldState: WorldState,
    memorySystem: MemorySystem
  ): Promise<ReasoningResult> {
    const goalLower = goal.toLowerCase();
    
    // 1. استرجاع بيانات المستخدم التاريخية من الذاكرة طويلة المدى
    const preferredBrand = await memorySystem.longTerm.getUserPreference('favoriteBrand') || 'أي براند';
    const skinType = await memorySystem.longTerm.getUserPreference('skinType') || 'غير محدد';

    // 2. تذكر الأحداث السابقة من الذاكرة الحدثية (Episodic Memory)
    const episodes = await memorySystem.episodic.recallEpisodes({ action: 'purchased' });
    const pastPurchasesSummary = episodes.length > 0
      ? `سبق له شراء: ${episodes.map((e: any) => e.entities.productName).join(', ')}`
      : 'لا توجد مشتريات سابقة مسجلة';

    // 3. تحليل الهدف دلالياً وصياغة المنطق (Reasoning Process)
    const constraints: string[] = [];
    const assumptions: string[] = [];
    const alternatives: string[] = [];
    let isFeasible = true;
    let strategy = 'DirectCommandExecution';
    let reasoning = `تحليل الهدف: المستخدم يريد "${goal}".`;

    if (goalLower.includes('روتين') || goalLower.includes('routine') || goalLower.includes('عناية')) {
      strategy = 'CreateRoutineFlow';
      constraints.push(`نوع البشرة المعتمد: ${skinType}`);
      constraints.push(`البراند المفضل للمستخدم: ${preferredBrand}`);
      assumptions.push('البدء بالخطوات الأساسية: غسول، مرطب، واقي شمس');
      alternatives.push('روتين اقتصادي');
      alternatives.push('روتين متكامل ماركة واحدة');

      // استرجاع معرفة مفاهيمية من الذاكرة الدلالية (Semantic Memory)
      const semanticFacts = await memorySystem.semantic.query('oily_skin');
      reasoning += ` تم الكشف عن نية روتين عناية. البشرة المخزنة: ${skinType}. المعرفة الدلالية المسترجعة: ${semanticFacts.join(' - ')}.`;
    }

    // التحقق من واقعية الهدف (Feasibility Check)
    // مثال لطلب غير منطقي: روتين عناية للبشرة الدهنية بميزانية 5 دراهم (غير واقعي)
    const budgetMatch = goal.match(/(\d+)\s*(درهم|دج|جنيه|dh|dirham)/i);
    if (budgetMatch) {
      const budgetValue = parseInt(budgetMatch[1]);
      constraints.push(`ميزانية أقصاها: ${budgetValue} درهم`);
      if (budgetValue < 20) {
        isFeasible = false;
        reasoning += ' الميزانية منخفضة جداً ولا يمكن توفير منتجات عناية حقيقية بها.';
      }
    }

    const thought: ThoughtProcess = {
      reasoning,
      confidenceScore: isFeasible ? 0.95 : 0.40,
      alternativesConsidered: alternatives,
      assumptionsMade: assumptions,
      constraintsIdentified: constraints,
    };

    return {
      isFeasible,
      refinedGoal: goal,
      thought,
      recommendedStrategy: strategy,
      rejectionReason: isFeasible ? undefined : 'الميزانية المحددة غير واقعية للحصول على روتين عناية بالبشرة.',
      knowledgeUsed: [],
      memoryRecalled: episodes,
    };
  }

  /**
   * تقييم جودة ومنطقية الخطة المقترحة قبل البدء في التنفيذ
   */
  public async verifyPlan(
    plan: any,
    worldState: WorldState
  ): Promise<{ isValid: boolean; critique?: string }> {
    // التحقق من خلو الخطة من خطوات متعارضة
    const steps = plan.steps || [];
    
    // إذا كانت الخطة فارغة، فهي غير صالحة
    if (steps.length === 0) {
      return { isValid: false, critique: 'الخطة المقترحة لا تحتوي على أي خطوات للتنفيذ.' };
    }

    // كشف التكرار أو التعارض في الخطوات
    const hasAddAndClear = steps.some((s: any) => s.name.includes('clear')) && steps.some((s: any) => s.name.includes('add'));
    if (hasAddAndClear) {
      return {
        isValid: false,
        critique: 'تحتوي الخطة على تعارض مباشر: محاولة تفريغ السلة وإضافة منتجات في نفس الوقت.',
      };
    }

    return { isValid: true };
  }
}
