/**
 * Brain Test Suite — Core Pipeline Unit Tests
 *
 * Tests:
 *  1. Language Detection (Arabic, Darija, English)
 *  2. Entity Extraction (brands, products, sizes — single & multiple)
 *  3. Intent Classification with confidence scores
 *  4. OUT_OF_SCOPE handling
 *  5. Context resolution & TTL expiration
 *  6. Conversation stage transitions
 *  7. Full pipeline integration (processMessage)
 */

import { detectLanguage, tokenize } from '../analyzer/keywordParser';
import { extractEntities } from '../analyzer/entityExtractor';
import { analyzeMessage } from '../analyzer/messageAnalyzer';
import { classifyIntent } from '../intent/intentClassifier';
import { resolveContext } from '../context/contextManager';
import { createEmptyContext, isContextExpired, touchContext } from '../context/conversationMemory';
import { processMessage } from '../core/assistantPipeline';
import type { AssistantContext } from '../types';

// ─── Test Harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

const assert = (condition: boolean, name: string, detail?: string) => {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const printSection = (title: string) => {
  console.log(`\n═══ ${title} ═══`);
};

// ════════════════════════════════════════════════════════════════════════════════
// 1. Language Detection
// ════════════════════════════════════════════════════════════════════════════════

const testLanguageDetection = () => {
  printSection('1. Language Detection');

  assert(detectLanguage('I want a serum') === 'en', 'English detection');
  assert(detectLanguage('أريد سيروم') === 'ar', 'Arabic detection');
  assert(detectLanguage('بغيت سيروم') === 'darija', 'Darija detection — بغيت');
  assert(detectLanguage('وريني شامبو') === 'darija', 'Darija detection — وريني');
  assert(detectLanguage('show me cream') === 'en', 'English detection — show me');
};

// ════════════════════════════════════════════════════════════════════════════════
// 2. Tokenization
// ════════════════════════════════════════════════════════════════════════════════

const testTokenization = () => {
  printSection('2. Tokenization');

  const tokens1 = tokenize('بغيت سيروم لوريال');
  assert(tokens1.length >= 2, 'Arabic tokenization produces tokens', `Got ${tokens1.length}`);

  const tokens2 = tokenize('show me the best cream');
  assert(tokens2.length === 5, 'English tokenization produces 5 tokens', `Got ${tokens2.length}`);

  const tokens3 = tokenize('');
  assert(tokens3.length === 0, 'Empty string produces 0 tokens');
};

// ════════════════════════════════════════════════════════════════════════════════
// 3. Entity Extraction — Single Entities
// ════════════════════════════════════════════════════════════════════════════════

const testSingleEntityExtraction = () => {
  printSection('3. Entity Extraction — Single');

  const r1 = extractEntities('بغيت سيروم');
  assert(r1.products !== undefined && r1.products.includes('serum'), 'Extracts product: serum', JSON.stringify(r1.products));

  const r2 = extractEntities('عطيني كريم لوريال');
  assert(r2.brands !== undefined && r2.brands.includes('loreal'), 'Extracts brand: loreal', JSON.stringify(r2.brands));
  assert(r2.products !== undefined && r2.products.includes('cream'), 'Extracts product: cream', JSON.stringify(r2.products));

  const r3 = extractEntities('شامبو 50ml');
  assert(r3.sizes !== undefined && r3.sizes.length > 0, 'Extracts size: 50ml', JSON.stringify(r3.sizes));
};

// ════════════════════════════════════════════════════════════════════════════════
// 4. Entity Extraction — Multiple Entities (Comparisons)
// ════════════════════════════════════════════════════════════════════════════════

const testMultipleEntityExtraction = () => {
  printSection('4. Entity Extraction — Multiple Entities');

  const r1 = extractEntities('قارن بين لوريال و سيرافي');
  assert(r1.brands !== undefined && r1.brands.length >= 2, 'Extracts 2+ brands for comparison', JSON.stringify(r1.brands));

  const r2 = extractEntities('شنو الفرق بين شامبو و سيروم');
  assert(r2.products !== undefined && r2.products.length >= 2, 'Extracts 2+ products for comparison', JSON.stringify(r2.products));
};

// ════════════════════════════════════════════════════════════════════════════════
// 5. Intent Classification
// ════════════════════════════════════════════════════════════════════════════════

const testIntentClassification = () => {
  printSection('5. Intent Classification');

  const msg1 = analyzeMessage('بغيت سيروم');
  const r1 = classifyIntent(msg1);
  assert(r1.intent === 'SEARCH_PRODUCT', 'Search product intent', r1.intent);
  assert(r1.confidence >= 0.85, 'Search confidence >= 0.85', String(r1.confidence));

  const msg2 = analyzeMessage('سلام');
  const r2 = classifyIntent(msg2);
  assert(r2.intent === 'GREETING', 'Greeting intent', r2.intent);

  const msg3 = analyzeMessage('ساعدني');
  const r3 = classifyIntent(msg3);
  assert(r3.intent === 'HELP', 'Help intent', r3.intent);

  const msg4 = analyzeMessage('hello');
  const r4 = classifyIntent(msg4);
  assert(r4.intent === 'GREETING', 'English greeting intent', r4.intent);
};

// ════════════════════════════════════════════════════════════════════════════════
// 6. OUT_OF_SCOPE Handling
// ════════════════════════════════════════════════════════════════════════════════

const testOutOfScope = () => {
  printSection('6. OUT_OF_SCOPE Handling');

  const msg1 = analyzeMessage('شنو عاصمة اليابان');
  const r1 = classifyIntent(msg1);
  assert(r1.intent === 'OUT_OF_SCOPE', 'Geography question → OUT_OF_SCOPE', r1.intent);

  const msg2 = analyzeMessage('who is the president of France');
  const r2 = classifyIntent(msg2);
  assert(r2.intent === 'OUT_OF_SCOPE', 'Politics question → OUT_OF_SCOPE', r2.intent);
};

// ════════════════════════════════════════════════════════════════════════════════
// 7. Context TTL & Message Count
// ════════════════════════════════════════════════════════════════════════════════

const testContextTTL = () => {
  printSection('7. Context TTL & Message Count');

  const fresh = createEmptyContext();
  assert(!isContextExpired(fresh), 'Fresh context is not expired');

  // Simulate expired context (16 minutes ago)
  const expired: AssistantContext = {
    ...fresh,
    lastUpdated: Date.now() - (16 * 60 * 1000),
  };
  assert(isContextExpired(expired), 'Context 16 min old is expired');

  // Simulate message count exceeded
  const maxedOut: AssistantContext = {
    ...fresh,
    messageCount: 21,
  };
  assert(isContextExpired(maxedOut), 'Context with 21 messages is expired');

  // Touch expired context should reset
  const touched = touchContext(expired);
  assert(touched.messageCount === 0, 'Touching expired context resets message count', String(touched.messageCount));
};

// ════════════════════════════════════════════════════════════════════════════════
// 8. Context Resolution (Follow-Up)
// ════════════════════════════════════════════════════════════════════════════════

const testContextResolution = () => {
  printSection('8. Context Resolution (Follow-Up)');

  // Simulate: user searched for "آيفون", then asks "شنو الألوان ديالو"
  const ctx: AssistantContext = {
    ...createEmptyContext(),
    lastQuery: 'ايفون',
    currentFocusedProduct: { id: 1, name: 'iPhone 16', price: '5000' },
    conversationStage: 'SEARCHING',
  };

  const followUp = analyzeMessage('شنو الألوان ديالو');
  const { enrichedMessage } = resolveContext(followUp, ctx);

  assert(
    enrichedMessage.entities.products !== undefined && enrichedMessage.entities.products.length > 0,
    'Follow-up resolves product from context',
    JSON.stringify(enrichedMessage.entities.products),
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// 9. Stage Transitions
// ════════════════════════════════════════════════════════════════════════════════

const testStageTransitions = () => {
  printSection('9. Stage Transitions');

  const ctx = createEmptyContext();

  // Search → SEARCHING
  const searchMsg = analyzeMessage('بغيت سيروم');
  const r1 = classifyIntent(searchMsg, ctx);
  searchMsg.intent = r1.intent;
  const { updatedContext: ctx1 } = resolveContext(searchMsg, ctx);
  assert(ctx1.conversationStage === 'SEARCHING', 'Search → SEARCHING stage', ctx1.conversationStage);

  // Greeting → GREETING
  const greetMsg = analyzeMessage('سلام');
  const r2 = classifyIntent(greetMsg, ctx);
  greetMsg.intent = r2.intent;
  const { updatedContext: ctx2 } = resolveContext(greetMsg, ctx);
  assert(ctx2.conversationStage === 'GREETING', 'Greeting → GREETING stage', ctx2.conversationStage);
};

// ════════════════════════════════════════════════════════════════════════════════
// 10. Full Pipeline Integration
// ════════════════════════════════════════════════════════════════════════════════

const testFullPipeline = () => {
  printSection('10. Full Pipeline Integration');

  const ctx = createEmptyContext();

  const r1 = processMessage('بغيت كريم لوريال', ctx);
  assert(r1.analyzedMessage.intent === 'SEARCH_PRODUCT', 'Pipeline: search product', r1.analyzedMessage.intent);
  assert(r1.analyzedMessage.entities.brands?.includes('loreal') === true, 'Pipeline: brand extracted', JSON.stringify(r1.analyzedMessage.entities.brands));
  assert(r1.analyzedMessage.entities.products?.includes('cream') === true, 'Pipeline: product extracted', JSON.stringify(r1.analyzedMessage.entities.products));
  assert(r1.analyzedMessage.confidence !== undefined && r1.analyzedMessage.confidence >= 0.85, 'Pipeline: confidence >= 0.85', String(r1.analyzedMessage.confidence));
  assert(r1.contextState.conversationStage === 'SEARCHING', 'Pipeline: stage is SEARCHING', r1.contextState.conversationStage);

  const r2 = processMessage('سلام عليكم', ctx);
  assert(r2.analyzedMessage.intent === 'GREETING', 'Pipeline: greeting', r2.analyzedMessage.intent);

  const r3 = processMessage('شنو عاصمة المغرب', ctx);
  assert(r3.analyzedMessage.intent === 'OUT_OF_SCOPE', 'Pipeline: out of scope', r3.analyzedMessage.intent);
};

// ════════════════════════════════════════════════════════════════════════════════
// Runner
// ════════════════════════════════════════════════════════════════════════════════

export const runBrainTests = () => {
  passed = 0;
  failed = 0;
  failures.length = 0;

  testLanguageDetection();
  testTokenization();
  testSingleEntityExtraction();
  testMultipleEntityExtraction();
  testIntentClassification();
  testOutOfScope();
  testContextTTL();
  testContextResolution();
  testStageTransitions();
  testFullPipeline();

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  if (failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) {
      console.log(`  ${f}`);
    }
  }
  console.log(`════════════════════════════════════════\n`);
};
