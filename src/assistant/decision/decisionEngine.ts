/**
 * DecisionEngine — Sprint 2 Placeholder
 *
 * This module will be responsible for:
 *  - Routing classified intents to the correct action handler
 *  - Applying business rules and constraints
 *  - Managing multi-step action plans (Agent-style reasoning)
 *
 * Pipeline position:
 *  ... → intentClassifier → contextManager → **decisionEngine** → actionExecutor → responseBuilder
 *
 * For now, this is a pass-through shell that returns a basic decision.
 */

import type { AnalyzedMessage, AssistantContext, ActionType } from '../types';
import type { DecisionResult } from './types';

/**
 * Makes a decision about what action to take based on the analyzed message and context.
 * Currently a placeholder — returns a basic mapping from intent to action.
 *
 * Sprint 2 will add:
 *  - Multi-step planning (e.g., search → filter → compare → recommend)
 *  - Confirmation gates for destructive actions
 *  - Tool routing for API calls
 *  - Business rule evaluation
 */
export const decide = (
  _message: AnalyzedMessage,
  _context: AssistantContext,
): DecisionResult => {
  // Placeholder: direct pass-through
  return {
    action: 'NONE',
    params: {},
    requiresConfirmation: false,
    reasoning: 'Decision Engine not yet active — Sprint 2 placeholder.',
  };
};
