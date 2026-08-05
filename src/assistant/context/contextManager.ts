/**
 * ContextManager — Resolves implicit references and ellipsis in multi-turn conversations.
 *
 * Responsibilities:
 *  - Detects when a follow-up message refers to a previous product/query
 *  - Resolves pronouns and ellipsis (e.g., "شنو الألوان؟" → "ألوان آيفون")
 *  - Transitions conversation stages based on intent flow
 *  - Enriches AnalyzedMessage with contextual data from memory
 */

import type { AnalyzedMessage, AssistantContext, ConversationStage, IntentType } from '../types';
import { assistantConfig } from '../config/assistantConfig';
import { touchContext } from './conversationMemory';

// ─── Follow-Up Detection Keywords ─────────────────────────────────────────────

const FOLLOW_UP_INDICATORS = [
  // Arabic pronouns and references
  'ديالو', 'ديالها', 'ديالهم', 'تاعو', 'تاعها', 'نتاعو', 'نتاعها',
  'هاد', 'هادو', 'هادي', 'داك', 'ديك', 'هداك', 'هديك',
  'فيه', 'فيها', 'عليه', 'عليها', 'منو', 'منها',
  // Question words that imply follow-up about a previously mentioned entity
  'شحال', 'بشحال', 'شنو', 'واش', 'فين', 'كيفاش',
  // English equivalents
  'its', 'this one', 'that one', 'the same', 'it',
];

/**
 * Checks if a message is likely a follow-up to a previous query
 * (i.e., the user is asking about something already discussed).
 */
const isFollowUp = (analyzed: AnalyzedMessage, ctx: AssistantContext): boolean => {
  if (!ctx.lastQuery && !ctx.currentFocusedProduct) return false;

  const text = analyzed.originalText.toLowerCase();
  const tokens = analyzed.tokens;

  // If no product/brand is mentioned but a follow-up indicator is present
  const hasEntities = (analyzed.entities.products && analyzed.entities.products.length > 0) ||
                      (analyzed.entities.brands && analyzed.entities.brands.length > 0);

  if (!hasEntities) {
    const hasFollowUpWord = FOLLOW_UP_INDICATORS.some(ind => text.includes(ind));
    if (hasFollowUpWord) return true;

    // Short messages without product context are likely follow-ups
    // e.g., "شنو الألوان؟" (3 tokens, no product/brand)
    if (tokens.length <= 4 && ctx.currentFocusedProduct) return true;
  }

  return false;
};

/**
 * Enriches an AnalyzedMessage with contextual information from the conversation memory.
 * This is the core context resolution function.
 *
 * Example:
 *  User: "بغيت آيفون"  → ctx.currentFocusedProduct = iPhone
 *  User: "شنو الألوان؟" → resolveContext enriches query to "ألوان آيفون"
 */
export const resolveContext = (
  analyzed: AnalyzedMessage,
  ctx: AssistantContext,
): { enrichedMessage: AnalyzedMessage; updatedContext: AssistantContext } => {
  if (!assistantConfig.enableContextResolution) {
    return { enrichedMessage: analyzed, updatedContext: ctx };
  }

  // Touch context (TTL + message count check, increment counter)
  let updatedCtx = touchContext(ctx);
  let enriched = { ...analyzed };

  // If this is a follow-up, enrich entities with context
  if (isFollowUp(analyzed, updatedCtx)) {
    // Carry forward the focused product from context
    if (updatedCtx.currentFocusedProduct && !enriched.entities.products?.length) {
      enriched = {
        ...enriched,
        entities: {
          ...enriched.entities,
          products: [updatedCtx.currentFocusedProduct.name],
        },
      };
    }

    // Combine the current query with the previous query for richer search
    if (updatedCtx.lastQuery && enriched.entities.query) {
      enriched = {
        ...enriched,
        entities: {
          ...enriched.entities,
          query: `${updatedCtx.lastQuery} ${enriched.entities.query}`,
        },
      };
    }
  }

  // Transition conversation stage based on intent
  if (enriched.intent) {
    updatedCtx = {
      ...updatedCtx,
      conversationStage: inferStage(enriched.intent, updatedCtx),
    };
  }

  return { enrichedMessage: enriched, updatedContext: updatedCtx };
};

// ─── Stage Inference ──────────────────────────────────────────────────────────

/**
 * Infers the correct conversation stage from the current intent and context.
 */
const inferStage = (intent: IntentType, ctx: AssistantContext): ConversationStage => {
  switch (intent) {
    case 'PRODUCT_SEARCH':
    case 'SEARCH_PRODUCT':
    case 'CATEGORY_BROWSING':
      return 'SEARCHING';

    case 'RECOMMENDATIONS':
    case 'RECOMMEND_PRODUCTS':
      return 'RECOMMENDING';

    case 'UNKNOWN':
    case 'HELP':
      return ctx.conversationStage === 'SEARCHING' ? 'CLARIFYING' : 'UNKNOWN';

    case 'ADD_TO_CART':
    case 'CART_MANAGEMENT':
    case 'OPEN_CART':
      return 'CHECKOUT';

    case 'GREETING':
    case 'SMALL_TALK':
      return 'GREETING';

    case 'OUT_OF_SCOPE':
      return 'OUT_OF_SCOPE';

    case 'CONFIRMATION':
    case 'NEGATION':
      // If we were clarifying, return to previous stage
      return ctx.conversationStage ?? 'UNKNOWN';

    default:
      return ctx.conversationStage ?? 'UNKNOWN';
  }
};
