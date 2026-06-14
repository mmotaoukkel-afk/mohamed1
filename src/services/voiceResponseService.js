/**
 * Voice Response Service - Kataraa
 * Generates intelligent Arabic responses and speaks them
 * Professional Beauty Consultant Style 💄
 */

import * as Speech from 'expo-speech';

// Get time-based greeting
const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء النور';
};

// Response templates in Arabic - Professional Beauty Consultant
const RESPONSES = {
    // Main product response
    foundProducts: (count, productType, skinType) => {
        // greeting removed here to avoid duplication with Main Logic
        // const greeting = getTimeGreeting();

        if (count === 0) {
            return `عذراً، لم أجد منتجات مطابقة لطلبك حالياً. لكن لا تقلقي، يمكنك تجربة البحث بكلمات أخرى أو التواصل معنا مباشرة لمساعدتك.`;
        }

        if (count === 1) {
            const typeMsg = productType ? ` من نوع ${productType}` : '';
            const skinMsg = skinType ? ` مناسب للبشرة ${skinType === 'oily' ? 'الدهنية' : skinType === 'dry' ? 'الجافة' : skinType === 'sensitive' ? 'الحساسة' : ''}` : '';
            return `وجدت لكِ منتج واحد رائع${typeMsg}${skinMsg}. إنه اختيار ممتاز!`;
        }

        if (count <= 5) {
            return `وجدت لكِ ${count} منتجات مميزة${productType ? ` من ${productType}` : ''}. اخترتها لكِ بعناية!`;
        }

        return `لدينا تشكيلة رائعة! وجدت ${count} منتج${productType ? ` في قسم ${productType}` : ''}. إليكِ أفضلها حسب تقييمات عملائنا.`;
    },

    // Skin type specific advice
    skinTypeAdvice: {
        oily: 'للبشرة الدهنية، اخترت لكِ منتجات خفيفة وخالية من الزيوت. تساعد على التحكم في اللمعان دون أن تسدّ المسام.',
        dry: 'للبشرة الجافة، هذه المنتجات غنية بالمرطبات الطبيعية. ستشعرين بالنعومة والترطيب طوال اليوم.',
        sensitive: 'للبشرة الحساسة، اخترت منتجات لطيفة خالية من العطور والمواد المهيجة. آمنة ومريحة لبشرتك.',
        combination: 'للبشرة المختلطة، هذه المنتجات توازن بين الترطيب والتحكم في الزيوت. مثالية لمنطقة T-zone.',
        normal: 'بشرتك عادية رائعة! هذه المنتجات ستحافظ على توازنها الطبيعي وتزيد من نضارتها.',
        mature: 'للبشرة الناضجة، اخترت منتجات غنية بمضادات الأكسدة والكولاجين. تساعد على شد البشرة ومكافحة علامات التقدم في العمر.',
    },

    // Concern-based advice with detailed explanations
    concernAdvice: {
        acne: 'لمشكلة حب الشباب، هذه المنتجات تحتوي على حمض الساليسيليك والنياسيناميد. تساعد على تنقية البشرة وتقليل الحبوب دون تجفيفها.',
        brightening: 'للتفتيح والإشراق، اخترت منتجات غنية بفيتامين سي وحمض الكوجيك. ستلاحظين الفرق خلال أسابيع قليلة.',
        whitening: 'لتوحيد لون البشرة، هذه المنتجات تعمل على تفتيح التصبغات ومنع ظهورها مجدداً.',
        hydration: 'للترطيب العميق، هذه المنتجات تحتوي على حمض الهيالورونيك والسيراميد. ترطيب يدوم ٢٤ ساعة!',
        glow: 'للنضارة والإشراق، هذه المنتجات ستعطي بشرتك لمعاناً صحياً وطبيعياً.',
        'anti-aging': 'لمكافحة التجاعيد، اخترت منتجات تحتوي على الريتينول والببتيدات. تقلل الخطوط الدقيقة وتشد البشرة.',
        'dark spots': 'للبقع الداكنة والتصبغات، هذه المنتجات تعمل على توحيد لون البشرة تدريجياً.',
        'dark circles': 'للهالات السوداء، اخترت منتجات تحتوي على فيتامين K والكافيين. تقلل الانتفاخ وتفتح المنطقة حول العين.',
        pores: 'لتصغير المسام، هذه المنتجات تحتوي على حمض الجليكوليك والنياسيناميد. تنظف المسام وتضيقها.',
        firming: 'لشد البشرة، هذه المنتجات غنية بالكولاجين والإيلاستين. تعيد للبشرة مرونتها وشبابها.',
        redness: 'لتهدئة الاحمرار، هذه المنتجات تحتوي على الألوفيرا والكاموميل. لطيفة ومهدئة للبشرة.',
    },

    // Ingredient-based recommendations
    ingredientAdvice: {
        'vitamin c': 'فيتامين سي ممتاز للتفتيح ومحاربة التجاعيد! هذه المنتجات تحتوي على تركيز فعّال ومستقر.',
        'retinol': 'الريتينول هو المعيار الذهبي لمكافحة الشيخوخة. أنصحك باستخدامه ليلاً مع واقي شمس نهاراً.',
        'hyaluronic acid': 'حمض الهيالورونيك يرطب البشرة بعمق ويملأ الخطوط الدقيقة. مناسب لجميع أنواع البشرة.',
        'niacinamide': 'النياسيناميد رائع لتقليل المسام وتوحيد اللون. يناسب البشرة الدهنية والمختلطة.',
        'salicylic acid': 'حمض الساليسيليك ينظف المسام بعمق ويقلل الحبوب. مثالي للبشرة الدهنية.',
    },

    // Price-based suggestions
    priceAdvice: {
        low: 'هذه المنتجات بأسعار مناسبة وجودة ممتازة. قيمة رائعة مقابل المال!',
        medium: 'هذه المنتجات بأسعار متوسطة وفعالية عالية. استثمار ذكي لبشرتك.',
        high: 'هذه المنتجات فاخرة بمكونات متميزة. تجربة فريدة ونتائج استثنائية.',
    },

    // Routine suggestions
    routineSuggestion: {
        morning: 'للروتين الصباحي: ابدئي بالغسول، ثم التونر، ثم السيروم، ثم المرطب، وأخيراً واقي الشمس.',
        night: 'للروتين المسائي: نظفي بشرتك جيداً، ثم استخدمي التونر والسيروم والكريم الليلي.',
    },

    // Conversational responses
    greeting: 'مرحباً بكِ! أنا مساعدتك الذكية للجمال. كيف يمكنني مساعدتك اليوم؟',
    askForMore: 'هل تريدين البحث عن شيء آخر؟ أنا هنا لمساعدتك.',
    noSpeech: 'عذراً، لم أتمكن من سماعك بوضوح. هل يمكنك تكرار طلبك؟',
    error: 'عذراً، حدث خطأ. دعينا نحاول مرة أخرى.',
    thanks: 'شكراً لتسوقك معنا! إذا كان لديكِ أي استفسار، لا تترددي في السؤال.',
};

