import { IEpisodicMemory, Episode, EpisodeFilter } from '../core/types';
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

export class EpisodicMemory implements IEpisodicMemory {
  private STORAGE_KEY = '@kataraa_agent_episodic_memory';
  private episodes: Episode[] = [];

  constructor() {
    this.loadEpisodes();
  }

  private async loadEpisodes(): Promise<void> {
    try {
      const data = await storage.getItem(this.STORAGE_KEY);
      if (data && Array.isArray(data)) {
        this.episodes = data;
      }
    } catch (e) {
      console.error('[EpisodicMemory] Failed to load episodes from storage:', e);
    }
  }

  private async saveEpisodes(): Promise<void> {
    try {
      await storage.setItem(this.STORAGE_KEY, this.episodes);
    } catch (e) {
      console.error('[EpisodicMemory] Failed to save episodes to storage:', e);
    }
  }

  /**
   * تسجيل تجربة أو حدث جديد
   */
  public async recordEpisode(episode: Episode): Promise<void> {
    this.episodes.push(episode);
    // الاحتفاظ بحد أقصى من التجارب التاريخية لتجنب تضخم الملف (مثال: آخر 100 حدث رئيسي)
    if (this.episodes.length > 100) {
      this.episodes.shift();
    }
    await this.saveEpisodes();
  }

  /**
   * استرجاع التجارب السابقة المصنفة بفلتر محدد
   */
  public async recallEpisodes(filter: EpisodeFilter): Promise<Episode[]> {
    return this.episodes.filter((ep) => {
      // فلترة بواسطة اسم العلامة التجارية أو تفاصيل الكيانات
      if (filter.productBrand) {
        const brand = filter.productBrand.toLowerCase();
        const hasBrand = ep.entities.brand && ep.entities.brand.toLowerCase() === brand;
        const nameHasBrand = ep.entities.productName && ep.entities.productName.toLowerCase().includes(brand);
        if (!hasBrand && !nameHasBrand) return false;
      }

      // فلترة بواسطة نوع الإجراء (شراء، إضافة، تقييم)
      if (filter.action && ep.action !== filter.action) {
        return false;
      }

      // فلترة بالنطاق الزمني
      if (filter.dateRange) {
        if (ep.timestamp < filter.dateRange.from || ep.timestamp > filter.dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * مسح ذاكرة الأحداث بالكامل
   */
  public async clearEpisodes(): Promise<void> {
    this.episodes = [];
    await this.saveEpisodes();
  }
}
