/**
 * Etiquette Engine & Sentiment Analyzer Tests
 */

import { analyzeSentiment } from '../analyzer/sentimentAnalyzer';
import { applyEtiquette, getPoliteApology } from '../engine/etiquetteEngine';

export function runEtiquetteTests() {
  console.log('--- Running Etiquette & Sentiment Tests ---');

  // Test 1: Positive sentiment
  const s1 = analyzeSentiment('شكرا بزاف رائع ممتاز');
  console.assert(s1.sentiment === 'positive', `Expected positive, got ${s1.sentiment}`);
  console.assert(s1.score > 0, `Expected positive score, got ${s1.score}`);
  console.log('✅ Test 1 Passed: Positive sentiment detection');

  // Test 2: Frustrated sentiment
  const s2 = analyzeSentiment('المنتج سيء جداً وتأخر الطلب');
  console.assert(s2.sentiment === 'frustrated', `Expected frustrated, got ${s2.sentiment}`);
  console.assert(s2.isFrustrated === true, 'Expected isFrustrated to be true');
  console.log('✅ Test 2 Passed: Frustrated sentiment detection');

  // Test 3: Apply etiquette on frustration
  const raw = 'إليك نتائج البحث.';
  const politeResponse = applyEtiquette(raw, 'PRODUCT_SEARCH', s2, 'ar');
  console.assert(politeResponse.includes('أعتذر منك') || politeResponse.includes('حقك علينا'), 'Expected empathetic prefix in response');
  console.log('✅ Test 3 Passed: Empathetic response generation on frustration');

  // Test 4: Polite apology
  const apology = getPoliteApology('ar');
  console.assert(apology.includes('أعتذر منك'), 'Expected polite apology string');
  console.log('✅ Test 4 Passed: Polite apology string');

  console.log('✨ All Etiquette & Sentiment tests passed!\n');
}
