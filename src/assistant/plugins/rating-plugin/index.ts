import { ISkill } from '../../sdk/contracts/ISkill';
import { ISkillContext } from '../../sdk/contracts/ISkillContext';
import { ISkillManifest } from '../../sdk/contracts/types';

export class RatingPlugin implements ISkill {
  manifest: ISkillManifest = {
    id: 'org.kataraa.rating',
    name: 'Product Rating',
    version: '1.0.0',
    description: 'تقييم المنتجات بنظام النجوم (1-5).',
    author: 'Kataraa Team',
    compatibility: { coreVersion: '^1.0.0', platform: ['node', 'react-native', 'browser'] },
    dependencies: {},
    permissions: { required: ['STORAGE'], optional: [] },
    capabilities: [
      {
        name: 'RatingCapability',
        description: 'القدرة على تقييم المنتجات',
        tools: ['rating_submit', 'rating_get'],
      },
    ],
    tools: [
      {
        name: 'rating_submit',
        description: 'إرسال تقييم نجوم لمنتج.',
        inputSchema: {
          productId: { type: 'string', required: true },
          stars: { type: 'number', required: true },
        },
      },
      {
        name: 'rating_get',
        description: 'جلب تقييم المستخدم لمنتج محدد.',
        inputSchema: { productId: { type: 'string', required: true } },
      },
    ],
  };

  private context!: ISkillContext;

  async initialize(context: ISkillContext): Promise<void> {
    this.context = context;
    const stored = await this.context.storage.get('user_ratings');
    if (!stored) {
      await this.context.storage.set('user_ratings', {});
    }
    this.context.logger.info('RatingPlugin initialized.');
  }

  async activate(): Promise<void> {
    this.context.logger.info('RatingPlugin activated.');
  }

  async deactivate(): Promise<void> {
    this.context.logger.info('RatingPlugin deactivated.');
  }

  async terminate(): Promise<void> {
    await this.context.storage.delete('user_ratings');
    this.context.logger.info('RatingPlugin terminated.');
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<Record<string, any>> {
    const ratings: Record<string, number> = (await this.context.storage.get('user_ratings')) || {};

    switch (toolName) {
      case 'rating_submit': {
        const { productId, stars } = args;

        if (stars < 1 || stars > 5) {
          return { success: false, message: 'التقييم يجب أن يكون بين 1 و 5 نجوم.' };
        }

        ratings[productId] = stars;
        await this.context.storage.set('user_ratings', ratings);

        this.context.eventBus.publish('rating.action', {
          action: 'submit',
          productId,
          stars,
        });

        this.context.logger.info(`Rated product ${productId}: ${stars} stars.`);
        return { success: true, action: 'submit', productId, stars };
      }

      case 'rating_get': {
        const { productId } = args;
        const rating = ratings[productId];

        return {
          success: true,
          productId,
          stars: rating ?? null,
          hasRating: rating !== undefined,
        };
      }

      default:
        throw new Error(`RatingPlugin: Unknown tool "${toolName}".`);
    }
  }
}
