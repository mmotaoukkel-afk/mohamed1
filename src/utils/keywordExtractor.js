/**
 * Keyword Extractor for Voice Search
 * Extracts product types, skin types, and concerns from Arabic text
 * Supports Standard Arabic (العربية الفصحى)
 */

// Arabic Keywords Dictionary - Enhanced for Voice Recognition
// Comprehensive Standard Arabic (الفصحى) Support
const KEYWORDS = {
    // Product Types - Expanded
    products: {
        // Creams - كريمات
        'كريم': 'cream',
        'كريمات': 'cream',
        'كريم مرطب': 'moisturizer',
        'كريم ترطيب': 'moisturizer',
        'كريم واقي': 'sunscreen',
        'كريم أساس': 'foundation',
        'كريم عيون': 'eye cream',
        'كريم ليلي': 'night cream',
        'كريم نهاري': 'day cream',
        'كريم تفتيح': 'brightening cream',
        'كريم مضاد للتجاعيد': 'anti-aging cream',
        'كريم حب الشباب': 'acne cream',
        'كريم يدين': 'hand cream',
        'كريم قدمين': 'foot cream',

        // Makeup - مكياج
        'مكياج': 'makeup',
        'ميكب': 'makeup',
        'ماسكارا': 'mascara',
        'مسكرة': 'mascara',
        'أحمر شفاه': 'lipstick',
        'احمر شفاه': 'lipstick',
        'روج': 'lipstick',
        'ليب ستيك': 'lipstick',
        'ملمع شفاه': 'lip gloss',
        'غلوس': 'lip gloss',
        'آيلاينر': 'eyeliner',
        'ايلاينر': 'eyeliner',
        'كحل': 'eyeliner',
        'كحل سائل': 'liquid liner',
        'ظل عيون': 'eyeshadow',
        'ظلال عيون': 'eyeshadow',
        'ظلال': 'eyeshadow',
        'باليت': 'palette',
        'باليت ظلال': 'eyeshadow palette',
        'بودرة': 'powder',
        'باودر': 'powder',
        'بودرة مضغوطة': 'pressed powder',
        'بودرة سائبة': 'loose powder',
        'فاونديشن': 'foundation',
        'أساس': 'foundation',
        'كونسيلر': 'concealer',
        'خافي عيوب': 'concealer',
        'كونتور': 'contour',
        'بلاشر': 'blush',
        'أحمر خدود': 'blush',
        'احمر خدود': 'blush',
        'برونزر': 'bronzer',
        'هايلايتر': 'highlighter',
        'اضاءة': 'highlighter',
        'إضاءة': 'highlighter',
        'برايمر': 'primer',
        'تمهيد': 'primer',
        'سيتينغ سبراي': 'setting spray',
        'مثبت مكياج': 'setting spray',
        'رموش صناعية': 'false lashes',
        'رموش': 'lashes',
        'قلم حواجب': 'brow pencil',
        'حواجب': 'brow',

        // Skincare - العناية بالبشرة
        'سيروم': 'serum',
        'سيرم': 'serum',
        'غسول': 'cleanser',
        'غسول وجه': 'face cleanser',
        'منظف': 'cleanser',
        'منظف وجه': 'face cleanser',
        'صابون': 'soap',
        'صابونة': 'soap',
        'صابونة طبيعية': 'natural soap',
        'تونر': 'toner',
        'تونيك': 'toner',
        'مرطب': 'moisturizer',
        'موستورايزر': 'moisturizer',
        'لوشن': 'lotion',
        'زيت': 'oil',
        'زيت وجه': 'facial oil',
        'زيت أرغان': 'argan oil',
        'زيت الأرغان': 'argan oil',
        'جل': 'gel',
        'جل مرطب': 'hydrating gel',
        'مقشر': 'exfoliator',
        'سكراب': 'scrub',
        'بيلينغ': 'peel',
        'ماسك': 'mask',
        'قناع': 'mask',
        'قناع وجه': 'face mask',
        'ماسك ورقي': 'sheet mask',
        'ماسك طين': 'clay mask',
        'أمبولات': 'ampoules',
        'ايسنس': 'essence',

        // Sun protection - حماية من الشمس
        'واقي شمس': 'sunscreen',
        'واقي من الشمس': 'sunscreen',
        'صن بلوك': 'sunscreen',
        'صن سكرين': 'sunscreen',
        'حماية من الشمس': 'sunscreen',
        'كريم حماية': 'sunscreen',
        'اس بي اف': 'spf',

        // Eye care - العناية بالعين
        'كريم عين': 'eye cream',
        'سيروم عين': 'eye serum',
        'جل عيون': 'eye gel',
        'باتش عيون': 'eye patches',
        'أقنعة عيون': 'eye masks',

        // Hair - الشعر
        'شامبو': 'shampoo',
        'بلسم': 'conditioner',
        'بلسم شعر': 'conditioner',
        'زيت شعر': 'hair oil',
        'ماسك شعر': 'hair mask',
        'سيروم شعر': 'hair serum',
        'صبغة شعر': 'hair dye',
        'صبغة': 'hair dye',
        'مثبت شعر': 'hair spray',
        'جل شعر': 'hair gel',

        // Body - الجسم
        'لوشن جسم': 'body lotion',
        'كريم جسم': 'body cream',
        'زبدة جسم': 'body butter',
        'مقشر جسم': 'body scrub',
        'زيت جسم': 'body oil',
        'مزيل عرق': 'deodorant',
        'ديودورانت': 'deodorant',

        // Perfume - العطور
        'عطر': 'perfume',
        'بارفيوم': 'perfume',
        'عطور': 'perfume',
        'بودي سبلاش': 'body splash',
        'بودي ميست': 'body mist',

        // Lips - الشفاه
        'مقشر شفاه': 'lip scrub',
        'مرطب شفاه': 'lip balm',
        'بلسم شفاه': 'lip balm',
    },

    // Skin Types - أنواع البشرة
    skinTypes: {
        'دهنية': 'oily',
        'بشرة دهنية': 'oily',
        'زيتية': 'oily',
        'جافة': 'dry',
        'بشرة جافة': 'dry',
        'ناشفة': 'dry',
        'حساسة': 'sensitive',
        'بشرة حساسة': 'sensitive',
        'متهيجة': 'sensitive',
        'مختلطة': 'combination',
        'بشرة مختلطة': 'combination',
        'عادية': 'normal',
        'بشرة عادية': 'normal',
        'طبيعية': 'normal',
        'مركبة': 'combination',
        'ناضجة': 'mature',
        'بشرة ناضجة': 'mature',
        'متقدمة في العمر': 'mature',
        'باهتة': 'dull',
        'بشرة باهتة': 'dull',
        'ميدة': 'oily', // Moroccan for greasy/oily
        'ناشفة': 'dry',
        'حرشة': 'dry', // Moroccan for rough/dry
        'حمراء': 'sensitive',
    },

    // Concerns & Benefits - المشاكل والفوائد
    concerns: {
        // Acne - حب الشباب
        'حب الشباب': 'acne',
        'حبوب': 'acne',
        'بثور': 'acne',
        'حب شباب': 'acne',
        'بثرات': 'acne',
        'رؤوس سوداء': 'blackheads',
        'رؤوس بيضاء': 'whiteheads',
        'مسام واسعة': 'large pores',

        // Brightening - التفتيح
        'تفتيح': 'brightening',
        'تبييض': 'whitening',
        'توحيد لون': 'even tone',
        'توحيد اللون': 'even tone',
        'تفتيح البشرة': 'skin brightening',
        'إشراقة': 'radiance',

        // Hydration - الترطيب
        'ترطيب': 'hydration',
        'جفاف': 'hydration',
        'ترطيب عميق': 'deep hydration',
        'نعومة': 'softness',

        // Glow - النضارة
        'نضارة': 'glow',
        'إشراق': 'glow',
        'لمعان': 'glow',
        'حيوية': 'vitality',
        'بشرة متوهجة': 'glowing skin',

        // Anti-aging - مكافحة الشيخوخة
        'تجاعيد': 'anti-aging',
        'خطوط': 'anti-aging',
        'خطوط رفيعة': 'fine lines',
        'شيخوخة': 'anti-aging',
        'مكافحة الشيخوخة': 'anti-aging',
        'مضاد للشيخوخة': 'anti-aging',
        'مكافحة التجاعيد': 'anti-wrinkle',
        'شد': 'firming',
        'شد البشرة': 'skin firming',
        'مرونة': 'elasticity',
        'كولاجين': 'collagen',

        // Dark spots - البقع الداكنة
        'تصبغات': 'pigmentation',
        'بقع': 'dark spots',
        'بقع داكنة': 'dark spots',
        'كلف': 'melasma',
        'نمش': 'freckles',
        'آثار حبوب': 'acne scars',
        'ندوب': 'scars',

        // Dark circles - الهالات السوداء
        'هالات': 'dark circles',
        'هالات سوداء': 'dark circles',
        'انتفاخ العين': 'eye puffiness',
        'انتفاخات': 'puffiness',

        // Pores - المسام
        'مسام': 'pores',
        'مسامات': 'pores',
        'تضييق المسام': 'pore minimizing',

        // Other concerns
        'تقشير': 'exfoliation',
        'تنظيف': 'cleansing',
        'تنظيف عميق': 'deep cleansing',
        'تنعيم': 'smoothing',
        'حماية': 'protection',
        'تغذية': 'nourishment',
        'علاج': 'treatment',
        'احمرار': 'redness',
        'حساسية': 'sensitivity',
        'التهاب': 'inflammation',
        'حبوب رقيقة': 'small bumps',
        'لي بوان نوار': 'blackheads', // French/Darija
        'ليكرو': 'sunscreen', // Moroccan/French for Screen
    },

    // Price range - نطاق السعر
    prices: {
        'رخيص': 'low',
        'اقتصادي': 'low',
        'بسعر معقول': 'low',
        'غير مكلف': 'low',
        'متوسط': 'medium',
        'متوسط السعر': 'medium',
        'معقول': 'medium',
        'غالي': 'high',
        'فاخر': 'high',
        'ثمين': 'high',
        'برستيج': 'high',
        'هاي اند': 'high',
    },

    // Intent indicators - مؤشرات النية
    intents: {
        'أريد': 'want',
        'اريد': 'want',
        'أبغى': 'want',
        'ابغى': 'want',
        'أحتاج': 'need',
        'احتاج': 'need',
        'أبحث عن': 'search',
        'ابحث عن': 'search',
        'عندي': 'have',
        'لدي': 'have',
        'أعطني': 'give',
        'اعطني': 'give',
        'اقترح': 'suggest',
        'اقترح لي': 'suggest',
        'اقتراح': 'suggest',
        'نصيحة': 'advice',
        'انصحني': 'advice',
        'أفضل': 'best',
        'افضل': 'best',
        'أحسن': 'best',
        'احسن': 'best',
        'ممتاز': 'excellent',
        'جيد': 'good',
        'مناسب': 'suitable',
        'يناسب': 'suitable',
        'لبشرتي': 'for my skin',
        'لوجهي': 'for my face',
        'لعيوني': 'for my eyes',
        'للشفاه': 'for lips',
        'للجسم': 'for body',
        'للشعر': 'for hair',
        'فين': 'where',
        'أين': 'where',
        'كيف': 'how',
        'شنو': 'what',
        'ماذا': 'what',
        'هل': 'question',
        'مشكلة': 'problem',
        'مشكلتي': 'my problem',
        'بغيت': 'want', // Moroccan
        'خصني': 'need', // Moroccan
        'بشحال': 'how much', // Moroccan
        'بغيت شي حاجة': 'want something',
        'كاين شي': 'is there any',
        'عندكم': 'do you have',
        'عافاك': 'please',
        'يخليك': 'please/be safe',
    },

    // Ingredients - المكونات
    ingredients: {
        'فيتامين سي': 'vitamin c',
        'فيتامين c': 'vitamin c',
        'ريتينول': 'retinol',
        'هيالورونيك': 'hyaluronic acid',
        'حمض الهيالورونيك': 'hyaluronic acid',
        'نياسيناميد': 'niacinamide',
        'ساليسيليك': 'salicylic acid',
        'جليكوليك': 'glycolic acid',
        'الألوفيرا': 'aloe vera',
        'الوفيرا': 'aloe vera',
        'زيت الأرغان': 'argan oil',
        'زبدة الشيا': 'shea butter',
        'زيت جوز الهند': 'coconut oil',
        'زيت الورد': 'rose oil',
        'ماء الورد': 'rose water',
        'شاي أخضر': 'green tea',
        'كافيين': 'caffeine',
        'بيبتيدات': 'peptides',
        'سيراميد': 'ceramides',
    }
};

