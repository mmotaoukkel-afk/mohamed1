/**
 * assistantKnowledge.js — Kataraa AI Assistant Knowledge Base
 * قاعدة معرفة المساعد الذكي
 */

// ─────────────────────────────────────────────────────────
// معلومات التطبيق
// ─────────────────────────────────────────────────────────
export const APP_INFO = {
  name: 'Kataraa',
  nameAr: 'كتاراء',
  tagline: 'متجر العناية بالبشرة والجمال',
  description: {
    ar: 'كتاراء هو متجر متخصص في منتجات العناية بالبشرة والجمال. نقدم أفضل المنتجات من كريمات، سيرومات، ماسكات، مكياج، عناية بالشعر، عطور وأكثر.',
    ma: 'كتاراء هو متجر ديال العناية بالبشرة والجمال. كاين عندنا أفضل المنتجات: كريمات، سيرومات، ماسكات، مكياج، عناية بالشعر وعطور.',
    fr: 'Kataraa est une boutique spécialisée dans les soins de la peau et la beauté. Nous proposons des crèmes, sérums, masques, maquillage, soins capillaires et parfums.',
    en: 'Kataraa is a beauty and skincare store. We offer creams, serums, masks, makeup, hair care, fragrances and more.',
  },
};

// ─────────────────────────────────────────────────────────
// الصفحات وروابطها
// ─────────────────────────────────────────────────────────
export const APP_PAGES = [
  { name: 'الرئيسية', route: '/', keywords: ['رئيسية', 'هوم', 'home', 'accueil', 'دار', 'بداية'] },
  { name: 'المنتجات', route: '/products', keywords: ['منتجات', 'products', 'produits', 'تسوق', 'shop', 'سلع', 'boutique'] },
  { name: 'السلة', route: '/cart', keywords: ['سلة', 'cart', 'panier', 'عربة', 'كارت', 'الطلب'] },
  { name: 'المفضلة', route: '/favorites', keywords: ['مفضلة', 'favorites', 'favoris', 'محبوبات', 'قلب'] },
  { name: 'الملف الشخصي', route: '/profile', keywords: ['ملف', 'profile', 'profil', 'حساب', 'compte', 'بروفيل'] },
  { name: 'العروض', route: '/products?on_sale=true', keywords: ['عروض', 'تخفيضات', 'خصومات', 'offres', 'promotions', 'soldes', 'deals', 'sales', 'تنزيلات'] },
  { name: 'الدفع', route: '/checkout/payment', keywords: ['دفع', 'checkout', 'paiement', 'كاشو', 'payment', 'ادفع'] },
  { name: 'الطلبات', route: '/orders', keywords: ['طلبات', 'orders', 'commandes', 'طلبياتي', 'mes commandes'] },
];

// ─────────────────────────────────────────────────────────
// معلومات الشحن والدفع والإرجاع
// ─────────────────────────────────────────────────────────
export const POLICIES = {
  shipping: {
    ar: 'التوصيل يستغرق من 24 إلى 48 ساعة لجميع المدن. الشحن مجاني للطلبات فوق 150 درهم.',
    ma: 'التوصيل كياخد بين 24 و48 ساعة لجميع المدن. الشحن مجاني للطلبات فوق 150 درهم.',
    fr: 'La livraison prend entre 24 et 48 heures pour toutes les villes. Livraison gratuite pour les commandes supérieures à 150 DH.',
    en: 'Delivery takes 24 to 48 hours to all cities. Free shipping on orders above 150 DH.',
  },
  returns: {
    ar: 'يمكنك إرجاع المنتجات خلال 7 أيام من تاريخ الاستلام، شرط أن يكون المنتج في حالته الأصلية.',
    ma: 'تقدر ترجع المنتجات خلال 7 أيام من الاستلام، بشرط يكون المنتج بحاله الأصلية.',
    fr: 'Vous pouvez retourner les produits dans les 7 jours suivant la réception, à condition que le produit soit dans son état d\'origine.',
    en: 'You can return products within 7 days of receipt, provided the product is in its original condition.',
  },
  payment: {
    ar: 'نقبل الدفع عند الاستلام (COD)، البطاقة البنكية (Visa/Mastercard)، والتحويل البنكي.',
    ma: 'كنقبلو الدفع عند الاستلام، البطاقة البنكية، والتحويل البنكي.',
    fr: 'Nous acceptons le paiement à la livraison (COD), les cartes bancaires (Visa/Mastercard) et les virements.',
    en: 'We accept cash on delivery (COD), bank cards (Visa/Mastercard), and bank transfers.',
  },
  support: {
    ar: 'للتواصل مع الدعم يمكنك مراسلتنا عبر البريد الإلكتروني أو الاتصال على رقم الدعم. فريقنا متاح من 9 صباحاً حتى 6 مساءً.',
    ma: 'باش تتواصل مع الدعم، راسلنا على الإيميل أو اتصل بينا. الفريق ديالنا متاح من 9 الصبح حتى 6 العشية.',
    fr: 'Pour contacter le support, envoyez-nous un email ou appelez-nous. Notre équipe est disponible de 9h à 18h.',
    en: 'To contact support, email us or give us a call. Our team is available from 9 AM to 6 PM.',
  },
};

