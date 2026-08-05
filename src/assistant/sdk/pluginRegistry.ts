import { ISkill } from './contracts/ISkill';
import { ISkillContext } from './contracts/ISkillContext';
import { PermissionType, ISkillManifest } from './contracts/types';
import { EventBus } from '../kernel/eventBus';

export class PluginRegistry {
  private static instance: PluginRegistry;
  private skills: Map<string, ISkill> = new Map();
  private skillStates: Map<string, 'INSTALLED' | 'REGISTERED' | 'INITIALIZED' | 'ACTIVATED' | 'DISABLED'> = new Map();
  private grantedPermissions: Map<string, Set<PermissionType>> = new Map();
  private coreVersion = '1.0.0';
  private storageData: Map<string, Map<string, any>> = new Map(); // skillId -> key-value map

  private constructor() {}

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Reset instance for testing
   */
  public static resetInstance(): void {
    PluginRegistry.instance = new PluginRegistry();
  }

  /**
   * Register a new skill plugin.
   */
  public register(skill: ISkill): void {
    const manifest = skill.manifest;
    
    // 1. Check compatibility
    if (!this.checkSemverCompatibility(this.coreVersion, manifest.compatibility.coreVersion)) {
      throw new Error(`Skill ${manifest.id} (v${manifest.version}) is incompatible with Core v${this.coreVersion}`);
    }

    this.skills.set(manifest.id, skill);
    this.skillStates.set(manifest.id, 'REGISTERED');
    this.grantedPermissions.set(manifest.id, new Set());
  }

  /**
   * Load and Initialize all registered skills in dependency order.
   */
  public async initializeAll(): Promise<void> {
    const sortedIds = this.resolveDependencyOrder();

    for (const skillId of sortedIds) {
      const skill = this.skills.get(skillId);
      if (!skill) continue;

      const state = this.skillStates.get(skillId);
      if (state !== 'REGISTERED') continue;

      const context = this.createContext(skillId);
      await skill.initialize(context);
      this.skillStates.set(skillId, 'INITIALIZED');
    }
  }

  /**
   * Activate all initialized skills.
   */
  public async activateAll(): Promise<void> {
    for (const [skillId, skill] of this.skills.entries()) {
      const state = this.skillStates.get(skillId);
      if (state === 'INITIALIZED') {
        // Automatically grant required permissions for simulation / system level plugins
        const manifest = skill.manifest;
        const granted = this.grantedPermissions.get(skillId) || new Set();
        for (const p of manifest.permissions.required) {
          granted.add(p);
        }
        this.grantedPermissions.set(skillId, granted);

        await skill.activate();
        this.skillStates.set(skillId, 'ACTIVATED');
      }
    }
  }

