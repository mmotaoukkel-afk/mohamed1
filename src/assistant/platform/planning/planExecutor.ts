import { ExecutionPlan, ExecutionStep, WorldState, ITool } from '../core/types';
import { EventBus } from '../core/eventBus';
import { WorldStateManager } from '../core/worldState';
import { CapabilityEngine } from '../capabilities/capabilityEngine';
import { ToolRegistry } from '../tools/registry';

export class PlanExecutor {
  private static instance: PlanExecutor;
  private eventBus: EventBus;
  private worldStateManager: WorldStateManager;
  private capabilityEngine: CapabilityEngine;
  private toolRegistry: ToolRegistry;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.worldStateManager = WorldStateManager.getInstance();
    this.capabilityEngine = CapabilityEngine.getInstance();
    this.toolRegistry = ToolRegistry.getInstance();
  }

  public static getInstance(): PlanExecutor {
    if (!PlanExecutor.instance) {
      PlanExecutor.instance = new PlanExecutor();
    }
    return PlanExecutor.instance;
  }

  /**
   * تنفيذ الخطة بالكامل خطوة بخطوة مع حل الاعتماديات
   */
  public async execute(plan: ExecutionPlan): Promise<boolean> {
    plan.status = 'EXECUTING';
    
    if (__DEV__) {
      console.log(`[PlanExecutor] 🚀 Starting Execution of Plan: ${plan.id} (${plan.steps.length} steps)`);
    }

    try {
      for (const step of plan.steps) {
        // إذا تم إلغاء الخطة أثناء العمل
        if (plan.status as string === 'CANCELLED') {
          return false;
        }

        // 1. معالجة وتجاوز الخطوات المتخطاة
        if (step.status === 'SKIPPED') {
          continue;
        }

        // 2. التحقق وحل الاعتماديات
        const canExecute = this.checkDependencies(step, plan.steps);
        if (!canExecute) {
          step.status = 'FAILED';
          step.errorMessage = 'Dependencies failed or were skipped.';
          this.handleStepFailure(step, plan);
          continue;
        }

        // 3. بدء تشغيل الخطوة
        step.status = 'RUNNING';
        this.publishStepEvent('STEP_STARTED', step, plan.id);

        try {
          // حل وحقن المتغيرات الديناميكية (Dynamic Variable Injection)
          const resolvedParams = this.resolveParameters(step.inputParameters, plan.steps);

          // 4. استدعاء محرك القدرات لحل الأداة الأنسب وتدبير تنفيذها
          const tool = this.capabilityEngine.selectTool(step.capabilityName, step.toolName || step.name, this.worldStateManager.getState());
          
          this.worldStateManager.updateToolStatus(tool.definition.name, 'RUNNING');
          const output = await tool.execute(resolvedParams, { worldState: this.worldStateManager.getState() });
          this.worldStateManager.updateToolStatus(tool.definition.name, 'COMPLETED', output);

          // 5. نجاح الخطوة
          step.status = 'COMPLETED';
          step.outputData = output;
          
          // حفظ المخرجات في البيانات المؤقتة لحالة العالم ليتسنى للخطوات التالية استخدامها
          this.worldStateManager.updateTemporaryData(step.id, output);

          this.publishStepEvent('STEP_COMPLETED', step, plan.id, output);

        } catch (error: any) {
          // 6. فشل الخطوة
          step.status = 'FAILED';
          step.errorMessage = error?.message || 'Unknown error occurred during step execution.';
          this.publishStepEvent('STEP_FAILED', step, plan.id, undefined, step.errorMessage);
          
          const recoverySuccess = await this.handleStepFailure(step, plan);
          if (!recoverySuccess) {
            plan.status = 'FAILED';
            return false;
          }
        }
      }

      plan.status = 'SUCCESS';
      return true;

    } catch (e) {
      plan.status = 'FAILED';
      return false;
    }
  }

  private checkDependencies(step: ExecutionStep, allSteps: ExecutionStep[]): boolean {
    for (const depId of step.dependencies) {
      const depStep = allSteps.find((s) => s.id === depId);
      if (!depStep || depStep.status !== 'COMPLETED') {
        return false;
      }
    }
    return true;
  }

  /**
   * حل وحقن مخرجات الخطوات السابقة في بارامترات الخطوة الحالية
   * مثال: "$steps.1.output.id" -> يستبدل بالمعرف الحقيقي للمنتج
   */
  private resolveParameters(params: Record<string, any>, allSteps: ExecutionStep[]): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('$steps.')) {
        // تفكيك المسار: $steps.stepIndex.output.field
        const parts = value.split('.');
        const stepIdPart = parts[1]; // مثلاً 'step_goalId_1' أو الفهرس الرقمي
        const fieldName = parts[parts.length - 1];

        // البحث عن الخطوة المطابقة
        const sourceStep = allSteps.find(s => s.id.endsWith(stepIdPart) || s.id.includes(stepIdPart) || s.name.includes(stepIdPart));
        if (sourceStep && sourceStep.outputData) {
          // جلب الحقل المطلوب من المخرجات
          resolved[key] = sourceStep.outputData[fieldName] || sourceStep.outputData;
        } else {
          resolved[key] = undefined;
        }
      } else if (Array.isArray(value)) {
        // دعم مصفوفة المتغيرات
        resolved[key] = value.map(val => {
          if (typeof val === 'string' && val.startsWith('$steps.')) {
            const parts = val.split('.');
            const stepIdPart = parts[1];
            const fieldName = parts[parts.length - 1];
            const sourceStep = allSteps.find(s => s.id.endsWith(stepIdPart) || s.id.includes(stepIdPart) || s.name.includes(stepIdPart));
            return sourceStep && sourceStep.outputData ? (sourceStep.outputData[fieldName] || sourceStep.outputData) : undefined;
          }
          return val;
        }).filter(v => v !== undefined);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * تدبير استراتيجيات التعافي عند فشل خطوة محددة
   */
  private async handleStepFailure(step: ExecutionStep, plan: ExecutionPlan): Promise<boolean> {
    if (__DEV__) {
      console.log(`[PlanExecutor] 🛡️ Resolving failure for step: "${step.name}" via Strategy: "${step.onFailure}"`);
    }

    if (step.onFailure === 'SKIP') {
      step.status = 'SKIPPED';
      return true; // نواصل التنفيذ
    }

    if (step.onFailure === 'COMPENSATE' && step.compensationAction) {
      this.eventBus.publish({
        id: `evt_pe_comp_${Date.now()}`,
        type: 'COMPENSATION_TRIGGERED',
        timestamp: Date.now(),
        payload: { stepId: step.id, action: step.compensationAction },
        metadata: {
          sessionId: 'default',
          correlationId: `corr_${Date.now()}`,
          actor: 'SYSTEM',
        },
      });

      // تشغيل إجراء التعويض والتراجع
      const compTool = this.toolRegistry.resolve(step.compensationAction.toolName);
      if (compTool) {
        await compTool.execute(step.compensationAction.parameters, { worldState: this.worldStateManager.getState() });
      }
      return false;
    }

    if (step.onFailure === 'REPLAN') {
      // إيقاف الخطة لإعادة التخطيط
      return false;
    }

    return false; // ABORT أو غير معروف
  }

  private publishStepEvent(
    type: 'STEP_STARTED' | 'STEP_COMPLETED' | 'STEP_FAILED',
    step: ExecutionStep,
    planId: string,
    output?: any,
    error?: string
  ): void {
    this.eventBus.publish({
      id: `evt_step_${step.id}_${Date.now()}`,
      type,
      timestamp: Date.now(),
      payload: { stepId: step.id, stepName: step.name, planId, output, error },
      metadata: {
        sessionId: 'default',
        correlationId: `corr_${Date.now()}`,
        actor: 'EXECUTOR',
      },
    });
  }
}
