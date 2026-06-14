/**
 * assistantEngine.js — Kataraa AI Assistant Engine
 * المحرك الذكي للمساعد: كشف اللغة، فهم النية، البحث، توليد الإجابات
 */

import {
  APP_INFO,
  APP_PAGES,
  INTENT_KEYWORDS,
  POLICIES,
  WELCOME_MESSAGES,
} from './assistantKnowledge';
import { MOCK_PRODUCTS } from './mockData';

// ─────────────────────────────────────────────────────────
// 1. كشف اللغة
// ─────────────────────────────────────────────────────────
const ARABIC_REGEX = /[\u0600-\u06FF]/;
const MOROCCAN_TRIGGERS = [
  'واش', 'بغيت', 'كتقلب', 'كنبغي', 'ديال', 'وريني', 'نقدر', 'فين', 'بزاف',
  'شنو', 'كيفاش', 'أكيد', 'راك', 'خدني', 'مزيان', 'عندكم', 'عندك', 'غادي',
  'اش', 'معاك', 'ويناه', 'نعاونك', 'قادر', 'هاد', 'هاداك', 'لاباس', 'لا باس',
  'كي داير', 'كيداير', 'كي دايرة', 'كيدايرة', 'بخير', 'شكون'
];
const FRENCH_REGEX = /\b(je|vous|nous|est|les|des|une|bonjour|salut|coucou|merci|comment|pour|avec|dans|sur|qui|que|quoi|cette)\b/i;
const ENGLISH_REGEX = /\b(i|you|we|is|the|a|an|hello|hi|hey|bye|thank|thanks|thx|how|for|with|in|on|who|what|this|please|can|help)\b/i;

export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'ar';
  const lower = text.toLowerCase().trim();

  // Special greeting check for Moroccan سلام
  if (lower === 'سلام' || lower === 'سلام عليكم' || lower === 'السلام عليكم' || lower.startsWith('سلام ')) {
    return 'ma';
  }

  const hasMoroccan = MOROCCAN_TRIGGERS.some(t => lower.includes(t));
  if (hasMoroccan) return 'ma';

  if (ARABIC_REGEX.test(text)) return 'ar';
  if (FRENCH_REGEX.test(lower)) return 'fr';
  if (ENGLISH_REGEX.test(lower)) return 'en';

  return 'ar'; // default
}

