/**
 * ResponseGenerator — Layer 3: مولد الردود الطبيعية (Context-Aware)
 *
 * المسؤوليات:
 *  - توليد ردود متنوعة لكل نية — يستحيل التكرار
 *  - ردود واعية بالسياق (تتضمن أسماء المنتجات والكميات)
 *  - ردود التوضيح عند انخفاض الثقة
 *  - ردود SMALL_TALK حسب نوع المحادثة
 *  - دعم كامل للغتين العربية الفصحى والإنجليزية بناءً على لغة التطبيق
 */

import type { AssistantProduct, IntentType, ScreenName, ActionType } from '../types';
import {
  HOW_ARE_YOU_ALIASES,
  THANKS_ALIASES,
  GREETING_ALIASES,
  POSITIVE_ALIASES,
  containsAny,
  normalizeText,
} from './aliasResolver';

type LocaleType = 'ar' | 'en';

// ─── مساعد لاختيار رد عشوائي ──────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ─── عداد لمنع تكرار آخر رد (مخزن في ذاكرة الموديول) ────────────────────────
const _lastResponses = new Map<string, number>();

const pickUnique = (arr: string[], category: string): string => {
  const lastIdx = _lastResponses.get(category);
  let idx: number;
  if (arr.length <= 1) {
    idx = 0;
  } else {
    do {
      idx = Math.floor(Math.random() * arr.length);
    } while (idx === lastIdx);
  }
  _lastResponses.set(category, idx);
  return arr[idx];
};

// ─── رسالة الترحيب الافتتاحية ─────────────────────────────────────────────────
export const WELCOME_MESSAGE = {
  ar: 'مرحباً بك! 👋 أهلاً وسهلاً بك في متجر كتارا.\nأنا مساعدك الذكي ويسعدني جداً خدمتك اليوم! ✨\n\nيمكنني مساعدتك في:\n• 🔍 البحث عن أفضل المنتجات\n• 🛒 إضافة وحذف المنتجات من سلتك\n• ⚙️ فتح وتصفح جميع أقسام التطبيق\n• 💡 تقديم توصيات مخصصة لك\n\nكيف يمكنني مساعدتك بكل سرور اليوم؟',
  en: 'Welcome! 👋 Hello and welcome to Kataraa.\nI am your smart assistant, and I am delighted to serve you today! ✨\n\nI can assist you with:\n• 🔍 Finding top products\n• 🛒 Managing items in your cart\n• ⚙️ Navigating app sections\n• 💡 Getting personalized recommendations\n\nHow may I have the pleasure of helping you today?',
};