// ─────────────────────────────────────────────────────────
// الكلمات المفتاحية لكشف النية
// ─────────────────────────────────────────────────────────
export const INTENT_KEYWORDS = {
  product_search: {
    triggers: ['منتج', 'سيروم', 'كريم', 'ماسك', 'غسول', 'تونر', 'واقي', 'عطر', 'شامبو', 'مكياج',
      'produit', 'sérum', 'crème', 'masque', 'product', 'serum', 'cream', 'mask', 'شوف', 'وريني', 'بغيت', 'محتاج',
      'je cherche', 'j\'ai besoin', 'i need', 'i want', 'show me', 'أريد', 'أبحث', 'أحتاج', 'عندكم'],
  },
  navigation: {
    triggers: ['صفحة', 'خدني', 'روح', 'اذهب', 'وين', 'أين', 'go to', 'navigate', 'emmène', 'page',
      'سلة', 'عروض', 'منتجات', 'مفضلة', 'حساب', 'ويناه', 'فين'],
  },
  shipping: {
    triggers: ['شحن', 'توصيل', 'وقت', 'متى', 'كيف', 'livraison', 'délai', 'shipping', 'delivery', 'when', 'كيفاش', 'فكيد'],
  },
  returns: {
    triggers: ['إرجاع', 'رجوع', 'راجع', 'استبدال', 'retour', 'return', 'refund', 'exchange', 'ارجع', 'رجع'],
  },
  payment: {
    triggers: ['دفع', 'تسديد', 'كارت', 'بطاقة', 'كاش', 'paiement', 'payer', 'payment', 'pay', 'visa', 'mastercard'],
  },
  support: {
    triggers: ['دعم', 'مساعدة', 'تواصل', 'اتصال', 'support', 'aide', 'contact', 'help', 'whatsapp', 'إيميل', 'email'],
  },
  greeting: {
    triggers: ['مرحبا', 'السلام', 'أهلاً', 'هلا', 'bonjour', 'salut', 'hello', 'hi', 'hey', 'سلام', 'آسلامو', 'صباح', 'مساء'],
  },
  offers: {
    triggers: ['عروض', 'تخفيض', 'خصم', 'offre', 'promo', 'sale', 'discount', 'promotion', 'تنزيل', 'رخيص', 'pas cher', 'cheap'],
  },
  app_info: {
    triggers: ['ما هو', 'شنو هو', 'c\'est quoi', 'what is', 'عن الموقع', 'عن التطبيق', 'about'],
  },
};

// ─────────────────────────────────────────────────────────
// Quick Replies متعددة اللغات
// ─────────────────────────────────────────────────────────
export const QUICK_REPLIES = {
  ar: [
    { id: 'skincare', label: '🌸 منتجات البشرة', query: 'منتجات العناية بالبشرة' },
    { id: 'offers', label: '🎁 العروض والتخفيضات', query: 'العروض' },
    { id: 'shipping', label: '🚚 معلومات الشحن', query: 'كيف يتم الشحن؟' },
    { id: 'makeup', label: '💄 منتجات المكياج', query: 'وريني المكياج' },
    { id: 'hair', label: '💇 منتجات الشعر', query: 'منتجات الشعر' },
    { id: 'support', label: '📞 تواصل مع الدعم', query: 'كيف أتواصل مع الدعم؟' },
  ],
  ma: [
    { id: 'skincare', label: '🌸 منتجات البشرة', query: 'وريني منتجات البشرة' },
    { id: 'offers', label: '🎁 شنو العروض؟', query: 'شنو العروض؟' },
    { id: 'shipping', label: '🚚 كيفاش يتم التوصيل؟', query: 'كيفاش يتم الشحن؟' },
    { id: 'makeup', label: '💄 وريني المكياج', query: 'وريني المكياج' },
    { id: 'hair', label: '💇 منتجات الشعر', query: 'وريني منتجات الشعر' },
    { id: 'support', label: '📞 الدعم', query: 'بغيت نتواصل مع الدعم' },
  ],
  fr: [
    { id: 'skincare', label: '🌸 Soins de la peau', query: 'Je cherche des produits pour la peau' },
    { id: 'offers', label: '🎁 Voir les offres', query: 'Quelles sont les offres ?' },
    { id: 'shipping', label: '🚚 Infos livraison', query: 'Comment se passe la livraison ?' },
    { id: 'makeup', label: '💄 Maquillage', query: 'Montrez-moi le maquillage' },
    { id: 'hair', label: '💇 Soins capillaires', query: 'Produits pour les cheveux' },
    { id: 'support', label: '📞 Support', query: 'Comment contacter le support ?' },
  ],
  en: [
    { id: 'skincare', label: '🌸 Skincare products', query: 'Show me skincare products' },
    { id: 'offers', label: '🎁 Current offers', query: 'What are the current offers?' },
    { id: 'shipping', label: '🚚 Shipping info', query: 'How does shipping work?' },
    { id: 'makeup', label: '💄 Makeup', query: 'Show me makeup products' },
    { id: 'hair', label: '💇 Hair care', query: 'Show me hair care products' },
    { id: 'support', label: '📞 Contact support', query: 'How do I contact support?' },
  ],
};

// ─────────────────────────────────────────────────────────
// رسائل الترحيب
// ─────────────────────────────────────────────────────────
export const WELCOME_MESSAGES = {
  ar: 'مرحباً! أنا المساعد الذكي لـ Kataraa 🌸 كيف يمكنني مساعدتك اليوم؟',
  ma: 'أهلاً بيك! أنا المساعد الذكي ديال Kataraa 🌸 بأش نقدر نعاونك؟',
  fr: 'Bonjour! Je suis l\'assistant intelligent de Kataraa 🌸 Comment puis-je vous aider?',
  en: 'Hello! I\'m the Kataraa smart assistant 🌸 How can I help you today?',
};
