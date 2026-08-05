/**
 * Test Runner — تشغيل اختبارات IntentEngine
 * 
 * يمكن تشغيله عبر: npx ts-node src/assistant/tests/runTests.ts
 * أو استيراده في Console المطور
 */

import './setup';
import { runAllTests } from './intentEngine.test';
import { runBrainTests } from './brain.test';
import { runAgentPlatformTests } from './agentPlatform.test';
import { runRuntimeTests } from './runtime.test';
import { runPluginTests } from './plugins.test';
import { runEtiquetteTests } from './etiquette.test';

async function execute() {
  console.log('🚀 Starting Intent Engine Tests...\n');
  runAllTests();

  console.log('\n🧠 Starting Core Brain Pipeline Tests...\n');
  runBrainTests();

  console.log('\n🧠 Starting Generic AI Agent Platform Tests...\n');
  await runAgentPlatformTests();

  console.log('\n⚙️ Starting AI Runtime Engine & Skill SDK Tests...\n');
  await runRuntimeTests();

  console.log('\n🧩 Starting Plugin Migration Tests (Sprint 2)...\n');
  await runPluginTests();

  console.log('\n🤝 Starting Etiquette & Customer Sentiment Tests...\n');
  runEtiquetteTests();

  console.log('\n✅ All test suites completed successfully!');
}

execute().catch((err) => {
  console.error('\n❌ Tests execution failed:', err);
  process.exit(1);
});