// ─── قوالب الردود المحلية ───────────────────────────────────────────────────
const LOCALIZED_RESPONSES = {
  ar: {
    nav: {
      Cart: [
        'بكل سرور، فتحت لك سلة التسوق. 🛒 هل تود مراجعة مشترياتك؟',
        'تفضل، إليك سلة مشترياتك. 🛍️ يسعدني خدمتك!',
        'نقلتك إلى السلة لمشاهدة كافة مشترياتك. 🛒',
      ],
      Home: [
        'تفضل، أنت الآن في الصفحة الرئيسية. 🏠 تحت أمرك في أي استفسار!',
        'تمت العودة إلى الصفحة الرئيسية بنجاح. ✨',
        'إليك الصفحة الرئيسية، تسوق ممتع! 🏡',
      ],
      Profile: [
        'تفضل، إليك ملفك الشخصي. 👤',
        'هنا حسابك الشخصي بكل تفاصيله. 🙋',
        'فتحت لك الملف الشخصي بنجاح. ✨',
      ],
      Products: [
        'بكل سرور، إليك معرض المنتجات. 🛍️ أتمنى لك تجربة تصفح رائعة!',
        'هنا جميع المنتجات والمتوفرة لدينا حالياً. ✨',
        'فتحت لك متجر كتارا. 🏪 يسعدني مساعدتك في الاختيار!',
      ],
      Favorites: [
        'تفضل، هذه قائمة المنتجات المفضلة لديك. ❤️',
        'هنا منتجاتك المفضلة التي اخترتها بكل عناية. 💜',
        'فتحت لك قائمة المفضلات. ✨',
      ],
      Orders: [
        'تفضل، إليك طلباتك السابقة وسجل مشترياتك. 📦',
        'هنا قائمة طلباتك لمتابعة حالتها. 📋',
        'فتحت لك صفحة الطلبات بنجاح. ✨',
      ],
      Settings: [
        'تفضل، إليك صفحة الإعدادات. ⚙️',
        'هنا يمكنك ضبط كافة خيارات التطبيق. 🔧',
      ],
      Back: [
        'تمت العودة إلى الصفحة السابقة بكل سرور. 🔙',
        'تم الرجوع إلى الخلف. ↩️',
      ],
    },
    searchFound: [
      (count: number) => `بكل سرور! وجدت لك ${count} منتج${count > 1 ? 'اً' : ''} ممتازاً 🎉 تفضل بالاطلاع عليها:`,
      (count: number) => `لدي ${count} منتج${count > 1 ? 'ات' : ''} تناسب طلبك تماماً. ✨`,
      (count: number) => `عثرت على ${count} منتج${count > 1 ? 'ات' : ''}. 🔍 تفضل بمشاهدة التشكيلة المتوفرة:`,
      (count: number) => `إليك ${count} نتيج${count > 1 ? 'ة' : ''} مطابق${count > 1 ? 'ة' : ''} لطلبك. 🎯 تحت أمرك إذا أردت تفاصيل أي منها!`,
    ],
    searchNotFound: [
      (query: string) => `أعتذر منك جداً 🌸 لم أجد منتجات تطابق "${query}". هل تود البحث باسم آخر أو استكشاف أحدث التشكيلات لدينا؟ 🔍`,
      (query: string) => `عذراً منك، لم أعثر على "${query}" 🤔 يسعدني أن تجرب كلمة بحث أخرى وسأساعدك فوراً.`,
      (query: string) => `لا توجد نتائج بحث لـ "${query}" حالياً 😞 هل تحب أن أبحت لك عن قسم أو منتج مشابه؟`,
    ],
    cartAdd: [
      (name: string) => `من دواعي سروري! ✅ تمت إضافة "${name}" إلى سلتك بنجاح. 🛒 هل تود إكمال التسوق؟`,
      (name: string) => `وضعت لك "${name}" في السلة بكل سرور. 🛒`,
      (name: string) => `تم بنجاح! "${name}" الآن مفعلة في سلتك. ✨`,
    ],
    cartRemove: [
      (name: string) => `تم حذف "${name}" من السلة بناءً على طلبك. 🗑️`,
      (name: string) => `أزلت "${name}" من السلة. 🗑️ تحت أمرك في أي وقت!`,
      (name: string) => `تم إزالة "${name}" بنجاح.`,
    ],
    cartEmpty: [
      'سلة مشترياتك فارغة حالياً! 🛒 يسعدني مساعدتك في العثور على منتجات رائعة لإضافتها.',
      'لا يوجد أي منتج في سلة مشترياتك الآن. 😅 تفضل بتصفح المتجر واختيار ما يعجبك!',
      'السلة فارغة، يسعدني جداً مساعدتك في اختيار أفضل المنتجات!',
    ],
    cartNoResults: [
      'تفقد معي المنتجات أولاً حتى أتمكن من إضافتها لسلتك بكل سرور. 😊',
      'يسعدني إدراج المنتج في سلتك! يرجى البحث أو اختيار المنتج أولاً. 🔍',
      'لا توجد نتائج، ابحث أولاً عن المنتج المطلوبة ثم أضف ما تحب. 😊',
    ],
    recommendations: [
      (count: number) => `يسعدني إفادتك! إليك أفضل ${count} منتجات مختارة لك في متجرنا. 🌟`,
      (count: number) => `هذه أجود ${count} منتجات متوفرة لدينا وحاصلة على أعلى التقييمات. ✨`,
      (count: number) => `هذه أكثر ${count} منتجات مبيعاً وإقبالاً الآن. 🔥`,
    ],
    brandInfo: [
      'أهلاً بك! كتارا هو متجرك الأول المتخصص في أجود منتجات التجميل والعناية بالبشرة والشعر. 🌟\n\nنضمن لك منتجات أصلية 100% وبأسعار منافسة وتوصيل سريع لباب منزلك.\n\nكيف يمكنني مساعدتك بكل سرور اليوم؟',
      'مرحباً بك في كتارا! 🌟 وجهتك الراعية للجمال والعناية.\n\nنقدم مجموعة شاملة من أشهر العلامات التجارية لخدمتك.\n\nهل تود البحث عن منتج معين؟',
      'كتارا — متجرك المفضل للجمال. 💄\n\nنحرص على انتقاء أفضل المنتجات لخدمتك.\n\nيمكنني مساعدتك في:\n• 🔍 البحث عن المنتجات\n• 🛒 الشراء والإضافة للسلة\n• 📦 التوصيل السريع',
    ],
    handoff: [
      'يسعدني جداً تحويلك إلى فريق خدمة العملاء والدعم الفني لمساعدتك بالشكل الأكمل. 🤝\nيمكنك التواصل المباشر معنا عبر:\n• 📱 واتساب: +212XXXXXXXXX\n• 📧 البريد: support@kataraa.com',
      'فهمت طلبك، وفريق خدمة العملاء جاهز تماماً للتعامل معه وخدمتك. 🤝\nراسلنا عبر واتساب أو البريد وسنكون في خدمتك فوراً.',
      'أنا مساعد تسوق، والفريق متواجد لحل هذا الموضوع بدقة. 😊\nيسعدنا تواصلك معنا عبر:\n• 📱 واتساب: +212XXXXXXXXX',
    ],
    smallTalk: {
      greeting: [
        'أهلاً وسهلاً بك في كتارا! 🌸 يسعدني جداً خدمتكم اليوم. كيف أستطيع مساعدتك؟',
        'مرحباً بك عزيزي الزبون! 🌟 أنا مساعدك الذكي في كتارا وفي الخدمة دائماً.',
        'مرحباً! أهلاً بك في متجرنا. 🤖 ماذا تود أن تفعل بكل سرور؟',
      ],
      thanks: [
        'على الرحب والسعة! 🌸 من دواعي سروري خدمتك ونتمنى لك تجربة تسوق رائعة. ❤️',
        'لا شكر على واجب! سعادتك هي هدفنا دائماً. 🛍️',
        'يسعدني جداً أنني استطعت مساعدتك بكل توفيق! 🥰',
      ],
      how_are_you: [
        'أنا بأحسن حال والحمد لله! 😊 يسعدني جداً الاستماع إليك ومساعدتك في التسوق.',
        'بأتم الصحة والعافية! 🌟 هل أساعدك في العثور على أي منتج اليوم؟',
      ],
      positive: [
        'هذا رائع جداً! 🌟 يسعدني رضاك، هل هناك أي شيء آخر أستطيع مساعدتك به؟',
        'جميل جداً! أنا دائماً في خدمتك بكل سرور. 😊',
        'سعيد جداً بكونك راضياً! أتمنى لك يوماً جميلاً. ✨',
      ],
      default: [
        'جميل! يسعدني دائماً تقديم المساعدة في كل ما تحتاجه أثناء التسوق. 🛍️',
        'أنا هنا دائماً لخدمتك! ابحث عن أي منتج أو تصفح الأقسام بكل سهولة. 😊',
      ],
      help: [
        'بكل سرور! 😊 أنا مساعدك الذكي في كتارا، ويمكنني:\n• 🔍 البحث عن المنتجات (مثال: "أرني سيروم للتفتيح")\n• 🛒 إضافة وحذف منتجات من سلتك\n• ⚙️ فتح أي صفحة في التطبيق\n• 💡 توصيات مخصصة بأفضل المنتجات\n• 📦 متابعة طلباتك\n\nفقط اكتب طلبك وأنا تحت أمرك! ✨',
        'من دواعي سروري إخبارك بما أستطيع فعله! 🌟\n\nيمكنني مساعدتك في:\n• البحث عن المنتجات والعروض\n• إضافة منتجات إلى سلتك مباشرة\n• التنقل بين صفحات التطبيق\n• اقتراح أفضل المنتجات لك\n\nما الذي تريد البدء به؟ 😊',
        'أهلاً! إليك ما أقدر على تقديمه لك: 🤖\n\n🔍 بحث ذكي عن المنتجات\n🛒 إدارة سلة المشتريات\n❤️ إدارة المفضلة\n🗺️ التنقل بين أقسام التطبيق\n📋 عرض تاريخ طلباتك\n\nتحت أمرك في أي وقت! ✨',
      ],
    },
    clarify: [
      'أعتذر منك، هل تقصد البحث عن منتج أم فتح صفحة معينة؟ 🤔',
      'هل يمكنك توضيح طلبك قليلاً حتى أتمكن من خدمتك بالشكل الأفضل؟ 😊',
      'أحتاج تفاصيل بسيطة لأقدم لك الخدمة المطلوبة بدقة.\n\nمثلاً:\n• "أرني كريم مرطب" للبحث\n• "افتح السلة" للتنقل',
      'لم أستوعب الطلب بدقة. 😅 هل تبحث عن منتج أم تود الانتقال لصفحة أخرى؟',
    ],
    unknown: [
      'أعتذر منك جداً، لم أتمكن من فهم طلبك بدقة. 😅\n\nيسعدني مساعدتك في:\n• 🔍 البحث عن المنتجات (مثال: أرني سيروم)\n• ⚙️ فتح صفحات التطبيق (مثال: افتح السلة)\n• 🛒 إدارة سلتك (مثال: أضف المنتج الأول)',
      'عذراً منك، لم أستوعب ما تريده تماماً. 🤔\n\nيمكنك تجرب:\n• "أرني كريم" للبحث\n• "افتح الملف الشخصي" للتنقل\n• "أضف الأول" لإضافة منتج',
      'عذراً، حاول كتابة طلبك بصياغة أخرى وسأساعدك فورا. 😊\n\nأنا أفهم طلبات:\n• البحث عن المنتجات\n• فتح الصفحات\n• سلة المشتريات',
    ],
  },
  en: {
    nav: {
      Cart: [
        'Okay, I have opened your shopping cart. 🛒',
        'Here is your shopping cart. 🛍️',
        'Redirected you to the cart page. 🛒',
      ],
      Home: [
        'You are on the home page now. 🏠',
        'Returned to the home page. ✨',
        'Here is the home page. 🏡',
      ],
      Profile: [
        'Here is your profile. 👤',
        'Here is your personal account. 🙋',
        'Opened your profile page. ✨',
      ],
      Products: [
        'Here is the products page. 🛍️',
        'Here are all available products. ✨',
        'Opened the store catalog. 🏪',
      ],
      Favorites: [
        'Here is your favorites list. ❤️',
        'Here are your favorite products. 💜',
        'Opened your wishlist. ✨',
      ],
      Orders: [
        'Here are your past orders. 📦',
        'Here is your orders list. 📋',
        'Opened your orders history page. ✨',
      ],
      Settings: [
        'Here are the settings. ⚙️',
        'Here is the settings page. 🔧',
      ],
      Back: [
        'Returned to the previous page. 🔙',
        'Went back. ↩️',
      ],
    },
    searchFound: [
      (count: number) => `Found ${count} product${count > 1 ? 's' : ''} 🎉 Here are the results:`,
      (count: number) => `I have ${count} product${count > 1 ? 's' : ''} that suit you. ✨`,
      (count: number) => `Found ${count} product${count > 1 ? 's' : ''}. 🔍 Check out what I found:`,
      (count: number) => `Here are ${count} match${count > 1 ? 'es' : 'ing result'} for your request. 🎯`,
    ],
    searchNotFound: [
      (query: string) => `I couldn't find any products matching "${query}" 😕 Try a different search term or category.`,
      (query: string) => `No results found for "${query}" 🤔 Please try another keyword.`,
      (query: string) => `No matches for "${query}" 😞 Would you like to search for something else?`,
    ],
    cartAdd: [
      (name: string) => `✅ "${name}" has been added to your cart successfully!`,
      (name: string) => `I put "${name}" in your cart. 🛒`,
      (name: string) => `Done! "${name}" is now in your cart. ✨`,
    ],
    cartRemove: [
      (name: string) => `❌ "${name}" has been removed from your cart.`,
      (name: string) => `Removed "${name}" from your cart. 🗑️`,
      (name: string) => `"${name}" removed successfully.`,
    ],
    cartEmpty: [
      'Your shopping cart is already empty! 🛒',
      'You have no items in your cart currently. 😅',
      'The cart is empty, search for a product to add!',
    ],
    cartNoResults: [
      'Please search for a product first so I can add it to the cart. 😊',
      'You need to look for a product first, then we can add it to the cart. 🔍',
      'No search results, please search first and add what you like. 😊',
    ],
    recommendations: [
      (count: number) => `Here are our top ${count} recommended products. 🌟`,
      (count: number) => `These are the best ${count} products we have currently. ✨`,
      (count: number) => `These are the ${count} best-selling products right now. 🔥`,
    ],
    brandInfo: [
      'Kataraa is a store specialized in beauty, skincare, and hair care products. 🌟\n\nWe provide you with the best global brands at competitive prices with fast delivery.\n\nHow can I help you today?',
      'Welcome! Kataraa is your primary destination for beauty and care. ✨\n\nWe offer a wide range of skincare, hair care, and makeup products from top brands.\n\nWould you like to search for a specific product?',
      'Kataraa — your favorite store for beauty products. 💄\n\nWe select the highest quality products and deliver them to your doorstep.\n\nWhat you can do with me:\n• 🔍 Search for products\n• 🛒 Easy checkout\n• 📦 Fast shipping',
    ],
    handoff: [
      'I will forward you to the support team to assist you better. 🤝\nYou can reach us via:\n• 📱 WhatsApp: +212XXXXXXXXX\n• 📧 Email: support@kataraa.com',
      'I understand, this issue should be handled by our customer support team. 🤝\nPlease contact us on WhatsApp or email and we will help you out.',
      'I am a shopping assistant and cannot help you with this directly. 😊\nBut our support team is ready to assist you:\n• 📱 WhatsApp: +212XXXXXXXXX',
    ],
    smallTalk: {
      greeting: [
        'Welcome! 👋 How can I help you today?',
        'Hello! Welcome to Kataraa. 🌟 How may I serve you?',
        'Hi! I am your smart Kataraa assistant. 🤖 What would you like to do?',
      ],
      thanks: [
        'You are welcome! I am happy to help. ❤️',
        'No problem! I wish you a wonderful shopping experience. 🛍️',
        'Glad I could help! 🥰',
      ],
      how_are_you: [
        'I am doing great, thank you! 😊 How can I help you with your shopping?',
        'Doing wonderful! 🌟 Shall I help you find a product?',
      ],
      positive: [
        'Great! 🌟 Is there anything else I can help you with?',
        'Nice! I am always here to serve you. 😊',
        'Happy you are satisfied! Do you need anything else? ✨',
      ],
      default: [
        'Nice! Is there anything I can help you with regarding shopping? 🛍️',
        'I am here to help! Search for a product or open any page. 😊',
      ],
      help: [
        'Sure! 😊 I am your smart Kataraa assistant. Here is what I can do:\n• 🔍 Search for products (e.g., "show me serum")\n• 🛒 Add or remove items from your cart\n• ⚙️ Open any app page\n• 💡 Personalized product recommendations\n• 📦 View your orders\n\nJust type what you need! ✨',
        'Happy to help! Here are my capabilities: 🌟\n• Product search and browsing\n• Cart management\n• App navigation\n• Smart recommendations\n\nHow can I assist you today? 😊',
      ],
    },
    clarify: [
      'Did you mean searching for a product or opening a specific page? 🤔',
      'Could you please clarify your request? 😊',
      'I need a few details to assist you better.\n\nFor example:\n• "show me moisturizer" to search\n• "open cart" to navigate',
      'I did not understand clearly. 😅 Are you searching for a product or do you want to open a page?',
    ],
    unknown: [
      "I couldn't understand your request. 😅\n\nI can help you with:\n• 🔍 Searching products (e.g., show moisturizer)\n• ⚙️ Opening pages (e.g., open cart)\n• 🛒 Managing cart (e.g., add the first product)",
      "Sorry, I couldn't understand what you want. 🤔\n\nTry:\n• 'show me serum' to search\n• 'open profile' to navigate\n• 'add first' to add a product",
      "I am not sure what you mean. 😊 Try writing your request differently.\n\nI understand:\n• Product search\n• Opening application pages\n• Adding/removing from cart",
    ],
  },
};

