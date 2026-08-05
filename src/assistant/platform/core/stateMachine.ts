import { AgentState } from './types';
import { EventBus } from './eventBus';

export class AgentStateMachine {
  private static instance: AgentStateMachine;
  private currentState: AgentState = 'Idle';
  private eventBus: EventBus;

  // تعريف الانتقالات المسموحة لحماية دورة حياة الوكيل
  private allowedTransitions: Record<AgentState, AgentState[]> = {
    Idle: ['Listening', 'Thinking', 'Interrupted'],
    Listening: ['Thinking', 'Interrupted', 'Idle'],
    Thinking: ['Planning', 'WaitingUser', 'Idle', 'Interrupted'],
    Planning: ['Executing', 'Thinking', 'Interrupted'],
    Executing: ['WaitingTool', 'WaitingUser', 'Recovering', 'Summarizing', 'Interrupted', 'Failed'],
    WaitingTool: ['Executing', 'Interrupted', 'Failed'],
    WaitingUser: ['Thinking', 'Interrupted'],
    Recovering: ['Executing', 'Thinking', 'Failed', 'Interrupted'],
    Summarizing: ['Speaking', 'Interrupted'],
    Speaking: ['Completed', 'Interrupted', 'Idle'],
    Completed: ['Idle'],
    Failed: ['Idle'],
    Interrupted: ['Idle'],
  };

  private constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): AgentStateMachine {
    if (!AgentStateMachine.instance) {
      AgentStateMachine.instance = new AgentStateMachine();
    }
    return AgentStateMachine.instance;
  }

  /**
   * الحصول على الحالة الحالية
   */
  public getCurrentState(): AgentState {
    return this.currentState;
  }

  /**
   * تغيير الحالة بشكل آمن
   */
  public transitionTo(nextState: AgentState, reason?: string): void {
    const allowed = this.allowedTransitions[this.currentState];
    
    if (!allowed.includes(nextState)) {
      console.warn(
        `[StateMachine] ⚠️ Invalid state transition attempted: ${this.currentState} -> ${nextState}. Allowed transitions: ${allowed.join(', ')}`
      );
      // في بيئة التطوير قد نريد رمي خطأ أو السماح به كتحذير لتجنب انهيار التطبيق
    }

    const previousState = this.currentState;
    this.currentState = nextState;

    if (__DEV__) {
      console.log(`[StateMachine] 🔄 State Changed: ${previousState} ➔ ${nextState} ${reason ? `(${reason})` : ''}`);
    }

    // نشر الحدث
    this.eventBus.publish({
      id: `evt_sm_${Date.now()}`,
      type: 'AGENT_STATE_CHANGED',
      timestamp: Date.now(),
      payload: { previousState, currentState: nextState, reason },
      metadata: {
        sessionId: 'default',
        correlationId: `corr_${Date.now()}`,
        actor: 'SYSTEM',
      },
    });
  }

  /**
   * إعادة ضبط آلة الحالة
   */
  public reset(): void {
    this.currentState = 'Idle';
  }
}