  /**
   * Deactivate and terminate a specific skill.
   */
  public async deactivateSkill(skillId: string): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    const state = this.skillStates.get(skillId);
    if (state === 'ACTIVATED') {
      await skill.deactivate();
      this.skillStates.set(skillId, 'DISABLED');
    }
  }

  /**
   * Routes a tool execution to the appropriate skill.
   */
  public async executeTool(toolName: string, args: Record<string, any>): Promise<Record<string, any>> {
    // Find skill that exposes this tool
    let targetSkill: ISkill | null = null;
    for (const skill of this.skills.values()) {
      const state = this.skillStates.get(skill.manifest.id);
      if (state !== 'ACTIVATED') continue;

      const hasTool = skill.manifest.tools.some((t) => t.name === toolName);
      if (hasTool) {
        targetSkill = skill;
        break;
      }
    }

    if (!targetSkill) {
      throw new Error(`No active skill found that exposes tool: ${toolName}`);
    }

    // Verify permissions required by the capabilities using this tool
    const skillId = targetSkill.manifest.id;
    const capability = targetSkill.manifest.capabilities.find((c) => c.tools.includes(toolName));
    
    // In a production system, we would map capabilities to specific permissions.
    // For this engine, we require the skill to be fully activated.

    return await targetSkill.executeTool(toolName, args);
  }

  /**
   * Resolve execution capability routing.
   * Maps capability requested by planner to the best matching tool.
   */
  public resolveCapabilityTool(capabilityName: string): { toolName: string; skillId: string } | null {
    let bestMatch: { toolName: string; skillId: string } | null = null;

    for (const skill of this.skills.values()) {
      const state = this.skillStates.get(skill.manifest.id);
      if (state !== 'ACTIVATED') continue;

      const cap = skill.manifest.capabilities.find((c) => c.name === capabilityName);
      if (cap && cap.tools.length > 0) {
        // Return first matching tool for the capability
        bestMatch = {
          toolName: cap.tools[0],
          skillId: skill.manifest.id,
        };
        break;
      }
    }

    return bestMatch;
  }

  /**
   * Resolves dependencies using a topological DAG sort.
   */
  public resolveDependencyOrder(): string[] {
    const ids = Array.from(this.skills.keys());
    const visited: Record<string, 'VISITING' | 'VISITED'> = {};
    const sorted: string[] = [];

    const dfs = (skillId: string) => {
      visited[skillId] = 'VISITING';

      const skill = this.skills.get(skillId);
      if (skill) {
        const deps = Object.keys(skill.manifest.dependencies || {});
        for (const depId of deps) {
          if (!this.skills.has(depId)) {
            throw new Error(`Missing dependency: ${depId} required by ${skillId}`);
          }
          if (visited[depId] === 'VISITING') {
            throw new Error(`Circular dependency detected involving ${skillId} and ${depId}`);
          }
          if (!visited[depId]) {
            dfs(depId);
          }
        }
      }

      visited[skillId] = 'VISITED';
      sorted.push(skillId);
    };

    for (const id of ids) {
      if (!visited[id]) {
        dfs(id);
      }
    }

    return sorted;
  }

  public getSkillState(skillId: string) {
    return this.skillStates.get(skillId);
  }

  public getPermissions(skillId: string): Set<PermissionType> {
    return this.grantedPermissions.get(skillId) || new Set();
  }

  public grantPermission(skillId: string, permission: PermissionType): void {
    const granted = this.grantedPermissions.get(skillId) || new Set();
    granted.add(permission);
    this.grantedPermissions.set(skillId, granted);
  }

  /**
   * Create context injected into the skill.
   */
  private createContext(skillId: string): ISkillContext {
    const self = this;
    
    // Initialize storage map for the skill if not exists
    if (!this.storageData.has(skillId)) {
      this.storageData.set(skillId, new Map());
    }
    const localStore = this.storageData.get(skillId)!;

    return {
      skillId,
      eventBus: EventBus.getInstance().getScopedInterface(skillId),
      storage: {
        async get(key: string): Promise<any> {
          return localStore.get(key);
        },
        async set(key: string, value: any): Promise<void> {
          localStore.set(key, value);
        },
        async delete(key: string): Promise<void> {
          localStore.delete(key);
        },
      },
      security: {
        async hasPermission(permission: PermissionType): Promise<boolean> {
          const granted = self.grantedPermissions.get(skillId);
          return granted ? granted.has(permission) : false;
        },
        async requestPermission(permission: PermissionType): Promise<boolean> {
          // Mock prompt consent - automatically grant if requested in manifest
          const skill = self.skills.get(skillId);
          if (!skill) return false;

          const manifest = skill.manifest;
          const isRequested = 
            manifest.permissions.required.includes(permission) ||
            manifest.permissions.optional.includes(permission);

          if (isRequested) {
            self.grantPermission(skillId, permission);
            return true;
          }
          return false;
        },
      },
      logger: {
        info(message: string, meta?: any): void {
          if (__DEV__) {
            console.log(`[Skill:${skillId}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
          }
        },
        warn(message: string, meta?: any): void {
          if (__DEV__) {
            console.warn(`[Skill:${skillId}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
          }
        },
        error(message: string, error?: any): void {
          if (__DEV__) {
            console.error(`[Skill:${skillId}] [ERROR] ${message}`, error || '');
          }
        },
      },
    };
  }

  /**
   * Simple semver checker.
   * Supports basic matching: "^1.0.0", "1.0.0", ">=1.0.0".
   */
  private checkSemverCompatibility(coreVer: string, requestedVer: string): boolean {
    if (requestedVer === '*' || requestedVer === '^' + coreVer || requestedVer === coreVer) {
      return true;
    }
    if (requestedVer.startsWith('^')) {
      const reqBase = requestedVer.slice(1).split('.');
      const coreBase = coreVer.split('.');
      return reqBase[0] === coreBase[0]; // same major version
    }
    return true;
  }
}
