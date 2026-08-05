import { ITool, ToolDefinition, WorldState } from '../core/types';

export abstract class BaseTool implements ITool {
  public abstract definition: ToolDefinition;

  /**
   * دالة التنفيذ الأساسية التي يجب على كل أداة تخصيصها وتطبيقها
   */
  public abstract execute(
    params: Record<string, any>,
    context: { worldState: WorldState }
  ): Promise<any>;

  /**
   * دالة مساعدة للتحقق من صحة المدخلات بناءً على الـ Schema المحددة في التعريف
   */
  protected validateParams(params: Record<string, any>): void {
    const { parameters } = this.definition;
    
    for (const param of parameters) {
      const value = params[param.name];
      
      // التحقق من الحقول الإلزامية
      if (param.required && (value === undefined || value === null)) {
        throw new Error(`[Tool Validation] Parameter "${param.name}" is required for tool "${this.definition.name}".`);
      }
      
      // التحقق من نوع البيانات البسيط
      if (value !== undefined && value !== null) {
        const valueType = typeof value;
        if (param.type === 'array' && !Array.isArray(value)) {
          throw new Error(`[Tool Validation] Parameter "${param.name}" must be an array.`);
        }
        if (param.type !== 'array' && param.type !== 'object' && valueType !== param.type) {
          throw new Error(`[Tool Validation] Parameter "${param.name}" must be of type "${param.type}". Got "${valueType}".`);
        }
      }
    }
  }
}
