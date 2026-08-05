/**
 * Voice Response Service - Kataraa
 * Generates intelligent responses in English and strict Modern Standard Arabic (MSA)
 * Professional Beauty Consultant Style 💄
 */

import * as Speech from 'expo-speech';

// Get time-based greeting
const getTimeGreeting = (locale = 'ar') => {
    const hour = new Date().getHours();
    if (locale === 'en') {
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    } else {
        if (hour < 12) return 'صباح الخير';
        if (hour < 18) return 'مساء الخير';
        return 'مساء النور';
    }
};

// Localized Response templates
const LOCALIZED_RESPONSES = {
    ar: {
        foundProducts: (count, productType, skinType) => {
            if (count === 0) {
                return `عذراً، لم أجد منتجات مطابقة لطلبك حالياً. يمكنك تجربة البحث بكلمات أخرى أو التواصل معنا مباشرة لمساعدتك.`;
            }
            if (count === 1) {
                const typeMsg = productType ? ` من نوع ${productType}` : '';
                const skinMsg = skinType ? ` مناسب للبشرة ${skinType === 'oily' ? 'الدهنية' : skinType === 'dry' ? 'الجافة' : skinType === 'sensitive' ? 'الحساسة' : ''}` : '';
                return `وجدت لكِ منتجاً واحداً رائعاً${typeMsg}${skinMsg}. إنه اختيار ممتاز!`;
            }
            if (count <= 5) {
                return `وجدت لكِ ${count} منتجات مميزة${productType ? ` من فئة ${productType}` : ''}. اخترتها لكِ بعناية!`;
            }
            return `لدينا تشكيلة رائعة! وجدت ${count} منتج${productType ? ` في قسم ${productType}` : ''}. إليكِ أفضلها حسب تقييمات عملائنا.`;
        },
        skinTypeAdvice: {
            oily: 'للبشرة الدهنية، اخترت لكِ منتجات خفيفة وخالية من الزيوت لتنظيم اللمعان دون سد المسام.',
            dry: 'للبشرة الجافة، هذه المنتجات غنية بالمرطبات الطبيعية لتمنحك ترطيباً يدوم طوال اليوم.',
            sensitive: 'للبشرة الحساسة، اخترت منتجات لطيفة خالية من العطور والمواد المهيجة لبشرتك.',
            combination: 'لالبشرة المختلطة، هذه المنتجات توازن بين الترطيب والتحكم في الإفرازات الدهنية.',
            normal: 'لبشرتك العادية، هذه المنتجات تحافظ على توازنها الطبيعي وتزيد من نضارتها.',
            mature: 'للبشرة الناضجة، اخترت منتجات غنية بمضادات الأكسدة والكولاجين لشد البشرة.',
        },
        concernAdvice: {
            acne: 'لمشكلة حب الشباب، هذه المنتجات تحتوي على حمض الساليسيليك والنياسيناميد لتنقية البشرة.',
            brightening: 'للتفتيح والإشراق، اخترت منتجات غنية بفيتامين سي لتفتيح لون البشرة وتوحيده.',
            whitening: 'لتوحيد لون البشرة، هذه المنتجات تعمل على إزالة التصبغات الداكنة.',
            hydration: 'للترطيب العميق، هذه المنتجات تحتوي على حمض الهيالورونيك لتمنحك رطوبة تدوم ٢٤ ساعة.',
            glow: 'للنضارة، هذه المنتجات ستمنح بشرتك إشراقاً صحياً وطبيعياً.',
            'anti-aging': 'لمكافحة علامات التقدم في السن، اخترت منتجات تحتوي على الريتينول لتقليل الخطوط الدقيقة.',
            'dark spots': 'للبقع الداكنة، هذه المنتجات تعمل على تقشير البشرة وتوحيد لونها تدريجياً.',
            'dark circles': 'للهالات السوداء، اخترت منتجات تحتوي على الكافيين لتقليل الانتفاخ وتفتيح منطقة العين.',
            pores: 'لتصغير المسام، هذه المنتجات تحتوي على النياسيناميد لتنظيف وضبط حجم المسام.',
            firming: 'لشد البشرة، هذه المنتجات غنية بالكولاجين لتعيد للبشرة مرونتها وشبابها.',
            redness: 'لتهدئة الاحمرار، هذه المنتجات تحتوي على الألوفيرا والكاموميل لتهدئة البشرة الملتهبة.',
        },
        greeting: 'مرحباً بكِ! أنا مساعدتك الذكية للجمال. كيف يمكنني مساعدتك اليوم؟',
        askForMore: 'هل تريدين البحث عن شيء آخر؟ أنا هنا لمساعدتك.',
        noSpeech: 'عذراً، لم أتمكن من سماعك بوضوح. هل يمكنكِ تكرار طلبك؟',
        error: 'عذراً، حدث خطأ. دعنا نحاول مرة أخرى.',
        thanks: 'شكراً لتسوقك معنا! إذا كان لديكِ أي استفسار، لا تترددي في السؤال.',
    },
    en: {
        foundProducts: (count, productType, skinType) => {
            if (count === 0) {
                return `Sorry, I couldn't find matching products for your request. You can try searching with different words or contact support.`;
            }
            if (count === 1) {
                const typeMsg = productType ? ` ${productType}` : ' product';
                const skinMsg = skinType ? ` for ${skinType} skin` : '';
                return `I found one great${typeMsg}${skinMsg}. It is an excellent choice!`;
            }
            if (count <= 5) {
                return `I found ${count} premium${productType ? ` ${productType}` : ''} products for you. Curated with care!`;
            }
            return `We have a wonderful selection! Found ${count} products${productType ? ` in ${productType}` : ''}. Here are the best ones based on reviews.`;
        },
        skinTypeAdvice: {
            oily: 'For oily skin, I selected lightweight, oil-free products to control shine without clogging pores.',
            dry: 'For dry skin, these products are rich in natural moisturizers to keep your skin hydrated all day.',
            sensitive: 'For sensitive skin, I chose gentle products free of fragrances and irritants.',
            combination: 'For combination skin, these products balance hydration and oil control.',
            normal: 'For normal skin, these products maintain your natural balance and boost radiance.',
            mature: 'For mature skin, I selected products rich in antioxidants and collagen to firm the skin.',
        },
        concernAdvice: {
            acne: 'For acne-prone skin, these products contain salicylic acid and niacinamide to purify your skin.',
            brightening: 'For brightening, I selected vitamin C enriched products to unify your skin tone.',
            whitening: 'To even out skin tone, these products help fade dark spots.',
            hydration: 'For deep hydration, these products contain hyaluronic acid for 24-hour moisture.',
            glow: 'For a natural glow, these products will give your skin a healthy radiance.',
            'anti-aging': 'For anti-aging, I selected retinol products to reduce fine lines and firm the skin.',
            'dark spots': 'For dark spots, these products help fade pigmentation gradually.',
            'dark circles': 'For dark circles, I chose caffeine-infused products to reduce puffiness around the eyes.',
            pores: 'To minimize pores, these products contain niacinamide to clarify and tighten pores.',
            firming: 'For skin firming, these products are rich in collagen to restore elasticity.',
            redness: 'To soothe redness, these products contain aloe vera and chamomile to calm the skin.',
        },
        greeting: 'Welcome! I am your smart beauty assistant. How can I help you today?',
        askForMore: 'Would you like to search for anything else? I am here to help.',
        noSpeech: "Sorry, I couldn't hear you clearly. Could you please repeat your request?",
        error: 'Sorry, an error occurred. Let us try again.',
        thanks: 'Thank you for shopping with us! If you have any questions, feel free to ask.',
    }
};

