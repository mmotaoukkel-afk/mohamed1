/**
 * AliasResolver — Layer 0: قاموس المرادفات المركزي وأدوات التوحيد
 *
 * المسؤوليات:
 *  - تنظيف النص (normalizeText)
 *  - قاموس مرادفات شامل (عربية فصحى، دارجة مغربية، إنجليزية)
 *  - استخراج اسم الشاشة من النص
 *  - أدوات مساعدة: containsAny, extractScreen, extractOrdinal, extractNumber
 */

import type { ScreenName } from '../types';

// ─── كلمات فئات التصفح ────────────────────────────────────────────────────────

export const CATEGORY_NAV_WORDS = [
  'قسم', 'القسم', 'فئه', 'الفئه', 'فئة', 'الفئة', 'اقسام', 'الاقسام',
  'تصنيف', 'التصنيف', 'section', 'category', 'department',
];

// ─── كلمات المنتجات (للتصنيف الذكي) ──────────────────────────────────────────

export const PRODUCT_INDICATOR_WORDS = [
  'منتج', 'المنتج', 'منتوج', 'المنتوج', 'سلعة', 'السلعة',
  'كريم', 'مرطب', 'سيروم', 'غسول', 'ماسك', 'واقي', 'شامبو', 'بلسم',
  'زيت', 'شعر', 'بشره', 'وجه', 'عنايه', 'تبييض', 'ترطيب', 'عطر', 'برفان',
  'مكياج', 'روج', 'كحل', 'فاونديشن', 'صابون', 'لوشن', 'ماسكارا', 'بودره',
  'كراتين', 'سكراب', 'مقشر', 'كولونيا', 'فيتامين',
  'cream', 'serum', 'moisturizer', 'lotion', 'oil', 'shampoo', 'perfume',
  'makeup', 'lipstick', 'foundation', 'sunscreen', 'soap', 'conditioner',
  'mascara', 'powder', 'scrub', 'keratin', 'product', 'item',
];

// ─── كلمات تفريغ السلة والمفضلات ───────────────────────────────────────────

export const CLEAR_CART_WORDS = ['فرغ', 'خوي', 'empty', 'clear all', 'clear', 'افرغ'];

// ─── مرادفات الأسئلة والاستفسارات ───────────────────────────────────────────

export const PRICE_QUESTION_ALIASES = [
  // دارجة مغربية
  'شحال الثمن', 'شحال كيدير', 'شحال ثمن', 'بشحال', 'شحال دير', 'شحال هذا',
  'بشحال هذا', 'بشحال هذا المنتج', 'بشحال هاد', 'شحال ثمنه', 'ثمن هاد',
  'بشحال كيتباع', 'شحال كيتباع', 'كم ثمنه', 'واش غالي', 'شحال الپري',
  'شحال ثمن هذا المنتوج', 'شحال ثمن هاد المنتوج', 'شحال يسوى', 'شحال تسوى', 'شحال قيمته',
  // عربية فصحى
  'السعر', 'بكم', 'كم السعر', 'بكم هذا', 'كم سعره', 'ما سعر', 'كم يكلف', 'ما ثمن',
  'كم هو ثمن', 'كم هو ثمن هذا', 'كم هو ثمن هذا المنتوج', 'كم هو سعر', 'كم هو سعر هذا',
  'ما هو ثمن', 'ما هو ثمن هذا', 'ما هو ثمن هذا المنتوج', 'ما هو سعر', 'ما هو سعر هذا',
  'كم ثمن', 'كم سعر', 'كم قيمته', 'ماهو ثمن', 'ماهو سعر', 'ثمن هذا المنتوج', 'ثمن هذا المنتج',
  // إنجليزية
  'price', 'how much', 'cost', 'how much does it cost', 'what is the price',
];

export const DELIVERY_QUESTION_ALIASES = [
  // دارجة مغربية
  'شحال مدة التوصيل', 'مدة التوصيل', 'فوقاش يوصلني', 'شحال وقت التوصيل',
  'توصيل', 'شحن', 'شحال التوصيل', 'فين التوصيل', 'واش كاين التوصيل',
  'واش كتوصلو', 'كيفاش نوصلو', 'كيفاش التوصيل', 'واش كاين الليفريزون',
  'الليفريزون', 'واش كتوصلو للمغرب', 'فوقاش غيوصل', 'شحال ديال التوصيل',
  'واش التوصيل مجاني', 'واش التوصيل بالمجان', 'طريقة التوصيل',
  // عربية فصحى
  'هل يوجد توصيل', 'كيف يتم التوصيل', 'مدة الشحن', 'تكلفة التوصيل',
  // إنجليزية
  'delivery time', 'shipping time', 'shipping cost', 'delivery cost',
  'do you deliver', 'how to deliver', 'delivery fee', 'free shipping',
];

export const WARRANTY_QUESTION_ALIASES = [
  // دارجة مغربية
  'واش كاين الضمان', 'الضمان', 'واش المنتج اصلي', 'واش اوريجينال',
  'ضمان', 'اوريجينال', 'الاوريجينال', 'واش عندكم ضمان', 'واش عندكم الضمان',
  'الاسترجاع', 'استرجاع', 'واش نقدر نرجعه', 'واش نقدر نبدله', 'واش كاين الاسترجاع',
  'سياسة الاسترجاع', 'واش نقدر نردو', 'واش كاين الاستبدال', 'واش مضمون',
  // عربية فصحى
  'هل يوجد ضمان', 'سياسة الإرجاع', 'هل المنتج أصلي', 'هل هو أصلي',
  'سياسة الارجاع', 'سياسة الاستبدال', 'هل يمكن الاسترجاع',
  // إنجليزية
  'original', 'warranty', 'guarantee', 'return policy', 'is it original',
  'can i return', 'exchange policy', 'refund policy',
];

export const AVAILABILITY_QUESTION_ALIASES = [
  // دارجة مغربية
  'واش متوفر', 'واش كاين في السوك', 'واش موجود', 'كاين منه', 'واش كاين فالمخزن',
  'واش هذا متوفر', 'كاين فالماغازان', 'واش مازال كاين', 'واش باقي كاين',
  'واش عندكم', 'واش كاين عندكم', 'واش فالستوك',
  // عربية فصحى
  'هل متوفر', 'هل هو متاح', 'هل موجود في المخزون',
  // إنجليزية
  'in stock', 'available', 'is it available', 'do you have', 'is it in stock',
];

export const COMPARISON_QUESTION_ALIASES = [
  // دارجة مغربية
  'شنو الفرق', 'ما الفرق', 'الفرق بين', 'شكون حسن', 'شكون احسن',
  'قارن بين', 'قارن لي', 'قارنلي', 'شنو الاحسن', 'شكون خير',
  'واش هذا حسن من', 'واش هذا خير من', 'فرق بين',
  // عربية فصحى
  'ما هو الفرق', 'قارن بين', 'ما الأفضل', 'أيهما أفضل',
  // إنجليزية
  'comparison', 'difference', 'compare', 'which is better', 'vs',
];

