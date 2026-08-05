/**
 * ResponseNormalizer — الطبقة بين Generator و LanguageGuard
 *
 * Flow:
 *   Generator → Normalizer → LanguageGuard → Retry → Fallback
 *
 * المسؤوليات:
 *  - استبدال الكلمات المختلطة بمقابلها العربي قبل التحقق
 *  - تحويل الأرقام الإنجليزية إلى عربية إن لزم
 *  - تنظيف المسافات والعلامات الزائدة
 *  - تحويل مصطلحات الواجهة المختلطة ("Cart" → "سلة التسوق")
 *
 * يقلل هذا من عدد حالات الفشل في LanguageGuard بشكل كبير
 * لأنه يصحح المشاكل الشائعة قبل أن تصل إلى مرحلة التحقق.
 */

// ─── خريطة الاستبدال للمصطلحات المختلطة ─────────────────────────────────────

/**
 * مصطلحات الواجهة الإنجليزية ومقابلها العربي الفصيح البسيط.
 * ترتب من الأطول للأقصر لضمان الاستبدال الصحيح (longest-match first).
 */
const UI_TERM_MAP: Array<[RegExp, string]> = [
  // عبارات مركبة أولاً
  [/\bshopping cart\b/gi,   'سلة التسوق'],
  [/\bwish list\b/gi,        'قائمة الأمنيات'],
  [/\bhome page\b/gi,        'الصفحة الرئيسية'],
  [/\bsign in\b/gi,          'تسجيل الدخول'],
  [/\bsign up\b/gi,          'إنشاء حساب'],
  [/\bsign out\b/gi,         'تسجيل الخروج'],

  // مفردات شائعة
  [/\bcart\b/gi,             'سلة التسوق'],
  [/\bproducts?\b/gi,        'المنتجات'],
  [/\bsearch\b/gi,           'البحث'],
  [/\bitem s?\b/gi,          'العناصر'],
  [/\borders?\b/gi,          'الطلبات'],
  [/\bprofile\b/gi,          'الملف الشخصي'],
  [/\bsettings?\b/gi,        'الإعدادات'],
  [/\bfavorites?\b/gi,       'المفضلة'],
  [/\bhome\b/gi,             'الرئيسية'],
  [/\bshop\b/gi,             'المتجر'],
  [/\bstore\b/gi,            'المتجر'],
  [/\bback\b/gi,             'رجوع'],
  [/\bhelp\b/gi,             'مساعدة'],
  [/\bsupport\b/gi,          'الدعم'],
  [/\bclear\b/gi,            'مسح'],
  [/\bempty\b/gi,            'فارغ'],
  [/\bremove\b/gi,           'إزالة'],
  [/\bdelete\b/gi,           'حذف'],
  [/\badd\b/gi,              'إضافة'],
  [/\bchat\b/gi,             'المحادثة'],
];

// ─── تحويل الأرقام الإنجليزية إلى عربية ───────────────────────────────────────

const ARABIC_DIGITS: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
};

/**
 * يحوّل الأرقام الإنجليزية (0-9) داخل نص عربي إلى أرقام عربية (٠-٩).
 * لا يحوّل الأرقام إذا كانت داخل كلمات إنجليزية (أسماء منتجات، SKUs…).
 */
const convertDigits = (text: string): string => {
  // نحوّل فقط الأرقام المستقلة المحاطة بعلامات عربية أو مسافات
  return text.replace(/(?<=[\u0600-\u06FF\s،,.!؟?]|^)\d+(?=[\u0600-\u06FF\s،,.!؟?]|$)/gm,
    (digits) => digits.split('').map(d => ARABIC_DIGITS[d] ?? d).join('')
  );
};

// ─── تنظيف المسافات والعلامات الزائدة ────────────────────────────────────────

const cleanWhitespace = (text: string): string =>
  text
    .replace(/[ \t]{2,}/g, ' ')        // مسافات متعددة → مسافة واحدة
    .replace(/\n{3,}/g, '\n\n')        // أسطر فارغة زائدة
    .trim();

// ─── الدالة الرئيسية ─────────────────────────────────────────────────────────

/**
 * ينظّف ويوحّد ردود المساعد العربية قبل إرسالها إلى LanguageGuard.
 *
 * @param text   - النص الخام من ResponseGenerator
 * @param locale - لغة المساعد الحالية
 * @returns النص المُحسَّن
 */
export const normalizeResponse = (text: string, locale: 'ar' | 'en'): string => {
  if (!text) return text;

  // تطبيق التطبيع فقط على الردود العربية
  if (locale === 'ar') {
    let result = text;

    // 1. استبدال مصطلحات الواجهة المختلطة
    for (const [pattern, replacement] of UI_TERM_MAP) {
      result = result.replace(pattern, replacement);
    }

    // 2. تحويل الأرقام (اختياري — مفعّل بشكل افتراضي)
    // result = convertDigits(result);

    // 3. تنظيف المسافات
    result = cleanWhitespace(result);

    return result;
  }

  // للإنجليزية: تنظيف فقط
  return cleanWhitespace(text);
};

/**
 * يعيد صياغة الرد لجعله بلغة عربية فصحى بسيطة (Simple MSA).
 *
 * يستخدم قائمة من العبارات الرسمية المفرطة ويستبدلها
 * بما يعادلها من الفصحى البسيطة المباشرة.
 *
 * مثال:
 *   "يسرني إعلامكم بأنه تم تنفيذ العملية المطلوبة بنجاح"
 *   → "تم تنفيذ العملية بنجاح."
 */
const FORMAL_TO_SIMPLE: Array<[RegExp, string]> = [
  [/يسرني إعلامكم بأنه\s*/gi,       ''],
  [/يسرني إخباركم بأن\s*/gi,         ''],
  [/يشرفني إعلامكم\s*/gi,            ''],
  [/تفضلوا بقبول\s*/gi,              ''],
  [/المطلوبة منكم\b/gi,              'المطلوبة'],
  [/الكريم[ة]?\b/gi,                 ''],
  [/بكل سرور\b/gi,                   ''],
  [/على الفور\b/gi,                   'فوراً'],
  [/في أقرب وقت ممكن\b/gi,           'قريباً'],
  [/وفقاً لطلبكم\b/gi,               ''],
];

export const simplifySMSA = (text: string): string => {
  if (!text) return text;
  let result = text;
  for (const [pattern, replacement] of FORMAL_TO_SIMPLE) {
    result = result.replace(pattern, replacement);
  }
  return cleanWhitespace(result);
};

/**
 * Pipeline مدمج: يطبّق normalizeResponse ثم simplifySMSA.
 */
export const normalizeAndSimplify = (text: string, locale: 'ar' | 'en'): string => {
  return simplifySMSA(normalizeResponse(text, locale));
};