/**
 * Generate intelligent response based on search results
 * @param {Array} products - Found products
 * @param {Object} keywords - Extracted keywords
 * @param {string} searchQuery - Cleaned search text
 * @param {string} userName - Optional user name for personalization
 * @returns {string} - Arabic response text
 */
export function generateResponse(products, keywords, searchQuery = null, userName = null) {
    const parts = [];

    // Use original text for intent detection
    const rawInput = keywords.originalText ? keywords.originalText.toLowerCase() : '';

    // Use cleaned search query for the specific product mention
    const queryText = searchQuery || keywords.originalText;

    const namePart = userName ? ` يا ${userName}` : '';

    // 1. Detect Social Intent / Politeness
    const isGreeting = ['سلام', 'مرحبا', 'أهلا', 'صباح', 'مساء', 'hello', 'hi'].some(w => rawInput.includes(w));
    const isQuestion = ['نسول', 'سؤال', 'ممكن', 'عفاك', 'الله يخليك', 'plz', 'please'].some(w => rawInput.includes(w));
    const isGratitude = ['شكرا', 'الله يحفظك', 'merci', 'thanks'].some(w => rawInput.includes(w));

    // Add Polite Intro
    if (isGreeting) {
        parts.push(getTimeGreeting() + namePart + '!');
    } else if (isQuestion) {
        parts.push(`أهلاً بكِ${namePart}! يسعدني جداً الرد على سؤالك.`);
    } else if (isGratitude) {
        parts.push('العفو' + namePart + '! أنا هنا دائماً لمساعدتك.');
    } else {
        // Default warm opening
        if (userName) parts.push(`تفضلي يا ${userName}،`);
    }

    // 2. Handle Specific Search vs General
    // If searchQuery is present (cleaned text), usually it implies a specific intent
    const isSpecificSearch = (queryText && queryText.length > 0) ||
        (!keywords.productType && !keywords.skinType && !keywords.concern);

    const isPriceQuery = rawInput.includes('بشحال') || rawInput.includes('سعر') || rawInput.includes('ثمن') || rawInput.includes('price');

    if (products.length > 0) {
        if (isPriceQuery && products.length === 1) {
            const product = products[0];
            const price = product.sale_price || product.price;
            parts.push(`بخصوص ثمن ${product.name}، فهو ${price} درهم.`);
            parts.push(`إنه منتج رائع ويستحق التجربة!`);
        } else if (isSpecificSearch) {
            // Conversational: "Regarding your request for X..."
            parts.push(`بخصوص طلبك عن "${queryText}"، وجدت لكِ تشكيلة رائعة.`);
            parts.push(`إليكِ ${products.length > 1 ? 'أفضل' : ''} ${products.length} خيارات تتماشى مع ذوقك.`);
        } else {
            // General Category logic
            parts.push(RESPONSES.foundProducts(
                products.length,
                keywords.productType,
                keywords.skinType
            ));
        }
    } else {
        // Zero results but polite fallback
        // ONLY say we didn't find products if they actually asked for something, not just a greeting
        if (!isGreeting && !isGratitude && !isQuestion) {
            parts.push(RESPONSES.foundProducts(0));
        } else if (isGreeting) {
            parts.push('كيف يمكنني مساعدتك اليوم في العناية بجمالك؟');
        } else if (isQuestion) {
            parts.push('تفضلي، أنا أسمعك.');
        }
    }

    // 3. Add Educational/Advice context if relevant
    if (products.length > 0) {
        // Add skin type advice if relevant
        if (keywords.skinType && RESPONSES.skinTypeAdvice[keywords.skinType]) {
            parts.push(RESPONSES.skinTypeAdvice[keywords.skinType]);
        }

        // Add concern advice if relevant
        if (keywords.concern && RESPONSES.concernAdvice[keywords.concern]) {
            parts.push(RESPONSES.concernAdvice[keywords.concern]);
        }
    }

    // Keep response natural - usually intro + main result + 1 advice max
    // Filter out empty parts
    const validParts = parts.filter(p => p && p.length > 0);

    // limit to 3 sentences to not bore the user
    const spokenParts = validParts.slice(0, 3);

    return spokenParts.join(' ');
}

/**
 * Generate a detailed text response (for display, not speaking)
 * @param {Array} products - Found products
 * @param {Object} keywords - Extracted keywords
 * @returns {string} - Detailed Arabic response text
 */
export function generateDetailedResponse(products, keywords) {
    return generateResponse(products, keywords);
}

/**
 * Speak text using Text-to-Speech
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @returns {Promise} - Resolves when speech is complete
 */
export async function speakResponse(text, options = {}) {
    return new Promise((resolve, reject) => {
        Speech.speak(text, {
            language: 'ar', // Arabic
            pitch: 1.0,
            rate: 0.85, // Slightly slower for clarity and warmth
            onDone: resolve,
            onError: reject,
            ...options,
        });
    });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
    Speech.stop();
}

/**
 * Check if currently speaking
 */
export async function isSpeaking() {
    return await Speech.isSpeakingAsync();
}

/**
 * Get available voices for Arabic
 */
export async function getArabicVoices() {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.filter(v => v.language?.startsWith('ar'));
}

export default {
    generateResponse,
    generateDetailedResponse,
    speakResponse,
    stopSpeaking,
    isSpeaking,
    getArabicVoices,
    RESPONSES,
};