export const DETAILS_QUESTION_ALIASES = [
  // دارجة مغربية
  'شنو مميزات', 'شنو المميزات', 'شرح لي', 'عطيني التفاصيل',
  'شنو كيدير', 'شنو كتدير', 'شنو هو هاد', 'شنو هي هاد',
  'كيفاش كيستعمل', 'كيفاش كنستعملو', 'صالح لشنو', 'ديالاش',
  'عطيني معلومات', 'وصف لي', 'حكيلي على', 'شرح هذا المنتج', 'شرح هذا المنتوج',
  // عربية فصحى
  'مميزات', 'المميزات', 'وصف', 'فوائد', 'الفوائد',
  'ما هي مميزات', 'ما هي مميزات هذا', 'ما هي مميزات هذا المنتوج',
  'ما مميزات', 'ما هي فوائد', 'ما فوائد', 'ما هي خصائص', 'ما خصائص',
  'طريقة الاستعمال', 'تفاصيل', 'معلومات عن المنتج',
  'دواعي الاستعمال', 'معلومات',
  // إنجليزية
  'details', 'description', 'features', 'how to use', 'benefits',
  'tell me about', 'what is', 'explain',
];

// ─── مرادفات التأكيد والرفض ──────────────────────────────────────────────────

export const CONFIRM_YES_ALIASES = [
  'نعم', 'اه', 'بصح', 'واخا', 'اكيد', 'موافق', 'يه', 'صفى', 'تأكيد', 'نعم متأكد',
  'yes', 'yep', 'sure', 'ok', 'confirm'
];

export const CONFIRM_NO_ALIASES = [
  'لا', 'نهائيا', 'مابغيتش', 'بلاش', 'لا شكرا', 'إلغاء', 'الغاء', 'حبس', 'رجع لور',
  'no', 'nope', 'cancel', 'don\'t'
];

// ─── مرادفات التعليقات (InteractionIntent — COMMENT) ───────────────────

/**
 * كلمات دالة بوضوح على نية كتابة تعليق — ثقة عالية (≥ 0.88)
 * تحتوي كلها على كلمة "تعليق" أو مرادف واضح
 */
export const COMMENT_WRITE_ALIASES = [
  // عربية فصحى
  'اكتب تعليق', 'علق', 'اكتب مراجعه', 'اكتب مراجعة', 'اكتب ريفيو', 'اكتب تقييم',
  'اترك تعليق', 'اضف تعليق', 'اضافه تعليق', 'ضيف تعليق',
  'اكتبلي تعليق', 'اكتب رايك', 'شارك رايك',
  // دارجة
  'علق بانه', 'علق بانها', 'كتب فيه', 'علق عليه', 'اكتب في',
  'حط تعليق', 'حطي تعليق', 'ضيفو تعليق',
  // إنجليزية
  'comment', 'write comment', 'write review', 'leave review',
  'add review', 'leave a comment', 'add comment', 'write a review',
  'post comment', 'leave feedback', 'write feedback',
];

/**
 * كلمات دالة على نشر/إرسال التعليق — ثقة عالية (≥ 0.95)
 */
export const COMMENT_SUBMIT_ALIASES = [
  'انشر', 'ارسل', 'سجل', 'اكمل', 'تاكيد', 'صيفط', 'ابعته', 'ابعتها',
  'نشر التعليق', 'ارسل التعليق', 'سجل التعليق',
  'post', 'submit', 'send', 'publish', 'post comment', 'submit comment', 'send comment',
];

/**
 * كلمات دالة على حذف التعليق — ثقة عالية (≥ 0.92)
 */
export const COMMENT_DELETE_ALIASES = [
  'احذف التعليق', 'امسح التعليق', 'حيد التعليق', 'ازل التعليق',
  'حذف التعليق', 'مسح التعليق', 'احذف المراجعه', 'امسح المراجعه',
  'حيدو التعليق', 'مسحو التعليق',
  'delete comment', 'remove comment', 'delete review', 'remove review',
];

// ─── مرادفات التقييم (InteractionIntent — RATING) ─────────────────

/**
 * كلمات تدل بوضوح على نية تقييم المنتج — ثقة عالية (≥ 0.88)
 */
export const RATING_ALIASES = [
  // عربية فصحى
  'قيم', 'تقييم', 'قيمه', 'قيم المنتج', 'أعطه', 'أعطيه', 'اعطه',
  'أعطه تقييم', 'أعطيه تقييم', 'عدل التقييم', 'غير التقييم',
  'ضع تقييم', 'أضف تقييم',
  // دارجة مغربية
  'قيمه ب', 'عطيه', 'عطيليه', 'أعطيه نجوم', 'قيم ب', 'يستاحق',
  // إنجليزية
  'rate', 'rating', 'stars', 'give stars', 'give rating',
  'rate this', 'rate product', 'rate it', 'star rating', 'set rating',
  'change rating', 'update rating',
];

/**
 * كلمات تدل على حذف التقييم — ثقة عالية (≥ 0.92)
 */
export const RATING_REMOVE_ALIASES = [
  'احذف التقييم', 'الغ التقييم', 'حيد التقييم', 'امسح التقييم',
  'مسح التقييم', 'احذف النجوم', 'بلاش تقييم',
  'remove rating', 'delete rating', 'clear rating', 'cancel rating',
];

/**
 * كلمات تعني الحد الأقصى (5 نجوم) في سياق التقييم
 */
export const RATING_FULL_ALIASES = [
  'كامله', 'كامل', 'مكس', 'ماكس', 'الحد الاقصى', 'كل النجوم',
  'full', 'max', 'maximum', 'all stars', 'perfect', 'full stars',
];


// ─── أنماط الأفعال الدلالية (Semantic Pattern Prefixes) ─────────────────────────

export const SEARCH_PATTERNS_PREFIXES = [
  'بغيت', 'عافاك وريني', 'قلب ليا', 'لقي ليا', 'كنقلب على', 'باغي نشري', 'باغي', 'نفتش على',
  'كنفتش على', 'وريني', 'أرني', 'أبحث عن', 'اعرض لي', 'اريد', 'شوف لي'
];

export const ACTION_PATTERNS_PREFIXES = [
  'افتح', 'حل', 'ادخل', 'روح', 'انتقل', 'اذهب', 'ديني', 'خذني', 'امشي', 'سير',
  'نقلني', 'انقلني', 'رجع', 'رجعني', 'زيد', 'ضيف', 'حيد', 'احذف', 'حيدو', 'فرغ', 'خوي', 'مسح', 'امسح'
];