/**
 * Find matching keywords in text
 * @param {string} text - Normalized text to search in
 * @param {object} dictionary - Dictionary of keywords
 * @returns {string|null} - Matched value or null
 */
function findMatch(text, dictionary) {
    for (const [key, value] of Object.entries(dictionary)) {
        if (text.includes(key)) {
            return value;
        }
    }
    return null;
}

/**
 * Extract keywords from voice search text
 * @param {string} text - Raw transcription from speech-to-text
 * @returns {object} - Extracted keywords
 */
export function extractKeywords(text) {
    if (!text) {
        return {
            productType: null,
            skinType: null,
            concern: null,
            priceRange: null,
            ingredient: null,
            intent: null,
            originalText: ''
        };
    }

    const normalized = text.toLowerCase().trim();

    return {
        productType: findMatch(normalized, KEYWORDS.products),
        skinType: findMatch(normalized, KEYWORDS.skinTypes),
        concern: findMatch(normalized, KEYWORDS.concerns),
        priceRange: findMatch(normalized, KEYWORDS.prices),
        ingredient: findMatch(normalized, KEYWORDS.ingredients),
        intent: findMatch(normalized, KEYWORDS.intents),
        originalText: text
    };
}

/**
 * Build search query from extracted keywords
 * @param {object} keywords - Extracted keywords
 * @returns {string} - Search query string
 */
