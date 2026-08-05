/**
 * Decision Engine Types — Sprint 2 Placeholder
 *
 * These types will be used by the Decision Engine to route intents
 * to specific actions and tools.
 */

import type { ActionType, IntentType, AnalyzedMessage, AssistantContext } from '../types';

// ─── Decision Result ──────────────────────────────────────────────────────────

export interface DecisionResult {
  /** The action to execute */
  action: ActionType;
  /** Parameters for the action */
  params: Record<string, unknown>;
  /** Whether the action requires user confirmation before execution */
  requiresConfirmation: boolean;
  /** Reasoning trace for debugging */
  reasoning?: string;
}

// ─── Action Route ─────────────────────────────────────────────────────────────

export interface ActionRoute {
  /** The intent that triggers this route */
  intent: IntentType;
  /** The action to execute */
  action: ActionType;
  /** Priority (higher = checked first) */
  priority: number;
  /** Optional condition function */
  condition?: (message: AnalyzedMessage, context: AssistantContext) => boolean;
}

// ─── Tool Definition (for Agent-style execution) ──────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  /** The action type this tool handles */
  handles: ActionType[];
  /** Execute the tool */
  execute: (params: Record<string, unknown>, context: AssistantContext) => Promise<unknown>;
}