const CATEGORY_ARABIC_NAMES: Record<string, string> = {
  'Skincare': 'العناية بالبشرة',
  'Hair Care': 'العناية بالشعر',
  'Makeup': 'المكياج',
  'Perfume': 'العطور',
  'Body Care': 'العناية بالجسم',
  'Toner': 'التونر',
  'Serum': 'السيروم',
  'Suncare': 'واقي الشمس',
  'Anti-Aging': 'مكافحة الشيخوخة',
  'Acne': 'حب الشباب',
  'Tools': 'أدوات التجميل',
  'Cleansers': 'المنظفات',
  'Masks': 'الماسكات',
};

// ─── الدوال العامة ─────────────────────────────────────────────────────────────

/** رد التنقل */
export const getNavigationResponse = (screen: ScreenName, category: string | undefined, locale: LocaleType): string => {
  if (screen === 'Products' && category) {
    if (locale === 'ar') {
      const arabicName = CATEGORY_ARABIC_NAMES[category] || category;
      return `تم، نقلتك إلى قسم "${arabicName}" في المتجر. 📂`;
    } else {
      return `Done, redirected you to the "${category}" section. 📂`;
    }
  }
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  const responses = dict.nav[screen] || dict.nav.Home;
  return pickUnique(responses, `nav_${screen}`);
};

