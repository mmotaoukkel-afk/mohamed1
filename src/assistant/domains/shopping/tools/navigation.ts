import { BaseTool } from '../../../platform/tools/baseTool';
import { ToolDefinition, WorldState } from '../../../platform/core/types';
import { EventBus } from '../../../platform/core/eventBus';

export class NavigationTool extends BaseTool {
  private eventBus: EventBus;

  constructor() {
    super();
    this.eventBus = EventBus.getInstance();
  }

  public definition: ToolDefinition = {
    name: 'navigation',
    description: 'التنقل بين شاشات التطبيق المختلفة (الرئيسية، السلة، المفضلة، المنتجات).',
    parameters: [
      {
        name: 'screen',
        type: 'string',
        description: 'اسم الشاشة المستهدفة للتنقل (Home, Cart, Favorites, Products)',
        required: true,
        enum: ['Home', 'Cart', 'Favorites', 'Products'],
      }
    ],
    outputSchema: {
      type: 'object',
      description: 'حالة التنقل وتأكيد الانتقال للشاشة',
    },
  };

  public async execute(
    params: { screen: string },
    context: { worldState: WorldState }
  ): Promise<any> {
    this.validateParams(params);
    const { screen } = params;

    if (__DEV__) {
      console.log(`[NavigationTool] 🧭 Navigating to screen: "${screen}"`);
    }

    // نشر حدث التنقل ليتم التقاطه في سياق React واستدعاء الـ Router
    this.eventBus.publish({
      id: `evt_nav_action_${Date.now()}`,
      type: 'STEP_COMPLETED',
      timestamp: Date.now(),
      payload: {
        domain: 'shopping',
        type: 'navigation',
        screen,
      },
      metadata: {
        sessionId: 'default',
        correlationId: `corr_${Date.now()}`,
        actor: 'SYSTEM',
      },
    });

    return { success: true, screen, message: `Navigation to screen "${screen}" dispatched successfully.` };
  }
}
