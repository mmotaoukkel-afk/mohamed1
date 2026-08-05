/**
 * Intent Engine Test Suite — 200+ حالة اختبار
 *
 * يختبر جميع النوايا التسعة مع:
 *  - العربية الفصحى
 *  - الدارجة المغربية
 *  - الإنجليزية
 *  - أخطاء إملائية
 *  - عبارات مختلفة لنفس المعنى
 *
 * كل حالة تتحقق من:
 *  - intent: النية المتوقعة
 *  - confidence: الحد الأدنى المقبول
 *  - action: الأمر المتوقع (اختياري)
 *  - entities: الكيانات المتوقعة (اختياري)
 */

import { analyzeIntent } from '../engine/intentEngine';
import type { ActionType, IntentType } from '../types';

// استيراد معالجات التفاعلات والـ Registry statically لضمان قيام TypeScript بتجميعها وإخراجها في مجلد dist
import '../engine/interactionRegistry';
import '../engine/handlers/commentHandler';
import '../engine/handlers/ratingHandler';
import '../engine/interactionPipeline';


// ─── أداة مساعدة للاختبارات ───────────────────────────────────────────────────

interface TestCase {
  input: string;
  expectedIntent: IntentType;
  minConfidence?: number;
  expectedAction?: ActionType;
  entityCheck?: (entities: any) => boolean;
  description?: string;
}