/** رد البحث — نتائج موجودة */
export const getSearchFoundResponse = (count: number, locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  const fn = pick(dict.searchFound);
  return fn(count);
};

/** رد البحث — لا نتائج */
export const getSearchNotFoundResponse = (query: string, locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  const fn = pick(dict.searchNotFound);
  return fn(query);
};

/** رد إضافة للسلة (Context-Aware — يتضمن اسم المنتج) */
export const getCartAddResponse = (product: AssistantProduct, locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  const fn = pick(dict.cartAdd);
  return fn(product.name);
};

/** رد حذف من السلة (Context-Aware) */
export const getCartRemoveResponse = (productName: string, locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  const fn = pick(dict.cartRemove);
  return fn(productName);
};

/** رد سلة فارغة */
export const getCartEmptyResponse = (locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  return pickUnique(dict.cartEmpty, 'cart_empty');
};

/** رد لا توجد نتائج بحث سابقة */
export const getCartNoResultsResponse = (locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  return pickUnique(dict.cartNoResults, 'cart_no_results');
};

/** رد التوصيات */
export const getRecommendationsResponse = (count: number, locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  const fn = pick(dict.recommendations);
  return fn(count);
};

/** رد معلومات البراند */
export const getBrandInfoResponse = (locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  return pickUnique(dict.brandInfo, 'brand_info');
};

