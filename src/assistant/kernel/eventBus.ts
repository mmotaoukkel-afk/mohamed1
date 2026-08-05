import { IEventBus } from '../sdk/contracts/ISkillContext';

export interface SystemEvent {
  id: string;
  topic: string;
  payload: any;
  timestamp: number;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  origin: string;
}

export type SubscriberCallback = (event: SystemEvent) => void;
export type SubscriberFilter = (event: SystemEvent) => boolean;

interface Subscription {
  id: string;
  topic: string;
  callback: SubscriberCallback;
  filter?: SubscriberFilter;
}

export class EventBus implements IEventBus {
  private static instance: EventBus;
  private subscriptions: Map<string, Subscription[]> = new Map();
  private subscriptionMap: Map<string, string> = new Map(); // subId -> topic
  private eventHistory: SystemEvent[] = [];
  private maxHistorySize = 1000;

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Reset instance for clean testing
   */
  public static resetInstance(): void {
    EventBus.instance = new EventBus();
  }

  /**
   * Scopes the event bus for a specific skill, providing the ISkillContext-compatible interface.
   */
  public getScopedInterface(skillId: string) {
    const self = this;
    return {
      publish(topic: string, payload: any, priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'): void {
        self.publish({
          id: `${skillId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          topic,
          payload,
          timestamp: Date.now(),
          priority: priority || 'NORMAL',
          origin: skillId,
        });
      },
      subscribe(
        topic: string,
        callback: (event: any) => void,
        filter?: (event: any) => boolean
      ): string {
        const outerCallback = (evt: SystemEvent) => callback(evt.payload);
        const outerFilter = filter ? (evt: SystemEvent) => filter(evt.payload) : undefined;
        return self.subscribe(topic, outerCallback, outerFilter);
      },
      unsubscribe(subscriptionId: string): void {
        self.unsubscribe(subscriptionId);
      },
    };
  }

  /**
   * Publish an event. Critical events are processed immediately; lower priority ones
   * are dispatched asynchronously (simulating queue scheduler yielding).
   */
  public publish(event: SystemEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const subs = this.subscriptions.get(event.topic) || [];
    const matchedSubs = subs.filter((sub) => !sub.filter || sub.filter(event));

    if (event.priority === 'CRITICAL') {
      // Execute immediately (blocking)
      for (const sub of matchedSubs) {
        try {
          sub.callback(event);
        } catch (err) {
          console.error(`[EventBus] Error in critical subscriber callback for topic ${event.topic}:`, err);
        }
      }
    } else {
      // Queue for asynchronous dispatch to prevent event-loop blockages
      // Priority determines how fast it runs (represented by microtask vs macro-task)
      const delay = event.priority === 'HIGH' ? 0 : event.priority === 'NORMAL' ? 1 : 10;
      
      setTimeout(() => {
        for (const sub of matchedSubs) {
          try {
            sub.callback(event);
          } catch (err) {
            console.error(`[EventBus] Error in async subscriber callback for topic ${event.topic}:`, err);
          }
        }
      }, delay);
    }
  }

  public subscribe(
    topic: string,
    callback: SubscriberCallback,
    filter?: SubscriberFilter
  ): string {
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSub: Subscription = { id: subId, topic, callback, filter };

    const list = this.subscriptions.get(topic) || [];
    list.push(newSub);
    this.subscriptions.set(topic, list);
    this.subscriptionMap.set(subId, topic);

    return subId;
  }

  public unsubscribe(subscriptionId: string): void {
    const topic = this.subscriptionMap.get(subscriptionId);
    if (!topic) return;

    const list = this.subscriptions.get(topic) || [];
    const updated = list.filter((sub) => sub.id !== subscriptionId);
    
    if (updated.length === 0) {
      this.subscriptions.delete(topic);
    } else {
      this.subscriptions.set(topic, updated);
    }
    this.subscriptionMap.delete(subscriptionId);
  }

  public getHistory(): SystemEvent[] {
    return [...this.eventHistory];
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }
}