// ─── خوارزمية Levenshtein Distance ──────────────────────────────────────────

export const getLevenshteinDistance = (a: string, b: string): number => {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = a[i - 1] === b[j - 1]
        ? tmp[i - 1][j - 1]
        : Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + 1);
    }
  }
  return tmp[a.length][b.length];
};

// ─── 1. تنظيف وتوحيد النصوص ──────────────────────────────────────────────────

export const normalizeText = (text: string): string => {
  if (!text) return '';

  let res = text.toLowerCase();

  // إزالة التشكيل العربي (Harakat)
  res = res.replace(/[\u064B-\u0652]/g, '');

  // توحيد الهمزات والحروف المتشابهة
  res = res.replace(/[أإآٱ]/g, 'ا');
  res = res.replace(/ة/g, 'ه');
  res = res.replace(/ى/g, 'ي');

  // إزالة تكرار الحروف (مرحبببببا → مرحبا) - مع الحفاظ على الحرف المزدوج مثل "الاجدد" و "ممتاز"
  res = res.replace(/([\u0600-\u06FF])\1{2,}/g, '$1');
  res = res.replace(/([a-z])\1{2,}/g, '$1');

  // إزالة الرموز مع الاحتفاظ بالأحرف والأرقام والمسافات
  res = res.replace(/[^\w\s\u0600-\u06FF]/g, ' ');

  // تنظيف المسافات
  res = res.replace(/\s+/g, ' ').trim();

  return res;
};

// ─── 2. قاموس المرادفات المركزي ───────────────────────────────────────────────

/** مرادفات الشاشات / الوجهات */
export const CART_ALIASES = [
  'السله', 'سله', 'سلة', 'المشتريات', 'عربه', 'العربه', 'بانيي', 'البانيي', 'الباني', 'باني',
  'cart', 'bag', 'basket', 'shopping cart',
];

export const HOME_ALIASES = [
  'الرئيسيه', 'البدايه', 'الهوم', 'الصفحه الرئيسيه', 'الواجهه',
  'home', 'main', 'main page', 'homepage',
];

export const PROFILE_ALIASES = [
  'البروفايل', 'بروفايل', 'البروفيل', 'بروفيل',
  'الملف الشخصي', 'حسابي', 'حسابى', 'ملفي',
  'profile', 'account', 'my account', 'my profile',
];

export const PRODUCTS_ALIASES = [
  'المنتجات', 'المنتوجات', 'منتوجات', 'المتجر', 'الشوب', 'الماركت',
  'products', 'shop', 'store', 'market',
];

export const FAVORITES_ALIASES = [
  'المفضله', 'مفضلتي', 'المفضلات', 'المحبوبات', 'المفضلة', 'المفضل', 'مفضل', 'مفضلة', 'مفضله',
  'favorites', 'wishlist', 'liked', 'saved',
];

export const ORDERS_ALIASES = [
  'الطلبات', 'طلباتي', 'مشترياتي', 'الاوردرات',
  'orders', 'my orders', 'purchases',
];

export const SETTINGS_ALIASES = [
  'الاعدادات', 'الاعدات', 'اعدادات',
  'settings', 'config', 'preferences',
];

export const BACK_ALIASES = [
  'رجوع', 'رجعني', 'عوده', 'ارجع', 'ارجعني', 'رجع', 'ارجوع',
  'للخلف', 'ورا', 'للوراء', 'لور', 'للور', 'وراء',
  'السابقة', 'سابقة', 'سابق', 'لصفحة السابقة', 'صفحة قبل',
  'back', 'go back', 'return', 'previous',
];

/** مرادفات الأفعال */
export const SHOW_ALIASES = [
  'ارني', 'اريني', 'وريني', 'اعرض', 'جيب', 'جيبلي', 'جيب لي',
  'اريد', 'نبغي', 'بغيت', 'بغا', 'شوف', 'شوفي', 'شوفلي',
  'عطيني', 'دور', 'دورلي', 'قلب', 'قلبلي', 'فتش',
  'ابحث', 'ابحثي', 'ابحث عن',
  'عندكم', 'عندك', 'كاين', 'واش كاين',
  'show', 'show me', 'display', 'get me', 'find', 'search', 'search for',
  'i want', 'i need', 'looking for', 'look for', 'do you have',
];

export const NAVIGATE_ALIASES = [
  'افتح', 'حل', 'ادخل', 'روح', 'انتقل', 'اذهب', 'ديني', 'خذني', 'امشي', 'سير',
  'نقلني', 'انقلني', 'وديني', 'خدني', 'وصلني', 'ارسلني', 'صيفطني', 'سيفطني', 'دينا', 'خدينا', 'تدينا', 'دي', 'ديها',
  'open', 'go to', 'take me', 'navigate', 'goto', 'go',
];

export const ADD_ALIASES = [
  'اضف', 'ضيف', 'زيد', 'حط', 'حطي', 'حطلي', 'ضع', 'ضعه',
  'اشتري', 'اقتني', 'خذ', 'خذلي', 'شري', 'شريلي', 'اشتره', 'باغي نشري',
  'انقل', 'نقل', 'انقلها', 'نقلها',
  'add', 'put in', 'buy', 'purchase',
];

export const REMOVE_ALIASES = [
  'احذف', 'حذف', 'حيد', 'حيدو', 'حيدها', 'نحي', 'احذفه',
  'ازل', 'أزل', 'ازله', 'أزله', 'مسح', 'امسح', 'شيل', 'شيله',
  'remove', 'delete', 'discard', 'drop',
];

export const UNDO_ALIASES = [
  'تراجع', 'لا بلاش', 'بلاش', 'الغاء', 'إلغاء', 'تراجع عن', 'ارجع في كلامي', 'ارجع فكلامي',
  'undo', 'revert', 'cancel last', 'go back on that'
];

export const REPEAT_ALIASES = [
  'كرر', 'اعد ذلك', 'أعد ذلك', 'مرة اخرى', 'مرة أخرى', 'نعاود', 'عاود',
  'repeat', 'do it again', 'once more', 'again'
];

export const CLICK_ALIASES = [
  'اضغط', 'انقر', 'كليك', 'اختر', 'افتح', 'برك', 'ورك', 'كليكي', 'برك عليه', 'ورك عليه', 'كليكي عليه',
  'click', 'press', 'select', 'choose', 'open'
];

export const SHARE_ALIASES = [
  'شارك', 'بارطاجي', 'صيفط', 'ارسل', 'مشاركة',
  'share', 'send', 'forward'
];