/** رد خدمة الزبناء */
export const getHandoffResponse = (locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  return pickUnique(dict.handoff, 'handoff');
};

/** رد SMALL_TALK — حسب نوع المحادثة */
export const getSmallTalkResponse = (rawText: string, locale: LocaleType): string => {
  const normalized = normalizeText(rawText);
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;

  if (containsAny(normalized, HOW_ARE_YOU_ALIASES)) {
    return pickUnique(dict.smallTalk.how_are_you, 'st_how');
  }
  if (containsAny(normalized, THANKS_ALIASES)) {
    return pickUnique(dict.smallTalk.thanks, 'st_thanks');
  }
  if (containsAny(normalized, GREETING_ALIASES)) {
    return pickUnique(dict.smallTalk.greeting, 'st_greeting');
  }
  if (containsAny(normalized, POSITIVE_ALIASES)) {
    return pickUnique(dict.smallTalk.positive, 'st_positive');
  }

  return pickUnique(dict.smallTalk.default, 'st_default');
};

/** رد HELP — حين يسأل الزبون عن قدرات المساعد */
export const getHelpResponse = (locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  return pickUnique(dict.smallTalk.help, 'st_help');
};


/** رد التوضيح عند الثقة المنخفضة */
export const getClarifyResponse = (locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  return pickUnique(dict.clarify, 'clarify');
};

