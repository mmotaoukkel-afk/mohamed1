import { ILongTermMemory } from '../core/types';
let storage: any;
const isNodeTest = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNodeTest && !(global as any).Expo) {
  const inMemoryDb: Record<string, any> = {};
  storage = {
    getItem: async (key: string) => inMemoryDb[key] ?? null,
    setItem: async (key: string, value: any) => { inMemoryDb[key] = value; },
    removeItem: async (key: string) => { delete inMemoryDb[key]; },
    clear: async () => { for (const k in inMemoryDb) delete inMemoryDb[k]; }
  };
} else {
  try {
    storage = require('../../../utils/storage').storage;
  } catch (e) {
    const inMemoryDb: Record<string, any> = {};
    storage = {
      getItem: async (key: string) => inMemoryDb[key] ?? null,
      setItem: async (key: string, value: any) => { inMemoryDb[key] = value; },
      removeItem: async (key: string) => { delete inMemoryDb[key]; },
      clear: async () => { for (const k in inMemoryDb) delete inMemoryDb[k]; }
    };
  }
}

export class LongTermMemory implements ILongTermMemory {
  private STORAGE_KEY_PREFIX = '@kataraa_agent_ltm_';

  public async getUserPreference(key: string): Promise<any> {
    try {
      const fullKey = `${this.STORAGE_KEY_PREFIX}${key}`;
      return await storage.getItem(fullKey);
    } catch (e) {
      console.error(`[LongTermMemory] Error getting preference for ${key}:`, e);
      return null;
    }
  }

  public async setUserPreference(key: string, value: any): Promise<void> {
    try {
      const fullKey = `${this.STORAGE_KEY_PREFIX}${key}`;
      await storage.setItem(fullKey, value);
    } catch (e) {
      console.error(`[LongTermMemory] Error setting preference for ${key}:`, e);
    }
  }

  public async clearPreferences(): Promise<void> {
    // يمكن مسح تفضيلات الوكيل إذا طلب المستخدم ذلك
    try {
      const keys = await storage.getItem('user_profiles') || {};
      // مسح عناصر محددة تتطابق مع البادئة إذا كان التخزين يدعم التصفية،
      // أو نكتفي بتركها لحذفها الفردي
    } catch (e) {
      console.error('[LongTermMemory] Error clearing preferences:', e);
    }
  }
}
