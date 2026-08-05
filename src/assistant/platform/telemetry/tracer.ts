import { EventBus } from '../core/eventBus';
import { AgentEvent } from '../core/types';

export class Tracer {
  private static instance: Tracer;
  private eventBus: EventBus;
  private logs: string[] = [];
  private stepTimers: Map<string, number> = new Map();

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.initializeSubscription();
  }

  public static getInstance(): Tracer {
    if (!Tracer.instance) {
      Tracer.instance = new Tracer();
    }
    return Tracer.instance;
  }

  private initializeSubscription(): void {
    // الاشتراك في جميع أحداث المنصة لمراقبتها وحفظ تقارير Telemetry
    this.eventBus.subscribe('*', (event) => {
      this.logEvent(event);
      this.processMetrics(event);
    });
  }

  private logEvent(event: AgentEvent): void {
    const timestampStr = new Date(event.timestamp).toISOString();
    const logMsg = `[Telemetry] [${timestampStr}] [${event.type}] (Correlation: ${event.metadata.correlationId}) - Payload: ${JSON.stringify(event.payload)}`;
    
    this.logs.push(logMsg);

    // الاحتفاظ بآخر 500 سجل فقط في الذاكرة لتفادي تراكم استهلاك الذاكرة
    if (this.logs.length > 500) {
      this.logs.shift();
    }
  }

  private processMetrics(event: AgentEvent): void {
    const { correlationId } = event.metadata;

    if (event.type === 'STEP_STARTED') {
      const stepId = event.payload.stepId;
      this.stepTimers.set(`${correlationId}_${stepId}`, Date.now());
    }

    if (event.type === 'STEP_COMPLETED' || event.type === 'STEP_FAILED') {
      const stepId = event.payload.stepId;
      const key = `${correlationId}_${stepId}`;
      const startTime = this.stepTimers.get(key);
      
      if (startTime) {
        const duration = Date.now() - startTime;
        this.stepTimers.delete(key);
        if (__DEV__) {
          console.log(`[Telemetry Metrics] ⏱️ Step "${event.payload.stepName}" finished in ${duration}ms (Status: ${event.type === 'STEP_COMPLETED' ? 'SUCCESS' : 'FAILED'})`);
        }
      }
    }
  }

  /**
   * جلب سجل التحليلات بالكامل
   */
  public getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * مسح السجلات
   */
  public clearLogs(): void {
    this.logs = [];
  }
}
