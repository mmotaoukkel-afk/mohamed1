import { PermissionType } from './types';

export interface IEventBus {
  publish(event: any): void;
  subscribe(topic: string, callback: any, filter?: any): string;
  unsubscribe(subscriptionId: string): void;
}

/**
 * Injected context by the Kataraa Core into the Skill sandbox.
 * Grants access to Event Bus, Scoped Storage, Permissions, and Logging in a secure way.
 */
export interface ISkillContext {
  skillId: string;

  /**
   * Access to the reactive event communication pipeline.
   */
  eventBus: {
    publish(topic: string, payload: any, priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'): void;
    subscribe(
      topic: string,
      callback: (event: any) => void,
      filter?: (event: any) => boolean
    ): string;
    unsubscribe(subscriptionId: string): void;
  };

  /**
   * Scoped persistent storage for this specific skill.
   */
  storage: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };

  /**
   * Security consent manager.
   */
  security: {
    hasPermission(permission: PermissionType): Promise<boolean>;
    requestPermission(permission: PermissionType): Promise<boolean>;
  };

  /**
   * Diagnostics logging.
   */
  logger: {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: any): void;
  };
}
