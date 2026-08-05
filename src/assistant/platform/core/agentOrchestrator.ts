import { Goal, ExecutionPlan, AgentState } from './types';
import { EventBus } from './eventBus';
import { AgentStateMachine } from './stateMachine';
import { WorldStateManager } from './worldState';
import { MemorySystem } from '../memory/memorySystem';
import { ReasoningEngine } from '../reasoning/reasoningEngine';
import { GoalManager } from '../goals/goalManager';
import { Planner } from '../planning/planner';
import { PlanExecutor } from '../planning/planExecutor';
import { SelfEvaluator } from '../evaluation/selfEvaluator';

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  
  private eventBus: EventBus;
  private stateMachine: AgentStateMachine;
  private worldStateManager: WorldStateManager;
  private memorySystem: MemorySystem;
  private reasoningEngine: ReasoningEngine;
  private goalManager: GoalManager;
  private planner: Planner;
  private planExecutor: PlanExecutor;
  private selfEvaluator: SelfEvaluator;

  private activePlan?: ExecutionPlan;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.stateMachine = AgentStateMachine.getInstance();
    this.worldStateManager = WorldStateManager.getInstance();
    this.memorySystem = MemorySystem.getInstance();
    this.reasoningEngine = ReasoningEngine.getInstance();
    this.goalManager = GoalManager.getInstance();
    this.planner = Planner.getInstance();
    this.planExecutor = PlanExecutor.getInstance();
    this.selfEvaluator = SelfEvaluator.getInstance();

    // الاشتراك في أحداث الأهداف لتشغيل الخطط
    this.eventBus.subscribe('GOAL_ACTIVATED', (event) => this.handleGoalActivated(event.payload.goal));
  }

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  /**
   * المدخل الرئيسي والوحيد للوكيل الذكي لمعالجة هدف المستخدم
   */
  public async handleUserInput(inputText: string): Promise<string> {
    const correlationId = `corr_${Date.now()}`;
    const sessionId = 'default';

    // 1. الانتقال لحالة الاستماع والتحليل
    this.stateMachine.transitionTo('Listening');
    this.eventBus.publish({
      id: `evt_user_input_${Date.now()}`,
      type: 'USER_INPUT_RECEIVED',
      timestamp: Date.now(),
      payload: { inputText },
      metadata: { sessionId, correlationId, actor: 'USER' },
    });

    // 2. تحديث المحادثة في ذاكرة الجلسة
    this.memorySystem.session.push({ role: 'user', content: inputText });

    // 3. الانتقال لحالة التفكير (Thinking)
    this.stateMachine.transitionTo('Thinking', 'Reasoning goal feasibility');

    // استدعاء محرك التفكير والاستنتاج
    const reasoningResult = await this.reasoningEngine.reason(
      inputText,
      this.worldStateManager.getState(),
      this.memorySystem
    );

    if (!reasoningResult.isFeasible) {
      this.stateMachine.transitionTo('Failed', 'Goal is not feasible');
      const response = reasoningResult.rejectionReason || 'عذراً، تعذر تنفيذ هذا الطلب.';
      this.memorySystem.session.push({ role: 'assistant', content: response });
      return response;
    }

    // 4. إنشاء الهدف وإرساله لمدير الأهداف
    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      description: reasoningResult.refinedGoal,
      priority: inputText.includes('مستعجل') || inputText.includes('فورا') ? 'HIGH' : 'NORMAL',
      status: 'QUEUED',
      createdAt: Date.now(),
      metadata: {
        strategy: reasoningResult.recommendedStrategy,
        constraints: reasoningResult.thought.constraintsIdentified,
      },
    };

    // إدراج الهدف وحل أي تعارض
    this.goalManager.enqueue(newGoal);

    // 5. في حال نجاح التنفيذ واكتمال الخطة
    if (this.activePlan && this.activePlan.status === 'SUCCESS') {
      this.stateMachine.transitionTo('Summarizing');
      
      const finalEval = await this.selfEvaluator.evaluateFinalOutput(
        this.activePlan,
        this.worldStateManager.getState()
      );

      this.stateMachine.transitionTo('Speaking');
      const finalResponse = this.generateResponseText(this.activePlan, finalEval.critique);
      this.memorySystem.session.push({ role: 'assistant', content: finalResponse });
      
      this.stateMachine.transitionTo('Completed');
      return finalResponse;
    }

    return 'تم استلام طلبك وبدء المعالجة الذكية.';
  }

  private async handleGoalActivated(goal: Goal): Promise<void> {
    this.stateMachine.transitionTo('Planning');
    
    // 1. توليد الخطة التنفيذية
    const plan = await this.planner.generatePlan({
      goalId: goal.id,
      goalText: goal.description,
      worldState: this.worldStateManager.getState(),
      strategy: goal.metadata.strategy,
      constraints: goal.metadata.constraints,
    });

    // 2. التحقق من صحة الخطة من محرك الاستنتاج
    const check = await this.reasoningEngine.verifyPlan(plan, this.worldStateManager.getState());
    if (!check.isValid) {
      this.stateMachine.transitionTo('Failed', `Plan verification failed: ${check.critique}`);
      return;
    }

    this.activePlan = plan;
    this.worldStateManager.updateActiveGoals(this.goalManager.getQueue());

    this.eventBus.publish({
      id: `evt_plan_gen_${plan.id}_${Date.now()}`,
      type: 'PLAN_GENERATED',
      timestamp: Date.now(),
      payload: { plan },
      metadata: { sessionId: 'default', correlationId: `corr_${Date.now()}`, actor: 'PLANNER' }
    });

    // 3. الانتقال لحالة التنفيذ (Executing)
    this.stateMachine.transitionTo('Executing');
    const success = await this.planExecutor.execute(plan);

    if (success) {
      if (__DEV__) {
        console.log(`[AgentOrchestrator] 🎉 Plan executed successfully for Goal: "${goal.description}"`);
      }
    } else {
      this.stateMachine.transitionTo('Failed', 'Plan execution failed.');
    }
  }

  private generateResponseText(plan: ExecutionPlan, evaluationCritique: string): string {
    // توليد رد سياقي مناسب بناءً على خطوات الخطة
    const completedCount = plan.steps.filter((s) => s.status === 'COMPLETED').length;
    return `بناءً على طلبك، قمت بإنشاء خطة واكتملت ${completedCount} خطوات بنجاح. ${evaluationCritique}`;
  }

  /**
   * إلغاء العملية الجارية فوراً
   */
  public cancelCurrentProcess(): void {
    if (this.activePlan) {
      this.activePlan.status = 'FAILED';
      this.stateMachine.transitionTo('Interrupted');
      if (__DEV__) {
        console.log('[AgentOrchestrator] 🛑 Process explicitly interrupted by user.');
      }
      this.stateMachine.transitionTo('Idle');
    }
  }
}