/**
 * Generate intelligent response based on search results
 */
export function generateResponse(products, keywords, searchQuery = null, userName = null, locale = 'ar') {
    const activeLocale = locale === 'en' ? 'en' : 'ar';
    const dict = LOCALIZED_RESPONSES[activeLocale];
    const parts = [];

    const rawInput = keywords.originalText ? keywords.originalText.toLowerCase() : '';
    const queryText = searchQuery || keywords.originalText;
    const namePart = userName ? (activeLocale === 'en' ? `, ${userName}` : ` يا ${userName}`) : '';

    // 1. Detect Social Intent / Politeness
    const isGreeting = ['سلام', 'مرحبا', 'أهلا', 'صباح', 'مساء', 'hello', 'hi', 'hey'].some(w => rawInput.includes(w));
    const isQuestion = ['نسول', 'سؤال', 'ممكن', 'عفاك', 'الله يخليك', 'plz', 'please'].some(w => rawInput.includes(w));
    const isGratitude = ['شكرا', 'الله يحفظك', 'merci', 'thanks', 'thank you'].some(w => rawInput.includes(w));

    if (isGreeting) {
        parts.push(getTimeGreeting(activeLocale) + namePart + '!');
    } else if (isQuestion) {
        parts.push(activeLocale === 'en' ? `Hello${namePart}! I am happy to answer your question.` : `أهلاً بكِ${namePart}! يسعدني جداً الرد على سؤالك.`);
    } else if (isGratitude) {
        parts.push(activeLocale === 'en' ? `You're welcome${namePart}! I am always here to help.` : `العفو${namePart}! أنا هنا دائماً لمساعدتك.`);
    } else {
        if (userName) {
            parts.push(activeLocale === 'en' ? `Sure ${userName},` : `تفضلي يا ${userName}،`);
        }
    }

    const isSpecificSearch = (queryText && queryText.length > 0) ||
        (!keywords.productType && !keywords.skinType && !keywords.concern);

    const isPriceQuery = rawInput.includes('بشحال') || rawInput.includes('سعر') || rawInput.includes('ثمن') || rawInput.includes('price');

    if (products.length > 0) {
        if (isPriceQuery && products.length === 1) {
            const product = products[0];
            const price = product.sale_price || product.price;
            if (activeLocale === 'en') {
                parts.push(`Regarding the price of ${product.name}, it is ${price} KWD.`);
                parts.push(`It is a great product and definitely worth trying!`);
            } else {
                parts.push(`بخصوص سعر ${product.name}، فهو ${price} درهم.`);
                parts.push(`إنه منتج رائع ويستحق التجربة!`);
            }
        } else if (isSpecificSearch) {
            if (activeLocale === 'en') {
                parts.push(`Regarding your request for "${queryText}", I found a great selection.`);
                parts.push(`Here ${products.length > 1 ? 'are the best' : 'is the'} ${products.length} options for you.`);
            } else {
                parts.push(`بخصوص طلبك عن "${queryText}"، وجدت لكِ تشكيلة رائعة.`);
                parts.push(`إليكِ ${products.length > 1 ? 'أفضل' : ''} ${products.length} خيارات تتماشى مع ذوقك.`);
            }
        } else {
            parts.push(dict.foundProducts(
                products.length,
                keywords.productType,
                keywords.skinType
            ));
        }
    } else {
        if (!isGreeting && !isGratitude && !isQuestion) {
            parts.push(dict.foundProducts(0));
        } else if (isGreeting) {
            parts.push(activeLocale === 'en' ? 'How can I help you with your beauty routine today?' : 'كيف يمكنني مساعدتك اليوم في العناية بجمالك؟');
        } else if (isQuestion) {
            parts.push(activeLocale === 'en' ? 'Please go ahead, I am listening.' : 'تفضلي، أنا أسمعك.');
        }
    }

    if (products.length > 0) {
        if (keywords.skinType && dict.skinTypeAdvice[keywords.skinType]) {
            parts.push(dict.skinTypeAdvice[keywords.skinType]);
        }
        if (keywords.concern && dict.concernAdvice[keywords.concern]) {
            parts.push(dict.concernAdvice[keywords.concern]);
        }
    }

    const validParts = parts.filter(p => p && p.length > 0);
    const spokenParts = validParts.slice(0, 3);
    return spokenParts.join(' ');
}

