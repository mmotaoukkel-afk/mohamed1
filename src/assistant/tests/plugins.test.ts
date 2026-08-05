/**
 * Plugins Test Suite — Sprint 2
 *
 * Tests the full lifecycle of all 6 migrated plugins:
 *   1. SearchPlugin
 *   2. CartPlugin
 *   3. NavigationPlugin
 *   4. WishlistPlugin
 *   5. ReviewPlugin
 *   6. RatingPlugin
 *
 * Also tests:
 *   - PluginRegistry lifecycle (register → initialize → activate → execute → deactivate)
 *   - Bridge adapter (ISkill → legacy ToolRegistry + CapabilityEngine)
 *   - EventBus scoped communication
 *   - Scoped storage isolation
 */

import './setup';
import { PluginRegistry } from '../sdk/pluginRegistry';
import { EventBus } from '../kernel/eventBus';
import { ToolRegistry } from '../platform/tools/registry';
import { CapabilityEngine } from '../platform/capabilities/capabilityEngine';
import { SearchPlugin } from '../plugins/search-plugin';
import { CartPlugin } from '../plugins/cart-plugin';
import { NavigationPlugin } from '../plugins/navigation-plugin';
import { WishlistPlugin } from '../plugins/wishlist-plugin';
import { ReviewPlugin } from '../plugins/review-plugin';
import { RatingPlugin } from '../plugins/rating-plugin';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ ${testName}`);
  }
}

async function assertAsync(fn: () => Promise<boolean>, testName: string): Promise<void> {
  try {
    const result = await fn();
    assert(result, testName);
  } catch (err: any) {
    failed++;
    console.error(`  ❌ ${testName} — threw: ${err.message}`);
  }
}

async function assertThrowsAsync(fn: () => Promise<any>, testName: string): Promise<void> {
  try {
    await fn();
    failed++;
    console.error(`  ❌ ${testName} — expected throw, but succeeded`);
  } catch (err: any) {
    passed++;
    console.log(`  ✅ ${testName} (threw: "${err.message.substring(0, 60)}...")`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Plugin Registration & Lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

async function testPluginLifecycle() {
  console.log('\n📦 Section 1: Plugin Registration & Lifecycle\n');

  PluginRegistry.resetInstance();
  EventBus.resetInstance();
  const registry = PluginRegistry.getInstance();

  const search = new SearchPlugin();
  const cart = new CartPlugin();
  const nav = new NavigationPlugin();
  const wishlist = new WishlistPlugin();
  const review = new ReviewPlugin();
  const rating = new RatingPlugin();

  // 1.1 Registration
  registry.register(search);
  registry.register(cart);
  registry.register(nav);
  registry.register(wishlist);
  registry.register(review);
  registry.register(rating);

  assert(registry.getSkillState('org.kataraa.search') === 'REGISTERED', 'SearchPlugin registered');
  assert(registry.getSkillState('org.kataraa.cart') === 'REGISTERED', 'CartPlugin registered');
  assert(registry.getSkillState('org.kataraa.navigation') === 'REGISTERED', 'NavigationPlugin registered');
  assert(registry.getSkillState('org.kataraa.wishlist') === 'REGISTERED', 'WishlistPlugin registered');
  assert(registry.getSkillState('org.kataraa.review') === 'REGISTERED', 'ReviewPlugin registered');
  assert(registry.getSkillState('org.kataraa.rating') === 'REGISTERED', 'RatingPlugin registered');

  // 1.2 Dependency resolution (no dependencies = any order is valid)
  const order = registry.resolveDependencyOrder();
  assert(order.length === 6, 'Dependency resolution returns all 6 plugins');

  // 1.3 Initialize
  await registry.initializeAll();
  assert(registry.getSkillState('org.kataraa.search') === 'INITIALIZED', 'SearchPlugin initialized');
  assert(registry.getSkillState('org.kataraa.cart') === 'INITIALIZED', 'CartPlugin initialized');
  assert(registry.getSkillState('org.kataraa.wishlist') === 'INITIALIZED', 'WishlistPlugin initialized');

  // 1.4 Activate
  await registry.activateAll();
  assert(registry.getSkillState('org.kataraa.search') === 'ACTIVATED', 'SearchPlugin activated');
  assert(registry.getSkillState('org.kataraa.cart') === 'ACTIVATED', 'CartPlugin activated');
  assert(registry.getSkillState('org.kataraa.navigation') === 'ACTIVATED', 'NavigationPlugin activated');
  assert(registry.getSkillState('org.kataraa.wishlist') === 'ACTIVATED', 'WishlistPlugin activated');
  assert(registry.getSkillState('org.kataraa.review') === 'ACTIVATED', 'ReviewPlugin activated');
  assert(registry.getSkillState('org.kataraa.rating') === 'ACTIVATED', 'RatingPlugin activated');

  // 1.5 Permissions auto-granted
  const searchPerms = registry.getPermissions('org.kataraa.search');
  assert(searchPerms.has('NETWORK'), 'SearchPlugin has NETWORK permission');

  const cartPerms = registry.getPermissions('org.kataraa.cart');
  assert(cartPerms.has('STORAGE'), 'CartPlugin has STORAGE permission');

  // 1.6 Deactivation
  await registry.deactivateSkill('org.kataraa.navigation');
  assert(registry.getSkillState('org.kataraa.navigation') === 'DISABLED', 'NavigationPlugin deactivated to DISABLED');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: Tool Execution through PluginRegistry
// ═══════════════════════════════════════════════════════════════════════════════

async function testToolExecution() {
  console.log('\n🔧 Section 2: Tool Execution through PluginRegistry\n');

  PluginRegistry.resetInstance();
  EventBus.resetInstance();
  const registry = PluginRegistry.getInstance();

  registry.register(new SearchPlugin());
  registry.register(new CartPlugin());
  registry.register(new NavigationPlugin());
  registry.register(new WishlistPlugin());
  registry.register(new ReviewPlugin());
  registry.register(new RatingPlugin());

  await registry.initializeAll();
  await registry.activateAll();

  // 2.1 Search tool
  await assertAsync(async () => {
    const result = await registry.executeTool('search_products', { query: 'غسول' });
    return result.items && result.items.length > 0;
  }, 'search_products returns items');

  // 2.2 Cart tools
  await assertAsync(async () => {
    const result = await registry.executeTool('cart_add', { productId: 'prod_1' });
    return result.success === true && result.action === 'add';
  }, 'cart_add dispatches successfully');

  await assertAsync(async () => {
    const result = await registry.executeTool('cart_remove', { productId: 'prod_1' });
    return result.success === true && result.action === 'remove';
  }, 'cart_remove dispatches successfully');

  await assertAsync(async () => {
    const result = await registry.executeTool('cart_clear', {});
    return result.success === true && result.action === 'clear';
  }, 'cart_clear dispatches successfully');

  // 2.3 Navigation tool
  await assertAsync(async () => {
    const result = await registry.executeTool('navigate_to', { screen: 'Home' });
    return result.success === true && result.screen === 'Home';
  }, 'navigate_to navigates to Home');

  // 2.4 Wishlist tools
  await assertAsync(async () => {
    const result = await registry.executeTool('wishlist_add', { productId: 'prod_42' });
    return result.success === true && result.totalItems === 1;
  }, 'wishlist_add adds item');

  await assertAsync(async () => {
    const result = await registry.executeTool('wishlist_add', { productId: 'prod_42' });
    return result.success === false; // already exists
  }, 'wishlist_add rejects duplicate');

  await assertAsync(async () => {
    const result = await registry.executeTool('wishlist_list', {});
    return result.items.length === 1 && result.items[0] === 'prod_42';
  }, 'wishlist_list returns items');

  await assertAsync(async () => {
    const result = await registry.executeTool('wishlist_remove', { productId: 'prod_42' });
    return result.success === true && result.totalItems === 0;
  }, 'wishlist_remove removes item');

  // 2.5 Review tools
  await assertAsync(async () => {
    const result = await registry.executeTool('review_submit', { productId: 'prod_1', text: 'ممتاز!' });
    return result.success === true && result.textLength === 6;
  }, 'review_submit submits review');

  await assertAsync(async () => {
    const result = await registry.executeTool('review_generate', { productId: 'prod_1', tone: 'positive', length: 'short' });
    return result.success === true && result.generatedText.length > 0;
  }, 'review_generate generates text');

  // 2.6 Rating tools
  await assertAsync(async () => {
    const result = await registry.executeTool('rating_submit', { productId: 'prod_1', stars: 5 });
    return result.success === true && result.stars === 5;
  }, 'rating_submit submits 5 stars');

  await assertAsync(async () => {
    const result = await registry.executeTool('rating_submit', { productId: 'prod_1', stars: 6 });
    return result.success === false; // invalid range
  }, 'rating_submit rejects out-of-range value');

  await assertAsync(async () => {
    const result = await registry.executeTool('rating_get', { productId: 'prod_1' });
    return result.hasRating === true && result.stars === 5;
  }, 'rating_get returns saved rating');

  await assertAsync(async () => {
    const result = await registry.executeTool('rating_get', { productId: 'prod_999' });
    return result.hasRating === false && result.stars === null;
  }, 'rating_get returns null for unrated product');

  // 2.7 Unknown tool
  await assertThrowsAsync(async () => {
    await registry.executeTool('non_existent_tool', {});
  }, 'executeTool throws for unknown tool');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Capability Routing
// ═══════════════════════════════════════════════════════════════════════════════

async function testCapabilityRouting() {
  console.log('\n🧭 Section 3: Capability Routing\n');

  PluginRegistry.resetInstance();
  EventBus.resetInstance();
  const registry = PluginRegistry.getInstance();

  registry.register(new SearchPlugin());
  registry.register(new CartPlugin());
  registry.register(new NavigationPlugin());
  registry.register(new WishlistPlugin());
  registry.register(new ReviewPlugin());
  registry.register(new RatingPlugin());

  await registry.initializeAll();
  await registry.activateAll();

  // 3.1 Resolve search capability
  const searchCap = registry.resolveCapabilityTool('SearchCapability');
  assert(searchCap !== null && searchCap!.toolName === 'search_products', 'SearchCapability routes to search_products');

  // 3.2 Resolve cart capability
  const cartCap = registry.resolveCapabilityTool('CartCapability');
  assert(cartCap !== null && cartCap!.toolName === 'cart_add', 'CartCapability routes to cart_add (first tool)');

  // 3.3 Resolve navigation capability
  const navCap = registry.resolveCapabilityTool('NavigationCapability');
  assert(navCap !== null && navCap!.toolName === 'navigate_to', 'NavigationCapability routes to navigate_to');

  // 3.4 Resolve wishlist capability
  const wishCap = registry.resolveCapabilityTool('WishlistCapability');
  assert(wishCap !== null && wishCap!.toolName === 'wishlist_add', 'WishlistCapability routes to wishlist_add');

  // 3.5 Resolve review capability
  const revCap = registry.resolveCapabilityTool('ReviewCapability');
  assert(revCap !== null && revCap!.toolName === 'review_submit', 'ReviewCapability routes to review_submit');

  // 3.6 Resolve rating capability
  const ratCap = registry.resolveCapabilityTool('RatingCapability');
  assert(ratCap !== null && ratCap!.toolName === 'rating_submit', 'RatingCapability routes to rating_submit');

  // 3.7 Non-existent capability
  const nonExist = registry.resolveCapabilityTool('NonExistentCapability');
  assert(nonExist === null, 'Non-existent capability returns null');

  // 3.8 Deactivated skill not resolved
  await registry.deactivateSkill('org.kataraa.search');
  const deactivatedCap = registry.resolveCapabilityTool('SearchCapability');
  assert(deactivatedCap === null, 'Deactivated skill capabilities not resolved');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: EventBus Integration
// ═══════════════════════════════════════════════════════════════════════════════

async function testEventBusIntegration() {
  console.log('\n📡 Section 4: EventBus Integration\n');

  PluginRegistry.resetInstance();
  EventBus.resetInstance();
  const registry = PluginRegistry.getInstance();
  const eventBus = EventBus.getInstance();

  registry.register(new CartPlugin());
  registry.register(new NavigationPlugin());
  registry.register(new WishlistPlugin());
  registry.register(new RatingPlugin());

  await registry.initializeAll();
  await registry.activateAll();

  // 4.1 Cart events emitted on cart_add
  let cartEventReceived = false;
  eventBus.subscribe('cart.action', (event) => {
    if (event.payload.action === 'add') {
      cartEventReceived = true;
    }
  });

  await registry.executeTool('cart_add', { productId: 'prod_10' });
  // Events dispatched asynchronously for NORMAL priority — wait for them
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert(cartEventReceived, 'Cart event received on cart_add');

  // 4.2 Navigation events emitted
  let navEventReceived = false;
  eventBus.subscribe('navigation.action', (event) => {
    if (event.payload.screen === 'Favorites') {
      navEventReceived = true;
    }
  });

  await registry.executeTool('navigate_to', { screen: 'Favorites' });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert(navEventReceived, 'Navigation event received on navigate_to');

  // 4.3 Wishlist events
  let wishlistEventReceived = false;
  eventBus.subscribe('wishlist.action', (event) => {
    if (event.payload.action === 'add') {
      wishlistEventReceived = true;
    }
  });

  await registry.executeTool('wishlist_add', { productId: 'prod_ev' });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert(wishlistEventReceived, 'Wishlist event received on wishlist_add');

  // 4.4 Rating events
  let ratingEventReceived = false;
  eventBus.subscribe('rating.action', (event) => {
    if (event.payload.stars === 4) {
      ratingEventReceived = true;
    }
  });

  await registry.executeTool('rating_submit', { productId: 'prod_ev', stars: 4 });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert(ratingEventReceived, 'Rating event received on rating_submit');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Scoped Storage Isolation
// ═══════════════════════════════════════════════════════════════════════════════

async function testStorageIsolation() {
  console.log('\n💾 Section 5: Scoped Storage Isolation\n');

  PluginRegistry.resetInstance();
  EventBus.resetInstance();
  const registry = PluginRegistry.getInstance();

  registry.register(new WishlistPlugin());
  registry.register(new RatingPlugin());

  await registry.initializeAll();
  await registry.activateAll();

  // Add items to wishlist
  await registry.executeTool('wishlist_add', { productId: 'iso_1' });
  await registry.executeTool('wishlist_add', { productId: 'iso_2' });

  // Add a rating
  await registry.executeTool('rating_submit', { productId: 'iso_1', stars: 3 });

  // 5.1 Wishlist sees only its own data
  const wl = await registry.executeTool('wishlist_list', {});
  assert(wl.totalItems === 2, 'Wishlist has 2 items');

  // 5.2 Rating sees only its own data
  const rt = await registry.executeTool('rating_get', { productId: 'iso_1' });
  assert(rt.stars === 3 && rt.hasRating === true, 'Rating has correct value');

  // 5.3 Rating does not see wishlist data
  const rt2 = await registry.executeTool('rating_get', { productId: 'iso_2' });
  assert(rt2.hasRating === false, 'Rating does not leak wishlist data');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Bridge Adapter (Legacy Platform Compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

async function testBridgeAdapter() {
  console.log('\n🔌 Section 6: Bridge Adapter (Legacy Platform Compatibility)\n');

  // Reset all singletons
  PluginRegistry.resetInstance();
  EventBus.resetInstance();
  // Reset the ToolRegistry and CapabilityEngine via their clear methods
  const toolRegistry = ToolRegistry.getInstance();
  const capabilityEngine = CapabilityEngine.getInstance();
  toolRegistry.clear();
  capabilityEngine.clear();

  const registry = PluginRegistry.getInstance();

  registry.register(new SearchPlugin());
  registry.register(new CartPlugin());
  registry.register(new NavigationPlugin());

  // Import and run bridge
  const { bridgePluginsToLegacyPlatform } = await import('../sdk/bridge');
  await bridgePluginsToLegacyPlatform(registry);

  // 6.1 Legacy ToolRegistry contains plugin tools
  const searchTool = toolRegistry.resolve('search_products');
  assert(searchTool !== undefined, 'Bridge registered search_products in legacy ToolRegistry');

  const cartAddTool = toolRegistry.resolve('cart_add');
  assert(cartAddTool !== undefined, 'Bridge registered cart_add in legacy ToolRegistry');

  const navTool = toolRegistry.resolve('navigate_to');
  assert(navTool !== undefined, 'Bridge registered navigate_to in legacy ToolRegistry');

  // 6.2 Legacy ToolRegistry lists all tools
  const allTools = toolRegistry.listTools();
  const toolNames = allTools.map(t => t.name);
  assert(toolNames.includes('search_products'), 'listTools() includes search_products');
  assert(toolNames.includes('cart_add'), 'listTools() includes cart_add');
  assert(toolNames.includes('cart_remove'), 'listTools() includes cart_remove');
  assert(toolNames.includes('cart_clear'), 'listTools() includes cart_clear');
  assert(toolNames.includes('navigate_to'), 'listTools() includes navigate_to');

  // 6.3 Legacy ToolRegistry can execute plugin tools
  if (searchTool) {
    const mockWorldState: any = { timestamp: Date.now(), domain: {} };
    const result = await searchTool.execute({ query: 'test' }, { worldState: mockWorldState });
    assert(result.items && result.items.length > 0, 'Legacy tool adapter executes search successfully');
  }

  if (cartAddTool) {
    const mockWorldState: any = { timestamp: Date.now(), domain: {} };
    const result = await cartAddTool.execute({ productId: 'prod_bridge' }, { worldState: mockWorldState });
    assert(result.success === true, 'Legacy tool adapter executes cart_add successfully');
  }

  // 6.4 CapabilityEngine has plugin capabilities
  const mockWS: any = { timestamp: Date.now(), domain: {}, user: { id: null, isAuthenticated: false, preferences: {} }, app: { currentScreen: 'Home', screenElements: {}, navigationHistory: [] }, activeGoals: [], runningTools: {}, temporaryData: {}, lastEventId: '' };
  const resolved = capabilityEngine.resolveCapabilities('search products', mockWS);
  assert(resolved.length > 0, 'CapabilityEngine resolves SearchCapability from plugins');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Plugin Manifest Validation
// ═══════════════════════════════════════════════════════════════════════════════

async function testManifestValidation() {
  console.log('\n📋 Section 7: Plugin Manifest Validation\n');

  const search = new SearchPlugin();
  const cart = new CartPlugin();
  const nav = new NavigationPlugin();
  const wishlist = new WishlistPlugin();
  const review = new ReviewPlugin();
  const rating = new RatingPlugin();

  // 7.1 All manifests have required fields
  const allPlugins = [search, cart, nav, wishlist, review, rating];
  for (const plugin of allPlugins) {
    const m = plugin.manifest;
    assert(!!m.id && !!m.name && !!m.version, `${m.name}: has id, name, version`);
    assert(m.tools.length > 0, `${m.name}: has at least one tool`);
    assert(m.capabilities.length > 0, `${m.name}: has at least one capability`);
    assert(m.compatibility.coreVersion === '^1.0.0', `${m.name}: compatible with core ^1.0.0`);
  }

  // 7.2 No duplicate tool names across plugins
  const allToolNames: string[] = [];
  for (const plugin of allPlugins) {
    for (const tool of plugin.manifest.tools) {
      assert(!allToolNames.includes(tool.name), `Tool name "${tool.name}" is unique across plugins`);
      allToolNames.push(tool.name);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

export async function runPluginTests(): Promise<{ passed: number; failed: number }> {
  passed = 0;
  failed = 0;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       🧩 Plugin Migration Tests — Sprint 2                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await testPluginLifecycle();
  await testToolExecution();
  await testCapabilityRouting();
  await testEventBusIntegration();
  await testStorageIsolation();
  await testBridgeAdapter();
  await testManifestValidation();

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`   📊 Plugin Tests Summary: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    throw new Error(`${failed} plugin test(s) failed!`);
  }

  return { passed, failed };
}
