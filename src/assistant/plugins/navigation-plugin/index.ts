import { ISkill } from '../../sdk/contracts/ISkill';
import { ISkillContext } from '../../sdk/contracts/ISkillContext';
import { ISkillManifest } from '../../sdk/contracts/types';

export class NavigationPlugin implements ISkill {
  manifest: ISkillManifest = {
    id: 'org.kataraa.navigation',
    name: 'App Navigation',
    version: '1.0.0',
    description: 'التنقل بين شاشات التطبيق المختلفة.',
    author: 'Kataraa Team',
    compatibility: { coreVersion: '^1.0.0', platform: ['node', 'react-native', 'browser'] },
    dependencies: {},
    permissions: { required: [], optional: [] },
    capabilities: [
      {
        name: 'NavigationCapability',
        description: 'القدرة على التنقل بين شاشات التطبيق',
        tools: ['navigate_to'],
      },
    ],
    tools: [
      {
        name: 'navigate_to',
        description: 'التنقل لشاشة معينة في التطبيق.',
        inputSchema: {
          screen: { type: 'string', required: true, enum: ['Home', 'Cart', 'Favorites', 'Products', 'Orders', 'Settings', 'Profile'] },
        },
      },
    ],
  };

  private context!: ISkillContext;

  async initialize(context: ISkillContext): Promise<void> {
    this.context = context;
    this.context.logger.info('NavigationPlugin initialized.');
  }

  async activate(): Promise<void> {
    this.context.logger.info('NavigationPlugin activated.');
  }

  async deactivate(): Promise<void> {
    this.context.logger.info('NavigationPlugin deactivated.');
  }

  async terminate(): Promise<void> {
    this.context.logger.info('NavigationPlugin terminated.');
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<Record<string, any>> {
    if (toolName !== 'navigate_to') {
      throw new Error(`NavigationPlugin: Unknown tool "${toolName}".`);
    }

    const { screen } = args;
    this.context.logger.info(`Navigating to screen: "${screen}"`);

    this.context.eventBus.publish('navigation.action', { screen });

    return { success: true, screen, message: `Navigated to "${screen}".` };
  }
}
