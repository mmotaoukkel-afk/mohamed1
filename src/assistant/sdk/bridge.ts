/**
 * Compatibility Bridge — Strangler Fig Adapter
 *
 * Connects new Skill SDK plugins (ISkill) to the existing platform's
 * ToolRegistry & CapabilityEngine, allowing a gradual migration
 * without breaking the current AgentOrchestrator / PlanExecutor pipeline.
 *
 * Each ISkill's tools are wrapped as ITool instances and registered
 * in the legacy ToolRegistry. Each ISkill's capabilities are registered
 * in the legacy CapabilityEngine.
 */

import { ISkill } from './contracts/ISkill';
import { PluginRegistry } from './pluginRegistry';
import { ToolRegistry } from '../platform/tools/registry';
import { CapabilityEngine } from '../platform/capabilities/capabilityEngine';
import { ITool, ToolDefinition, WorldState } from '../platform/core/types';

/**
 * Wraps an ISkill tool as a legacy ITool so the existing PlanExecutor
 * can invoke it seamlessly through the ToolRegistry.
 */
class SkillToolAdapter implements ITool {
  public definition: ToolDefinition;
  private skill: ISkill;
  private toolName: string;

  constructor(skill: ISkill, manifestTool: { name: string; description: string; inputSchema: Record<string, any> }) {
    this.skill = skill;
    this.toolName = manifestTool.name;

    this.definition = {
      name: manifestTool.name,
      description: manifestTool.description,
      parameters: Object.entries(manifestTool.inputSchema).map(([key, schema]: [string, any]) => ({
        name: key,
        type: schema.type || 'string',
        description: schema.description || key,
        required: schema.required ?? false,
        enum: schema.enum,
      })),
      outputSchema: { type: 'object', description: 'Plugin tool output' },
    };
  }

  public async execute(params: Record<string, any>, _context: { worldState: WorldState }): Promise<any> {
    return this.skill.executeTool(this.toolName, params);
  }
}

/**
 * Registers all activated ISkill plugins into the legacy platform systems.
 */
export async function bridgePluginsToLegacyPlatform(pluginRegistry: PluginRegistry): Promise<void> {
  const toolRegistry = ToolRegistry.getInstance();
  const capabilityEngine = CapabilityEngine.getInstance();

  // Initialize and activate all registered skills
  await pluginRegistry.initializeAll();
  await pluginRegistry.activateAll();

  // For each skill, wrap its tools and capabilities into the legacy system
  const sortedIds = pluginRegistry.resolveDependencyOrder();

  for (const skillId of sortedIds) {
    const state = pluginRegistry.getSkillState(skillId);
    if (state !== 'ACTIVATED') continue;

    // Access the skill through executeTool routing
    const manifest = getManifestFromRegistry(pluginRegistry, skillId);
    if (!manifest) continue;

    const skill = getSkillFromRegistry(pluginRegistry, skillId);
    if (!skill) continue;

    // 1. Register each tool as a legacy ITool adapter
    for (const toolDef of manifest.tools) {
      const adapter = new SkillToolAdapter(skill, toolDef);

      try {
        toolRegistry.register(adapter);
      } catch (e) {
        // Tool may already be registered — skip silently
      }
    }

    // 2. Register each capability in the legacy CapabilityEngine
    for (const cap of manifest.capabilities) {
      try {
        capabilityEngine.registerCapability({
          name: cap.name,
          description: cap.description,
          toolNames: cap.tools,
          domains: [skillId.split('.').pop() || 'general'],
          isAvailable: () => pluginRegistry.getSkillState(skillId) === 'ACTIVATED',
        });
      } catch (e) {
        // Capability may already be registered — skip silently
      }
    }

    if (__DEV__) {
      console.log(`[Bridge] 🔌 Plugin "${manifest.name}" (${skillId}) bridged to legacy platform.`);
    }
  }
}

// ── Helper to access internal skill objects from PluginRegistry ──────────────
// These reach into the registry's internal state. In a production system,
// the registry would expose proper getters.

function getManifestFromRegistry(registry: PluginRegistry, skillId: string) {
  // Use the capability routing API to verify the skill is registered
  // and extract manifest data through its public interface.
  const skills = (registry as any).skills as Map<string, ISkill> | undefined;
  if (!skills) return null;
  const skill = skills.get(skillId);
  return skill?.manifest ?? null;
}

function getSkillFromRegistry(registry: PluginRegistry, skillId: string): ISkill | null {
  const skills = (registry as any).skills as Map<string, ISkill> | undefined;
  if (!skills) return null;
  return skills.get(skillId) ?? null;
}
