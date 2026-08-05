import { CapabilityDefinition, WorldState, ITool } from '../core/types';
import { ToolRegistry } from '../tools/registry';

export class CapabilityEngine {
  private static instance: CapabilityEngine;
  private capabilities: Map<string, CapabilityDefinition> = new Map();
  private toolRegistry: ToolRegistry;

  private constructor() {
    this.toolRegistry = ToolRegistry.getInstance();
  }

  public static getInstance(): CapabilityEngine {
    if (!CapabilityEngine.instance) {
      CapabilityEngine.instance = new CapabilityEngine();
    }
    return CapabilityEngine.instance;
  }

  /**
   * تسجيل قدرة جديدة
   */
  public registerCapability(capability: CapabilityDefinition): void {
    const name = capability.name;
    this.capabilities.set(name, capability);
    if (__DEV__) {
      console.log(`[CapabilityEngine] 🌟 Capability Registered: ${name}`);
    }
  }

  /**
   * إلغاء تسجيل قدرة
   */
  public unregisterCapability(name: string): void {
    if (this.capabilities.delete(name) && __DEV__) {
      console.log(`[CapabilityEngine] 🗑️ Capability Unregistered: ${name}`);
    }
  }

  /**
   * البحث عن وحل القدرات المتوافقة مع هدف المستخدم والـ World State الحالي
   */
  public resolveCapabilities(goal: string, worldState: WorldState): CapabilityDefinition[] {
    const matched: CapabilityDefinition[] = [];
    const goalLower = goal.toLowerCase();

    this.capabilities.forEach((cap) => {
      // 1. التحقق من إتاحة القدرة بناءً على حالة العالم الحالية
      if (!cap.isAvailable(worldState)) {
        return;
      }

      // 2. مطابقة دلالية مبسطة للوصف والاسم مع الهدف
      const isMatch =
        goalLower.includes(cap.name.toLowerCase()) ||
        cap.description.toLowerCase().split(' ').some((word) => word.length > 3 && goalLower.includes(word));

      if (isMatch) {
        matched.push(cap);
      }
    });

    // إذا لم يتطابق شيء دلالياً، نرجع القدرات العامة المتاحة افتراضياً
    if (matched.length === 0) {
      return Array.from(this.capabilities.values()).filter((c) => c.isAvailable(worldState));
    }

    return matched;
  }

  /**
   * اختيار الأداة الأنسب لتنفيذ خطوة تحت قدرة معينة
   */
  public selectTool(
    capabilityName: string,
    stepAction: string,
    worldState: WorldState
  ): ITool {
    const capability = this.capabilities.get(capabilityName);
    if (!capability) {
      throw new Error(`[CapabilityEngine] Capability "${capabilityName}" is not registered.`);
    }

    // مطابقة الأداة الأنسب من قائمة الأدوات المرتبطة بالقدرة
    for (const toolName of capability.toolNames) {
      const tool = this.toolRegistry.resolve(toolName);
      if (!tool) continue;

      // مطابقة مبسطة بناءً على اسم الأداة والـ stepAction
      // مثال: إذا كان الـ action هو 'search' ونملك أداة باسم 'SearchProductsTool'
      const toolNameLower = tool.definition.name.toLowerCase();
      const actionLower = stepAction.toLowerCase();
      
      if (toolNameLower.includes(actionLower) || actionLower.includes(toolNameLower)) {
        return tool;
      }
    }

    // Fallback: إرجاع الأداة الأولى المسجلة في القدرة إذا لم يتطابق اسم الإجراء
    if (capability.toolNames.length > 0) {
      const fallbackTool = this.toolRegistry.resolve(capability.toolNames[0]);
      if (fallbackTool) return fallbackTool;
    }

    throw new Error(`[CapabilityEngine] No valid tools resolved for capability "${capabilityName}" and action "${stepAction}".`);
  }

  /**
   * مسح جميع القدرات
   */
  public clear(): void {
    this.capabilities.clear();
  }
}
