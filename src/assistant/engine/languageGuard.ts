/**
 * LanguageGuard — طبقة التحقق من اللغة (v2 — Pattern-Based)
 *
 * يتحقق من أن ردود المساعد تلتزم بلغة التطبيق المحددة:
 *  - عربية فصحى بسيطة (Simple MSA) — ممنوع الدارجة والخلط
 *  - إنجليزية نظيفة — ممنوع الكلمات العربية
 *
 * التحسينات عن النسخة السابقة:
 *  ✅ استبدال Blacklist الضخمة بـ Grammar Patterns (أقل False Positives)
 *  ✅ Pattern-based Brand Detection (iPhone 16 Pro / Galaxy S25 Ultra…)
 *  ✅ Language Metrics (counters للإنتاج)
 *  ✅ تحليل اللغة المختلطة بـ Ratio بدل Binary Check
 */

// ─── Language Metrics (للإنتاج) ──────────────────────────────────────────────

interface LanguageMetrics {
  /** عدد مرات نجاح التحقق */
  validationPasses: number;
  /** عدد مرات فشل التحقق */
  validationFailures: number;
  /** عدد مرات تفعيل الـ Fallback */
  fallbackCount: number;
  /** عدد مرات إعادة المحاولة (Retry) */
  retryCount: number;
  /** عدد الردود المختلطة اللغة */
  invalidMixedLanguageCount: number;
  /** عدد الردود التي تحتوي دارجة */
  dialectDetectedCount: number;
}

const _metrics: LanguageMetrics = {
  validationPasses: 0,
  validationFailures: 0,
  fallbackCount: 0,
  retryCount: 0,
  invalidMixedLanguageCount: 0,
  dialectDetectedCount: 0,
};

export const getLanguageMetrics = (): Readonly<LanguageMetrics> => ({ ..._metrics });
export const resetLanguageMetrics = (): void => {
  Object.keys(_metrics).forEach(k => (_metrics as any)[k] = 0);
};
export const incrementFallback   = (): void => { _metrics.fallbackCount++; };
export const incrementRetry      = (): void => { _metrics.retryCount++; };

// ─── Brand & Model Patterns (أكثر مرونة من Whitelist ثابتة) ─────────────────

/**
 * يكتشف أسماء العلامات التجارية والموديلات بـ Patterns بدل قائمة ثابتة.
 *
 * يغطي:
 *  - Apple: iPhone 16 Pro Max, iPad Pro, MacBook Air
 *  - Samsung: Galaxy S25 Ultra, Galaxy Tab A9
 *  - PlayStation: PS5, PlayStation 5, PS4 Pro
 *  - Gaming: RTX 5090, GeForce, Xbox Series X
 *  - Kataraa internal: SKU-XXXX, KWD
 *  - أي proper noun بحرفين كبيرين على الأقل مفصول بمسافة (BMW, LG, HP…)
 */
const BRAND_PATTERNS: RegExp[] = [
  // Apple
  /\biPhone\s*\d*\s*(Pro|Max|Plus|Mini|SE)?\b/i,
  /\biPad\s*(Pro|Air|Mini)?\b/i,
  /\bMacBook\s*(Pro|Air)?\b/i,
  /\bAirPods?\s*(Pro|Max)?\b/i,
  /\bApple\s*Watch\b/i,

  // Samsung
  /\bGalaxy\s*(S|A|M|Z|Note|Tab|Watch)\d+\s*(Ultra|Plus|FE|Pro)?\b/i,
  /\bSamsung\b/i,

  // Sony / PlayStation
  /\bPlayStation\s*\d\b/i,
  /\bPS[45]\s*(Pro|Slim)?\b/i,
  /\bSony\b/i,

  // Gaming / GPU
  /\bRTX\s*\d{4}\s*(Ti|Super)?\b/i,
  /\bGTX\s*\d{4}\s*(Ti)?\b/i,
  /\bGeForce\b/i,
  /\bXbox\s*(One|Series\s*[XS])?\b/i,

  // Kataraa internals
  /\bSKU[-\s]?\w+\b/i,
  /\bKWD\b/i,

  // Generic brand abbreviations (2–5 uppercase letters like BMW, LG, HP, L'Oréal)
  /\b[A-Z]{2,5}\b/,

  // CamelCase brand names (iPhone, easyJet, eBay…)
  /\b[a-z]+[A-Z][a-zA-Z]+\b/,

  // Capitalized brand/product names (Nike, Chanel, Dior, Kataraa…)
  /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]*)?\b/,
];

/**
 * يتحقق إذا كانت الكلمة الإنجليزية اسم علامة تجارية أو موديل مسموح به.
 */
const isBrandOrModel = (word: string): boolean => {
  return BRAND_PATTERNS.some(p => p.test(word));
};

// ─── قائمة الكلمات الإنجليزية المحظورة (مصطلحات واجهة فقط) ──────────────────

/**
 * فقط كلمات الواجهة الإنجليزية الواضحة التي لا يجب أن تظهر في رد عربي.
 * القائمة مختصرة بعمد — ResponseNormalizer يعالج معظمها قبل الوصول هنا.
 */
