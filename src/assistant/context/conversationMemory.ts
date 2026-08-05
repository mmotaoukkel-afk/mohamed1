/**
 * ConversationMemory — Short-term session memory with TTL and message limits.
 *
 * Responsibilities:
 *  - Stores recent messages, intents, and entities
 *  - Enforces TTL expiration (default 15 min)
 *  - Enforces max message count threshold
 *  - Provides reset/clear functionality
 */

import type { AssistantContext, AssistantProduct, IntentType, ActionType, ParsedIntent, ConversationStage } from '../types';
import { assistantConfig } from '../config/assistantConfig';

// ─── Default empty context ────────────────────────────────────────────────────

export const createEmptyContext = (): AssistantContext => ({
  lastSearchResults: [],
  lastIntent: undefined,
  lastQuery: undefined,
  lastCategory: undefined,
  lastRecommendations: [],
  currentScreen: 'Home',
  currentFocusedProduct: undefined,
  pendingAction: undefined,
  conversationStage: undefined,
  lastUpdated: Date.now(),
  messageCount: 0,
});

// ─── TTL & Message Count Validation ───────────────────────────────────────────

/**
 * Checks whether the session context is expired based on TTL or message count.
 * Returns true if the context should be reset.
 */
export const isContextExpired = (ctx: AssistantContext): boolean => {
  const now = Date.now();

  // TTL check
  if (ctx.lastUpdated) {
    const elapsed = now - ctx.lastUpdated;
    if (elapsed > assistantConfig.contextTTLMs) {
      return true;
    }
  }

  // Message count check
  if (ctx.messageCount !== undefined && ctx.messageCount >= assistantConfig.contextMaxMessages) {
    return true;
  }

  return false;
};

/**
 * Refreshes the context timestamps and increments message count.
 * If the context is expired, it resets to a fresh state.
 */
export const touchContext = (ctx: AssistantContext): AssistantContext => {
  if (isContextExpired(ctx)) {
    if (__DEV__) {
      console.log('[ConversationMemory] Context expired — resetting session.');
    }
    return createEmptyContext();
  }

  return {
    ...ctx,
    lastUpdated: Date.now(),
    messageCount: (ctx.messageCount ?? 0) + 1,
  };
};

// ─── Context Update Helpers ───────────────────────────────────────────────────

/**
 * Updates context after a search result is returned.
 */
export const updateSearchContext = (
  ctx: AssistantContext,
  query: string,
  results: AssistantProduct[],
): AssistantContext => ({
  ...ctx,
  lastSearchResults: results,
  lastQuery: query,
  lastIntent: 'PRODUCT_SEARCH',
  currentFocusedProduct: results[0] ?? ctx.currentFocusedProduct,
  conversationStage: 'SEARCHING',
  lastUpdated: Date.now(),
});

/**
 * Updates context after navigating to a screen.
 */
export const updateNavigationContext = (
  ctx: AssistantContext,
  screen: string,
  category?: string,
): AssistantContext => ({
  ...ctx,
  currentScreen: screen,
  lastCategory: category ?? ctx.lastCategory,
  lastIntent: 'NAVIGATION',
  lastUpdated: Date.now(),
});

/**
 * Updates the conversation stage.
 */
export const updateStage = (
  ctx: AssistantContext,
  stage: ConversationStage,
): AssistantContext => ({
  ...ctx,
  conversationStage: stage,
  lastUpdated: Date.now(),
});

/**
 * Sets a pending action requiring confirmation.
 */
export const setPendingAction = (
  ctx: AssistantContext,
  actionType: ActionType,
  entities?: ParsedIntent['entities'],
): AssistantContext => ({
  ...ctx,
  pendingAction: { type: actionType, entities },
  lastUpdated: Date.now(),
});

/**
 * Clears the pending action after confirmation or cancellation.
 */
export const clearPendingAction = (ctx: AssistantContext): AssistantContext => ({
  ...ctx,
  pendingAction: undefined,
  lastUpdated: Date.now(),
});