export const RECOMMENDATION_ALIASES = [
  'افضل', 'الافضل', 'احسن', 'الاحسن',
  'اكثر مبيعا', 'الاكثر مبيعا',
  'اقترح', 'تنصحني', 'تنصح', 'ماذا تنصح', 'ما تنصح', 'اقتراحات', 'نصيحه',
  'الارخص', 'الاغلي', 'الاجدد', 'اجدد',
  'best', 'top', 'popular', 'recommend', 'trending', 'bestseller', 'suggestions',
  // عبارات المنتجات المميزة / البارزة
  'مميزة', 'مميزه', 'المميزة', 'المميزه', 'مميز',
  'بارزة', 'بارزه', 'مشهورة', 'مشهوره',
  'مختارة', 'مختاره', 'الافضل', 'الاحسن',
  'featured', 'highlight', 'highlights', 'best products', 'top products',
  'منتجات مميزة', 'منتجات مميزه', 'المنتجات المميزة', 'المنتجات المميزه',
  'اعرضلي احسن', 'اعرض لي احسن', 'ورني احسن', 'وريني احسن',
  'اعرضلي افضل', 'اعرض لي افضل', 'ورني افضل', 'وريني افضل',
];

export const SUPPORT_ALIASES = [
  // دارجة مغربية وشكاوى
  'خدمة الزبناء', 'خدمه العملاء', 'خدمة العملاء', 'الدعم', 'دعم فني',
  'تواصل مع', 'اتواصل', 'نتواصل',
  'مشكل', 'مشكله', 'عندي مشكل', 'شكايه', 'شكوي',
  'ارجاع', 'ارجع المنتج', 'استرجاع', 'ارجاع المنتج', 'نرجع', 'نرجعو', 'نرد', 'نرده',
  'سيء', 'خايب', 'خايبه', 'بطيء', 'ثقيل', 'ماخدامش', 'لا يعمل', 'لست سريع', 'العمل معك سيء', 'العمل معك شيء',
  // إنجليزية وشكاوى
  'customer service', 'support', 'contact', 'complaint', 'return', 'refund',
  'help me', 'i have a problem', 'issue', 'not fast', 'slow', 'bad', 'not working', 'worst',
];

export const BRAND_ALIASES = [
  'من انتم', 'من انت', 'شكون انت', 'شكون انتما',
  'عرفني', 'عرفوني', 'معلومات عن المتجر', 'علامتكم التجاريه', 'علامتكم',
  'عن علامتكم', 'شنو هاد المتجر', 'معلومات عنكم', 'وصف عنكم',
  'ما يميزكم', 'ما الذي يميزكم', 'عرفني بعلامتكم',
  'عرفني عليكم', 'تعريف بسيط عنكم', 'حكيلي عليكم',
  'عنكم وعن', 'ما هو متجركم', 'ما هي علامتكم التجارية',
  'who are you', 'about your brand', 'what is this store', 'about you', 'your brand',
  'tell me about your brand', 'introduce yourself', 'what makes you special',
];

export const GREETING_ALIASES = [
  'السلام عليكم', 'سلام عليكم', 'سلام', 'مرحبا', 'اهلا', 'اهلين', 'الو', 'هاي',
  'صباح الخير', 'مساء الخير',
  'hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening',
];

export const THANKS_ALIASES = [
  'شكرا', 'ميرسي', 'بارك الله فيك', 'مشكور', 'مشكوره', 'يسلمو', 'تسلم',
  'thanks', 'thank you', 'thx', 'appreciated',
];

export const POSITIVE_ALIASES = [
  'ممتاز', 'رائع', 'زوين', 'زوينه', 'عظيم', 'حلو', 'تمام', 'واو', 'نعم',
  'great', 'awesome', 'amazing', 'nice', 'cool', 'perfect', 'yes', 'wow',
];

export const HOW_ARE_YOU_ALIASES = [
  'كيف حالك', 'كيف الحال', 'كيف احوالك', 'كيداير', 'كيدايره', 'كي داير', 'كي دايرة',
  'لاباس', 'واش لاباس', 'كيفك', 'شلونك', 'عامل ايه', 'شخبار مالي الدار', 'كيراك',
  'how are you', 'how r u', 'howdy',
];

// ─── 3. خريطة الشاشات ────────────────────────────────────────────────────────

const SCREEN_ALIAS_MAP: { aliases: string[]; screen: ScreenName }[] = [
  { aliases: CART_ALIASES,      screen: 'Cart' },
  { aliases: HOME_ALIASES,      screen: 'Home' },
  { aliases: PROFILE_ALIASES,   screen: 'Profile' },
  { aliases: PRODUCTS_ALIASES,  screen: 'Products' },
  { aliases: FAVORITES_ALIASES, screen: 'Favorites' },
  { aliases: ORDERS_ALIASES,    screen: 'Orders' },
  { aliases: SETTINGS_ALIASES,  screen: 'Settings' },
  { aliases: BACK_ALIASES,      screen: 'Back' },
];

// ─── 4. الأعداد الترتيبية ─────────────────────────────────────────────────────

export const ORDINAL_MAP: Record<string, number> = {
  'الاول': 0, 'اول': 0, 'الاولي': 0, 'اولي': 0, 'واحد': 0, '1': 0,
  'الثاني': 1, 'ثاني': 1, 'الثانيه': 1, 'ثانيه': 1, 'جوج': 1, '2': 1,
  'الثالث': 2, 'ثالث': 2, 'الثالثه': 2, 'ثالثه': 2, 'تلاته': 2, '3': 2,
  'الرابع': 3, 'رابع': 3, 'الرابعه': 3, 'رابعه': 3, 'ربعه': 3, '4': 3,
  'الخامس': 4, 'خامس': 4, 'الخامسه': 4, 'خامسه': 4, 'خمسه': 4, '5': 4,
  'السادس': 5, 'سادس': 5, '6': 5,
  'السابع': 6, 'سابع': 6, '7': 6,
  'الثامن': 7, 'ثامن': 7, '8': 7,
  'التاسع': 8, 'تاسع': 8, '9': 8,
  'العاشر': 9, 'عاشر': 9, '10': 9,
  'first': 0, '1st': 0,
  'second': 1, '2nd': 1,
  'third': 2, '3rd': 2,
  'fourth': 3, '4th': 3,
  'fifth': 4, '5th': 4,
};

// ─── خريطة استخراج النجوم (1–5) للتقييم ────────────────────────

/**
 * خريطة الكلمات النصية إلى أرقام التقييم (1-5)
 * تشمل: عربية فصحى + دارجة مغربية + إنجليزية
 */
const RATING_WORD_MAP: Record<string, number> = {
  // عربية فصحى
  'واحد': 1,  'واحده': 1, 'نجمه': 1,  'نجمة واحده': 1,
  'اثنين': 2, 'اثنتين': 2,
  'ثلاثة': 3, 'ثلاث': 3,
  'اربعة': 4, 'اربع': 4,
  'خمسة': 5,  'خمس': 5,  'خمس نجوم': 5, 'خمس نجمات': 5,
  // دارجة مغربية
  'يواحد': 1, 'جوج': 2, 'جوج نجوم': 2, 'تلاته': 3, 'تلات': 3, 'ربعه': 4, 'خمسه': 5,
  // إنجليزية
  'one': 1,  'two': 2,   'three': 3, 'four': 4,  'five': 5,
  'one star': 1, 'two stars': 2, 'three stars': 3, 'four stars': 4, 'five stars': 5,
  'a star': 1,
};

