import { initializeShoppingDomain } from '../domains/shopping/config';
import { AgentOrchestrator } from '../platform/core/agentOrchestrator';
import { EventBus } from '../platform/core/eventBus';
import { WorldStateManager } from '../platform/core/worldState';
import { MemorySystem } from '../platform/memory/memorySystem';
import { ToolRegistry } from '../platform/tools/registry';
import { CapabilityEngine } from '../platform/capabilities/capabilityEngine';
import { Tracer } from '../platform/telemetry/tracer';

export async function runAgentPlatformTests(): Promise<void> {
  console.log('🧪 Starting Generic AI Agent Platform Integration Tests...\n');

  let passedTests = 0;
  let failedTests = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      failedTests++;
      console.error(`❌ [FAIL] ${testName}`);
    }
  };

  try {
    // تهيئة المكونات والتحليلات
    const eventBus = EventBus.getInstance();
    const worldStateManager = WorldStateManager.getInstance();
    const memorySystem = MemorySystem.getInstance();
    const orchestrator = AgentOrchestrator.getInstance();
    const tracer = Tracer.getInstance();

    // 1. اختبار تهيئة النطاق والتسجيل
    initializeShoppingDomain();
    const tools = ToolRegistry.getInstance().listTools();
    const capabilities = CapabilityEngine.getInstance().resolveCapabilities('روتين عناية بالبشرة', worldStateManager.getState());

    assert(tools.length >= 3, 'Shopping tools registered successfully in ToolRegistry.');
    assert(capabilities.length > 0 && capabilities[0].name === 'Shopping', 'Shopping capability resolved correctly in CapabilityEngine.');

    // 2. اختبار الذاكرة الخماسية (5-Tier Memory)
    memorySystem.resetSession();
    memorySystem.working.set('temp_key', 'working_val');
    memorySystem.session.push({ role: 'user', content: 'hello' });
    memorySystem.longTerm.setUserPreference('favoriteBrand', 'La Roche-Posay');
    memorySystem.longTerm.setUserPreference('skinType', 'oily');

    const workingVal = memorySystem.working.get('temp_key');
    const sessionHistory = memorySystem.session.conversationHistory;
    
    assert(workingVal === 'working_val', 'Working memory working correctly.');
    assert(sessionHistory.length === 1 && sessionHistory[0].content === 'hello', 'Session memory pushing logs correctly.');

    // 3. اختبار دورة حياة الوكيل وتوليد الخطة (End-to-End Orchestrator Flow)
    // سنقوم بمحاكاة طلب المستخدم لروتين عناية
    console.log('\n🤖 Simulating user input: "أريد روتين عناية بالبشرة الدهنية"');
    
    // سنشترك في الأحداث لمراقبة التدفق المعرفي
    let planGenerated = false;
    let executorStarted = false;
    let stepCompleted = false;

    eventBus.subscribe('PLAN_GENERATED', () => {
      planGenerated = true;
    });
    eventBus.subscribe('STEP_STARTED', () => {
      executorStarted = true;
    });
    eventBus.subscribe('STEP_COMPLETED', () => {
      stepCompleted = true;
    });

    try {
      const response = await orchestrator.handleUserInput('أريد روتين عناية بالبشرة الدهنية');
      
      // Wait for the async orchestrator to finish planning & executing
      const { AgentStateMachine } = require('../platform/core/stateMachine');
      const stateMachine = AgentStateMachine.getInstance();
      
      const start = Date.now();
      while (
        stateMachine.getCurrentState() !== 'Completed' &&
        stateMachine.getCurrentState() !== 'Failed' &&
        Date.now() - start < 5000
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      assert(planGenerated, 'Planner generated the execution plan successfully.');
      assert(executorStarted, 'PlanExecutor started execution of steps.');
      assert(stepCompleted, 'Steps completed and resolved dependencies successfully.');
      
      // Since handleUserInput returns early, the final response is in the session memory
      const conversationHistory = memorySystem.session.conversationHistory;
      const finalResponse = conversationHistory[conversationHistory.length - 1]?.content || '';
      assert(finalResponse.includes('روتين') || finalResponse.includes('خطة'), 'AgentOrchestrator returned final response in session history.');
    } catch (err) {
      console.error('E2E orchestrator test failed with error:', err);
    }

    console.log(`\n📊 Test Execution Report: ${passedTests} passed, ${failedTests} failed.`);
    if (failedTests === 0) {
      console.log('🎉 All Agent Platform integration tests completed successfully!');
    } else {
      console.error('⚠️ Some tests failed. Please review logs above.');
      throw new Error('Some Agent Platform integration tests failed');
    }

  } catch (error) {
    console.error('Test execution failed catastrophically:', error);
    throw error;
  }
}

// تشغيل الاختبارات مباشرة إذا تم استدعاء هذا الملف
if (typeof require !== 'undefined' && require.main === module) {
  runAgentPlatformTests();
}
