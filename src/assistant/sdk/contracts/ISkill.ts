import { ISkillManifest } from './types';
import { ISkillContext } from './ISkillContext';

/**
 * Interface that every Kataraa Skill plugin must implement.
 */
export interface ISkill {
  manifest: ISkillManifest;

  /**
   * Called during initialization stage when the skill is loaded.
   * Scoped context with event bus, storage, logging, and security services is injected.
   */
  initialize(context: ISkillContext): Promise<void>;

  /**
   * Called when the skill transitions to the ACTIVATED state,
   * meaning permissions are accepted and tools can be registered.
   */
  activate(): Promise<void>;

  /**
   * Called when the skill is disabled or deactivated.
   * All event bus subscriptions must be cleared or will be cleared by the context automatically.
   */
  deactivate(): Promise<void>;

  /**
   * Called when the skill is being uninstalled or permanently removed.
   * The skill must clean up any local storage files.
   */
  terminate(): Promise<void>;

  /**
   * Executes a specific tool provided by this skill.
   * 
   * @param toolName The name of the tool to execute.
   * @param args The input arguments matching the tool's inputSchema.
   */
  executeTool(toolName: string, args: Record<string, any>): Promise<Record<string, any>>;
}