/**
 * تحويل الأرقام العربية-الهندية (١٢٣٤٥) إلى أرقام لاتينية (12345)
 */
const arabicIndicToLatin = (text: string): string => {
  return text.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
};

/**
 * استخراج عدد النجوم (1-5) من نص حر
 *
 * يدعم:
 * - أرقام لاتينية: 1 2 3 4 5
 * - أرقام عربية-هندية: ١ ٢ ٣ ٤ ٥
 * - كلمات نصية (AR/EN/Darija): "خمسة"، "three"، "تلاته"
 * - عبارات الحد الأقصى: "كامل"، "full"، "max" → 5
 *
 * @returns 1-5 أو undefined إذا لم يوجد عدد واضح، و-1 إذا كان > 5 (للتحقق من صحة المدخل)
 */
export const extractRatingValue = (text: string): number | undefined | -1 => {
  if (!text) return undefined;

  const normalized = normalizeText(arabicIndicToLatin(text));

  // 1. الحد الأقصى (كامل / full / max)
  if (RATING_FULL_ALIASES.some(a => normalized.includes(normalizeText(a)))) {
    return 5;
  }

  // 2. كلمات نصية (بدءاً من الأطول لتجنب تضارب الأجزاء)
  const sortedKeys = Object.keys(RATING_WORD_MAP).sort((a, b) => b.length - a.length);
  for (const word of sortedKeys) {
    if (normalized.includes(normalizeText(word))) {
      return RATING_WORD_MAP[word];
    }
  }

  // 3. أرقام داخل النص
  const numMatch = normalized.match(/\b([1-9]\d*)\b/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 5) return num;
    if (num > 5) return -1; // مؤشر خطأ Validation
  }

  return undefined;
};


// ─── 5. فئات المنتجات ─────────────────────────────────────────────────────────

export const CATEGORY_MAP: Record<string, string[]> = {
  'Skincare': [
    'بشره', 'وجه', 'مرطب', 'كريم', 'تبييض', 'ترطيب', 'عنايه بالبشره', 'عنايه', 'بشري', 'بشرى',
    'skin', 'skincare', 'face', 'cream', 'moisturizer', 'lotion', 'facial',
  ],
  'Hair Care': [
    'شعر', 'شامبو', 'بلسم', 'زيت الشعر', 'كراتين', 'عنايه بالشعر', 'شعري', 'شعرى',
    'hair', 'haircare', 'shampoo', 'conditioner', 'keratin',
  ],
  'Makeup': [
    'مكياج', 'ميكاب', 'ماكياج', 'روج', 'كحل', 'فاونديشن', 'ماسكارا', 'بودره', 'احمر شفاه', 'ظل',
    'makeup', 'lipstick', 'foundation', 'mascara', 'powder', 'blush', 'eyeshadow', 'concealer',
  ],
  'Perfume': [
    'عطر', 'برفان', 'عطور', 'بارفيوم', 'بارفيم', 'كولونيا',
    'perfume', 'fragrance', 'cologne', 'parfum',
  ],
  'Body Care': [
    'جسم', 'بدن', 'لوشن للجسم', 'سكراب للجسم', 'عنايه بالجسم',
    'body', 'body care', 'body lotion',
  ],
  'Toner': [
    'تونر', 'toner'
  ],
  'Serum': [
    'سيروم', 'serum'
  ],
  'Suncare': [
    'واقي شمس', 'واقي الشمس', 'حمايه من الشمس', 'suncare', 'sunscreen'
  ],
  'Anti-Aging': [
    'مكافحة الشيخوخة', 'مكافحه الشيخوخه', 'تجاعيد', 'anti-aging', 'anti aging'
  ],
  'Acne': [
    'حب الشباب', 'حب شباب', 'acne'
  ],
  'Tools': [
    'أدوات تجميل', 'ادوات تجميل', 'رولر', 'غوانشا', 'tools', 'beauty tools'
  ],
  'Cleansers': [
    'منظفات', 'غسول للوجه', 'ميسيلار', 'cleansers', 'cleanser'
  ],
  'Masks': [
    'ماسكات', 'ماسك للوجه', 'masks', 'mask'
  ],
};

// ─── 6. دوال المساعدة ─────────────────────────────────────────────────────────

/**
 * مطابقة ذكية للكلمات العربية مع دعم حروف الجر ولواحق الدارجة
 * e.g. 'لالسله'/'بالسله'/'سله' matches 'السله'
 * e.g. 'حيدو'/'حيدها' matches 'حيد'
 */
export const matchWord = (token: string, alias: string, useFuzzy = true): boolean => {
  if (token === alias) return true;

  // 1. دعم حروف الجر المباشرة (مثل لـ، بـ، فـ، وـ)
  const prefixes = ['ال', 'لل', 'بال', 'فال', 'وال', 'ل', 'ب', 'f', 'w', 'بـ', 'فـ', 'وـ'];
  for (const p of prefixes) {
    if (token.startsWith(p) && token.slice(p.length) === alias) {
      return true;
    }
  }

  // 2. تحويل حروف الجر المركبة لـ التعريف
  // مثلاً: "للسله" -> "السله"
  if (alias.startsWith('ال')) {
    const rawAlias = alias.slice(2);
    if (token.startsWith('لل') && token.slice(2) === rawAlias) return true;
    if (token.startsWith('بال') && token.slice(3) === rawAlias) return true;
    if (token.startsWith('فال') && token.slice(3) === rawAlias) return true;
    if (token.startsWith('وال') && token.slice(3) === rawAlias) return true;
  }

  // 3. دعم لواحق الدارجة المغربية للأفعال والأسماء والجمع
  // مثلاً: "حيدو" -> "حيد" / "ماسكات" -> "ماسك" / "منظفين" -> "منظف"
  const suffixes = ['و', 'ها', 'نا', 'لي', 'ا', 'ي', 'ك', 'كم', 'ني', 'ات', 'ين', 'ون'];
  if (token.startsWith(alias)) {
    const suffix = token.slice(alias.length);
    if (suffixes.includes(suffix)) {
      return true;
    }
  }

  // 4. مطابقة تقريبية (Fuzzy Matching) للأخطاء الإملائية الطفيفة
  if (useFuzzy) {
    const cleanToken = token.trim();
    const cleanAlias = alias.trim();
    const dist = getLevenshteinDistance(cleanToken, cleanAlias);
    const minLen = Math.min(cleanToken.length, cleanAlias.length);
    if (minLen >= 4) {
      const maxAllowedDistance = 1; // Strict distance of 1 to avoid false positive collisions
      if (dist <= maxAllowedDistance) {
        return true;
      }
    }
  }

  return false;
};

