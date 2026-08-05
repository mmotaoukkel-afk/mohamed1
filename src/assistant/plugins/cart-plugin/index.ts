import { ISkill } from '../../sdk/contracts/ISkill';
import { ISkillContext } from '../../sdk/contracts/ISkillContext';
import { ISkillManifest } from '../../sdk/contracts/types';

export class CartPlugin implements ISkill {
  manifest: ISkillManifest = {
    id: 'org.kataraa.cart',
    name: 'Cart Management',
    version: '1.0.0',
    description: 'إدارة سلة المشتريات: إضافة، حذف، تفريغ، إضافة متعددة.',
    author: 'Kataraa Team',
    compatibility: { coreVersion: '^1.0.0', platform: ['node', 'react-native', 'browser'] },
    dependencies: {},
    permissions: { required: ['STORAGE'], optional: [] },
    capabilities: [
      {
        name: 'CartCapability',
        description: 'القدرة على إدارة سلة المشتريات',
        tools: ['cart_add', 'cart_remove', 'cart_clear'],
      },
    ],
    tools: [
      {
        name: 'cart_add',
        description: 'إضافة منتج أو عدة منتجات إلى السلة.',
        inputSchema: {
          productId: { type: 'string', required: false },
          productIds: { type: 'array', required: false },
        },
      },
      {
        name: 'cart_remove',
        description: 'حذف منتج محدد من السلة.',
        inputSchema: { productId: { type: 'string', required: true } },
      },
      {
        name: 'cart_clear',
        description: 'تفريغ السلة بالكامل.',
        inputSchema: {},
      },
    ],
  };

  private context!: ISkillContext;

  async initialize(context: ISkillContext): Promise<void> {
    this.context = context;
    this.context.logger.info('CartPlugin initialized.');
  }

  async activate(): Promise<void> {
    this.context.logger.info('CartPlugin activated.');
  }

  async deactivate(): Promise<void> {
    this.context.logger.info('CartPlugin deactivated.');
  }

  async terminate(): Promise<void> {
    this.context.logger.info('CartPlugin terminated.');
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<Record<string, any>> {
    switch (toolName) {
      case 'cart_add': {
        const { productId, productIds } = args;
        const ids = productIds || (productId ? [productId] : []);
        this.context.logger.info(`Adding ${ids.length} item(s) to cart.`);

        this.context.eventBus.publish('cart.action', {
          action: ids.length > 1 ? 'add_multiple' : 'add',
          productId,
          productIds: ids,
        });

        return { success: true, action: 'add', count: ids.length };
      }

      case 'cart_remove': {
        const { productId } = args;
        this.context.logger.info(`Removing item ${productId} from cart.`);

        this.context.eventBus.publish('cart.action', {
          action: 'remove',
          productId,
        });

        return { success: true, action: 'remove', productId };
      }

      case 'cart_clear': {
        this.context.logger.info('Clearing entire cart.');

        this.context.eventBus.publish('cart.action', { action: 'clear' });

        return { success: true, action: 'clear' };
      }

      default:
        throw new Error(`CartPlugin: Unknown tool "${toolName}".`);
    }
  }
}
