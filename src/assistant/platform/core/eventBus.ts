import { AgentEvent, AgentEventType } from './types';

export type EventSubscriberCallback = (event: AgentEvent) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private subscribers: Map<string, { eventType: string; callback: EventSubscriberCallback }> = new Map();
  private eventHistory: AgentEvent[] = [];
  private subscriptionIdCounter = 0;

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * نشر حدث جديد في المنصة وإخطار جميع المشتركين المهتمين
   */
  public publish(event: AgentEvent): void {
    // 1. تسجيل الحدث في السجل التاريخي (Event Sourcing)
    this.eventHistory.push(event);

    if (__DEV__) {
      console.log(`[EventBus] 📢 Event Published: ${event.type} (Actor: ${event.metadata.actor})`);
    }

    // 2. إخطار المشتركين
    this.subscribers.forEach((sub) => {
      if (sub.eventType === '*' || sub.eventType === event.type) {
        try {
          const result = sub.callback(event);
          if (result instanceof Promise) {
            result.catch((err) => {
              console.error(`[EventBus] Error in async subscriber callback for event ${event.type}:`, err);
            });
          }
        } catch (err) {
          console.error(`[EventBus] Error in subscriber callback for event ${event.type}:`, err);
        }
      }
    });
  }

  /**
   * الاشتراك في أحداث محددة
   */
  public subscribe(eventType: AgentEventType | '*', callback: EventSubscriberCallback): string {
    this.subscriptionIdCounter++;
    const subscriptionId = `sub_${this.subscriptionIdCounter}`;
    this.subscribers.set(subscriptionId, { eventType, callback });
    return subscriptionId;
  }

  /**
   * إلغاء الاشتراك
   */
  public unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
  }

  /**
   * استعادة تاريخ الأحداث مع إمكانية الفلترة بواسطة correlationId
   */
  public getHistory(correlationId?: string): AgentEvent[] {
    if (correlationId) {
      return this.eventHistory.filter((e) => e.metadata.correlationId === correlationId);
    }
    return [...this.eventHistory];
  }

  /**
   * إعادة تشغيل الأحداث لمحاكاة أو تصحيح الأخطاء (Time-Travel / Replay)
   */
  public async replay(events: AgentEvent[]): Promise<void> {
    if (__DEV__) {
      console.log(`[EventBus] 🔄 Starting Replay of ${events.length} events...`);
    }
    // نقوم بنسخ المشتركين مؤقتاً لتجنب المشاكل أثناء تكرار الأحداث
    for (const event of events) {
      this.publish(event);
      // محاكاة تأخير بسيط بين الأحداث لجعل الإعادة واقعية في بيئة الاختبار
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * تفريغ السجل (مفيد في الاختبارات)
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }
}