/** هل يحتوي النص على أحد المرادفات (كلمة كاملة أو عبارة)؟ */
export const containsAny = (normalized: string, aliases: string[], useFuzzy = true): boolean => {
  const tokens = normalized.split(' ');
  for (const alias of aliases) {
    const normAlias = normalizeText(alias);
    if (normAlias.includes(' ')) {
      // عبارة متعددة الكلمات
      if (normalized.includes(normAlias)) return true;
    } else {
      // كلمة واحدة — مطابقة ذكية للكلمات
      if (tokens.some(t => matchWord(t, normAlias, useFuzzy))) return true;
    }
  }
  return false;
};

/** استخراج اسم الشاشة المستهدفة */
export const extractScreen = (normalized: string): ScreenName | undefined => {
  const tokens = normalized.split(' ');
  for (const entry of SCREEN_ALIAS_MAP) {
    for (const alias of entry.aliases) {
      if (alias.includes(' ')) {
        if (normalized.includes(alias)) return entry.screen;
      } else {
        // Disable fuzzy matching for screen shortcuts to prevent "طلباتي" matching "الباني"
        if (tokens.some(t => matchWord(t, alias, false))) return entry.screen;
      }
    }
  }
  return undefined;
};

/** استخراج الترتيب الرقمي (مثال: "الاول" → 0) */
export const extractOrdinal = (normalized: string): number | undefined => {
  const tokens = normalized.split(' ');
  for (const [word, index] of Object.entries(ORDINAL_MAP)) {
    if (tokens.some(t => matchWord(t, word)) || normalized.includes(word)) {
      return index;
    }
  }
  return undefined;
};

/** استخراج أول رقم من النص */
export const extractNumber = (normalized: string): number | undefined => {
  const match = normalized.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  // أرقام مكتوبة بالعربية والدارجة
  const arabicNums: Record<string, number> = {
    'واحد': 1, 'وحده': 1, 'وحدة': 1, 'حبة': 1, 'حبه': 1,
    'جوج': 2, 'زوج': 2, 'اثنين': 2, 'حبتين': 2, 'وحدتين': 2,
    'ثلاث': 3, 'ثلاثه': 3, 'تلاته': 3, 'تلاتة': 3,
    'اربع': 4, 'اربعه': 4, 'ربعة': 4, 'ربعه': 4,
    'خمس': 5, 'خمسه': 5, 'خمسة': 5,
    'ست': 6, 'سته': 6, 'ستة': 6,
    'سبع': 7, 'سبعه': 7, 'سبعة': 7,
    'ثمان': 8, 'ثمانيه': 8, 'ثمانية': 8,
    'تسع': 9, 'تسعه': 9, 'تسعة': 9,
    'عشر': 10, 'عشره': 10, 'عشرة': 10,
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  };
  const tokens = normalized.split(' ');
  for (const [word, num] of Object.entries(arabicNums)) {
    if (tokens.some(t => matchWord(t, word))) return num;
  }
  return undefined;
};

/** استخراج الفئة المستهدفة */
export const extractCategory = (normalized: string): string | undefined => {
  // تجميع كل الكلمات المفتاحية مع فئاتها
  const allKws: { kw: string; category: string }[] = [];
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords) {
      allKws.push({ kw, category });
    }
  }
  // ترتيب الكلمات المفتاحية من الأطول إلى الأقصر لتفادي المطابقة الخاطئة للكلمات القصيرة
  // مثلاً "العناية بالشعر" تطابق Hair Care وليس Skincare (التي تحتوي على "العناية" ككلمة قصيرة)
  allKws.sort((a, b) => b.kw.length - a.kw.length);

  for (const entry of allKws) {
    if (entry.kw.includes(' ')) {
      if (normalized.includes(entry.kw)) return entry.category;
    } else {
      const tokens = normalized.split(' ');
      if (tokens.some(t => matchWord(t, entry.kw))) return entry.category;
    }
  }
  return undefined;
};

/** استخراج كلمة البحث بعد حذف أفعال البحث والتنقل والإضافة والحذف والصفحات وكلمات الأسئلة */
export const extractProductQuery = (normalized: string): string => {
  let query = normalized;

  // إزالة أفعال البحث والعرض والإضافة والحذف والكلمات المساعدة للأقسام والصفحات والوجهات وحروف الجر وكلمات الأسئلة
  const stripPatterns = [
    ...SHOW_ALIASES,
    ...NAVIGATE_ALIASES,
    ...ADD_ALIASES,
    ...REMOVE_ALIASES,
    ...RECOMMENDATION_ALIASES,
    ...CART_ALIASES,
    ...FAVORITES_ALIASES,
    // كلمات الأسئلة والاستفسارات
    ...PRICE_QUESTION_ALIASES,
    ...DELIVERY_QUESTION_ALIASES,
    ...WARRANTY_QUESTION_ALIASES,
    ...AVAILABILITY_QUESTION_ALIASES,
    ...COMPARISON_QUESTION_ALIASES,
    ...DETAILS_QUESTION_ALIASES,
    ...BRAND_ALIASES,
    'منتجات', 'منتوجات', 'منتج', 'منتوج', 'المنتجات', 'المنتوجات',
    'حاجه', 'شي حاجه', 'شي', 'صفحه', 'صفحة', 'شاشه', 'شاشة',
    'القسم', 'قسم', 'فئة', 'فئه', 'المخصصة', 'المخصصه', 'مخصصة', 'مخصصه',
    'product', 'products', 'item', 'items', 'something',
    'الى', 'الي', 'في', 'ف', 'على', 'علي', 'من', 'ل', 'ب', 'تاع', 'ديال',
    'هذا', 'هذا المنتج', 'المنتج', 'هاد', 'هاد المنتج',
    'to', 'in', 'into', 'on', 'at', 'from', 'of', 'for', 'with', 'the'
  ];

  for (const word of stripPatterns) {
    const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('(^|\\s)' + escaped + '(\\s|$)', 'gi');
    query = query.replace(regex, ' ');
  }

  const cleaned = query.replace(/\s+/g, ' ').trim();

  // إذا تم تنظيف كل شيء، إرجاع النص الأصلي بعد حذف الأفعال الرئيسية فقط
  if (!cleaned || cleaned.length < 2) {
    let fallback = normalized;
    const mainVerbs = [
      'ارني', 'اريني', 'وريني', 'اعرض', 'جيب', 'بغيت', 'اريد',
      'ابحث عن', 'ابحث', 'دور', 'شوف', 'افتح',
      'show', 'search', 'find', 'display',
    ];
    for (const verb of mainVerbs) {
      const escaped = verb.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('(^|\\s)' + escaped + '(\\s|$)', 'gi');
      fallback = fallback.replace(regex, ' ');
    }
    return fallback.replace(/\s+/g, ' ').trim() || normalized;
  }

  return cleaned;
};