/** رد UNKNOWN */
export const getUnknownResponse = (locale: LocaleType): string => {
  const dict = LOCALIZED_RESPONSES[locale] || LOCALIZED_RESPONSES.ar;
  return pickUnique(dict.unknown, 'unknown');
};

// ─── ردود الأسئلة والاستفسارات المخصصة ──────────────────────────────────────────

export const getPriceResponse = (productName: string | undefined, price: number | string | undefined, locale: LocaleType): string => {
  if (productName && price) {
    return locale === 'ar'
      ? `سعر "${productName}" هو ${price} درهم. 💰\nيمكنك إضافته للسلة مباشرة إذا أعجبك!`
      : `The price of "${productName}" is ${price} MAD. 💰\nYou can add it to your cart right away!`;
  }
  if (productName) {
    return locale === 'ar'
      ? `السعر الحالي لـ "${productName}" معروض في صفحة المنتج. 💰 أضغط على بطاقة المنتج لرؤية السعر.`
      : `The current price for "${productName}" is shown on the product page. 💰 Tap the product card to see the price.`;
  }
  return locale === 'ar'
    ? 'أخبرني باسم المنتج اللي بغيتي تعرف ثمنه وأنا نعطيك السعر فورا! 😊💰'
    : 'Tell me the product name you want to check the price for, and I will get it for you right away! 😊💰';
};

export const getDetailsResponse = (product: AssistantProduct | undefined, locale: LocaleType): string => {
  if (product) {
    if (product.description) {
      return locale === 'ar'
        ? `إليك تفاصيل ومميزات المنتج "${product.name}":\n\n${product.description} 💡\n\nهل تريد إضافته إلى السلة؟`
        : `Here are the details and features for "${product.name}":\n\n${product.description} 💡\n\nWould you like to add it to your cart?`;
    }
    return locale === 'ar'
      ? `المنتج "${product.name}" هو منتج تجميل مميز من متجرنا. 🌟\nيمكنك الاطلاع على كامل تفاصيله ومكوناته في صفحة المنتج.\n\nهل تريد إضافته للسلة أو البحث عن منتج آخر؟`
      : `"${product.name}" is a premium beauty product from our store. 🌟\nYou can view its full details and ingredients on the product page.\n\nWould you like to add it to your cart or search for another product?`;
  }
  return locale === 'ar'
    ? 'أخبرني باسم المنتج اللي بغيتي تعرف تفاصيله وأنا نوريك المعلومات كاملة! 😊💡'
    : 'Tell me the product name you want details about, and I will show you the full information! 😊💡';
};

