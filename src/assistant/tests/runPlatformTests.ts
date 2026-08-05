/**
 * Standalone Agent Platform Test Runner
 * يمكن تشغيله مباشرة: npx tsx src/assistant/tests/runPlatformTests.ts
 */

// @ts-nocheck
(globalThis as any).__DEV__ = true;

// ── محاكاة وحدة التخزين المحلية للذاكرة طويلة المدى ──────────────────────
// الذاكرة ستستخدم تلقائياً التخزين الوهمي (In-Memory Fallback) في بيئة اختبارات Node.

// ── محاكاة api module ───────────────────────────────────────────────────────
const mockApi = {
  searchProducts: async (query: string) => {
    return [
      { id: 'prod_1', name: 'غسول CeraVe', category: 'cleanser', price: 120 },
      { id: 'prod_2', name: 'مرطب La Roche-Posay Effaclar', category: 'moisturizer', price: 200 },
    ];
  },
  getProduct: async (id: string) => {
    return { id, name: `Product ${id}`, price: 150 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات مستقلة للتحقق من المكونات الأساسية للمنصة
// ═══════════════════════════════════════════════════════════════════════════

async function runPlatformTests() {
  console.log('🧪 ═══ Generic AI Agent Platform — Integration Tests ═══\n');
  
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      passed++;
      console.log(`  ✅ ${name}`);
    } else {
      failed++;
      console.error(`  ❌ ${name}`);
    }
  }

  // ─── 1. EventBus Tests ─────────────────────────────────────────────────
  console.log('\n📢 EventBus Tests:');
  {
    const { EventBus } = require('../platform/core/eventBus');
    const bus = EventBus.getInstance();
    bus.clearHistory();

    let received = false;
    const subId = bus.subscribe('USER_INPUT_RECEIVED', () => { received = true; });
    
    bus.publish({
      id: 'test_1',
      type: 'USER_INPUT_RECEIVED',
      timestamp: Date.now(),
      payload: { text: 'hello' },
      metadata: { sessionId: 's1', correlationId: 'c1', actor: 'USER' },
    });

    assert(received === true, 'EventBus delivers events to subscribers');
    assert(bus.getHistory().length === 1, 'EventBus records event history');
    assert(bus.getHistory('c1').length === 1, 'EventBus filters by correlationId');
    
    bus.unsubscribe(subId);
    received = false;
    bus.publish({
      id: 'test_2',
      type: 'USER_INPUT_RECEIVED',
      timestamp: Date.now(),
      payload: {},
      metadata: { sessionId: 's1', correlationId: 'c2', actor: 'USER' },
    });
    assert(received === false, 'EventBus stops delivering after unsubscribe');

    // Wildcard subscriber
    let wildcardReceived = false;
    const wildId = bus.subscribe('*', () => { wildcardReceived = true; });
    bus.publish({
      id: 'test_3',
      type: 'PLAN_GENERATED',
      timestamp: Date.now(),
      payload: {},
      metadata: { sessionId: 's1', correlationId: 'c3', actor: 'PLANNER' },
    });
    assert(wildcardReceived === true, 'EventBus wildcard subscriber receives all events');
    bus.unsubscribe(wildId);
  }

  // ─── 2. WorldState Tests ───────────────────────────────────────────────
  console.log('\n🌍 WorldState Tests:');
  {
    const { WorldStateManager } = require('../platform/core/worldState');
    const ws = WorldStateManager.getInstance();
    ws.reset();

    const state = ws.getState();
    assert(state.user.id === null, 'WorldState initializes with null user');
    assert(state.app.currentScreen === 'Home', 'WorldState initializes with Home screen');

    ws.updateUser({ id: 'user_123', isAuthenticated: true });
    assert(ws.getState().user.id === 'user_123', 'WorldState updates user correctly');

    ws.updateApp({ currentScreen: 'Products' });
    assert(ws.getState().app.currentScreen === 'Products', 'WorldState updates app screen');
    assert(ws.getState().app.navigationHistory.includes('Home'), 'WorldState tracks navigation history');

    ws.updateDomain('cart', { items: [{ id: 'p1' }] });
    assert(ws.getState().domain.cart.items.length === 1, 'WorldState updates domain data');

    ws.updateToolStatus('search_products', 'RUNNING');
    assert(ws.getState().runningTools['search_products'].status === 'RUNNING', 'WorldState tracks tool status');

    ws.updateTemporaryData('step_1', { results: [1, 2, 3] });
    assert(ws.getState().temporaryData['step_1'].results.length === 3, 'WorldState stores temporary data');

    ws.clearTemporaryData();
    assert(Object.keys(ws.getState().temporaryData).length === 0, 'WorldState clears temporary data');
  }

  // ─── 3. StateMachine Tests ─────────────────────────────────────────────
  console.log('\n🔄 StateMachine Tests:');
  {
    const { AgentStateMachine } = require('../platform/core/stateMachine');
    const sm = AgentStateMachine.getInstance();
    sm.reset();

    assert(sm.getCurrentState() === 'Idle', 'StateMachine starts in Idle state');

    sm.transitionTo('Listening');
    assert(sm.getCurrentState() === 'Listening', 'StateMachine transitions to Listening');

    sm.transitionTo('Thinking');
    assert(sm.getCurrentState() === 'Thinking', 'StateMachine transitions to Thinking');

    sm.transitionTo('Planning');
    assert(sm.getCurrentState() === 'Planning', 'StateMachine transitions to Planning');

    sm.transitionTo('Executing');
    assert(sm.getCurrentState() === 'Executing', 'StateMachine transitions to Executing');

    sm.transitionTo('Summarizing');
    assert(sm.getCurrentState() === 'Summarizing', 'StateMachine transitions to Summarizing');

    sm.transitionTo('Speaking');
    assert(sm.getCurrentState() === 'Speaking', 'StateMachine transitions to Speaking');

    sm.transitionTo('Completed');
    assert(sm.getCurrentState() === 'Completed', 'StateMachine transitions to Completed');

    sm.transitionTo('Idle');
    assert(sm.getCurrentState() === 'Idle', 'StateMachine resets to Idle');
  }

  // ─── 4. Memory System Tests ────────────────────────────────────────────
  console.log('\n🧠 Memory System Tests:');
  {
    const { WorkingMemory } = require('../platform/memory/workingMemory');
    const { SessionMemory } = require('../platform/memory/sessionMemory');
    const { SemanticMemory } = require('../platform/memory/semanticMemory');

    // Working Memory
    const wm = new WorkingMemory();
    wm.set('key1', 'value1');
    assert(wm.get('key1') === 'value1', 'WorkingMemory stores and retrieves values');
    wm.clear();
    assert(wm.get('key1') === undefined, 'WorkingMemory clears correctly');

    // Session Memory
    const sm = new SessionMemory();
    sm.push({ role: 'user', content: 'بغيت سيروم' });
    sm.push({ role: 'assistant', content: 'ها هو السيروم' });
    assert(sm.conversationHistory.length === 2, 'SessionMemory tracks conversation');
    sm.lastSearchResults = [{ id: 1 }, { id: 2 }];
    assert(sm.lastSearchResults.length === 2, 'SessionMemory stores search results');
    sm.clear();
    assert(sm.conversationHistory.length === 0, 'SessionMemory clears correctly');

    // Semantic Memory
    const sem = new SemanticMemory();
    const serumFacts = await sem.query('serum');
    assert(serumFacts.length > 0, 'SemanticMemory returns facts for known concepts');
    assert(serumFacts.some((f: string) => f.includes('واقي شمس')), 'SemanticMemory returns relevant skincare knowledge');

    const unknownFacts = await sem.query('xyznonexistent');
    assert(unknownFacts.length === 0, 'SemanticMemory returns empty for unknown concepts');

    sem.addConcept('retinol', ['يُستخدم ليلاً فقط', 'يحتاج واقي شمس في اليوم التالي']);
    const retinolFacts = await sem.query('retinol');
    assert(retinolFacts.length === 2, 'SemanticMemory dynamically adds concepts');
  }

  // ─── 5. Tool Registry & Capability Engine Tests ────────────────────────
  console.log('\n🔧 Tool Registry & Capability Engine Tests:');
  {
    const { ToolRegistry } = require('../platform/tools/registry');
    const { CapabilityEngine } = require('../platform/capabilities/capabilityEngine');
    const { WorldStateManager } = require('../platform/core/worldState');

    const registry = ToolRegistry.getInstance();
    registry.clear();

    // Mock tool
    const mockTool = {
      definition: {
        name: 'mock_search',
        description: 'Mock search tool',
        parameters: [],
        outputSchema: {},
      },
      execute: async () => [{ id: 'p1', name: 'Test Product' }],
    };

    registry.register(mockTool);
    assert(registry.listTools().length === 1, 'ToolRegistry registers tools');
    assert(registry.resolve('mock_search') !== undefined, 'ToolRegistry resolves tools by name');

    registry.unregister('mock_search');
    assert(registry.resolve('mock_search') === undefined, 'ToolRegistry unregisters tools');

    // Capability Engine
    const capEngine = CapabilityEngine.getInstance();
    capEngine.clear();
    registry.register(mockTool);

    capEngine.registerCapability({
      name: 'TestCap',
      description: 'test capability for searching products',
      toolNames: ['mock_search'],
      domains: ['test'],
      isAvailable: () => true,
    });

    const ws = WorldStateManager.getInstance();
    const caps = capEngine.resolveCapabilities('search products', ws.getState());
    assert(caps.length > 0, 'CapabilityEngine resolves capabilities for goal text');
    assert(caps[0].name === 'TestCap', 'CapabilityEngine returns correct capability');

    const tool = capEngine.selectTool('TestCap', 'search', ws.getState());
    assert(tool.definition.name === 'mock_search', 'CapabilityEngine selects correct tool');
  }

  // ─── 6. GoalManager Tests ─────────────────────────────────────────────
  console.log('\n🎯 GoalManager Tests:');
  {
    const { GoalManager } = require('../platform/goals/goalManager');
    const gm = GoalManager.getInstance();
    gm.clear();

    const goal1 = {
      id: 'g1', description: 'ضيف المنتج للسلة', priority: 'NORMAL' as const,
      status: 'QUEUED' as const, createdAt: Date.now(), metadata: {},
    };
    const goal2 = {
      id: 'g2', description: 'بحث عن سيروم', priority: 'HIGH' as const,
      status: 'QUEUED' as const, createdAt: Date.now() + 1, metadata: {},
    };

    gm.enqueue(goal1);
    assert(gm.getQueue().length >= 1, 'GoalManager enqueues goals');

    const active = gm.getActiveGoal();
    assert(active !== undefined, 'GoalManager auto-activates first goal');
    assert(active!.id === 'g1', 'GoalManager activates correct goal');

    gm.cancel('g1', 'Test cancel');
    const afterCancel = gm.getQueue().find((g: any) => g.id === 'g1');
    assert(afterCancel?.status === 'CANCELLED', 'GoalManager cancels goals');

    gm.enqueue(goal2);
    const newActive = gm.getActiveGoal();
    assert(newActive?.id === 'g2', 'GoalManager activates next goal after cancellation');
  }

  // ─── 7. Planner Tests ─────────────────────────────────────────────────
  console.log('\n📋 Planner Tests:');
  {
    const { Planner } = require('../platform/planning/planner');
    const { WorldStateManager } = require('../platform/core/worldState');
    const { CapabilityEngine } = require('../platform/capabilities/capabilityEngine');

    const planner = Planner.getInstance();
    const ws = WorldStateManager.getInstance();

    // Test routine strategy
    const plan = await planner.generatePlan({
      goalId: 'test_goal_1',
      goalText: 'روتين عناية بالبشرة الدهنية',
      worldState: ws.getState(),
      strategy: 'CreateRoutineFlow',
      constraints: ['بشرة دهنية'],
    });

    assert(plan.steps.length >= 3, 'Planner generates multi-step plan for routine');
    assert(plan.steps[0].name === 'SearchCleanser', 'Planner creates cleanser search step');
    assert(plan.steps[1].name === 'SearchMoisturizer', 'Planner creates moisturizer search step');
    assert(plan.steps[2].dependencies.length > 0, 'Planner sets correct dependencies');

    // Test simple command strategy
    const simplePlan = await planner.generatePlan({
      goalId: 'test_goal_2',
      goalText: 'فرغ السلة',
      worldState: ws.getState(),
      strategy: 'DirectCommandExecution',
      constraints: [],
    });

    assert(simplePlan.steps.length === 1, 'Planner generates single-step plan for simple command');
  }

  // ─── 8. ReasoningEngine Tests ─────────────────────────────────────────
  console.log('\n🧩 ReasoningEngine Tests:');
  {
    const { ReasoningEngine } = require('../platform/reasoning/reasoningEngine');
    const { MemorySystem } = require('../platform/memory/memorySystem');

    const re = ReasoningEngine.getInstance();
    const mem = MemorySystem.getInstance();
    mem.resetSession();
    
    const { WorldStateManager } = require('../platform/core/worldState');
    const ws = WorldStateManager.getInstance();

    // Test feasible goal
    const result = await re.reason('روتين عناية بالبشرة الدهنية', ws.getState(), mem);
    assert(result.isFeasible === true, 'ReasoningEngine accepts feasible goals');
    assert(result.recommendedStrategy === 'CreateRoutineFlow', 'ReasoningEngine selects correct strategy');
    assert(result.thought.confidenceScore >= 0.9, 'ReasoningEngine has high confidence for clear goals');

    // Test infeasible goal (very low budget)
    const infeasible = await re.reason('روتين عناية بميزانية 5 درهم', ws.getState(), mem);
    assert(infeasible.isFeasible === false, 'ReasoningEngine rejects infeasible goals');
    assert(infeasible.rejectionReason !== undefined, 'ReasoningEngine provides rejection reason');

    // Test plan verification
    const validPlan = { steps: [{ name: 'search' }, { name: 'add' }] };
    const check = await re.verifyPlan(validPlan, ws.getState());
    assert(check.isValid === true, 'ReasoningEngine validates correct plans');

    const emptyPlan = { steps: [] };
    const emptyCheck = await re.verifyPlan(emptyPlan, ws.getState());
    assert(emptyCheck.isValid === false, 'ReasoningEngine rejects empty plans');

    const conflictPlan = { steps: [{ name: 'add item' }, { name: 'clear all' }] };
    const conflictCheck = await re.verifyPlan(conflictPlan, ws.getState());
    assert(conflictCheck.isValid === false, 'ReasoningEngine detects conflicting plan steps');
  }

  // ─── 9. SelfEvaluator Tests ───────────────────────────────────────────
  console.log('\n🔍 SelfEvaluator Tests:');
  {
    const { SelfEvaluator } = require('../platform/evaluation/selfEvaluator');
    const { WorldStateManager } = require('../platform/core/worldState');

    const evaluator = SelfEvaluator.getInstance();
    const ws = WorldStateManager.getInstance();

    // Test successful step evaluation
    const successStep = {
      id: 's1', name: 'SearchCleanser', status: 'COMPLETED',
      retryCount: 0, maxRetries: 2, errorMessage: undefined,
    };
    const evalResult = await evaluator.evaluateStep(successStep, [{ id: 'p1' }], ws.getState());
    assert(evalResult.isSuccessful === true, 'SelfEvaluator marks successful steps correctly');
    assert(evalResult.qualityScore === 1.0, 'SelfEvaluator gives full quality for success');

    // Test empty search results
    const emptyResult = await evaluator.evaluateStep(successStep, [], ws.getState());
    assert(emptyResult.deviationDetected === true, 'SelfEvaluator detects empty search deviation');
    assert(emptyResult.correctiveAction === 'REPLAN', 'SelfEvaluator suggests replan for empty results');

    // Test failed step
    const failStep = {
      id: 's2', name: 'CartAdd', status: 'FAILED',
      retryCount: 0, maxRetries: 2, errorMessage: 'Network error',
    };
    const failEval = await evaluator.evaluateStep(failStep, null, ws.getState());
    assert(failEval.isSuccessful === false, 'SelfEvaluator marks failed steps correctly');
    assert(failEval.correctiveAction === 'RETRY', 'SelfEvaluator suggests retry when retries available');

    // Test final plan evaluation
    const completePlan = {
      steps: [
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'SKIPPED' },
      ],
    };
    const finalEval = await evaluator.evaluateFinalOutput(completePlan as any, ws.getState());
    assert(finalEval.isGoalAchieved === true, 'SelfEvaluator confirms goal achievement at 75%+');
    assert(finalEval.overallQuality === 0.75, 'SelfEvaluator calculates correct quality score');
  }

  // ─── 10. Tracer Tests ─────────────────────────────────────────────────
  console.log('\n📊 Tracer Tests:');
  {
    const { Tracer } = require('../platform/telemetry/tracer');
    const { EventBus } = require('../platform/core/eventBus');

    const tracer = Tracer.getInstance();
    tracer.clearLogs();
    const bus = EventBus.getInstance();

    bus.publish({
      id: 'trace_test',
      type: 'STEP_STARTED',
      timestamp: Date.now(),
      payload: { stepId: 'st1', stepName: 'TestStep' },
      metadata: { sessionId: 's1', correlationId: 'ct1', actor: 'EXECUTOR' },
    });

    assert(tracer.getLogs().length > 0, 'Tracer captures events from EventBus');
    assert(tracer.getLogs()[tracer.getLogs().length - 1].includes('STEP_STARTED'), 'Tracer logs contain event type');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // النتيجة النهائية
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed === 0) {
    console.log('🎉 ALL AGENT PLATFORM TESTS PASSED! ✨');
  } else {
    console.error(`⚠️  ${failed} test(s) failed. Review output above.`);
    process.exit(1);
  }
  console.log('═══════════════════════════════════════════════════════\n');
}

runPlatformTests().catch(console.error);
