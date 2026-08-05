import { Goal, GoalStatus, GoalPriority, GoalConflict } from '../core/types';
import { EventBus } from '../core/eventBus';

export class GoalManager {
  private static instance: GoalManager;
  private queue: Goal[] = [];
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): GoalManager {
    if (!GoalManager.instance) {
      GoalManager.instance = new GoalManager();
    }
    return GoalManager.instance;
  }

  /**
   * إضافة هدف جديد لقائمة الانتظار (Queue) وحل التعارضات إن وجدت
   */
  public enqueue(goal: Goal): void {
    // 1. كشف التعارضات مسبقاً
    const conflicts = this.detectConflicts(goal);
    
    if (conflicts.length > 0) {
      this.eventBus.publish({
        id: `evt_gm_conflict_${Date.now()}`,
        type: 'GOAL_CONFLICT_DETECTED',
        timestamp: Date.now(),
        payload: { goal, conflicts },
        metadata: {
          sessionId: 'default',
          correlationId: `corr_${Date.now()}`,
          actor: 'SYSTEM',
        },
      });

      // حل التعارض بناءً على الاستراتيجية
      const resolution = conflicts[0].resolution;
      if (resolution === 'CANCEL_A') {
        // إلغاء الهدف الجديد
        goal.status = 'CANCELLED';
        if (__DEV__) console.log(`[GoalManager] 🚫 Goal "${goal.description}" cancelled due to conflict.`);
        return;
      } else if (resolution === 'CANCEL_B') {
        // إلغاء الهدف القديم المتعارض
        this.cancel(conflicts[0].goalB.id, 'Cancelled due to conflict with higher priority goal.');
      } else if (resolution === 'MERGE') {
        // دمج الهدفين
        this.merge(conflicts[0].goalB.id, goal.id);
        return;
      }
    }

    // 2. إدراج الهدف الجديد في القائمة
    this.queue.push(goal);
    
    this.eventBus.publish({
      id: `evt_gm_enq_${Date.now()}`,
      type: 'GOAL_ENQUEUED',
      timestamp: Date.now(),
      payload: { goal },
      metadata: {
        sessionId: 'default',
        correlationId: `corr_${Date.now()}`,
        actor: 'USER',
      },
    });

    // 3. ترتيب القائمة بناءً على الأولوية والتاريخ
    this.sortQueue();

    // 4. إذا لم يكن هناك هدف نشط، يتم تنشيط الهدف الأعلى أولوية فوراً
    if (!this.getActiveGoal()) {
      this.activateNext();
    }
  }

  /**
   * جلب الهدف النشط الحالي
   */
  public getActiveGoal(): Goal | undefined {
    return this.queue.find((g) => g.status === 'ACTIVE');
  }

  /**
   * تنشيط الهدف التالي ذي الأولوية الأعلى
   */
  public activateNext(): Goal | undefined {
    const active = this.getActiveGoal();
    if (active) return active;

    const next = this.queue.find((g) => g.status === 'QUEUED');
    if (next) {
      next.status = 'ACTIVE';
      this.eventBus.publish({
        id: `evt_gm_act_${Date.now()}`,
        type: 'GOAL_ACTIVATED',
        timestamp: Date.now(),
        payload: { goal: next },
        metadata: {
          sessionId: 'default',
          correlationId: `corr_${Date.now()}`,
          actor: 'SYSTEM',
        },
      });
      return next;
    }
    return undefined;
  }

  /**
   * إلغاء هدف محدد وتوثيق السبب
   */
  public cancel(goalId: string, reason: string): void {
    const goal = this.queue.find((g) => g.id === goalId);
    if (goal) {
      goal.status = 'CANCELLED';
      this.eventBus.publish({
        id: `evt_gm_can_${Date.now()}`,
        type: 'GOAL_CANCELLED',
        timestamp: Date.now(),
        payload: { goalId, reason },
        metadata: {
          sessionId: 'default',
          correlationId: `corr_${Date.now()}`,
          actor: 'SYSTEM',
        },
      });
      // تنشيط الهدف التالي
      this.activateNext();
    }
  }

  /**
   * كشف وجود تعارضات بين الهدف الجديد والأهداف الحالية في النظام
   */
  public detectConflicts(newGoal: Goal): GoalConflict[] {
    const conflicts: GoalConflict[] = [];

    this.queue.forEach((existingGoal) => {
      if (existingGoal.status !== 'ACTIVE' && existingGoal.status !== 'QUEUED') {
        return;
      }

      // مثال لقاعدة تعارض: تفريغ السلة يتعارض مع إضافة عناصر للسلة
      const isClearCart = newGoal.description.includes('فرغ') || newGoal.description.includes('clear') || newGoal.description.includes('empty');
      const isAddCart = existingGoal.description.includes('ضيف') || existingGoal.description.includes('add') || existingGoal.description.includes('سلة');

      if (isClearCart && isAddCart) {
        // تفريغ السلة له أولوية إلغاء الإضافات المعلقة
        conflicts.push({
          goalA: newGoal,
          goalB: existingGoal,
          reason: 'Clearing the cart conflicts with pending items to add.',
          resolution: 'CANCEL_B',
        });
      }
    });

    return conflicts;
  }

  /**
   * دمج هدفين متكاملين (Merge)
   */
  public merge(goalIdA: string, goalIdB: string): Goal {
    const goalA = this.queue.find((g) => g.id === goalIdA)!;
    const goalB = this.queue.find((g) => g.id === goalIdB)!;

    goalA.description = `${goalA.description} + ${goalB.description}`;
    goalB.status = 'COMPLETED'; // تعليم الهدف الثاني كمكتمل مدمج

    if (__DEV__) {
      console.log(`[GoalManager] 🔀 Goals Merged: ${goalIdA} and ${goalIdB}`);
    }

    return goalA;
  }

  /**
   * جلب الأهداف الموجودة في قائمة الانتظار
   */
  public getQueue(): Goal[] {
    return [...this.queue];
  }

  /**
   * تفريغ قائمة الأهداف بالكامل
   */
  public clear(): void {
    this.queue = [];
  }

  private sortQueue(): void {
    const priorityWeight: Record<GoalPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    };

    this.queue.sort((a, b) => {
      // 1. الترتيب حسب الوزن المخصص للأولوية
      const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (weightDiff !== 0) return weightDiff;
      // 2. الترتيب حسب وقت الإنشاء (الأقدم أولاً في حال تساوي الأولويات)
      return a.createdAt - b.createdAt;
    });
  }
}