export const getAvailabilityResponse = (productName: string | undefined, locale: LocaleType): string => {
  if (productName) {
    return locale === 'ar'
      ? `نعم، المنتج "${productName}" متوفر حالياً في متجرنا! ✅\nيمكنك إضافته إلى السلة مباشرة. 🛒`
      : `Yes, "${productName}" is currently in stock! ✅\nYou can add it to your cart right away. 🛒`;
  }
  return locale === 'ar'
    ? 'جميع المنتجات المعروضة في المتجر متوفرة حالياً. ✅\nأخبرني باسم المنتج اللي بغيتي تتأكد من توفره! 🔍'
    : 'All products shown in the store are currently available. ✅\nTell me the product name you want to check availability for! 🔍';
};

export const getDeliveryResponse = (locale: LocaleType): string => {
  return locale === 'ar'
    ? 'نعم، كاين التوصيل لجميع مدن المغرب! 📦\n\n• ⏱️ المدة: من 24 إلى 48 ساعة\n• 💵 الدفع عند الاستلام متاح\n• 🚚 التوصيل لباب المنزل\n\nهل تريد إضافة منتج للسلة؟'
    : 'Yes, we deliver to all cities! 📦\n\n• ⏱️ Duration: 24 to 48 hours\n• 💵 Cash on delivery available\n• 🚚 Door-to-door delivery\n\nWould you like to add a product to your cart?';
};

export const getWarrantyResponse = (locale: LocaleType): string => {
  return locale === 'ar'
    ? 'جميع منتجاتنا أصلية 100% ومضمونة! 🛡️\n\n• ✅ منتجات أوريجينال من المصدر\n• 🔄 استبدال أو استرجاع خلال 7 أيام\n• 📋 ضمان الجودة على كل طلب\n\nتسوّق بكل ثقة! 💜'
    : 'All our products are 100% authentic and guaranteed! 🛡️\n\n• ✅ Original products from the source\n• 🔄 Exchange or return within 7 days\n• 📋 Quality guarantee on every order\n\nShop with full confidence! 💜';
};

export const getComparisonResponse = (locale: LocaleType): string => {
  return locale === 'ar'
    ? 'بغيتي تقارن بين منتجات؟ 🤔\n\nأخبرني بأسماء المنتجات اللي بغيتي تقارن بينها، مثلاً:\n• "قارن بين سيروم وكريم مرطب"\n• "شنو الفرق بين شامبو لوريال وسيرافي"\n\nوأنا نوريك الفرق بينهم! 🤝'
    : 'Want to compare products? 🤔\n\nTell me the names of the products you want to compare, for example:\n• "Compare serum and moisturizer"\n• "What is the difference between L\'Oreal and CeraVe shampoo"\n\nAnd I will show you the differences! 🤝';
};

// ─── ردود التأكيدات والعمليات الحساسة ──────────────────────────────────────────

export const getConfirmationPrompt = (actionType: ActionType, locale: LocaleType): string => {
  if (locale === 'ar') {
    if (actionType === 'CLEAR_CART') {
      return 'هل أنت متأكد من رغبتك في تفريغ السلة بالكامل؟ 🗑️';
    }
    if (actionType === 'CLEAR_FAVORITES') {
      return 'هل أنت متأكد من رغبتك في مسح قائمة المفضلات بالكامل؟ ❤️';
    }
    return 'هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟ 🤔';
  } else {
    if (actionType === 'CLEAR_CART') {
      return 'Are you sure you want to empty your cart? 🗑️';
    }
    if (actionType === 'CLEAR_FAVORITES') {
      return 'Are you sure you want to clear your favorites list? ❤️';
    }
    return 'Are you sure you want to perform this action? 🤔';
  }
};

export const getConfirmYesResponse = (actionType: ActionType, locale: LocaleType): string => {
  if (locale === 'ar') {
    if (actionType === 'CLEAR_CART') {
      return 'تم تفريغ السلة بالكامل. 👍';
    }
    if (actionType === 'CLEAR_FAVORITES') {
      return 'تم مسح قائمة المفضلات بنجاح. 👍';
    }
    return 'تم تنفيذ الإجراء بنجاح. ✨';
  } else {
    if (actionType === 'CLEAR_CART') {
      return 'The cart has been completely emptied. 👍';
    }
    if (actionType === 'CLEAR_FAVORITES') {
      return 'The favorites list has been cleared successfully. 👍';
    }
    return 'Action executed successfully. ✨';
  }
};

