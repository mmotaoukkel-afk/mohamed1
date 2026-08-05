import { BaseTool } from '../../../platform/tools/baseTool';
import { ToolDefinition, WorldState } from '../../../platform/core/types';
let api: any;
try {
  api = require('../../../../services/api').default;
} catch (e) {
  api = {
    searchProducts: async (query: string) => [
      { id: 'prod_1', name: 'غسول CeraVe', category: 'cleanser', price: 120 },
      { id: 'prod_2', name: 'مرطب La Roche-Posay Effaclar', category: 'moisturizer', price: 200 }
    ],
    getProduct: async (id: string) => ({ id, name: `Product ${id}`, price: 150 })
  };
}

export class SearchProductsTool extends BaseTool {
  public definition: ToolDefinition = {
    name: 'search_products',
    description: 'البحث في كتالوج المنتجات بناءً على الاسم أو الفئة أو مرادفات نوع البشرة.',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'الكلمة المفتاحية للبحث عن المنتج',
        required: true,
      },
      {
        name: 'category',
        type: 'string',
        description: 'الفئة المستهدفة للبحث (مثال: cleanser, moisturizer)',
        required: false,
      }
    ],
    outputSchema: {
      type: 'array',
      description: 'قائمة بالمنتجات المطابقة',
    },
  };

  public async execute(
    params: { query: string; category?: string },
    context: { worldState: WorldState }
  ): Promise<any> {
    this.validateParams(params);
    const { query, category } = params;

    if (__DEV__) {
      console.log(`[SearchProductsTool] 🔍 Searching for products matching: "${query}" ${category ? `in category: "${category}"` : ''}`);
    }

    try {
      // استدعاء الـ API الحقيقي للمتجر للبحث عن المنتجات
      const results = await api.searchProducts(query, 1, 5);
      
      if (category) {
        // فلترة النتائج حسب الفئة للتأكد من الملاءمة
        return results.filter((p: any) => 
          p.category?.toLowerCase() === category.toLowerCase() || 
          p.categories?.some((c: any) => c.name?.toLowerCase() === category.toLowerCase())
        );
      }

      return results;
    } catch (e) {
      console.error('[SearchProductsTool] API Error:', e);
      throw new Error('تعذر جلب المنتجات من السيرفر حالياً.');
    }
  }
}
