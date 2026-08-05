import { EventBus } from '../kernel/eventBus';
import { TaskScheduler, Task } from '../kernel/taskScheduler';
import { withRetry, CircuitBreaker } from '../kernel/resilience';
import { PluginRegistry } from '../sdk/pluginRegistry';
import { ISkill } from '../sdk/contracts/ISkill';
import { ISkillContext } from '../sdk/contracts/ISkillContext';
import { ISkillManifest } from '../sdk/contracts/types';

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
// 1. Event Bus Tests
// ════════════════════════════════════════════════════════════════════════════════

const testEventBus = async () => {
  printSection('Runtime: Event Bus');
  EventBus.resetInstance();
  const eventBus = EventBus.getInstance();

  let criticalReceived: boolean = false;
  let normalReceivedCount = 0;

  // Subscribe to Critical topic
  eventBus.subscribe('system.alert', (evt) => {
    if (evt.priority === 'CRITICAL') {
      criticalReceived = true;
    }
  });

  // Subscribe to Normal topic
  eventBus.subscribe('user.click', (evt) => {
    normalReceivedCount++;
  });

  // Test immediate execution for CRITICAL
  eventBus.publish({
    id: 'e1',
    topic: 'system.alert',
    payload: { message: 'CPU critical temperature' },
    timestamp: Date.now(),
    priority: 'CRITICAL',
    origin: 'core',
  });

  assert(!!criticalReceived, 'Critical event executed synchronously and immediately');

  // Test async execution for NORMAL
  eventBus.publish({
    id: 'e2',
    topic: 'user.click',
    payload: { elementId: 'buy_button' },
    timestamp: Date.now(),
    priority: 'NORMAL',
    origin: 'ui',
  });

  assert(normalReceivedCount === 0, 'Normal event deferred and did not block current block');

  // Wait for async dispatch
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert(normalReceivedCount === 1, 'Normal event executed asynchronously');
};

// ════════════════════════════════════════════════════════════════════════════════
// 2. Task Scheduler Tests
// ════════════════════════════════════════════════════════════════════════════════

const testTaskScheduler = async () => {
  printSection('Runtime: Task Scheduler');

  const scheduler = new TaskScheduler({ concurrency: 1 });
  const executedOrder: string[] = [];

  const task1: Task = {
    id: 't1',
    name: 'Fetch Products',
    priority: 1,
    execute: async () => {
      executedOrder.push('t1');
      return 'products';
    },
    status: 'PENDING',
  };

  const task2: Task = {
    id: 't2',
    name: 'Calculate Taxes',
    priority: 5, // Higher priority, should run before t1
    execute: async () => {
      executedOrder.push('t2');
      return 100;
    },
    status: 'PENDING',
  };

  scheduler.addTask(task1);
  scheduler.addTask(task2);

  await scheduler.start();

  assert(
    executedOrder[0] === 't2' && executedOrder[1] === 't1',
    'Tasks executed in priority order',
    `Executed: ${executedOrder.join(' -> ')}`
  );
  assert(task1.status === 'COMPLETED' && task1.result === 'products', 'Task 1 completed successfully');
  assert(task2.status === 'COMPLETED' && task2.result === 100, 'Task 2 completed successfully');
};

const testSchedulerCancellationAndPause = async () => {
  printSection('Runtime: Scheduler Pause & Cancellation');

  const scheduler = new TaskScheduler({ concurrency: 1 });
  const executed: string[] = [];

  const taskSlow: Task = {
    id: 'tslow',
    name: 'Slow API Request',
    priority: 10,
    execute: async (signal) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          executed.push('tslow_done');
          resolve('done');
        }, 100);

        signal?.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      });
    },
    status: 'PENDING',
  };

  const taskNext: Task = {
    id: 'tnext',
    name: 'Immediate calculation',
    priority: 5,
    execute: async () => {
      executed.push('tnext_done');
      return 42;
    },
    status: 'PENDING',
  };

  scheduler.addTask(taskSlow);
  scheduler.addTask(taskNext);

  // Start executing slow task
  const runPromise = scheduler.start();

  // Cancel immediately after start
  await new Promise((resolve) => setTimeout(resolve, 10));
  scheduler.cancel();

  await runPromise;

  assert(executed.length === 0, 'No tasks completed after cancellation');
  assert(taskSlow.status === 'CANCELLED', 'Slow task was cancelled');
  assert(taskNext.status === 'CANCELLED', 'Next task in queue was cancelled');

  // Test Pause & Resume
  const scheduler2 = new TaskScheduler({ concurrency: 1 });
  const executed2: string[] = [];

  const t1: Task = {
    id: 't1',
    name: 'Task 1',
    priority: 10,
    execute: async () => {
      executed2.push('t1');
    },
    status: 'PENDING',
  };

  const t2: Task = {
    id: 't2',
    name: 'Task 2',
    priority: 5,
    execute: async () => {
      executed2.push('t2');
    },
    status: 'PENDING',
  };

  scheduler2.addTask(t1);
  scheduler2.addTask(t2);

  // Pause after t1
  const startPromise = scheduler2.start();
  scheduler2.pause();
  await startPromise;

  assert(executed2.includes('t1') && !executed2.includes('t2'), 'Scheduler paused correctly after running first task');
  assert(t2.status === 'PAUSED', 'Next task was set to PAUSED state');

  // Resume scheduler2
  await scheduler2.resume();
  assert(executed2.includes('t2'), 'Scheduler resumed correctly and completed the second task');
  assert(t2.status === 'COMPLETED', 'Second task completed successfully');
};

