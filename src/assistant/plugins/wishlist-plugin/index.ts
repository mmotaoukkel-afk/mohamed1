import { ISkill } from '../../sdk/contracts/ISkill';
import { ISkillContext } from '../../sdk/contracts/ISkillContext';
import { ISkillManifest } from '../../sdk/contracts/types';

export class WishlistPlugin implements ISkill {
  manifest: ISkillManifest = {
    id: 'org.kataraa.wishlist',
    name: 'Wishlist Management',
    version: '1.0.0',
    description: 'إدارة قائمة المفضلة: إضافة، حذف، عرض.',
    author: 'Kataraa Team',
    compatibility: { coreVersion: '^1.0.0', platform: ['node', 'react-native', 'browser'] },
    dependencies: {},
    permissions: { required: ['STORAGE'], optional: [] },
    capabilities: [
      {
        name: 'WishlistCapability',
        description: 'القدرة على إدارة قائمة المفضلة',
        tools: ['wishlist_add', 'wishlist_remove', 'wishlist_list'],
      },
    ],
    tools: [
      {
        name: 'wishlist_add',
        description: 'إضافة منتج إلى قائمة المفضلة.',
        inputSchema: { productId: { type: 'string', required: true } },
      },
      {
        name: 'wishlist_remove',
        description: 'حذف منتج من قائمة المفضلة.',
        inputSchema: { productId: { type: 'string', required: true } },
      },
      {
        name: 'wishlist_list',
        description: 'عرض جميع المنتجات في المفضلة.',
        inputSchema: {},
      },
    ],
  };

  private context!: ISkillContext;

  async initialize(context: ISkillContext): Promise<void> {
    this.context = context;
    // Load existing wishlist from scoped storage
    const stored = await this.context.storage.get('wishlist_items');
    if (!stored) {
      await this.context.storage.set('wishlist_items', []);
    }
    this.context.logger.info('WishlistPlugin initialized.');
  }

  async activate(): Promise<void> {
    this.context.logger.info('WishlistPlugin activated.');
  }

  async deactivate(): Promise<void> {
    this.context.logger.info('WishlistPlugin deactivated.');
  }

  async terminate(): Promise<void> {
    await this.context.storage.delete('wishlist_items');
    this.context.logger.info('WishlistPlugin terminated.');
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<Record<string, any>> {
    const items: string[] = (await this.context.storage.get('wishlist_items')) || [];

    switch (toolName) {
      case 'wishlist_add': {
        const { productId } = args;
        if (items.includes(productId)) {
          return { success: false, message: 'المنتج موجود بالفعل في المفضلة.' };
        }
        items.push(productId);
        await this.context.storage.set('wishlist_items', items);

        this.context.eventBus.publish('wishlist.action', { action: 'add', productId });
        this.context.logger.info(`Added ${productId} to wishlist.`);

        return { success: true, action: 'add', productId, totalItems: items.length };
      }

      case 'wishlist_remove': {
        const { productId } = args;
        const idx = items.indexOf(productId);
        if (idx === -1) {
          return { success: false, message: 'المنتج غير موجود في المفضلة.' };
        }
        items.splice(idx, 1);
        await this.context.storage.set('wishlist_items', items);

        this.context.eventBus.publish('wishlist.action', { action: 'remove', productId });
        this.context.logger.info(`Removed ${productId} from wishlist.`);

        return { success: true, action: 'remove', productId, totalItems: items.length };
      }

      case 'wishlist_list': {
        return { success: true, items, totalItems: items.length };
      }

      default:
        throw new Error(`WishlistPlugin: Unknown tool "${toolName}".`);
    }
  }
}