// ─── 7. خرائط الفئات العامة للتمييز بين الأقسام والمنتجات ───────────────────

export const GENERAL_CATEGORY_MAP: Record<string, string[]> = {
  'Skincare': ['بشره', 'بشرة', 'وجه', 'عنايه بالبشره', 'عنايه بالبشرة', 'عنايه', 'عناية', 'بشري', 'بشرى', 'skin', 'skincare', 'face', 'facial'],
  'Hair Care': ['شعر', 'الشعر', 'عنايه بالشعر', 'عناية بالشعر', 'شعري', 'شعرى', 'hair', 'haircare'],
  'Makeup': ['مكياج', 'ميكاب', 'ماكياج', 'makeup'],
  'Perfume': ['عطر', 'عطور', 'برفان', 'perfume', 'fragrance'],
  'Body Care': ['جسم', 'بدن', 'عنايه بالجسم', 'عناية بالجسم', 'body', 'bodycare'],
  'Toner': ['تونر', 'toner'],
  'Serum': ['سيروم', 'serum'],
  'Suncare': ['واقي شمس', 'واقي الشمس', 'حمايه من الشمس', 'suncare', 'sunscreen'],
  'Anti-Aging': ['مكافحة الشيخوخة', 'مكافحه الشيخوخه', 'تجاعيد', 'anti-aging', 'anti aging'],
  'Acne': ['حب الشباب', 'حب شباب', 'acne'],
  'Tools': ['أدوات تجميل', 'ادوات تجميل', 'tools', 'beauty tools'],
  'Cleansers': ['منظفات', 'cleansers', 'cleanser'],
  'Masks': ['ماسكات', 'masks'],
};

/** هل هذا الاستعلام عام ولا يحتوي على أسماء منتجات فرعية؟ */
export const isGenericCategoryQuery = (normalized: string, category: string): boolean => {
  const query = extractProductQuery(normalized);
  if (!query || query.length < 2) return true;

  // كلمات النكرة المفردة التي تدل على بحث عن منتج بعينه (وليس تصفح قسم)
  const INDEFINITE_PRODUCT_WORDS = ['منتج', 'حاجة', 'حاجه', 'منتجا'];
  const origTokens = normalized.split(' ');
  if (origTokens.some(t => INDEFINITE_PRODUCT_WORDS.includes(t))) {
    return false;
  }

  const tokens = query.split(' ');
  const keywords = GENERAL_CATEGORY_MAP[category] || [];

  // إذا كانت كلمة واحدة نكرة وليست مفتاحاً للفئة، فهي بحث عن منتج
  if (tokens.length === 1) {
    const token = tokens[0];
    const isDefinite = token.startsWith('ال') || token.startsWith('لل') || token.startsWith('بال');
    // مفتاح الفئة نفسها (معرّف) مقبول
    if (isDefinite && keywords.some(kw => matchWord(token, kw))) return true;
    if (!isDefinite) return false;
  }

  const genericWords = [
    // أشكال «منتج/منتوج» المعرّفة وبحروف الجر — هذه عامة وليست أسماء منتجات
    'المنتج', 'المنتوج', 'للمنتج', 'للمنتوج', 'بالمنتج', 'بالمنتوج',
    'منتجات', 'منتوجات', 'المنتجات', 'المنتوجات',
    // تقييمات وأوصاف عامة
    'افضل', 'الافضل', 'احسن', 'الاحسن', 'اجود', 'الاجود',
    'المخصصة', 'المخصصه', 'مخصصة', 'مخصصه', 'المخصص', 'مخصص',
    // كلمات التصفح والسياق
    'عناية', 'عنايه', 'القسم', 'قسم', 'فئة', 'فئه', 'صفحة', 'صفحه',
    'الجديدة', 'الجديده', 'جديدة', 'جديده',
    'المتوفرة', 'المتوفره', 'متوفرة', 'متوفره',
    'عندكم', 'كاين', 'شي',
    'الجمال', 'جمال', 'التجميل', 'تجميل',
    'الخاصة', 'الخاصه', 'خاصة', 'خاصه', 'مناسبة', 'مناسبه', 'مناسب'
  ];

  return tokens.every(token => {
    if (token.length < 2) return true;
    if (genericWords.some(gw => matchWord(token, gw))) return true;
    if (keywords.some(kw => matchWord(token, kw))) return true;
    return false;
  });
};

/** هل هذا الاستعلام تصفية سياقية للبحث السابق؟ */
export const isFollowUpQuery = (normalizedText: string, lastQuery?: string): boolean => {
  if (!lastQuery) return false;

  // 1. التحقق من عدم وجود كلمة اسم منتج رئيسي جديد (مثل شامبو، سيروم، إلخ)
  const tokens = normalizedText.split(' ');
  const hasNewProductWord = PRODUCT_INDICATOR_WORDS.some(w => tokens.some(t => matchWord(t, w)));
  if (hasNewProductWord) return false;

  // 2. التحقق من وجود كلمات تدل على الفرز والتصفية (ألوان، أسعار، ماركات، استثناءات)
  const followUpIndicators = [
    'غير', 'فقط', 'خاصة', 'ديال', 'ماركة', 'من', 'أقل', 'اكثر', 'كبر', 'صغر', 'درهم', 'باقي', 'تكون',
    'اسود', 'كحل', 'سوداء', 'سود', 'ابيض', 'بيضاء', 'بيضا', 'احمر', 'حمراء', 'حمر', 'ازرق', 'زرقاء', 'زرق', 'اخضر', 'خضراء', 'خضر',
    'وردي', 'روز', 'ذهبي', 'فضي', 'المتوفرة', 'المتوفره', 'متوفرة', 'متوفره',
    'only', 'just', 'brand', 'under', 'less than', 'more than', 'black', 'white', 'red', 'blue', 'green', 'available', 'in stock'
  ];

  return followUpIndicators.some(indicator => normalizedText.includes(indicator));
};