const testTaskTimeout = async () => {
  printSection('Runtime: Task Timeout protection');

  const scheduler = new TaskScheduler({ concurrency: 1 });
  const t: Task = {
    id: 'timeout_task',
    name: 'Hanging Task',
    priority: 1,
    timeoutMS: 50,
    execute: async () => {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000); // 1000ms delay, exceeds 50ms timeout
      });
    },
    status: 'PENDING',
  };

  scheduler.addTask(t);
  await scheduler.start();

  assert(t.status === 'FAILED', 'Task flagged as failed due to timeout');
  assert(t.error.message.includes('timed out'), 'Valid timeout error message present');
};

// ════════════════════════════════════════════════════════════════════════════════
// 3. Resilience Tests
// ════════════════════════════════════════════════════════════════════════════════

const testRetryPolicy = async () => {
  printSection('Runtime: Resilience Retry Policy');

  let attempts = 0;
  const flakyFunction = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error('Transient network timeout');
    }
    return 'success_payload';
  };

  const result = await withRetry(
    flakyFunction,
    { maxAttempts: 4, baseDelayMS: 5, enableJitter: false }
  );

  assert(result === 'success_payload', 'Flaky function recovered successfully');
  assert(attempts === 3, 'Flaky function retried exactly 3 times before succeeding', String(attempts));
};

const testCircuitBreaker = async () => {
  printSection('Runtime: Circuit Breaker');

  const cb = new CircuitBreaker({ failureThreshold: 2, cooldownPeriodMS: 50 });
  let callCount = 0;

  const failingCall = async () => {
    callCount++;
    throw new Error('API failure');
  };

  const successCall = async () => {
    callCount++;
    return 'ok';
  };

  // Attempt 1: CLOSED -> CLOSED
  try { await cb.execute(failingCall); } catch (e) {}
  assert(cb.getState() === 'CLOSED', 'Circuit closed after 1 failure');

  // Attempt 2: CLOSED -> OPEN (tripped)
  try { await cb.execute(failingCall); } catch (e) {}
  assert(cb.getState() === 'OPEN', 'Circuit opened after 2 failures');

  // Attempt 3: OPEN -> Immediate Block
  let blocked = false;
  try {
    await cb.execute(successCall);
  } catch (err: any) {
    if (err.message.includes('blocked')) blocked = true;
  }
  assert(blocked === true, 'Execution blocked while circuit is open');
  assert(callCount === 2, 'Underlying call not executed when open');

  // Wait for cooldown period
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert(cb.getState() === 'HALF_OPEN', 'Circuit transitioned to HALF_OPEN after cooldown');

  // Successful test request: HALF_OPEN -> CLOSED
  const res = await cb.execute(successCall);
  assert(res === 'ok', 'Execution successful in half-open state');
  assert(cb.getState() === 'CLOSED', 'Circuit breaker reset back to CLOSED');
};

// ════════════════════════════════════════════════════════════════════════════════
// 4. Plugin Registry & Dependency Resolution Tests
// ════════════════════════════════════════════════════════════════════════════════

