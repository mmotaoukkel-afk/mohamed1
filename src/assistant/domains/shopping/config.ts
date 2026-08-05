import { ToolRegistry } from '../../platform/tools/registry';
import { CapabilityEngine } from '../../platform/capabilities/capabilityEngine';
import { SearchProductsTool } from './tools/searchProducts';
import { CartManagementTool } from './tools/cartManagement';
import { NavigationTool } from './tools/navigation';

let isInitialized = false;

export function initializeShoppingDomain(): void {
  if (isInitialized) return;
  isInitialized = true;

  const toolRegistry = ToolRegistry.getInstance();
  const capabilityEngine = CapabilityEngine.getInstance();

  // 1. تسجيل الأدوات في سجل الأدوات المركزي (Tool Registry)
  const searchTool = new SearchProductsTool();
  const cartTool = new CartManagementTool();
  const navTool = new NavigationTool();

  toolRegistry.register(searchTool);
  toolRegistry.register(cartTool);
  toolRegistry.register(navTool);

  // 2. تسجيل القدرة (Shopping Capability) في محرك القدرات
  capabilityEngine.registerCapability({
    name: 'Shopping',
    description: 'القدرة على البحث عن المنتجات، وإدارة السلة، والتنقل بين صفحات المتجر.',
    toolNames: [searchTool.definition.name, cartTool.definition.name, navTool.definition.name],
    domains: ['shopping'],
    isAvailable: () => true, // متاحة دائماً
  });

  if (__DEV__) {
    console.log('🛍️ Shopping Domain initialized and bound to Agent Platform.');
  }
}
