/**
 * CommentGenerator — Template Engine لتوليد التعليقات
 *
 * بدلاً من مصفوفة جمل ثابتة، يستخدم هذا الملف نظام Templates مع
 * Placeholder {product} يُستبدل باسم المنتج الفعلي إذا كان معروفاً.
 *
 * إذا لم يكن اسم المنتج معروفاً، تُحذف الكلمة وتُعدَّل الجملة تلقائياً.
 *
 * يدعم:
 *  - tone:   positive | negative | neutral
 *  - length: short | long
 *  - locale: ar | en
 */

// ─── أنواع البيانات ────────────────────────────────────────────────────────────

interface CommentTemplate {
  /** النص مع placeholder {product} اختياري */
  text: string;
  tone: 'positive' | 'negative' | 'neutral';
  length: 'short' | 'long';
  locale: 'ar' | 'en';
}

export interface GenerateCommentOptions {
  tone?: 'positive' | 'negative' | 'neutral';
  length?: 'short' | 'long';
  locale: 'ar' | 'en';
  productName?: string;
}

// ─── مكتبة Templates ───────────────────────────────────────────────────────────

const COMMENT_TEMPLATES: CommentTemplate[] = [
  // ── Arabic | Positive | Short ──────────────────────────────────────────────
  { text: '{product} منتج رائع، أنصح به بشدة! 👍', tone: 'positive', length: 'short', locale: 'ar' },
  { text: 'الجودة ممتازة في {product}، سعيد بشرائه. ✨', tone: 'positive', length: 'short', locale: 'ar' },
  { text: 'تجربة رائعة مع {product}! أنصح بتجربته. 🌟', tone: 'positive', length: 'short', locale: 'ar' },
  { text: '{product} خيار ممتاز! يستحق كل قرش. 💯', tone: 'positive', length: 'short', locale: 'ar' },
  { text: 'راضٍ تماماً عن {product}، جودة عالية وسعر مناسب. 👌', tone: 'positive', length: 'short', locale: 'ar' },

  // ── Arabic | Positive | Long ───────────────────────────────────────────────
  { text: 'استخدمت {product} منذ فترة وأنا سعيد جداً بالنتيجة. الجودة ممتازة وتستحق كل قرش دفعته. أنصح الجميع بتجربته! 🌟', tone: 'positive', length: 'long', locale: 'ar' },
  { text: 'منتج {product} فاق توقعاتي بكثير! التغليف جميل، الجودة عالية، والتوصيل كان سريعاً. تجربة تسوق رائعة مع كتارا. ✨', tone: 'positive', length: 'long', locale: 'ar' },
  { text: 'اشتريت {product} بناءً على التوصيات وأنا لم أندم! الجودة تتحدث عن نفسها والنتائج واضحة. سأشتري مرة أخرى بكل تأكيد. 💯', tone: 'positive', length: 'long', locale: 'ar' },

  // ── Arabic | Negative | Short ──────────────────────────────────────────────
  { text: '{product} لم يلبِّ توقعاتي، الجودة أقل مما كنت أتوقع. 😕', tone: 'negative', length: 'short', locale: 'ar' },
  { text: 'خيبة أمل من {product}، لا أنصح به بصراحة. 👎', tone: 'negative', length: 'short', locale: 'ar' },
  { text: 'للأسف {product} لم يكن بالجودة المعلن عنها. 😞', tone: 'negative', length: 'short', locale: 'ar' },

  // ── Arabic | Negative | Long ───────────────────────────────────────────────
  { text: 'للأسف تجربتي مع {product} كانت مخيبة للآمال. الجودة ليست كما في الصور والرائحة غريبة نوعاً ما. لا أنصح به وسأفكر قبل الشراء مجدداً من هذا المنتج. 😞', tone: 'negative', length: 'long', locale: 'ar' },
  { text: 'اشتريت {product} وكانت خيبة أمل كبيرة. لم تكن النتائج كما وُعدت، والتغليف وصل تالفاً. آمل أن تتحسن الجودة مستقبلاً. 👎', tone: 'negative', length: 'long', locale: 'ar' },

  // ── Arabic | Neutral | Short ───────────────────────────────────────────────
  { text: '{product} جيد بشكل عام، لا يخيب ولا يبهر. 🙂', tone: 'neutral', length: 'short', locale: 'ar' },
  { text: 'تجربة متوسطة مع {product}، يؤدي الغرض بشكل مقبول. 😐', tone: 'neutral', length: 'short', locale: 'ar' },

  // ── Arabic | Neutral | Long ────────────────────────────────────────────────
  { text: '{product} منتج جيد يؤدي الغرض المطلوب. ليس الأفضل في السوق ولكنه مقبول بسعره. يمكن تجربته ولكن توقعاتك يجب أن تكون متوسطة. 🙂', tone: 'neutral', length: 'long', locale: 'ar' },

  // ── English | Positive | Short ─────────────────────────────────────────────
  { text: '{product} is amazing! Highly recommend it. 👍', tone: 'positive', length: 'short', locale: 'en' },
  { text: 'Great quality {product}! Worth every penny. ✨', tone: 'positive', length: 'short', locale: 'en' },
  { text: 'Loving {product}! Very satisfied with my purchase. 🌟', tone: 'positive', length: 'short', locale: 'en' },
  { text: '{product} exceeded my expectations! 💯', tone: 'positive', length: 'short', locale: 'en' },

  // ── English | Positive | Long ──────────────────────────────────────────────
  { text: "I've been using {product} for a while now and I'm really impressed with the quality. It works exactly as described and the results are visible. Definitely recommending this to everyone! 🌟", tone: 'positive', length: 'long', locale: 'en' },
  { text: '{product} is one of the best purchases I have made on Kataraa! The packaging was beautiful, quality is top-notch, and delivery was fast. 10/10 would recommend. ✨', tone: 'positive', length: 'long', locale: 'en' },

  // ── English | Negative | Short ─────────────────────────────────────────────
  { text: '{product} did not meet my expectations. Not recommended. 👎', tone: 'negative', length: 'short', locale: 'en' },
  { text: 'Disappointed with {product}. Quality is below what was advertised. 😞', tone: 'negative', length: 'short', locale: 'en' },

  // ── English | Negative | Long ──────────────────────────────────────────────
  { text: "Unfortunately, my experience with {product} was disappointing. The quality doesn't match the product photos and the smell is quite strong. I wouldn't recommend it and will be more careful next time. 👎", tone: 'negative', length: 'long', locale: 'en' },

  // ── English | Neutral | Short ──────────────────────────────────────────────
  { text: '{product} is okay, does the job but nothing spectacular. 🙂', tone: 'neutral', length: 'short', locale: 'en' },
  { text: 'Average experience with {product}. Works as expected. 😐', tone: 'neutral', length: 'short', locale: 'en' },

  // ── English | Neutral | Long ───────────────────────────────────────────────
  { text: '{product} is a decent product that does what it promises. Not the best on the market but acceptable for its price range. Worth trying if you keep expectations moderate. 🙂', tone: 'neutral', length: 'long', locale: 'en' },
];

