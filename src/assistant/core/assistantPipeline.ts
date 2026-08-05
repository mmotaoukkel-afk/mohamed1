/**
 * AssistantPipeline — The central orchestrator for the Kataraa Assistant Core Brain.
 *
 * This is the single entry point for all message processing.
 * It is fully decoupled from React and can be tested or run in any environment.
 *
 * Pipeline:
 *  Raw Text → keywordParser → entityExtractor → messageAnalyzer
 *           → intentClassifier → contextManager → PipelineResult
 *
 * Future Sprint 2 will insert the Decision Engine between contextManager and output.
 */

import { analyzeMessage } from '../analyzer/messageAnalyzer';
import { analyzeSentiment } from '../analyzer/sentimentAnalyzer';
import { classifyIntent } from '../intent/intentClassifier';
import { resolveContext } from '../context/contextManager';
import { assistantConfig } from '../config/assistantConfig';
import type { AssistantContext, PipelineResult } from '../types';

/**
 * Processes a raw user message through the full brain pipeline.
 *
 * @param message - The raw text from the user.
 * @param context - The current session context (short-term memory).
 * @returns PipelineResult with the enriched analyzed message and updated context.
 *
 * Usage:
 *   const result = processMessage("بغيت سيروم لوريال", sessionContext);
 *   // result.analyzedMessage.intent => "SEARCH_PRODUCT"
 *   // result.analyzedMessage.entities.brands => ["loreal"]
 *   // result.analyzedMessage.entities.products => ["serum"]
 *   // result.contextState.conversationStage => "SEARCHING"
 */
export const processMessage = (
  message: string,
  context: AssistantContext,
): PipelineResult => {
  // ── Step 1: Analyze Message (tokenize + detect language + extract entities) ──
  const analyzed = analyzeMessage(message);
  const sentimentResult = analyzeSentiment(message);

  if (__DEV__) {
    console.log('[Pipeline] Step 1 — Analyzed:', JSON.stringify({
      language: analyzed.language,
      tokens: analyzed.tokens.length,
      entities: analyzed.entities,
      sentiment: sentimentResult.sentiment,
    }));
  }

  // ── Step 2: Classify Intent ──────────────────────────────────────────────────
  const { intent, confidence, category } = classifyIntent(analyzed, context);

  const withIntent = {
    ...analyzed,
    intent,
    confidence,
    sentimentResult,
  };

  if (__DEV__) {
    console.log(`[Pipeline] Step 2 — Intent: ${intent} (${(confidence * 100).toFixed(0)}%) | Category: ${category}`);
  }

  // ── Step 3: Resolve Context (enrichment + stage transition + TTL) ────────────
  const { enrichedMessage, updatedContext } = resolveContext(withIntent, context);

  if (__DEV__) {
    console.log(`[Pipeline] Step 3 — Stage: ${updatedContext.conversationStage} | Messages: ${updatedContext.messageCount}`);
  }

  // ── Step 4: Decision Engine (placeholder — Sprint 2) ─────────────────────────
  if (assistantConfig.enableDecisionEngine) {
    // Future: const decision = decisionEngine.decide(enrichedMessage, updatedContext);
    if (__DEV__) {
      console.log('[Pipeline] Step 4 — Decision Engine is enabled but not yet implemented.');
    }
  }

  return {
    analyzedMessage: enrichedMessage,
    contextState: updatedContext,
  };
};
