import { BaseTool } from '../../../platform/tools/baseTool';
import { ToolDefinition, WorldState } from '../../../platform/core/types';
import { EventBus } from '../../../platform/core/eventBus';

export class CartManagementTool extends BaseTool {
  private eventBus: EventBus;

  constructor() {
    super();
    this.eventBus = EventBus.getInstance();
  }

  public definition: ToolDefinition = {
    name: 'cart_management',
    description: 'إدارة سلة المشتريات (إضافة منتج، إضافة منتجات متعددة، حذف، تفريغ السلة).',
    parameters: [
      {
        name: 'action',
        type: 'string',
        description: 'نوع الإجراء المطلق (add, add_multiple, remove, clear)',
        required: true,
        enum: ['add', 'add_multiple', 'remove', 'clear'],
      },
      {
        name: 'productId',
        type: 'string',
        description: 'معرف المنتج المطلوب إضافته أو حذفه',
        required: false,
      },
      {
        name: 'productIds',
        type: 'array',
        description: 'قائمة بمعرفات المنتجات للإضافة المتعددة',
        required: false,
      }
    ],
    outputSchema: {
      type: 'object',
      description: 'حالة العملية وتقرير السلة المعدلة',
    },
  };

  public async execute(
    params: { action: 'add' | 'add_multiple' | 'remove' | 'clear'; productId?: string; productIds?: string[] },
    context: { worldState: WorldState }
  ): Promise<any> {
    this.validateParams(params);
    const { action, productId, productIds } = params;

    if (__DEV__) {
      console.log(`[CartManagementTool] 🛒 Executing Cart Action: "${action}"`);
    }

    // نشر حدث السلة على ناقل الأحداث لتلتقطه طبقة React وتقوم بالتعديل الفعلي
    this.eventBus.publish({
      id: `evt_cart_action_${Date.now()}`,
      type: 'STEP_COMPLETED', // نرفع الحدث كتأكيد اكتمال الخطوة مع الـ Payload لتنفيذه في React
      timestamp: Date.now(),
      payload: {
        domain: 'shopping',
        type: 'cart',
        action,
        productId,
        productIds,
      },
      metadata: {
        sessionId: 'default',
        correlationId: `corr_${Date.now()}`,
        actor: 'SYSTEM',
      },
    });

    return { success: true, action, message: `Cart action "${action}" dispatched successfully.` };
  }
}