export function buildSearchQuery(keywords) {
    // 1. Filter out common conversational/stop words (Standard + Moroccan Dialect)
    const stopWords = [
        // Standard Arabic
        'أريد', 'بغيت', 'أبحث', 'عن', 'البي', 'عندكم', 'في', 'من', 'ممكن', 'بدي', 'احتاج', 'ابحث', 'عطيني', 'ورينا', 'فينا', 'شي', 'ديال', 'لي', 'مزيان',
        'السلام', 'عليكم', 'هل', 'لديكم', 'اسألك', 'نسولك', 'بغيتك', 'توريني', 'عافاك', 'شكرا', 'لو', 'سمحت',
        // Moroccan/North African Dialect
        'كاين', 'كاينة', 'واش', 'شي', 'حاجة', 'ديال', 'بغيت', 'بغين', 'خصني', 'خاصني', 'عفاك', 'الله', 'يخليك', 'نسول', 'نسال', 'بغى', 'عافاك'
    ];

    let remainingText = keywords.originalText.toLowerCase();

    stopWords.forEach(word => {
        remainingText = remainingText.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
    });

    // 2. Arabic Light Stemming: Remove common prefixes
    // Only strip definite articles to avoid corrupting root words
    const words = remainingText.split(/\s+/);
    const cleanedWords = words.map(word => {
        let cleaned = word;
        // Only strip 'al' and 'li'/'lil' which are safe.
        // Stripping 'wa' (and), 'ba' (with), 'fa' (so) is risky for words like 'Waqi' (Sunscreen) or 'Bashra' (Skin)
        // REMOVED: 'و', 'ف', 'ب' to be safe.
        for (const prefix of ['لل', 'ال', 'كال', 'فال', 'بال']) {
            if (cleaned.startsWith(prefix) && cleaned.length > prefix.length + 2) {
                cleaned = cleaned.substring(prefix.length);
                break;
            }
        }
        return cleaned;
    });

    const cleanedSearch = cleanedWords.join(' ').trim();

    // Use the cleaned Arabic text for search to match product titles in DB
    if (cleanedSearch.length > 0) {
        return cleanedSearch;
    }

    // Fallback
    const parts = [];
    if (keywords.productType) parts.push(keywords.productType);
    if (keywords.concern) parts.push(keywords.concern);

    return parts.join(' ') || keywords.originalText;
}

/**
 * Get friendly description of search intent
 * @param {object} keywords - Extracted keywords
 * @returns {string} - Human-readable description
 */
export function getSearchDescription(keywords, t) {
    if (!keywords.productType && !keywords.skinType && !keywords.concern) {
        return keywords.originalText;
    }

    const parts = [];

    if (keywords.productType) {
        parts.push(keywords.productType);
    }

    if (keywords.concern) {
        parts.push(`for ${keywords.concern}`);
    }

    if (keywords.skinType) {
        parts.push(`(${keywords.skinType} skin)`);
    }

    return parts.join(' ');
}

export default {
    extractKeywords,
    buildSearchQuery,
    getSearchDescription,
    KEYWORDS
};