// ─── اختيار عشوائي من مصفوفة ─────────────────────────────────────────────────

const _lastUsedIndex = new Map<string, number>();

const pickTemplate = (templates: CommentTemplate[]): CommentTemplate => {
  const key = templates.map(t => t.text).join('|');
  const lastIdx = _lastUsedIndex.get(key);
  let idx: number;
  if (templates.length <= 1) {
    idx = 0;
  } else {
    do {
      idx = Math.floor(Math.random() * templates.length);
    } while (idx === lastIdx);
  }
  _lastUsedIndex.set(key, idx);
  return templates[idx];
};

// ─── تطبيق النص مع استبدال Placeholder ──────────────────────────────────────

/**
 * يستبدل {product} في template بالاسم الفعلي أو يحذف الكلمة ويعدّل الجملة.
 */
const applyTemplate = (template: string, productName: string | undefined): string => {
  if (!productName) {
    // حذف {product} وتنظيف الجملة
    return template
      .replace(/\{product\} +/g, '')      // في بداية الجملة
      .replace(/ +\{product\}/g, '')       // في نهاية الجملة
      .replace(/\{product\}/g, '')         // في أي مكان آخر
      .replace(/  +/g, ' ')               // تنظيف مسافات مضاعفة
      .trim();
  }
  return template.replace(/\{product\}/g, productName);
};

// ─── الدالة الرئيسية ──────────────────────────────────────────────────────────

/**
 * يولد تعليقاً مناسباً بناءً على الخيارات المحددة.
 *
 * @example
 * generateComment({ tone: 'positive', length: 'short', locale: 'ar', productName: 'سيروم لوريال' })
 * // → "سيروم لوريال منتج رائع، أنصح به بشدة! 👍"
 *
 * generateComment({ tone: 'positive', length: 'short', locale: 'ar' })
 * // → "منتج رائع، أنصح به بشدة! 👍"
 */
export const generateComment = (options: GenerateCommentOptions): string => {
  const {
    tone = 'positive',
    length = 'short',
    locale,
    productName,
  } = options;

  // تصفية Templates المناسبة
  const matching = COMMENT_TEMPLATES.filter(
    t => t.tone === tone && t.length === length && t.locale === locale
  );

  // fallback: نفس النبرة وأي طول
  const fallback = matching.length > 0
    ? matching
    : COMMENT_TEMPLATES.filter(t => t.tone === tone && t.locale === locale);

  // fallback أخير: أي template للغة نفسها
  const final = fallback.length > 0
    ? fallback
    : COMMENT_TEMPLATES.filter(t => t.locale === locale);

  const templates = final.length > 0 ? final : COMMENT_TEMPLATES;

  const chosen = pickTemplate(templates);
  return applyTemplate(chosen.text, productName);
};

/**
 * يُرجع قائمة بجميع التعليقات المتوفرة لمجموعة خيارات (للمعاينة والاختبار).
 */
export const getAllCommentVariants = (options: Omit<GenerateCommentOptions, 'productName'>): string[] => {
  const { tone = 'positive', length = 'short', locale } = options;
  return COMMENT_TEMPLATES
    .filter(t => t.tone === tone && t.length === length && t.locale === locale)
    .map(t => t.text);
};