const testPluginRegistryAndDependencies = async () => {
  printSection('Runtime: Plugin Registry & Dependency Resolver');
  PluginRegistry.resetInstance();
  const registry = PluginRegistry.getInstance();

  const manifestA: ISkillManifest = {
    id: 'org.kataraa.cart',
    name: 'Cart Skill',
    version: '1.0.0',
    description: 'Cart Management',
    author: 'Admin',
    compatibility: { coreVersion: '^1.0.0', platform: ['node'] },
    dependencies: { 'org.kataraa.search': '1.0.0' }, // Depends on Search
    permissions: { required: ['STORAGE'], optional: [] },
    capabilities: [{ name: 'CartCapability', description: 'Cart ops', tools: ['add_to_cart'] }],
    tools: [{ name: 'add_to_cart', description: 'Add item', inputSchema: {} }],
  };

  const manifestB: ISkillManifest = {
    id: 'org.kataraa.search',
    name: 'Search Skill',
    version: '1.0.0',
    description: 'Product Finder',
    author: 'Admin',
    compatibility: { coreVersion: '^1.0.0', platform: ['node'] },
    dependencies: {},
    permissions: { required: [], optional: [] },
    capabilities: [{ name: 'SearchCapability', description: 'Find products', tools: ['search_items'] }],
    tools: [{ name: 'search_items', description: 'Search items', inputSchema: {} }],
  };

  class MockCartSkill implements ISkill {
    manifest = manifestA;
    context!: ISkillContext;
    async initialize(context: ISkillContext) { this.context = context; }
    async activate() {}
    async deactivate() {}
    async terminate() {}
    async executeTool(name: string, args: any) {
      if (name === 'add_to_cart') return { success: true };
      throw new Error('Not found');
    }
  }

  class MockSearchSkill implements ISkill {
    manifest = manifestB;
    context!: ISkillContext;
    async initialize(context: ISkillContext) { this.context = context; }
    async activate() {}
    async deactivate() {}
    async terminate() {}
    async executeTool(name: string, args: any) {
      if (name === 'search_items') return { items: ['serum'] };
      throw new Error('Not found');
    }
  }

  const cartSkill = new MockCartSkill();
  const searchSkill = new MockSearchSkill();

  registry.register(cartSkill);
  registry.register(searchSkill);

  // Check topological ordering resolver
  const order = registry.resolveDependencyOrder();
  assert(
    order.indexOf('org.kataraa.search') < order.indexOf('org.kataraa.cart'),
    'Dependency org.kataraa.search resolved BEFORE org.kataraa.cart',
    `Resolved order: ${order.join(' -> ')}`
  );

  // Initialize and Activate
  await registry.initializeAll();
  assert(registry.getSkillState('org.kataraa.cart') === 'INITIALIZED', 'Cart initialized');
  assert(registry.getSkillState('org.kataraa.search') === 'INITIALIZED', 'Search initialized');

  await registry.activateAll();
  assert(registry.getSkillState('org.kataraa.cart') === 'ACTIVATED', 'Cart activated');

  // Verify Capability-to-Tool routing
  const capRoute = registry.resolveCapabilityTool('CartCapability');
  assert(capRoute !== null && capRoute.toolName === 'add_to_cart', 'Capability CartCapability routes to add_to_cart');

  // Verify dynamic tool execution routing
  const execResult = await registry.executeTool('search_items', {});
  assert(
    execResult.items !== undefined && execResult.items[0] === 'serum',
    'Tool routed and executed successfully',
    JSON.stringify(execResult)
  );

  // Scoped context storage testing
  await cartSkill.context.storage.set('user_pref_color', 'blue');
  const stored = await cartSkill.context.storage.get('user_pref_color');
  assert(stored === 'blue', 'Plugin scoped storage reads and writes correctly');
};

const testCircularDependencies = () => {
  printSection('Runtime: Circular Dependency Checks');
  PluginRegistry.resetInstance();
  const registry = PluginRegistry.getInstance();

  const manifest1: ISkillManifest = {
    id: 'plugin-1',
    name: 'P1',
    version: '1.0.0',
    description: 'P1',
    author: 'Admin',
    compatibility: { coreVersion: '^1.0.0', platform: ['node'] },
    dependencies: { 'plugin-2': '1.0.0' },
    permissions: { required: [], optional: [] },
    capabilities: [],
    tools: [],
  };

  const manifest2: ISkillManifest = {
    id: 'plugin-2',
    name: 'P2',
    version: '1.0.0',
    description: 'P2',
    author: 'Admin',
    compatibility: { coreVersion: '^1.0.0', platform: ['node'] },
    dependencies: { 'plugin-1': '1.0.0' }, // Circular dependency
    permissions: { required: [], optional: [] },
    capabilities: [],
    tools: [],
  };

  class Dummy1 implements ISkill {
    manifest = manifest1;
    async initialize() {}
    async activate() {}
    async deactivate() {}
    async terminate() {}
    async executeTool() { return {}; }
  }

  class Dummy2 implements ISkill {
    manifest = manifest2;
    async initialize() {}
    async activate() {}
    async deactivate() {}
    async terminate() {}
    async executeTool() { return {}; }
  }

  registry.register(new Dummy1());
  registry.register(new Dummy2());

  let threwCircular = false;
  try {
    registry.resolveDependencyOrder();
  } catch (err: any) {
    if (err.message.includes('Circular dependency')) {
      threwCircular = true;
    }
  }
  assert(threwCircular === true, 'Registry correctly catches and throws on circular dependency graphs');
};

// ════════════════════════════════════════════════════════════════════════════════
// Runner
// ════════════════════════════════════════════════════════════════════════════════

export const runRuntimeTests = async () => {
  passed = 0;
  failed = 0;
  failures.length = 0;

  await testEventBus();
  await testTaskScheduler();
  await testSchedulerCancellationAndPause();
  await testTaskTimeout();
  await testRetryPolicy();
  await testCircuitBreaker();
  await testPluginRegistryAndDependencies();
  testCircularDependencies();

  console.log(`\n════════════════════════════════════════`);
  console.log(`⚙️ Runtime Tests:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  if (failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) {
      console.log(`  ${f}`);
    }
  }
  console.log(`════════════════════════════════════════\n`);

  if (failed > 0) {
    throw new Error(`${failed} runtime tests failed`);
  }
};