/** مطابقة مرنة لأسماء المنتجات لتدعم الأخطاء الإملائية واختلاف اللواحق والضمائر */
export const fuzzyMatchProduct = (productName: string, query: string): boolean => {
  const normProduct = normalizeText(productName);
  const normQuery = normalizeText(query);

  if (normProduct.includes(normQuery) || normQuery.includes(normProduct)) {
    return true;
  }

  // تقسيم النصوص لكلمات
  const productTokens = normProduct.split(' ').filter(t => t.length > 1);
  const queryTokens = normQuery.split(' ').filter(t => t.length > 1);

  if (queryTokens.length === 0) return false;

  let matchedCount = 0;
  for (const qToken of queryTokens) {
    // تخطي الكلمات العامة جداً إذا كان الاستعلام أطول
    const isCommonWord = ['في', 'من', 'على', 'ال', 'مع', 'ب', 'ل', 'ديال', 'غير', 'فقط'].includes(qToken);
    if (isCommonWord && queryTokens.length > 1) {
      matchedCount++;
      continue;
    }

    const hasMatch = productTokens.some(pToken => {
      if (pToken === qToken) return true;
      if (matchWord(qToken, pToken) || matchWord(pToken, qToken)) return true;

      // مطابقة تقريبية للكلمات
      const dist = getLevenshteinDistance(qToken, pToken);
      const minL = Math.min(qToken.length, pToken.length);
      if (minL >= 4) {
        const maxDist = minL >= 6 ? 2 : 1;
        return dist <= maxDist;
      }
      return false;
    });

    if (hasMatch) {
      matchedCount++;
    }
  }

  const matchRatio = matchedCount / queryTokens.length;
  return matchRatio >= 0.75;
};

// ─── دوال استخراج بيانات التعليق ─────────────────────────────────────

/**
 * يستخرج نص التعليق المملى مباشرةً بعد نمط ":" أو عبارة "اكتب:"
 *
 * أمثلة:
 *   "اكتب تعليق: هذا المنتج رائع"  →  "هذا المنتج رائع"
 *   "comment: amazing product"            →  "amazing product"
 *   "علق بأن الجودة ممتازة"               →  "الجودة ممتازة"
 *   "اكتب مراجعة إيجابية"                  →  undefined (طلب توليد ليس إملاء)
 */
/**
 * ينظف نص التعليق من أي جمل تعقيبية خاصة بالتقييم (للطلبات المركبة)
 */
export const cleanCommentText = (text: string): string => {
  if (!text) return text;
  // إزالة جملة التقييم المعطوفة مثل "وقيمه بـ 5 نجوم" أو "وقيمه 5" أو "وقيمه بخمس نجوم"
  let cleaned = text.replace(/ *و *(?:قيمه|قيمو|التقييم|تقييم) *(?:بـ|ب|بخمس|بأربع|بثلاث|بجوج|بواحد)? *(?:[\d\s\u0600-\u06FF]+نجوم|[\d\s\u0600-\u06FF]+)?$/i, '');
  // Also clean English equivalents like "and rate it 5 stars" or "and rate 5"
  cleaned = cleaned.replace(/ *and *(?:rate|rating) *(?:it)? *(?:[\d\w\s]+stars|[\d\w\s]+)?$/i, '');
  return cleaned.trim();
};

export const extractCommentText = (text: string): string | undefined => {
  const normalized = text.trim();

  // نمط 1: نص بعد ":" مباشرة
  const colonMatch = normalized.match(/[:] *(.+)$/);
  if (colonMatch) {
    const afterColon = colonMatch[1].trim();
    if (afterColon.length >= 2) return cleanCommentText(afterColon);
  }

  // نمط 2: "علق بان ..." / "اكتب تعليق بأن ..."
  const commentThatMatch = normalized.match(
    /(?:علق|كتب|اكتب) +(?:تعليق|مراجعه|مراجعة|ريفيو|رايك)? *(?:بانه|بانها|بان|بأن|ان|ب) +(.+)$/i
  );
  if (commentThatMatch) {
    const extracted = commentThatMatch[1].trim();
    if (extracted.length >= 2) return cleanCommentText(extracted);
  }

  return undefined;
};

/**
 * يستخرج نبرة التعليق المطلوبة من النص
 *
 * أمثلة:
 *   "اكتب مراجعة إيجابية"  →  'positive'
 *   "اكتب تعليق سلبي"      →  'negative'
 *   "write positive review"    →  'positive'
 *   "write review"             →  undefined
 */
export const extractCommentTone = (
  text: string
): 'positive' | 'negative' | 'neutral' | undefined => {
  const normalized = text.toLowerCase();

  const positiveWords = [
    'إيجابي', 'إيجابية', 'حسن', 'ايجابي', 'مدح', 'ثناء',
    'رائع', 'ممتاز', 'زوين', 'احسن', 'أحسن', 'جيد', 'منيح',
    'positive', 'good', 'great', 'excellent', 'praise', 'recommend',
  ];

  const negativeWords = [
    'سلبي', 'سلبية', 'نقد', 'نقدي', 'شكوى', 'سيئ', 'ضعيف', 'رديء', 'ردي',
    'negative', 'bad', 'poor', 'complaint', 'critical',
  ];

  const neutralWords = [
    'حيادي', 'حيادية', 'متوسط',
    'neutral', 'balanced', 'objective',
  ];

  if (positiveWords.some(w => normalized.includes(w))) return 'positive';
  if (negativeWords.some(w => normalized.includes(w))) return 'negative';
  if (neutralWords.some(w => normalized.includes(w))) return 'neutral';

  return undefined;
};

/**
 * يستخرج الطول المطلوب للتعليق
 *
 * أمثلة:
 *   "اكتب تعليق قصير"  →  'short'
 *   "اكتب تعليق طويل"  →  'long'
 *   "short review"          →  'short'
 *   "write review"          →  undefined
 */
export const extractCommentLength = (
  text: string
): 'short' | 'long' | undefined => {
  const normalized = text.toLowerCase();

  const shortWords = ['قصير', 'قصيرة', 'بسيط', 'مختصر', 'بسيطة', 'short', 'brief', 'quick', 'simple'];
  const longWords = ['طويل', 'طويلة', 'مفصل', 'مفصلة', 'شامل', 'شاملة', 'long', 'detailed', 'elaborate', 'comprehensive'];

  if (shortWords.some(w => normalized.includes(w))) return 'short';
  if (longWords.some(w => normalized.includes(w))) return 'long';

  return undefined;
};

/**
 * يكتشف أجراء مرتبطاً بعد التعليق (مثل: "اكتب تعليق ثم انشره")
 *
 * @returns 'submit' | 'edit' | undefined
 */
export const extractCommentChainedAction = (
  text: string
): 'submit' | 'edit' | undefined => {
  const normalized = text.toLowerCase();

  const submitChain = ['ثم انشر', 'وانشر', 'ثم ارسل', 'وارسل', 'ثم سجل', 'then post', 'and post', 'then submit', 'and submit'];
  const editChain = ['ثم عدل', 'وعدل', 'ثم راجع', 'then edit', 'and edit'];

  if (submitChain.some(w => normalized.includes(w))) return 'submit';
  if (editChain.some(w => normalized.includes(w))) return 'edit';

  return undefined;
};
