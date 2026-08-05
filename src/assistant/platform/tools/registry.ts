import { ITool, ToolDefinition } from '../core/types';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ITool> = new Map();

  private constructor() {}

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * تسجيل أداة جديدة (دعم الـ Hot Tool Registration)
   */
  public register(tool: ITool): void {
    const name = tool.definition.name;
    if (this.tools.has(name)) {
      console.warn(`[ToolRegistry] ⚠️ Tool with name "${name}" is already registered. Overwriting...`);
    }
    this.tools.set(name, tool);
    if (__DEV__) {
      console.log(`[ToolRegistry] 🔧 Tool Registered: ${name}`);
    }
  }

  /**
   * إلغاء تسجيل أداة
   */
  public unregister(name: string): void {
    if (this.tools.delete(name) && __DEV__) {
      console.log(`[ToolRegistry] 🗑️ Tool Unregistered: ${name}`);
    }
  }

  /**
   * جلب أداة معينة بواسطة اسمها
   */
  public resolve(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * الحصول على قائمة بجميع تعريفات الأدوات المسجلة
   */
  public listTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /**
   * مسح جميع الأدوات المسجلة
   */
  public clear(): void {
    this.tools.clear();
  }
}