export function generateDetailedResponse(products, keywords, locale = 'ar') {
    return generateResponse(products, keywords, null, null, locale);
}

// قوائم اللغات المفضلة مع ترتيب البدائل
const ARABIC_PREFERRED = ['ar-SA', 'ar-AE', 'ar-EG', 'ar'];
const ENGLISH_PREFERRED = ['en-US', 'en-GB', 'en-AU', 'en'];

let cachedVoices = [];

const getAvailableVoicesSafe = async () => {
    if (cachedVoices.length > 0) return cachedVoices;
    try {
        const voices = await Speech.getAvailableVoicesAsync();
        cachedVoices = voices || [];
        return cachedVoices;
    } catch (e) {
        console.warn('[voiceResponseService] Failed to fetch voices:', e);
        return [];
    }
};

const selectBestLanguage = async (preferredList) => {
    const voices = await getAvailableVoicesSafe();
    if (voices.length === 0) {
        return preferredList[0];
    }

    for (const preferred of preferredList) {
        const match = voices.find(
            (v) =>
                v.language.toLowerCase() === preferred.toLowerCase() ||
                v.language.toLowerCase().replace('_', '-').startsWith(preferred.toLowerCase() + '-')
        );
        if (match) {
            return match.language;
        }
    }

    const baseLang = preferredList[preferredList.length - 1];
    const fallbackMatch = voices.find((v) =>
        v.language.toLowerCase().startsWith(baseLang.toLowerCase())
    );
    if (fallbackMatch) {
        return fallbackMatch.language;
    }

    return preferredList[0];
};

/**
 * Speak text using Text-to-Speech
 */
export async function speakResponse(text, options = {}) {
    const cleanText = text
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) {
      return;
    }

    const isEn = /^[a-zA-Z]/.test(cleanText);
    const preferredList = isEn ? ENGLISH_PREFERRED : ARABIC_PREFERRED;
    const selectedLanguage = await selectBestLanguage(preferredList);

    return new Promise((resolve, reject) => {
        Speech.speak(cleanText, {
            language: selectedLanguage,
            pitch: 1.0,
            rate: 0.85,
            onDone: resolve,
            onError: reject,
            ...options,
        });
    });
}

export function stopSpeaking() {
    Speech.stop();
}

export async function isSpeaking() {
    return await Speech.isSpeakingAsync();
}

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
    RESPONSES: LOCALIZED_RESPONSES.ar, // Legacy support
};