const runTests = (category: string, tests: TestCase[]): void => {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const test of tests) {
    const result = analyzeIntent(test.input);
    let testPassed = true;

    // التحقق من النية
    if (result.intent !== test.expectedIntent) {
      testPassed = false;
      failures.push(
        `❌ "${test.input}" → Expected: ${test.expectedIntent}, Got: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`,
      );
    }

    // التحقق من مستوى الثقة
    if (test.minConfidence && result.confidence < test.minConfidence) {
      testPassed = false;
      failures.push(
        `❌ "${test.input}" → Confidence too low: ${result.confidence.toFixed(2)} < ${test.minConfidence}`,
      );
    }

    // التحقق من الأمر
    if (test.expectedAction && result.action !== test.expectedAction) {
      testPassed = false;
      failures.push(
        `❌ "${test.input}" → Expected action: ${test.expectedAction}, Got: ${result.action}`,
      );
    }

    // التحقق من الكيانات
    if (test.entityCheck && !test.entityCheck(result.entities)) {
      testPassed = false;
      failures.push(
        `❌ "${test.input}" → Entity check failed. Entities: ${JSON.stringify(result.entities)}`,
      );
    }

    if (testPassed) passed++;
    else failed++;
  }

  console.log(`\n═══ ${category} ═══`);
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${tests.length}`);
    for (const f of failures) console.log(`  ${f}`);
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// 1. NAVIGATION — 40 حالات
// ════════════════════════════════════════════════════════════════════════════════

const NAVIGATION_TESTS: TestCase[] = [
  // ── السلة ────────────────────────────────────────────────────────────
  { input: 'افتح السلة', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },
  { input: 'السلة', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },
  { input: 'البانيي', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },
  { input: 'وريني السلة', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },
  { input: 'cart', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },
  { input: 'open cart', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },
  { input: 'بغيت نشوف السلة', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },
  { input: 'خذني للسلة', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },

  // ── الرئيسية ────────────────────────────────────────────────────────
  { input: 'افتح الرئيسية', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_HOME', minConfidence: 0.85 },
  { input: 'الهوم', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_HOME', minConfidence: 0.85 },
  { input: 'أرني الرئيسية', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_HOME', minConfidence: 0.85 },
  { input: 'go to home', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_HOME', minConfidence: 0.85 },
  { input: 'رجعني للبداية', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_HOME', minConfidence: 0.85 },
  { input: 'اذهب للرئيسية', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_HOME', minConfidence: 0.85 },

  // ── البروفايل ───────────────────────────────────────────────────────
  { input: 'افتح البروفايل', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE', minConfidence: 0.85 },
  { input: 'الملف الشخصي', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE', minConfidence: 0.85 },
  { input: 'حسابي', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE', minConfidence: 0.85 },
  { input: 'أرني البروفايل', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE', minConfidence: 0.85 },
  { input: 'profile', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE', minConfidence: 0.85 },
  { input: 'open my profile', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE', minConfidence: 0.85 },
  { input: 'بروفايل', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE', minConfidence: 0.85 },

  // ── المنتجات ────────────────────────────────────────────────────────
  { input: 'افتح المنتجات', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PRODUCTS', minConfidence: 0.85 },
  { input: 'المتجر', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PRODUCTS', minConfidence: 0.85 },
  { input: 'open shop', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PRODUCTS', minConfidence: 0.85 },

  // ── المفضلة ─────────────────────────────────────────────────────────
  { input: 'افتح المفضلة', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_FAVORITES', minConfidence: 0.85 },
  { input: 'مفضلتي', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_FAVORITES', minConfidence: 0.85 },
  { input: 'favorites', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_FAVORITES', minConfidence: 0.85 },

  // ── الطلبات ─────────────────────────────────────────────────────────
  { input: 'افتح الطلبات', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_ORDERS', minConfidence: 0.85 },
  { input: 'طلباتي', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_ORDERS', minConfidence: 0.85 },
  { input: 'orders', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_ORDERS', minConfidence: 0.85 },

  // ── الإعدادات ───────────────────────────────────────────────────────
  { input: 'الإعدادات', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_SETTINGS', minConfidence: 0.85 },
  { input: 'settings', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_SETTINGS', minConfidence: 0.85 },

  // ── الرجوع ──────────────────────────────────────────────────────────
  { input: 'رجوع', expectedIntent: 'NAVIGATION', expectedAction: 'GO_BACK', minConfidence: 0.85 },
  { input: 'رجعني', expectedIntent: 'NAVIGATION', expectedAction: 'GO_BACK', minConfidence: 0.85 },
  { input: 'ارجع', expectedIntent: 'NAVIGATION', expectedAction: 'GO_BACK', minConfidence: 0.85 },
  { input: 'go back', expectedIntent: 'NAVIGATION', expectedAction: 'GO_BACK', minConfidence: 0.85 },
  { input: 'back', expectedIntent: 'NAVIGATION', expectedAction: 'GO_BACK', minConfidence: 0.85 },

  // ── حالات حدودية ────────────────────────────────────────────────────
  { input: 'روح للسلة', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART', minConfidence: 0.85 },
  { input: 'ديني للبروفايل', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE', minConfidence: 0.85 },
  { input: 'سير للرئيسية', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_HOME', minConfidence: 0.85 },

  // ── التنقل بالضمائر ────────────────────────────────────────────────
  { input: 'انقلني اليه', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PRODUCTS', minConfidence: 0.85, entityCheck: (e) => e.screen === 'Products' },
  { input: 'ديني ليه', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PRODUCTS', minConfidence: 0.85, entityCheck: (e) => e.screen === 'Products' },
  { input: 'لا انقلني اليه', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PRODUCTS', minConfidence: 0.85, entityCheck: (e) => e.screen === 'Products' },
  { input: 'ديها ليها', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PRODUCTS', minConfidence: 0.85, entityCheck: (e) => e.screen === 'Products' },
];

// ════════════════════════════════════════════════════════════════════════════════
// 2. PRODUCT_SEARCH — 50 حالات
// ════════════════════════════════════════════════════════════════════════════════

const PRODUCT_SEARCH_TESTS: TestCase[] = [
  // ── بحث بالعربية الفصحى ─────────────────────────────────────────────
  { input: 'أرني كريم مرطب', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'أريد سيروم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'منتجات العناية بالبشرة', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'عندكم واقي شمس', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'أرني غسول للوجه', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'أرني شامبو', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'أرني ماسك للبشرة', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'أبحث عن زيت للشعر', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'هل لديكم بلسم للشعر', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },

  // ── بحث بالدارجة المغربية ───────────────────────────────────────────
  { input: 'وريني سيروم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'جيب لي كريم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'بغيت شامبو', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'جيبلي واقي شمس', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'شوف لي غسول', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'دورلي على مرطب', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'واش كاين شي سيروم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'عطيني كريم للوجه', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },

  // ── بحث بالإنجليزية ─────────────────────────────────────────────────
  { input: 'show me serum', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'i want moisturizer', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'search for shampoo', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'find me a cream', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'display sunscreen products', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'do you have face oil', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'get me foundation', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },

  // ── فئات منتجات محددة ───────────────────────────────────────────────
  { input: 'أرني منتجات الشعر', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'أرني منتجات المكياج', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'أرني عطور', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'كريم تبييض', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'سيروم فيتامين سي', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },

  // ── أخطاء إملائية ───────────────────────────────────────────────────
  { input: 'ارني كريم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'اريد سيروم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },

  // ── عبارات طويلة ────────────────────────────────────────────────────
  { input: 'أرني أحسن كريم مرطب للبشرة', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'بغيت شي حاجة للعناية بالبشرة', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'أريد منتج للعناية بالشعر', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },

  // ── entity checks ───────────────────────────────────────────────────
  {
    input: 'أرني كريم مرطب',
    expectedIntent: 'PRODUCT_SEARCH',
    entityCheck: (e) => !!e.query && e.query.length > 0,
  },
  {
    input: 'أرني سيروم',
    expectedIntent: 'PRODUCT_SEARCH',
    entityCheck: (e) => !!e.query,
  },

  // ── بحث مباشر بالكلمة ──────────────────────────────────────────────
  { input: 'سيروم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'كريم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'شامبو', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'غسول', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'واقي', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'ماسكارا', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'روج', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },
  { input: 'عطر', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.65 },

  // ── اعرض + فعل ─────────────────────────────────────────────────────
  { input: 'اعرض لي سيروم', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'اعرض كريمات', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'فتش على ماسك', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'ابحث عن زيت أرغان', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
  { input: 'نبغي لوشن', expectedIntent: 'PRODUCT_SEARCH', minConfidence: 0.85 },
];

// ════════════════════════════════════════════════════════════════════════════════
// 3. CART_MANAGEMENT — 30 حالات
// ════════════════════════════════════════════════════════════════════════════════

const CART_MANAGEMENT_TESTS: TestCase[] = [
  // ── إضافة ──────────────────────────────────────────────────────────
  { input: 'أضف المنتج الأول', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'ضيف الثاني', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'زيد الأول للسلة', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'حط المنتج الثالث', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'add the first one', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'add to cart', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.65 },
  { input: 'اشتري الأول', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'خذ الثاني', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'أضف هذا', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.65 },
  { input: 'حطلي الخامس', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },

  // ── حذف ─────────────────────────────────────────────────────────────
  { input: 'احذف المنتج الأول', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.85 },
  { input: 'حيد الثاني', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.85 },
  { input: 'ازل الثالث', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.85 },
  { input: 'امسح الأول', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.85 },
  { input: 'remove the first', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.85 },
  { input: 'delete item 2', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.85 },
  { input: 'حيدو', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.65 },
  { input: 'نحي الرابع', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.85 },

  // ── تفريغ السلة ────────────────────────────────────────────────────
  { input: 'فرغ السلة', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'CLEAR_CART', minConfidence: 0.85 },
  { input: 'خوي السلة', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'CLEAR_CART', minConfidence: 0.85 },
  { input: 'clear cart', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'CLEAR_CART', minConfidence: 0.85 },
  { input: 'افرغ المفضلات', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'CLEAR_FAVORITES', minConfidence: 0.85 },
  { input: 'فرغ المفضلة', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'CLEAR_FAVORITES', minConfidence: 0.85 },
  { input: 'افرغ صفحة المفضلات', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'CLEAR_FAVORITES', minConfidence: 0.85 },

  // ── entity checks ───────────────────────────────────────────────────
  {
    input: 'أضف الأول',
    expectedIntent: 'CART_MANAGEMENT',
    entityCheck: (e) => e.productRef === 0,
  },
  {
    input: 'احذف الثاني',
    expectedIntent: 'CART_MANAGEMENT',
    entityCheck: (e) => e.productRef === 1,
  },
  {
    input: 'حط الثالث',
    expectedIntent: 'CART_MANAGEMENT',
    entityCheck: (e) => e.productRef === 2,
  },
  {
    input: 'ازل الرابع',
    expectedIntent: 'CART_MANAGEMENT',
    entityCheck: (e) => e.productRef === 3,
  },
  {
    input: 'زيد الخامس',
    expectedIntent: 'CART_MANAGEMENT',
    entityCheck: (e) => e.productRef === 4,
  },

  // ── لهجات مختلفة ───────────────────────────────────────────────────
  { input: 'شريلي الأول', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'اقتني الثاني', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'buy the first', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'ADD_TO_CART', minConfidence: 0.85 },
  { input: 'شيل الأول', expectedIntent: 'CART_MANAGEMENT', expectedAction: 'REMOVE_FROM_CART', minConfidence: 0.85 },
];

// ════════════════════════════════════════════════════════════════════════════════
// 4. RECOMMENDATIONS — 20 حالات
// ════════════════════════════════════════════════════════════════════════════════

const RECOMMENDATIONS_TESTS: TestCase[] = [
  { input: 'أرني أفضل خمس منتجات', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'ماذا تنصحني', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'ما الأكثر مبيعاً', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'أفضل المنتجات', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'الأكثر مبيعاً', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'اقترح لي منتجات', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'ما تنصحني به', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'أرني أفضل 3 منتجات', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'top 5 products', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'best sellers', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'recommend something', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'popular products', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'trending', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'الأرخص', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'الأغلى', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },
  { input: 'الأجدد', expectedIntent: 'RECOMMENDATIONS', minConfidence: 0.85 },

  // ── entity checks ───────────────────────────────────────────────────
  {
    input: 'أرني أفضل خمس منتجات',
    expectedIntent: 'RECOMMENDATIONS',
    entityCheck: (e) => e.limit === 5,
  },
  {
    input: 'أفضل 3 منتجات',
    expectedIntent: 'RECOMMENDATIONS',
    entityCheck: (e) => e.limit === 3,
  },
  {
    input: 'top 10 products',
    expectedIntent: 'RECOMMENDATIONS',
    entityCheck: (e) => e.limit === 10,
  },
  {
    input: 'الأكثر مبيعاً',
    expectedIntent: 'RECOMMENDATIONS',
    entityCheck: (e) => e.sort === 'best_selling',
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 5. BRAND_INFORMATION — 15 حالات
// ════════════════════════════════════════════════════════════════════════════════

const BRAND_INFO_TESTS: TestCase[] = [
  { input: 'من أنتم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'عرفني بعلامتكم التجارية', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'ما الذي يميزكم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'أريد تعريفاً بسيطاً عنكم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'شكون أنتم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'عرفني عليكم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'شنو هاد المتجر', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'معلومات عنكم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'who are you', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'tell me about your brand', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'about you', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'what is this store', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'حكيلي عليكم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'ما هو متجركم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
  { input: 'علامتكم', expectedIntent: 'BRAND_INFORMATION', minConfidence: 0.85 },
];

// ════════════════════════════════════════════════════════════════════════════════
// 6. SMALL_TALK — 20 حالات
// ════════════════════════════════════════════════════════════════════════════════

const SMALL_TALK_TESTS: TestCase[] = [
  // ── تحية ────────────────────────────────────────────────────────────
  { input: 'مرحبا', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'سلام', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'أهلا', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'hello', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'hi', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'hey', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },

  // ── شكر ─────────────────────────────────────────────────────────────
  { input: 'شكراً', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'ميرسي', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'مشكور', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'thanks', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'thank you', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },

  // ── كيف حالك ────────────────────────────────────────────────────────
  { input: 'كيف حالك', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'كيداير', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'لاباس', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'how are you', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },

  // ── تعبيرات إيجابية ─────────────────────────────────────────────────
  { input: 'ممتاز', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'رائع', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'زوين', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'great', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'awesome', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
];

// ════════════════════════════════════════════════════════════════════════════════
// 7. CATEGORY_BROWSING — 15 حالات
// ════════════════════════════════════════════════════════════════════════════════

const CATEGORY_BROWSING_TESTS: TestCase[] = [
  { input: 'افتح قسم المكياج', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'انقلني للعناية بالبشرة', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'أرني أقسام الشعر', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'قسم العطور', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'فئة العناية بالبشرة', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'skincare section', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'hair care category', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'makeup department', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'قسم الشعر', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },
  { input: 'قسم الجسم', expectedIntent: 'CATEGORY_BROWSING', minConfidence: 0.85 },

  // ── entity checks ───────────────────────────────────────────────────
  {
    input: 'افتح قسم المكياج',
    expectedIntent: 'CATEGORY_BROWSING',
    entityCheck: (e) => e.category === 'Makeup',
  },
  {
    input: 'قسم الشعر',
    expectedIntent: 'CATEGORY_BROWSING',
    entityCheck: (e) => e.category === 'Hair Care',
  },
  {
    input: 'قسم العطور',
    expectedIntent: 'CATEGORY_BROWSING',
    entityCheck: (e) => e.category === 'Perfume',
  },
  {
    input: 'فئة العناية بالبشرة',
    expectedIntent: 'CATEGORY_BROWSING',
    entityCheck: (e) => e.category === 'Skincare',
  },
  {
    input: 'قسم الجسم',
    expectedIntent: 'CATEGORY_BROWSING',
    entityCheck: (e) => e.category === 'Body Care',
  },
  {
    input: 'اريني احسن المنتوجات المخصصة لعناية بالشعر',
    expectedIntent: 'CATEGORY_BROWSING',
    entityCheck: (e) => e.category === 'Hair Care',
  },
  {
    input: 'اريني الماسكات',
    expectedIntent: 'CATEGORY_BROWSING',
    entityCheck: (e) => e.category === 'Masks',
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 8. HUMAN_HANDOFF — 15 حالات
// ════════════════════════════════════════════════════════════════════════════════

const HUMAN_HANDOFF_TESTS: TestCase[] = [
  { input: 'بغيت نتواصل مع خدمة الزبناء', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'عندي مشكل في الطلب', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'بغيت نرجع المنتج', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'أريد التواصل مع الدعم', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'خدمة العملاء', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'عندي شكاية', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'استرجاع المنتج', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'customer service', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'i have a problem', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'contact support', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'refund please', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'return my order', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'عندي مشكلة', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'بغيت ارجاع', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
  { input: 'help me with my order', expectedIntent: 'HUMAN_HANDOFF', minConfidence: 0.85 },
];

// ════════════════════════════════════════════════════════════════════════════════
// 9. UNKNOWN — 15 حالات (يجب أن يكون أقل من 5%)
// ════════════════════════════════════════════════════════════════════════════════

const UNKNOWN_TESTS: TestCase[] = [
  { input: 'asdfghjkl', expectedIntent: 'UNKNOWN' },
  { input: 'xyz 123', expectedIntent: 'UNKNOWN' },
  { input: '!@#$%', expectedIntent: 'UNKNOWN' },
  { input: 'zzzzz', expectedIntent: 'UNKNOWN' },
  { input: 'test test test', expectedIntent: 'UNKNOWN' },
  { input: 'lorem ipsum', expectedIntent: 'UNKNOWN' },
  { input: 'aaa bbb ccc', expectedIntent: 'UNKNOWN' },
  { input: '....', expectedIntent: 'UNKNOWN' },
  { input: 'random gibberish here', expectedIntent: 'UNKNOWN' },
  { input: 'qwerty', expectedIntent: 'UNKNOWN' },
];

// ════════════════════════════════════════════════════════════════════════════════
// 10. EDGE CASES — حالات حدودية مهمة
// ════════════════════════════════════════════════════════════════════════════════

const EDGE_CASE_TESTS: TestCase[] = [
  // ── "أرني" + شاشة → NAVIGATION وليس PRODUCT_SEARCH ──────────────────
  { input: 'أرني صفحة الرئيسية', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_HOME' },
  { input: 'أرني صفحة البروفايل', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE' },

  // ── السلة بدون فعل → NAVIGATION ──────────────────────────────────────
  { input: 'السلة', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_CART' },
  { input: 'البروفايل', expectedIntent: 'NAVIGATION', expectedAction: 'OPEN_PROFILE' },

  // ── نص فارغ ──────────────────────────────────────────────────────────
  { input: '', expectedIntent: 'UNKNOWN' },
  { input: '   ', expectedIntent: 'UNKNOWN' },

  // ── تكرار الحروف ────────────────────────────────────────────────────
  { input: 'مرحبببببا', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
  { input: 'شكرررررا', expectedIntent: 'SMALL_TALK', minConfidence: 0.85 },
];

// ════════════════════════════════════════════════════════════════════════════════
// تشغيل جميع الاختبارات
// ════════════════════════════════════════════════════════════════════════════════

const QUESTION_TESTS: TestCase[] = [
  { input: 'شحال الثمن؟', expectedIntent: 'ASK_PRICE' },
  { input: 'بشحال هذا؟', expectedIntent: 'ASK_PRICE' },
  { input: 'كم السعر؟', expectedIntent: 'ASK_PRICE' },
  { input: 'واش متوفر المنتج؟', expectedIntent: 'ASK_AVAILABILITY' },
  { input: 'واش كاين في السوك؟', expectedIntent: 'ASK_AVAILABILITY' },
  { input: 'شحال مدة التوصيل؟', expectedIntent: 'ASK_DELIVERY' },
  { input: 'فوقاش يوصلني الطلب؟', expectedIntent: 'ASK_DELIVERY' },
  { input: 'واش كاين الضمان؟', expectedIntent: 'ASK_WARRANTY' },
  { input: 'واش المنتج اصلي؟', expectedIntent: 'ASK_WARRANTY' },
  { input: 'شنو الفرق بيناتهم؟', expectedIntent: 'ASK_COMPARISON' },
  { input: 'شكون حسن؟', expectedIntent: 'ASK_COMPARISON' },
];

const COMMENT_TESTS: TestCase[] = [
  { input: 'اكتب تعليق: هذا المنتج رائع', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.99, entityCheck: (e) => e.interactionAction === 'write' && e.commentText === 'هذا المنتج رائع' },
  { input: 'علق بأن الجودة ممتازة', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.97, entityCheck: (e) => e.interactionAction === 'write' && e.commentText === 'الجودة ممتازة' },
  { input: 'اكتب مراجعة إيجابية', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.93, entityCheck: (e) => e.interactionAction === 'generate' && e.commentTone === 'positive' },
  { input: 'اكتب تعليق قصير', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.88, entityCheck: (e) => e.interactionAction === 'generate' && e.commentLength === 'short' },
  { input: 'اكتب تعليق طويل', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.88, entityCheck: (e) => e.interactionAction === 'generate' && e.commentLength === 'long' },
  { input: 'Comment: Amazing product', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.99, entityCheck: (e) => e.interactionAction === 'write' && e.commentText === 'Amazing product' },
  { input: 'Write a review', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.88, entityCheck: (e) => e.interactionAction === 'generate' },
  { input: 'اكتب', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.35 },
  { input: 'علق', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.85, entityCheck: (e) => e.interactionAction === 'generate' },
  { input: 'انشر', expectedIntent: 'COMMENT', expectedAction: 'SUBMIT_COMMENT', minConfidence: 0.95, entityCheck: (e) => e.interactionAction === 'submit' },
  { input: 'post', expectedIntent: 'COMMENT', expectedAction: 'SUBMIT_COMMENT', minConfidence: 0.95 },
  { input: 'احذف التعليق', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.92, entityCheck: (e) => e.interactionAction === 'delete' },
  { input: 'اكتب تعليق ثم انشره', expectedIntent: 'COMMENT', expectedAction: 'WRITE_COMMENT', minConfidence: 0.88, entityCheck: (e) => e.chainedAction === 'submit' },
];

const RATING_TESTS: TestCase[] = [
  { input: 'قيم المنتج بخمس نجوم', expectedIntent: 'RATING', expectedAction: 'RATE_PRODUCT', minConfidence: 0.95, entityCheck: (e) => e.interactionAction === 'rate' && e.ratingValue === 5 },
  { input: 'قيم المنتج بخمسه نجوم', expectedIntent: 'RATING', expectedAction: 'RATE_PRODUCT', minConfidence: 0.95, entityCheck: (e) => e.interactionAction === 'rate' && e.ratingValue === 5 },
  { input: 'أعطه نجمة واحدة', expectedIntent: 'RATING', expectedAction: 'RATE_PRODUCT', minConfidence: 0.95, entityCheck: (e) => e.interactionAction === 'rate' && e.ratingValue === 1 },
  { input: 'عدل التقييم إلى ثلاثة', expectedIntent: 'RATING', expectedAction: 'RATE_PRODUCT', minConfidence: 0.95, entityCheck: (e) => e.interactionAction === 'rate' && e.ratingValue === 3 },
  { input: 'Rate this product 5 stars', expectedIntent: 'RATING', expectedAction: 'RATE_PRODUCT', minConfidence: 0.95, entityCheck: (e) => e.interactionAction === 'rate' && e.ratingValue === 5 },
  { input: 'give rating 4', expectedIntent: 'RATING', expectedAction: 'RATE_PRODUCT', minConfidence: 0.95, entityCheck: (e) => e.interactionAction === 'rate' && e.ratingValue === 4 },
  { input: 'احذف التقييم', expectedIntent: 'RATING', expectedAction: 'REMOVE_RATING', minConfidence: 0.95, entityCheck: (e) => e.interactionAction === 'delete' },
  { input: 'قيم المنتج', expectedIntent: 'RATING', expectedAction: 'RATE_PRODUCT', minConfidence: 0.88, entityCheck: (e) => e.interactionAction === 'rate' && e.ratingValue === undefined },
  { input: 'قيم', expectedIntent: 'RATING', expectedAction: 'RATE_PRODUCT', minConfidence: 0.35, entityCheck: (e) => e.interactionAction === 'rate' },
];

export const runAllTests = (): void => {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Kataraa Assistant — Intent Engine Test Suite          ║');
  console.log('║     240+ Test Cases                                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  runTests('1. NAVIGATION (40 tests)', NAVIGATION_TESTS);
  runTests('2. PRODUCT_SEARCH (50 tests)', PRODUCT_SEARCH_TESTS);
  runTests('3. CART_MANAGEMENT (30 tests)', CART_MANAGEMENT_TESTS);
  runTests('4. RECOMMENDATIONS (20 tests)', RECOMMENDATIONS_TESTS);
  runTests('5. BRAND_INFORMATION (15 tests)', BRAND_INFO_TESTS);
  runTests('6. SMALL_TALK (20 tests)', SMALL_TALK_TESTS);
  runTests('7. CATEGORY_BROWSING (15 tests)', CATEGORY_BROWSING_TESTS);
  runTests('8. HUMAN_HANDOFF (15 tests)', HUMAN_HANDOFF_TESTS);
  runTests('9. UNKNOWN (10 tests)', UNKNOWN_TESTS);
  runTests('10. EDGE CASES (8 tests)', EDGE_CASE_TESTS);
  runTests('11. PRODUCT QUESTIONS (11 tests)', QUESTION_TESTS);
  runTests('12. COMMENT (13 tests)', COMMENT_TESTS);
  runTests('13. RATING (9 tests)', RATING_TESTS);


  // 13. CONTEXTUAL & CONFIRMATION TESTS (Fuzzy & Context)
  console.log('\n═══ 13. CONTEXT & CONFIRMATION (Custom) ═══');
  let customPassed = 0;
  let customTotal = 12;

  // Test 1: Pending action confirmation yes
  const ctxYes: any = { pendingAction: { type: 'CLEAR_CART' } };
  const resYes = analyzeIntent('نعم متأكد', ctxYes);
  if (resYes.category === 'CONFIRMATION' && resYes.intent === 'CONFIRM_YES') {
    customPassed++;
  } else {
    console.log('❌ Pending Confirmation YES failed:', resYes);
  }

  // Test 2: Pending action confirmation no
  const resNo = analyzeIntent('لا بلاش', ctxYes);
  if (resNo.category === 'CONFIRMATION' && resNo.intent === 'CONFIRM_NO') {
    customPassed++;
  } else {
    console.log('❌ Pending Confirmation NO failed:', resNo);
  }

  // Test 3: Follow-up query combining
  const ctxFollow: any = { lastQuery: 'ساعات ذكية' };
  const resFollow = analyzeIntent('غير السود', ctxFollow);
  if (resFollow.category === 'PRODUCT_QUERY' && resFollow.intent === 'PRODUCT_SEARCH' && resFollow.entities.query === 'ساعات ذكية السود') {
    customPassed++;
  } else {
    console.log('❌ Contextual Follow-up query failed:', resFollow);
  }

  // Test 4: Fuzzy spelling correction check
  const resFuzzy = analyzeIntent('بغيت كرييم');
  if (resFuzzy.category === 'PRODUCT_QUERY' && resFuzzy.intent === 'PRODUCT_SEARCH') {
    customPassed++;
  } else {
    console.log('❌ Fuzzy spelling correction failed:', resFuzzy);
  }

  // Test 5: Matched pattern presence
  if (resFuzzy.matchedPattern !== undefined && resFuzzy.matchedPattern.length > 0) {
    customPassed++;
  } else {
    console.log('❌ Matched pattern field missing or empty:', resFuzzy);
  }

  // Test 6: UNKNOWN structure
  const resUnknown = analyzeIntent('asdfghjkl');
  if (
    resUnknown.category === 'UNKNOWN' &&
    resUnknown.intent === 'UNKNOWN' &&
    resUnknown.action === 'NONE' &&
    resUnknown.confidence <= 0.30
  ) {
    customPassed++;
  } else {
    console.log('❌ UNKNOWN structure check failed:', resUnknown);
  }

  // Test 7: Multi-turn contextual follow-up sequence
  // "ساعات ذكية" ➡️ "غير السود" ➡️ "أقل من 500 درهم" ➡️ "من Samsung" ➡️ "المتوفرة فقط"
  let ctxMulti: any = { lastQuery: 'ساعات ذكية' };
  
  // Step 1: "غير السود"
  const resM1 = analyzeIntent('غير السود', ctxMulti);
  ctxMulti.lastQuery = resM1.entities.query; // update session memory
  
  // Step 2: "أقل من 500 درهم"
  const resM2 = analyzeIntent('أقل من 500 درهم', ctxMulti);
  ctxMulti.lastQuery = resM2.entities.query;
  
  // Step 3: "من Samsung"
  const resM3 = analyzeIntent('من Samsung', ctxMulti);
  ctxMulti.lastQuery = resM3.entities.query;
  
  // Step 4: "المتوفرة فقط"
  const resM4 = analyzeIntent('المتوفرة فقط', ctxMulti);
  
  const expectedCombined = 'ساعات ذكية السود اقل من 500 درهم من samsung المتوفره';
  if (
    resM1.entities.query === 'ساعات ذكية السود' &&
    resM2.entities.query === 'ساعات ذكية السود اقل من 500 درهم' &&
    resM3.entities.query === 'ساعات ذكية السود اقل من 500 درهم من samsung' &&
    resM4.entities.query === expectedCombined
  ) {
    customPassed++;
  } else {
    console.log('❌ Multi-turn contextual follow-up sequence failed:', {
      r1: resM1.entities.query,
      r2: resM2.entities.query,
      r3: resM3.entities.query,
      r4: resM4.entities.query,
    });
  }

  // Test 8: Comment Short Memory text injection
  const ctxCommentMem: any = { pendingInteraction: { type: 'write_comment', status: 'awaiting_text' } };
  const resCommentMem = analyzeIntent('منتوج رائع', ctxCommentMem);
  if (
    resCommentMem.category === 'ACTION' &&
    resCommentMem.intent === 'COMMENT' &&
    resCommentMem.action === 'WRITE_COMMENT' &&
    resCommentMem.entities.commentText === 'منتوج رائع' &&
    resCommentMem.entities.interactionAction === 'write'
  ) {
    customPassed++;
  } else {
    console.log('❌ Comment short memory text injection failed:', resCommentMem);
  }

  // Test 9: Rating Short Memory (awaiting_stars) injection
  const ctxRatingMem: any = { pendingInteraction: { type: 'rating', status: 'awaiting_input', awaitingInputType: 'stars' } };
  const resRatingMem = analyzeIntent('خمس نجوم', ctxRatingMem);
  if (
    resRatingMem.category === 'ACTION' &&
    resRatingMem.intent === 'RATING' &&
    resRatingMem.action === 'RATE_PRODUCT' &&
    resRatingMem.entities.ratingValue === 5
  ) {
    customPassed++;
  } else {
    console.log('❌ Rating short memory injection failed:', resRatingMem);
  }

  // Test 10: Rating validation (> 5 stars value returning -1)
  const resRatingInvalid = analyzeIntent('قيم المنتج بـ 10 نجوم');
  if (
    resRatingInvalid.category === 'ACTION' &&
    resRatingInvalid.intent === 'RATING' &&
    resRatingInvalid.entities.ratingValue === -1
  ) {
    customPassed++;
  } else {
    console.log('❌ Rating validation check failed:', resRatingInvalid);
  }

  // Test 11: Compound Pipeline creation (COMMENT + RATING)
  const resCompound = analyzeIntent('اكتب تعليق بأن الجودة ممتازة وقيمه بـ 5 نجوم', { currentScreen: 'Product' } as any);
  if (
    resCompound.category === 'ACTION' &&
    resCompound.entities.pipelineSteps &&
    resCompound.entities.pipelineSteps.length === 2 &&
    resCompound.entities.pipelineSteps[0].intent === 'COMMENT' &&
    resCompound.entities.pipelineSteps[0].payload.commentText === 'الجودة ممتازة' &&
    resCompound.entities.pipelineSteps[1].intent === 'RATING' &&
    resCompound.entities.pipelineSteps[1].payload.ratingValue === 5
  ) {
    customPassed++;
  } else {
    console.log('❌ Compound pipeline creation failed:', JSON.stringify(resCompound, null, 2));
  }

  // Test 12: Registry verification (dynamic InteractionRegistry registration)
  // استيراد معالجات التعليقات والتقييم لضمان تسجيلها ديناميكياً قبل التحقق
  require('../engine/handlers/commentHandler');
  require('../engine/handlers/ratingHandler');
  const { InteractionRegistry } = require('../engine/interactionRegistry');
  if (
    InteractionRegistry.has('COMMENT') &&
    InteractionRegistry.has('RATING') &&
    InteractionRegistry.has('ADD_TO_FAVORITES')
  ) {
    customPassed++;
  } else {
    console.log('❌ InteractionRegistry verification failed. Registered:', InteractionRegistry.list());
  }

  console.log(`✅ Passed: ${customPassed}/${customTotal}`);

  const totalTests =
    NAVIGATION_TESTS.length +
    PRODUCT_SEARCH_TESTS.length +
    CART_MANAGEMENT_TESTS.length +
    RECOMMENDATIONS_TESTS.length +
    BRAND_INFO_TESTS.length +
    SMALL_TALK_TESTS.length +
    CATEGORY_BROWSING_TESTS.length +
    HUMAN_HANDOFF_TESTS.length +
    UNKNOWN_TESTS.length +
    EDGE_CASE_TESTS.length +
    QUESTION_TESTS.length +
    COMMENT_TESTS.length +
    RATING_TESTS.length +
    customTotal;

  console.log(`\n═══ TOTAL: ${totalTests} test cases ═══\n`);
};

