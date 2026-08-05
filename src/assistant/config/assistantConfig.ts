/**
 * Assistant Config — Feature flags and operational constants for the core brain.
 */
export const assistantConfig = {
  // Feature Toggles
  enableContextResolution: true,
  enableIntentConfidence: true,
  enableRecommendations: false,
  enableDecisionEngine: false,

  // TTL & Message Limit Configuration
  contextTTLMs: 15 * 60 * 1000, // 15 minutes session duration
  contextMaxMessages: 20,       // Reset session after 20 messages to prevent decay
};
