/**
 * Base types and definitions for the Kataraa Skill SDK.
 * Fully decoupled and platform independent.
 */

export type PermissionType =
  | 'CAMERA'
  | 'MICROPHONE'
  | 'NETWORK'
  | 'STORAGE'
  | 'PAYMENTS'
  | 'CONTACTS'
  | 'NOTIFICATIONS';

export type SkillState =
  | 'INSTALLED'
  | 'REGISTERED'
  | 'INITIALIZED'
  | 'ACTIVATED'
  | 'DISABLED'
  | 'UNINSTALLED';

export interface ISkillManifest {
  id: string; // unique identifier, e.g., "org.kataraa.cart"
  name: string;
  version: string;
  description: string;
  author: string;
  compatibility: {
    coreVersion: string; // e.g., "^1.0.0"
    platform: string[];  // e.g., ["node", "react-native", "browser"]
  };
  dependencies: Record<string, string>; // dependency skill ID to semver
  permissions: {
    required: PermissionType[];
    optional: PermissionType[];
  };
  capabilities: Array<{
    name: string;
    description: string;
    tools: string[];
  }>;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, any>;
  }>;
  sandbox?: {
    maxMemoryMB?: number;
    timeoutMS?: number;
    allowNetwork?: boolean;
  };
}