const FORBIDDEN_UI_WORDS = new Set([
  'cart', 'product', 'products', 'search', 'item', 'items',
  'order', 'orders', 'profile', 'setting', 'settings',
  'favorite', 'favorites', 'home', 'shop', 'store',
  'back', 'help', 'support', 'clear', 'empty',
  'add', 'remove', 'delete', 'chat',
]);

/**
 * يتحقق من أن الكلمة الإنجليزية مقبولة في رد عربي.
 */
const isAllowedEnglishWord = (word: string): boolean => {
  const lower = word.toLowerCase();
  if (FORBIDDEN_UI_WORDS.has(lower)) return false;
  if (isBrandOrModel(word)) return true;
  return false;
};

// ─── Dialect Detection — Pattern-Based ────────────────────────────────────────

/**
 * أنماط الدارجة المغربية الأكثر شيوعاً.
 * نستخدم Patterns بدل Word Blacklist لتجنب False Positives.
 *
 * منطق الاكتشاف:
 *  - كلمات دارجة لا تظهر في الفصحى أبداً
 *  - أنماط نحوية خاصة بالدارجة (غادي + فعل، ماشي كـ نفي…)
 *  - رموز وتعابير دارجة واضحة
 */
const DIALECT_PATTERNS: RegExp[] = [
  // كلمات حصرية في الدارجة
  /\bشنو\b/u,
  /\bواش\b/u,
  /\bعفاك\b/u,
  /\bخويا\b/u,
  /\bخيتي\b/u,
  /\bدابا\b/u,
  /\bبزاف\b/u,
  /\bديال\b/u,
  /\bبشحال\b/u,
  /\bشحال\b/u,
  /\bبغيت\b/u,
  /\bنقدرش\b/u,
  /\bنساعدك\b/u,  // دارجة (في الفصحى: سأساعدك)
  /\bواخا\b/u,
  /\bصفى\b/u,
  /\bبلاش\b/u,
  /\bشكون\b/u,
  /\bعلاش\b/u,

  // أنماط نحوية دارجة
  /\bغادي\s+[أ-ي]/u,       // غادي + فعل مضارع عربي
  /\bماشي\s+[أ-ي]/u,        // ماشي كنفي (مخالف لـ "ماشٍ" الفصحى)
  /\bكنقلب\b/u,
  /\bكيدير\b/u,
  /\bكنسالفو\b/u,

  // أعداد دارجة
  /\bجوج\b/u,
  /\bتلاتة\b/u,
  /\bربعة\b/u,
  /\bخمسة\s+دراهم\b/u,
];

/**
 * يتحقق من أن النص لا يحتوي أنماط دارجة.
 */
const containsDialect = (text: string): boolean => {
  return DIALECT_PATTERNS.some(p => p.test(text));
};

// ─── Mixed Language Ratio Check ──────────────────────────────────────────────

/**
 * يحسب نسبة الكلمات الإنجليزية غير المسموح بها في النص.
 * إذا تجاوزت نسبة محددة → رد مرفوض.
 *
 * يتجنب البت الثنائي (binary) ويسمح بكلمة إنجليزية واحدة مقبولة
 * (اسم منتج، SKU…) دون رفض الرد كله.
 */
const INVALID_ENGLISH_RATIO_THRESHOLD = 0.08; // 8% من الكلمات كحد أقصى

const containsInvalidEnglish = (text: string): boolean => {
  const allWords = text.match(/\S+/g) || [];
  if (allWords.length === 0) return false;

  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  if (englishWords.length === 0) return false;

  const invalidEnglish = englishWords.filter(w => !isAllowedEnglishWord(w));
  const ratio = invalidEnglish.length / allWords.length;

  return ratio > INVALID_ENGLISH_RATIO_THRESHOLD;
};

// ─── Arabic Detection ─────────────────────────────────────────────────────────

export const containsArabicText = (text: string): boolean =>
  /[\u0600-\u06FF]/.test(text);

// ─── Validation Result ────────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

// ─── الدالة الرئيسية ─────────────────────────────────────────────────────────

/**
 * يتحقق من أن الرد يلتزم بلغة التطبيق المحددة.
 *
 * للعربية:
 *  1. لا لغة مختلطة (English UI words)
 *  2. لا دارجة مغربية / عامية
 *
 * للإنجليزية:
 *  1. لا عربية
 */
export const validateResponse = (text: string, locale: 'ar' | 'en'): ValidationResult => {
  if (!text) {
    _metrics.validationPasses++;
    return { isValid: true };
  }

  if (locale === 'ar') {
    if (containsInvalidEnglish(text)) {
      _metrics.validationFailures++;
      _metrics.invalidMixedLanguageCount++;
      return { isValid: false, reason: 'mixed_language' };
    }
    if (containsDialect(text)) {
      _metrics.validationFailures++;
      _metrics.dialectDetectedCount++;
      return { isValid: false, reason: 'arabic_dialect' };
    }
  } else if (locale === 'en') {
    if (containsArabicText(text)) {
      _metrics.validationFailures++;
      return { isValid: false, reason: 'contains_arabic_text' };
    }
  }

  _metrics.validationPasses++;
  return { isValid: true };
};

// ─── Re-exports for backward compatibility ────────────────────────────────────

/** للاستخدام الخارجي المباشر إن لزم */
export const containsDialectWords = containsDialect;
export const containsInvalidEnglishWords = containsInvalidEnglish;