export const getConfirmNoResponse = (locale: LocaleType): string => {
  return locale === 'ar' ? 'تم إلغاء العملية. 👍' : 'Action cancelled. 👍';
};

/** رد خطأ في البحث */
export const getSearchErrorResponse = (locale: LocaleType): string => {
  return locale === 'ar'
    ? 'حدث خطأ أثناء البحث 😕 تحقق من اتصالك بالإنترنت وحاول مرة أخرى.'
    : 'An error occurred during search 😕 Please check your internet connection and try again.';
};

/** رد تفريغ السلة */
export const getCartClearedResponse = (locale: LocaleType): string => {
  return locale === 'ar'
    ? 'تم تفريغ السلة بالكامل. 🗑️'
    : 'The cart has been completely emptied. 🗑️';
};

// ─── الرد البديل المضمون والواعي بالنية (Guaranteed Fallbacks) ──────────────

const FALLBACK_BY_INTENT = {
  ar: {
    PRODUCT_SEARCH: 'جاري البحث عن المنتجات المطلوبة.',
    NAVIGATION: 'تم الانتقال إلى الشاشة المطلوبة.',
    CART_MANAGEMENT: 'تم تحديث سلة التسوق الخاصة بك.',
    CATEGORY_BROWSING: 'جاري عرض المنتجات في القسم المحدد.',
    RECOMMENDATIONS: 'إليك التوصيات المقترحة لك.',
    BRAND_INFORMATION: 'كتارا هو متجر متخصص في منتجات الجمال الكورية.',
    SMALL_TALK: 'مرحباً بك! أنا هنا لمساعدتك.',
    HUMAN_HANDOFF: 'جاري تحويلك إلى فريق خدمة العملاء.',
    ASK_PRICE: 'سعر هذا المنتج معروض في صفحته الخاصة.',
    ASK_AVAILABILITY: 'هذا المنتج متوفر حالياً في المتجر.',
    ASK_DELIVERY: 'يستغرق التوصيل من 24 إلى 48 ساعة.',
    ASK_WARRANTY: 'جميع منتجاتنا أصلية 100% ومضمونة.',
    ASK_COMPARISON: 'يمكنك المقارنة بين خصائص المنتجات في صفحاتها.',
    CONFIRM_YES: 'تم تأكيد العملية بنجاح.',
    CONFIRM_NO: 'تم إلغاء العملية.',
    COMMENT: 'جاري كتابة التعليق المطلوب.',
    RATING: 'جاري تقييم المنتج.',
    UNKNOWN: 'عذراً، لم أتمكن من فهم طلبك.',
  },
  en: {
    PRODUCT_SEARCH: 'Searching for the requested products.',
    NAVIGATION: 'Navigated to the requested screen.',
    CART_MANAGEMENT: 'Your shopping cart has been updated.',
    CATEGORY_BROWSING: 'Showing products in the selected category.',
    RECOMMENDATIONS: 'Here are the recommended products.',
    BRAND_INFORMATION: 'Kataraa is a store specialized in Korean beauty products.',
    SMALL_TALK: 'Hello! I am here to help you.',
    HUMAN_HANDOFF: 'Transferring you to customer support.',
    ASK_PRICE: 'The price of this product is shown on its page.',
    ASK_AVAILABILITY: 'This product is currently available.',
    ASK_DELIVERY: 'Delivery takes 24 to 48 hours.',
    ASK_WARRANTY: 'All our products are 100% authentic and guaranteed.',
    ASK_COMPARISON: 'You can compare product details on their pages.',
    CONFIRM_YES: 'Action confirmed successfully.',
    CONFIRM_NO: 'Action cancelled.',
    COMMENT: 'Writing the requested comment.',
    RATING: 'Submitting rating for the product.',
    UNKNOWN: "Sorry, I couldn't understand your request.",
  },
};

/**
 * إرجاع رد بديل مضمون وخاص بالنية عند فشل التحقق اللغوي
 */
export const getIntentFallbackResponse = (intent: IntentType, locale: LocaleType): string => {
  const dict = (FALLBACK_BY_INTENT[locale] || FALLBACK_BY_INTENT.ar) as Record<string, string>;
  return dict[intent] || dict.UNKNOWN;
};