// ─────────────────────────────────────────────────────────
// 1.5. كشف الحوار الاجتماعي
// ─────────────────────────────────────────────────────────
export function detectConversationIntent(message, language) {
  if (!message || typeof message !== 'string') return 'unknown';
  const lower = message.toLowerCase().trim();
  
  // Clean up punctuation for matching
  const clean = lower.replace(/[؟?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

  // 1. Goodbye (check before greetings as some goodbyes contain 'bye')
  if (
    /\b(bye|goodbye|see you|farewell)\b/.test(clean) ||
    /\b(au revoir|a bientot|à bientôt)\b/.test(clean) ||
    /مع السلامة|إلى اللقاء|بسلامة|الله يعاون/.test(clean)
  ) {
    return 'goodbye';
  }

  // 2. How are you
  if (
    /\b(how are you|how're you|how is it going|how are you doing|how do you do|how is everything)\b/.test(clean) ||
    /\b(comment ca va|comment ça va|ca va|ça va|comment allez-vous|comment vas-tu|tu vas bien|vous allez bien)\b/.test(clean) ||
    /كيف حالك|كيف الحال|شلونك|كيفك|شخبارك/.test(clean) ||
    /لاباس|لا باس|كي داير|كيداير|كي دايرة|كيدايرة|كلشي بخير|كيف داير/.test(clean)
  ) {
    return 'how_are_you';
  }

  // 3. Thanks
  if (
    /\b(thanks|thank you|thx|appreciate it)\b/.test(clean) ||
    /\b(merci|merci beaucoup|c'est gentil)\b/.test(clean) ||
    /شكرا|شكرًا|شكرا جزيلا|بارك الله فيك|لهلا يخطيك|شكرا لك/.test(clean)
  ) {
    return 'thanks';
  }

  // 4. Help / Support request
  if (
    /\b(help|can you help|assist me|support)\b/.test(clean) ||
    /\b(aide|aidez-moi|besoin d'aide)\b/.test(clean) ||
    /مساعدة|عاوني|ساعدني|محتاج مساعدة/.test(clean)
  ) {
    return 'help';
  }

  // 5. Greeting
  if (
    /\b(hello|hi|hey|good morning|good evening)\b/.test(clean) ||
    /\b(bonjour|salut|coucou|bonsoir)\b/.test(clean) ||
    /مرحبا|السلام|أهلاً|هلا|سلام|سلام عليكم|السلام عليكم|صباح الخير|مساء الخير|آسلامو/.test(clean)
  ) {
    return 'greeting';
  }

  return 'unknown';
}

export function getSocialResponse(intent, lang) {
  const responses = {
    greeting: {
      ar: 'أهلاً بك! أنا هنا لمساعدتك. هل تبحث عن منتج معين أم عن معلومات؟',
      ma: 'وعليكم السلام، مرحبا بك. شنو نقدر نعاونك به اليوم؟',
      fr: 'Bonjour, je suis là pour vous aider. Vous cherchez un produit ou une information ?',
      en: "Hello! I'm here to help you. Are you looking for a product or information?",
    },
    how_are_you: {
      ar: 'أنا بخير، شكرا لك. كيف أقدر أساعدك اليوم في Kataraa؟',
      ma: 'لاباس الحمد لله، شكرا. شنو نقدر نعاونك به اليوم؟',
      fr: "Je vais très bien, merci. Comment puis-je vous aider avec Kataraa aujourd'hui ?",
      en: "I'm doing great, thank you. How can I help you with Kataraa today?",
    },
    thanks: {
      ar: 'على الرحب والسعة. إذا احتجت أي مساعدة أخرى أنا هنا.',
      ma: 'بلا جميل، هاد واجبنا! يلا حتاجيتي شي حاجة أخرى راني هنا.',
      fr: "Je vous en prie. Si vous avez besoin d'autre chose, je suis là.",
      en: "You're welcome. I’m here if you need help with products, shipping, or checkout.",
    },
    goodbye: {
      ar: 'مع السلامة! نتمنى لك يوماً سعيداً. لا تتردد في العودة إذا احتجت أي شيء.',
      ma: 'بسلامة! تهلا فراسك، إلى حتاجيتي شي حاجة راني هنا ديما.',
      fr: "Au revoir ! Passez une excellente journée et n'hésitez pas à revenir.",
      en: "Goodbye! Have a great day and feel free to return if you need anything.",
    },
    help: {
      ar: 'بالتأكيد! أنا هنا لمساعدتك. يمكنك الاستفسار عن المنتجات، الشحن، الدفع، أو الدعم.',
      ma: 'بكل فرح! أنا هنا باش نعاونك. تقدر تسولني على المنتجات، التوصيل، طرق الدفع، ولا الدعم.',
      fr: "Certainement ! Je suis là pour vous aider. Vous pouvez me poser des questions sur les produits, la livraison, le paiement ou le support.",
      en: "Certainly! I'm here to help you. You can ask me about products, shipping, payment, or support.",
    }
  };

  return responses[intent]?.[lang] || responses[intent]?.ar || '';
}

// ─────────────────────────────────────────────────────────
// 2. كشف النية
// ─────────────────────────────────────────────────────────
export function detectIntent(text) {
  const lower = text.toLowerCase();

  // Check each intent
  for (const [intent, { triggers }] of Object.entries(INTENT_KEYWORDS)) {
    if (triggers.some(t => lower.includes(t.toLowerCase()))) {
      // For product_search, extract the search query
      if (intent === 'product_search') {
        return { type: 'product_search', query: text, category: detectCategory(lower) };
      }
      // For navigation, find which page
      if (intent === 'navigation') {
        const page = APP_PAGES.find(p => p.keywords.some(k => lower.includes(k.toLowerCase())));
        return { type: 'navigation', page: page || null };
      }
      return { type: intent };
    }
  }

  // Default: treat as product search if nothing else matched
  if (text.trim().length > 2) {
    return { type: 'product_search', query: text, category: detectCategory(lower) };
  }

  return { type: 'unknown' };
}

function detectCategory(lower) {
  if (/مكياج|makeup|maquillage/.test(lower)) return 'makeup';
  if (/شعر|hair|capillaire|شامبو|shampoo/.test(lower)) return 'hair';
  if (/عطر|parfum|fragrance|perfume/.test(lower)) return 'fragrances';
  if (/واقي شمس|sunscreen|suncare|protection solaire/.test(lower)) return 'suncare';
  if (/ماسك|mask|masque/.test(lower)) return 'masks';
  if (/سيروم|serum|sérum/.test(lower)) return 'serum';
  if (/جسم|body|corps/.test(lower)) return 'body-care';
  if (/أداة|tool|outil/.test(lower)) return 'tools';
  if (/حب الشباب|acne|boutons/.test(lower)) return 'acne';
  return null; // general skincare
}

// ─────────────────────────────────────────────────────────
// 3. البحث في المنتجات
// ─────────────────────────────────────────────────────────
export function searchInProducts(query, category = null, maxResults = 3) {
  let results = [...MOCK_PRODUCTS];

  // Filter by category slug if detected
  if (category) {
    results = results.filter(p =>
      p.categories?.some(c => c.slug === category || c.name?.toLowerCase().includes(category))
    );
  }

  // If still no results or no category, do a text search
  if (results.length === 0 || !category) {
    const q = query.toLowerCase();

    // 1. Smart skin-type matching
    if (q.includes('جاف') || q.includes('dry')) {
      results = MOCK_PRODUCTS.filter(p =>
        p.name.includes('ترطيب') || p.description?.includes('ترطيب') ||
        p.name.includes('شيا') || p.description?.includes('شيا') ||
        p.name.includes('هيالورونيك') || p.description?.includes('هيالورونيك')
      );
    } else if (q.includes('دهن') || q.includes('oily') || q.includes('دهون')) {
      results = MOCK_PRODUCTS.filter(p =>
        p.name.includes('دهون') || p.description?.includes('دهون') ||
        p.name.includes('زنك') || p.description?.includes('زنك') ||
        p.name.includes('تنقية') || p.description?.includes('تنقية')
      );
    } else if (q.includes('حساس') || q.includes('sensitive')) {
      results = MOCK_PRODUCTS.filter(p =>
        p.name.includes('مهدئ') || p.description?.includes('مهدئ') ||
        p.name.includes('آمن') || p.description?.includes('آمن')
      );
    } else {
      // Remove common filler words before searching
      const cleanQ = q
        .replace(/وريني|بغيت|عندكم|كتقلب|أريد|أبحث|show me|je cherche|i need|i want|je veux/g, '')
        .trim();

      if (cleanQ.length > 1) {
        results = MOCK_PRODUCTS.filter(p =>
          p.name.toLowerCase().includes(cleanQ) ||
          p.description?.toLowerCase().includes(cleanQ) ||
          p.categories?.some(c => c.name.toLowerCase().includes(cleanQ))
        );
      }
    }
  }

  // Prioritize on-sale products
  results.sort((a, b) => (b.on_sale ? 1 : 0) - (a.on_sale ? 1 : 0));

  return results.slice(0, maxResults);
}

// ─────────────────────────────────────────────────────────
// 4. حالة الموديل 3D
// ─────────────────────────────────────────────────────────
export function getAvatarState(intentType, phase = 'thinking') {
  if (phase === 'thinking') return 'Wave'; // thinking animation
  
  const stateMap = {
    product_search: 'Wave',
    navigation: 'Wave',
    greeting: 'Wave',
    how_are_you: 'Wave',
    thanks: 'Wave',
    goodbye: 'Idle',
    help: 'Wave',
    shipping: 'Idle',
    returns: 'Idle',
    payment: 'Idle',
    support: 'Idle',
    offers: 'Wave',
    app_info: 'Idle',
    unknown: 'Idle',
  };
  return stateMap[intentType] || 'Idle';
}

// ─────────────────────────────────────────────────────────
// 5. توليد الإجابات
// ─────────────────────────────────────────────────────────
function formatPrice(price) {
  return `${parseFloat(price).toFixed(2)} د.م`;
}

export function generateResponse(intent, lang) {
  const { type } = intent;

  // ── Greeting ──
  if (type === 'greeting') {
    const msgs = {
      ar: 'أهلاً بك! 😊 أنا هنا لمساعدتك في كل ما يخص منتجات Kataraa. كيف يمكنني خدمتك؟',
      ma: 'أهلاً بيك! 😊 أنا هنا باش نعاونك فكلشي خاص بمنتجات Kataraa. بأش نقدر نخدمك؟',
      fr: 'Bonjour! 😊 Je suis là pour vous aider avec tout ce qui concerne les produits Kataraa. Comment puis-je vous servir?',
      en: 'Hello! 😊 I\'m here to help you with everything about Kataraa products. How can I serve you?',
    };
    return { text: msgs[lang] || msgs.ar, buttons: [], avatarState: 'Wave' };
  }

  // ── معلومات التطبيق ──
  if (type === 'app_info') {
    return {
      text: APP_INFO.description[lang] || APP_INFO.description.ar,
      buttons: [{ label: { ar: '🛍️ تصفح المنتجات', ma: '🛍️ شوف المنتجات', fr: '🛍️ Voir les produits', en: '🛍️ Browse products' }[lang], route: '/products' }],
      avatarState: 'Idle',
    };
  }

  // ── التنقل ──
  if (type === 'navigation') {
    const page = intent.page;
    if (page) {
      const confirmMsgs = {
        ar: `تفضل، خذتك إلى صفحة ${page.name} 👉`,
        ma: `تفضل، خدتك لصفحة ${page.name} 👉`,
        fr: `Voilà, je vous emmène à la page ${page.name} 👉`,
        en: `Here you go, taking you to ${page.name} 👉`,
      };
      return {
        text: confirmMsgs[lang] || confirmMsgs.ar,
        buttons: [{ label: `🔗 ${page.name}`, route: page.route }],
        avatarState: 'Wave',
      };
    }
    const notFoundMsgs = {
      ar: 'لم أجد الصفحة التي تبحث عنها. هل تريد الذهاب إلى المنتجات أو السلة؟',
      ma: 'ما لقيتش الصفحة اللي كتقلب عليها. بغيتي تمشي للمنتجات أو السلة؟',
      fr: 'Je n\'ai pas trouvé cette page. Voulez-vous accéder aux produits ou au panier?',
      en: 'I didn\'t find that page. Would you like to go to products or the cart?',
    };
    return {
      text: notFoundMsgs[lang] || notFoundMsgs.ar,
      buttons: [
        { label: { ar: '🛍️ المنتجات', ma: '🛍️ المنتجات', fr: '🛍️ Produits', en: '🛍️ Products' }[lang], route: '/products' },
        { label: { ar: '🛒 السلة', ma: '🛒 السلة', fr: '🛒 Panier', en: '🛒 Cart' }[lang], route: '/cart' },
      ],
      avatarState: 'Idle',
    };
  }

  // ── بحث في المنتجات ──
  if (type === 'product_search') {
    const products = searchInProducts(intent.query, intent.category);

    if (products.length === 0) {
      const noResultMsgs = {
        ar: 'لم أجد منتجات مطابقة لبحثك. هل تريد تصفح جميع المنتجات؟',
        ma: 'ما لقيت حتى منتج يطابق ما كتقلب عليه. بغيتي تشوف جميع المنتجات؟',
        fr: 'Je n\'ai pas trouvé de produits correspondants. Voulez-vous parcourir tous les produits?',
        en: 'I didn\'t find matching products. Would you like to browse all products?',
      };
      return {
        text: noResultMsgs[lang] || noResultMsgs.ar,
        buttons: [{ label: { ar: '🛍️ جميع المنتجات', ma: '🛍️ جميع المنتجات', fr: '🛍️ Tous les produits', en: '🛍️ All products' }[lang], route: '/products' }],
        avatarState: 'Idle',
      };
    }

    const introMsgs = {
      ar: `وجدت لك ${products.length} منتج${products.length > 1 ? 'ات' : ''} مناسب${products.length > 1 ? 'ة' : ''}:`,
      ma: `لقيت لك ${products.length} منتج${products.length > 1 ? 'ات' : ''} مناسب${products.length > 1 ? 'ين' : ''}:`,
      fr: `J'ai trouvé ${products.length} produit${products.length > 1 ? 's' : ''} pour vous:`,
      en: `I found ${products.length} product${products.length > 1 ? 's' : ''} for you:`,
    };

    const productLines = products.map((p, i) => {
      const sale = p.on_sale ? ' 🔥' : '';
      return `${i + 1}. ${p.name} — ${formatPrice(p.price)}${sale}`;
    }).join('\n');

    const askMoreMsgs = {
      ar: '\nهل تريد مزيداً من التفاصيل عن أحدها؟',
      ma: '\nبغيتي تعرف كثر عن واحد منهم؟',
      fr: '\nVoulez-vous plus de détails sur l\'un d\'eux?',
      en: '\nWould you like more details about any of them?',
    };

    return {
      text: (introMsgs[lang] || introMsgs.ar) + '\n\n' + productLines + (askMoreMsgs[lang] || askMoreMsgs.ar),
      products: products,
      buttons: [
        {
          label: { ar: '🛍️ عرض جميع المنتجات', ma: '🛍️ شوف جميع المنتجات', fr: '🛍️ Voir tous', en: '🛍️ View all' }[lang],
          route: intent.category ? `/products?category=${intent.category}` : '/products',
        },
      ],
      avatarState: 'Wave',
    };
  }

  // ── عروض ──
  if (type === 'offers') {
    const saleProducts = MOCK_PRODUCTS.filter(p => p.on_sale).slice(0, 3);
    const offerMsgs = {
      ar: `🎁 لدينا ${MOCK_PRODUCTS.filter(p => p.on_sale).length} منتج بتخفيضات رائعة الآن!\n\nأبرز العروض:\n` +
        saleProducts.map((p, i) => `${i + 1}. ${p.name} — ${formatPrice(p.sale_price)} بدلاً من ${formatPrice(p.regular_price)}`).join('\n'),
      ma: `🎁 عندنا ${MOCK_PRODUCTS.filter(p => p.on_sale).length} منتج بتخفيضات واعرة دابا!\n\nأهم العروض:\n` +
        saleProducts.map((p, i) => `${i + 1}. ${p.name} — ${formatPrice(p.sale_price)} عوض ${formatPrice(p.regular_price)}`).join('\n'),
      fr: `🎁 Nous avons ${MOCK_PRODUCTS.filter(p => p.on_sale).length} produits en promotion!\n\nMeilleures offres:\n` +
        saleProducts.map((p, i) => `${i + 1}. ${p.name} — ${formatPrice(p.sale_price)} au lieu de ${formatPrice(p.regular_price)}`).join('\n'),
      en: `🎁 We have ${MOCK_PRODUCTS.filter(p => p.on_sale).length} products on sale!\n\nTop offers:\n` +
        saleProducts.map((p, i) => `${i + 1}. ${p.name} — ${formatPrice(p.sale_price)} instead of ${formatPrice(p.regular_price)}`).join('\n'),
    };
    return {
      text: offerMsgs[lang] || offerMsgs.ar,
      buttons: [{ label: { ar: '🏷️ جميع العروض', ma: '🏷️ جميع العروض', fr: '🏷️ Toutes les offres', en: '🏷️ All offers' }[lang], route: '/products?on_sale=true' }],
      avatarState: 'Wave',
    };
  }

  // ── سياسات ──
  if (type === 'shipping') return { text: POLICIES.shipping[lang] || POLICIES.shipping.ar, buttons: [], avatarState: 'Idle' };
  if (type === 'returns') return { text: POLICIES.returns[lang] || POLICIES.returns.ar, buttons: [], avatarState: 'Idle' };
  if (type === 'payment') return { text: POLICIES.payment[lang] || POLICIES.payment.ar, buttons: [], avatarState: 'Idle' };
  if (type === 'support') {
    return {
      text: POLICIES.support[lang] || POLICIES.support.ar,
      buttons: [],
      avatarState: 'Idle',
    };
  }

  // ── Unknown ──
  const unknownMsgs = {
    ar: 'أنا متخصص في منتجات ومعلومات Kataraa فقط. هل يمكنني مساعدتك في البحث عن منتج أو معلومات الشحن أو الدعم؟',
    ma: 'أنا متخصص غير فمنتجات ومعلومات Kataraa. واش نقدر نعاونك تقلب على منتج، أو معلومات التوصيل، أو الدعم؟',
    fr: 'Je suis spécialisé uniquement dans les produits et informations Kataraa. Puis-je vous aider à chercher un produit, des infos de livraison ou le support?',
    en: 'I\'m specialized in Kataraa products and info only. Can I help you find a product, shipping info, or support?',
  };
  return {
    text: unknownMsgs[lang] || unknownMsgs.ar,
    buttons: [
      { label: { ar: '🛍️ المنتجات', ma: '🛍️ المنتجات', fr: '🛍️ Produits', en: '🛍️ Products' }[lang], route: '/products' },
    ],
    avatarState: 'Idle',
  };
}

// ─────────────────────────────────────────────────────────
// 6. الدالة الرئيسية — معالجة رسالة المستخدم
// ─────────────────────────────────────────────────────────
export async function processUserMessage(text) {
  const lang = detectLanguage(text);

  // Check social/conversational intent first
  const socialIntent = detectConversationIntent(text, lang);
  if (socialIntent !== 'unknown') {
    const responseText = getSocialResponse(socialIntent, lang);
    return {
      lang,
      intent: { type: socialIntent },
      text: responseText,
      buttons: [],
      products: [],
      avatarState: getAvatarState(socialIntent, 'response'),
    };
  }

  const intent = detectIntent(text);
  const response = generateResponse(intent, lang);
  return { lang, intent, ...response };
}
