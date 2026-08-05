import { WorldState, UserProfile, ApplicationState, Goal } from './types';
import { EventBus } from './eventBus';

export class WorldStateManager {
  private static instance: WorldStateManager;
  private state: WorldState;
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.state = this.getInitialState();
  }

  public static getInstance(): WorldStateManager {
    if (!WorldStateManager.instance) {
      WorldStateManager.instance = new WorldStateManager();
    }
    return WorldStateManager.instance;
  }

  private getInitialState(): WorldState {
    return {
      timestamp: Date.now(),
      user: {
        id: null,
        isAuthenticated: false,
        preferences: {},
      },
      app: {
        currentScreen: 'Home',
        screenElements: {},
        navigationHistory: [],
      },
      domain: {
        cart: { items: [] },
        favorites: { items: [] },
      },
      activeGoals: [],
      runningTools: {},
      temporaryData: {},
      lastEventId: '',
    };
  }

  /**
   * الحصول على نسخة غير قابلة للتعديل من الحالة الحالية (Immutable State Read)
   */
  public getState(): Readonly<WorldState> {
    return this.state;
  }

  /**
   * تحديث الحالة الكلية أو الجزئية بطريقة آمنة
   */
  public updateState(updater: (state: WorldState) => void, triggerEvent = true): void {
    // استنساخ عميق مبسط للحفاظ على عدم التغيير المباشر (Immutability)
    const clone: WorldState = JSON.parse(JSON.stringify(this.state));
    updater(clone);
    clone.timestamp = Date.now();
    
    this.state = Object.freeze(clone);

    if (triggerEvent) {
      this.eventBus.publish({
        id: `evt_ws_${Date.now()}`,
        type: 'AGENT_STATE_CHANGED',
        timestamp: Date.now(),
        payload: { stateSummary: this.getStateSummary() },
        metadata: {
          sessionId: 'default',
          correlationId: `corr_${Date.now()}`,
          actor: 'SYSTEM',
        },
      });
    }
  }

  /**
   * تحديث سياق المستخدم الحالي
   */
  public updateUser(user: Partial<UserProfile>): void {
    this.updateState((state) => {
      state.user = { ...state.user, ...user };
    });
  }

  /**
   * تحديث سياق التطبيق (الشاشة الحالية والعناصر التفاعلية)
   */
  public updateApp(app: Partial<ApplicationState>): void {
    this.updateState((state) => {
      if (app.currentScreen && app.currentScreen !== state.app.currentScreen) {
        state.app.navigationHistory.push(state.app.currentScreen);
      }
      state.app = { ...state.app, ...app };
    });
  }

  /**
   * تحديث بيانات المجال (السلة، المفضلة، إلخ)
   */
  public updateDomain(key: string, data: any): void {
    this.updateState((state) => {
      state.domain[key] = data;
    });
  }

  /**
   * تحديث قائمة الأهداف الحالية للوكيل
   */
  public updateActiveGoals(goals: Goal[]): void {
    this.updateState((state) => {
      state.activeGoals = goals;
    });
  }

  /**
   * تسجيل أو تحديث حالة أداة جارية
   */
  public updateToolStatus(toolName: string, status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED', lastOutput?: any): void {
    this.updateState((state) => {
      state.runningTools[toolName] = { status, lastOutput };
    });
  }

  /**
   * تحديث البيانات المؤقتة الناتجة من خطوات الخطط
   */
  public updateTemporaryData(key: string, value: any): void {
    this.updateState((state) => {
      state.temporaryData[key] = value;
    });
  }

  /**
   * مسح البيانات المؤقتة
   */
  public clearTemporaryData(): void {
    this.updateState((state) => {
      state.temporaryData = {};
    });
  }

  /**
   * تصفير كامل للحالة (إعادة تعيين الجلسة)
   */
  public reset(): void {
    this.state = this.getInitialState();
  }

  private getStateSummary(): string {
    return `Screen: ${this.state.app.currentScreen}, Active Goals: ${this.state.activeGoals.length}, Cart Items: ${this.state.domain.cart?.items?.length || 0}`;
  }
}
