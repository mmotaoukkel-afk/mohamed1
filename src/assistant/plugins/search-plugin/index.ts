import { ISkill } from '../../sdk/contracts/ISkill';
import { ISkillContext } from '../../sdk/contracts/ISkillContext';
import { ISkillManifest } from '../../sdk/contracts/types';

let api: any;
try {
  api = require('../../../../services/api').default;
} catch (e) {
  api = {
    searchProducts: async (query: string) => [
      { id: 'prod_1', name: 'غسول CeraVe', category: 'cleanser', price: 120 },
      { id: 'prod_2', name: 'مرطب La Roche-Posay Effaclar', category: 'moisturizer', price: 200 },
    ],
  };
}

export class SearchPlugin implements ISkill {
  manifest: ISkillManifest = {
    id: 'org.kataraa.search',
    name: 'Product Search',
    version: '1.0.0',
    description: 'البحث في كتالوج المنتجات بناءً على الاسم أو الفئة أو مرادفات نوع البشرة.',
    author: 'Kataraa Team',
    compatibility: { coreVersion: '^1.0.0', platform: ['node', 'react-native', 'browser'] },
    dependencies: {},
    permissions: { required: ['NETWORK'], optional: ['STORAGE'] },
    capabilities: [
      {
        name: 'SearchCapability',
        description: 'القدرة على البحث عن المنتجات في الكتالوج',
        tools: ['search_products'],
      },
    ],
    tools: [
      {
        name: 'search_products',
        description: 'البحث في كتالوج المنتجات بناءً على الاسم أو الفئة.',
        inputSchema: {
          query: { type: 'string', required: true },
          category: { type: 'string', required: false },
        },
      },
    ],
  };

  private context!: ISkillContext;

  async initialize(context: ISkillContext): Promise<void> {
    this.context = context;
    this.context.logger.info('SearchPlugin initialized.');
  }

  async activate(): Promise<void> {
    this.context.logger.info('SearchPlugin activated.');
  }

  async deactivate(): Promise<void> {
    this.context.logger.info('SearchPlugin deactivated.');
  }

  async terminate(): Promise<void> {
    this.context.logger.info('SearchPlugin terminated.');
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<Record<string, any>> {
    if (toolName !== 'search_products') {
      throw new Error(`SearchPlugin: Unknown tool "${toolName}".`);
    }

    const { query, category } = args;
    this.context.logger.info(`Searching for: "${query}"${category ? ` in category: "${category}"` : ''}`);

    try {
      const results = await api.searchProducts(query, 1, 5);

      if (category) {
        const filtered = results.filter((p: any) =>
          p.category?.toLowerCase() === category.toLowerCase() ||
          p.categories?.some((c: any) => c.name?.toLowerCase() === category.toLowerCase())
        );
        return { items: filtered, count: filtered.length };
      }

      return { items: results, count: results.length };
    } catch (e: any) {
      this.context.logger.error('API Error during search.', e);
      throw new Error('تعذر جلب المنتجات من السيرفر حالياً.');
    }
  }
}
