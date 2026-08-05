import { ISemanticMemory } from '../core/types';

export class SemanticMemory implements ISemanticMemory {
  // علاقات مفاهيمية ثابتة كمخزن معرفي افتراضي للمنصة
  private conceptMap: Map<string, string[]> = new Map([
    // عناية بالبشرة
    ['serum', ['يُوضع بعد التونر وقبل الكريم المرطب', 'يحتاج واقي شمس إذا استُخدم نهاراً', 'عناية مركزة']],
    ['toner', ['يُهون البشرة ويُوضع مباشرة بعد الغسول', 'يُوازن حموضة البشرة']],
    ['cleanser', ['الخطوة الأولى في أي روتين عناية', 'ينظف المسام من الدهون']],
    ['sunscreen', ['يُوضع في نهاية الروتين الصباحي', 'يحمي من التصبغات والتجاعيد']],
    ['moisturizer', ['يُرطب البشرة ويُثبت المكونات النشطة', 'يُستخدم صباحاً ومساءً']],
    
    // أنواع البشرة وعلاقاتها
    ['oily_skin', ['تحتاج منتجات خفيفة وقائمة على الماء (Water-based)', 'جل غسول مناسب لها', 'الابتعاد عن الزيوت الثقيلة']],
    ['dry_skin', ['تحتاج مرطبات غنية بالزيوت وحمض الهيالورونيك', 'كريمات مرطبة سميكة']],
    ['sensitive_skin', ['تجنب المنتجات التي تحتوي على عطور كحولية', 'استخدام مكونات مهدئة مثل السنتيلا والبابونج']]
  ]);

  /**
   * الاستعلام عن العلاقات والمفاهيم المرتبطة بمصطلح معين
   */
  public async query(concept: string): Promise<string[]> {
    const key = concept.toLowerCase().trim();
    // محاولة إيجاد تطابق تقريبي في الكلمات المفتاحية
    for (const [k, values] of this.conceptMap.entries()) {
      if (key.includes(k) || k.includes(key)) {
        return values;
      }
    }
    return [];
  }

  /**
   * إضافة مفهوم معرفي جديد ديناميكياً
   */
  public addConcept(concept: string, relations: string[]): void {
    const key = concept.toLowerCase().trim();
    const existing = this.conceptMap.get(key) || [];
    this.conceptMap.set(key, Array.from(new Set([...existing, ...relations])));
  }
}
