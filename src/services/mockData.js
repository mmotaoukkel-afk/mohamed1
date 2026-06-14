/**
 * Mock Products Data - Kataraa
 * Demo data for products and categories
 */

export const MOCK_PRODUCTS = [
    // ===== سيرومات الوجه (Face Serums) =====
    {
        id: 1,
        name: 'سيروم ببتيد النحاس المتقدم',
        price: '34.000',
        regular_price: '38.000',
        sale_price: '34.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 5, name: 'السيروم' }],
        description: 'سيروم متقدم بببتيد النحاس لتحفيز إنتاج الكولاجين وتجديد خلايا البشرة.',
    },
    {
        id: 2,
        name: 'سيروم نياسيناميد 10% مع الزنك',
        price: '26.500',
        regular_price: '26.500',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 5, name: 'السيروم' }],
        description: 'سيروم مركّز بتركيز 10% نياسيناميد مع خلاصة الزنك لتنقية المسام وتقليل الدهون الزائدة.',
    },
    {
        id: 3,
        name: 'سيروم ريتينول 0.5% مع فيتامين E',
        price: '42.000',
        regular_price: '48.000',
        sale_price: '42.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 5, name: 'السيروم' }, { id: 7, name: 'مكافحة الشيخوخة' }],
        description: 'سيروم ليلي بتركيز آمن من الريتينول مع فيتامين E المضاد للأكسدة.',
    },
    {
        id: 4,
        name: 'سيروم حمض الهيالورونيك المتعدد الأوزان',
        price: '29.000',
        regular_price: '32.000',
        sale_price: '29.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 5, name: 'السيروم' }],
        description: 'سيروم ترطيب مكثف بثلاثة أنواع من حمض الهيالورونيك.',
    },

    // ===== كريمات العناية (Care Creams) =====
    {
        id: 5,
        name: 'كريم ليل بالنياسيناميد والبيكربولايد',
        price: '35.000',
        regular_price: '35.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 7, name: 'مكافحة الشيخوخة' }],
        description: 'كريم ليلي غني بالنياسيناميد والبيكربولايد. يعمل أثناء النوم على تجديد البشرة.',
    },
    {
        id: 6,
        name: 'كريم واقي نهاري SPF 50+ بالتيتانيوم',
        price: '21.500',
        regular_price: '25.000',
        sale_price: '21.500',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 6, name: 'العناية من الشمس' }],
        description: 'واقي شمس نهاري بحماية عالية SPF 50+ بتركيبة خفيفة غير دهنية.',
    },
    {
        id: 7,
        name: 'كريم الترطيب المكثف بزبدة الشيا',
        price: '17.000',
        regular_price: '17.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'كريم ترطيب عميق بخلاصة زبدة الشيا الطبيعية وفيتامين B5.',
    },
    {
        id: 8,
        name: 'كريم العين بالكافيين والببتيدات',
        price: '24.000',
        regular_price: '28.000',
        sale_price: '24.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'كريم خاص بمنطقة حول العين بالكافيين والببتيدات.',
    },

    // ===== تنظيف البشرة (Cleansing) =====
    {
        id: 9,
        name: 'غسول مائي بحمض الهيالورونيك',
        price: '14.500',
        regular_price: '14.500',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 10, name: 'منظفات' }],
        description: 'غسول مائي بتركيبة لطيفة على البشرة يحتوي على حمض الهيالورونيك.',
    },
    {
        id: 10,
        name: 'ماسك فحم نشط لتنقية المسام',
        price: '16.000',
        regular_price: '19.000',
        sale_price: '16.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 12, name: 'ماسكات' }],
        description: 'ماسك فحم نشط يسحب الشوائب والدهون من داخل المسام.',
    },
    {
        id: 11,
        name: 'تونر مهدئ بخلاصة البابونج',
        price: '12.000',
        regular_price: '12.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 2, name: 'تونر' }],
        description: 'تونر مهدئ بخلاصة البابونج الطبيعي.',
    },
    {
        id: 12,
        name: 'مائي ميسيلار للتنظيف اليومي',
        price: '13.500',
        regular_price: '15.000',
        sale_price: '13.500',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 10, name: 'منظفات' }],
        description: 'مائي ميسيلار للتنظيف اليومي بفعالية.',
    },

    // ===== العناية من الشمس (Sun Protection) =====
    {
        id: 13,
        name: 'واقي شمس جل شفاف SPF 50',
        price: '22.000',
        regular_price: '22.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 6, name: 'العناية من الشمس' }],
        description: 'واقي شمس بتركيبة جل شفاف غير لزج.',
    },
    {
        id: 14,
        name: 'برايمر واقي شمس متوهج SPF 30',
        price: '19.500',
        regular_price: '23.000',
        sale_price: '19.500',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 6, name: 'العناية من الشمس' }],
        description: 'برايمر واقي شمس بتأثير متوهج.',
    },

    // ===== ماسكات العناية (Treatment Masks) =====
    {
        id: 15,
        name: 'ماسك أحماض الفاكهة AHA 30%',
        price: '28.000',
        regular_price: '32.000',
        sale_price: '28.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 12, name: 'ماسكات' }],
        description: 'ماسك تقشير كيميائي بتركيز 30% من أحماض الفاكهة.',
    },
    {
        id: 16,
        name: 'ماسك الطين المغربي المنقي',
        price: '15.000',
        regular_price: '18.000',
        sale_price: '15.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 12, name: 'ماسكات' }],
        description: 'ماسك طين مغربي أصلي لتنقية البشرة وامتصاص الدهون الزائدة.',
    },
    {
        id: 17,
        name: 'ماسك مرطب بالصبار وحمض الهيالورونيك',
        price: '13.000',
        regular_price: '13.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 12, name: 'ماسكات' }],
        description: 'ماسك مرطب غني بخلاصة الصبار وحمض الهيالورونيك.',
    },

    // ===== علاجات موضعية (Spot Treatments) =====
    {
        id: 18,
        name: 'لاصقات شفافة لحب الشباب النشط',
        price: '9.500',
        regular_price: '12.000',
        sale_price: '9.500',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 8, name: 'حب الشباب' }],
        description: 'لاصقات شفافة بخلاصة الهيدروكلويد لامتصاص القيح وتقليل الاحمرار.',
    },
    {
        id: 19,
        name: 'قلم точتي حب الشباب السحري',
        price: '11.000',
        regular_price: '11.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 8, name: 'حب الشباب' }],
        description: 'قلم موضعي لعلاج حب الشباب فوراً.',
    },
    {
        id: 20,
        name: 'لاصقات تحت العين لتصغير المسام',
        price: '18.000',
        regular_price: '22.000',
        sale_price: '18.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'لاصقات تحت العين بتأثير فوري لتصغير المسام وتقليل الهالات.',
    },

    // ===== أدوات العناية (Beauty Tools) =====
    {
        id: 21,
        name: 'رولر يشم طبيعي مع حجر الغوانشا',
        price: '20.000',
        regular_price: '20.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 9, name: 'أدوات' }],
        description: 'رولر تدليك من حجر اليشم الطبيعي مع حجر الغوانشا.',
    },
    {
        id: 22,
        name: 'جهاز دراجوا بالفرشاة الماسية',
        price: '55.000',
        regular_price: '65.000',
        sale_price: '55.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 9, name: 'أدوات' }],
        description: 'جهاز دراجوا بفرشاة ماسية للتدليك العميق.',
    },
    {
        id: 23,
        name: 'أداة تدليك بالبرودة والحرارة',
        price: '38.000',
        regular_price: '38.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 9, name: 'أدوات' }],
        description: 'أداة متعددة الاستخدامات بالبرودة والحرارة.',
    },

    // ===== مكياج (Makeup) =====
    {
        id: 24,
        name: 'كوشن فاونديشن بالتفوق الطبيعي',
        price: '25.000',
        regular_price: '30.000',
        sale_price: '25.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 3, name: 'المكياج' }],
        description: 'كوشن فاونديشن بتغطية طبيعية تدوم طوال اليوم.',
    },
    {
        id: 25,
        name: 'بالت ظلال عيون برونزي',
        price: '32.000',
        regular_price: '38.000',
        sale_price: '32.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 3, name: 'المكياج' }],
        description: 'بالت 12 لون من ظلال العيون بدرجات برونزي ونحاسي.',
    },
    {
        id: 26,
        name: 'ماسكرا رافعة للرموش',
        price: '16.000',
        regular_price: '16.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 3, name: 'المكياج' }],
        description: 'ماسكرا بفرشاة منحنية ترفع الرموش وتفيدها.',
    },

    // ===== العناية بالشعر (Hair Care) =====
    {
        id: 27,
        name: 'شامبو بالبيوتين والكيراتين',
        price: '18.000',
        regular_price: '18.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 4, name: 'الشعر' }],
        description: 'شامبو مقوي بالبيوتين والكيراتين.',
    },
    {
        id: 28,
        name: 'ماسك إصلاح عميق بالكيراتين البرازيلي',
        price: '24.000',
        regular_price: '28.000',
        sale_price: '24.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 4, name: 'الشعر' }],
        description: 'ماسك إصلاح عميق بالكيراتين البرازيلي.',
    },
    {
        id: 29,
        name: 'سيروم شعر بالزيت الأرجان المغربي',
        price: '22.000',
        regular_price: '22.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 4, name: 'الشعر' }],
        description: 'سيروم خفيف بزيت الأرجان المغربي الأصلي.',
    },

    // ===== العناية بالجسم (Body Care) =====
    {
        id: 30,
        name: 'لوشن الجسم بالجليسرين والبابونج',
        price: '15.000',
        regular_price: '15.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 11, name: 'العناية بالجسم' }],
        description: 'لوشن مرطب للجسم بجليسرين نباتي وخلاصة البابونج.',
    },
    {
        id: 31,
        name: 'سكراب الجسم بالسكر البنية والكركديه',
        price: '18.500',
        regular_price: '22.000',
        sale_price: '18.500',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 11, name: 'العناية بالجسم' }],
        description: 'سكراب تقشير للجسم بسكر البني وخلاصة الكركديه.',
    },
    {
        id: 32,
        name: 'كريم تفتيح الجسم بالنياسيناميد',
        price: '21.000',
        regular_price: '25.000',
        sale_price: '21.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 11, name: 'العناية بالجسم' }],
        description: 'كريم تفتيح للجسم بتركيز عالي من النياسيناميد وفيتامين C.',
    },
    {
        id: 33,
        name: 'بودرة التلك الناعمة بالروائح',
        price: '10.000',
        regular_price: '10.000',
        on_sale: false,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 11, name: 'العناية بالجسم' }],
        description: 'بودرة تلك ناعمة برائحة زهرة الياسمين.',
    },

    // ===== عطور (Fragrances) =====
    {
        id: 34,
        name: 'عطر زهرة الورد والياسمين',
        price: '45.000',
        regular_price: '52.000',
        sale_price: '45.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 13, name: 'العطور' }],
        description: 'عطر نسائي أنثوي بريشة الورد الدمشقي والميسك الأبيض.',
    },
    {
        id: 35,
        name: 'عطر عود ملكي بالعنبر والمسك',
        price: '68.000',
        regular_price: '75.000',
        sale_price: '68.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 13, name: 'العطور' }],
        description: 'عطر شرقي فاخر بالعود الطبيعي والعنبر والمسك.',
    },

    // ===== مجموعات (Sets) =====
    {
        id: 36,
        name: 'طقم العناية الليلي الكامل',
        price: '89.000',
        regular_price: '110.000',
        sale_price: '89.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'طقم كامل للعناية الليلية يشمل 4 منتجات أساسية.',
    },
    {
        id: 37,
        name: 'طقم الهدايا الفاخر للمرأة',
        price: '125.000',
        regular_price: '150.000',
        sale_price: '125.000',
        on_sale: true,
        stock_status: 'instock',
        images: [
            { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=400&fit=crop' }
        ],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'طقم هدايا فاخر يحتوي على 6 منتجات مختارة.',
    },
];

export const MOCK_CATEGORIES = [
    {
        id: 1,
        name: 'العناية بالبشرة',
        slug: 'skincare',
        count: 25,
    },
    {
        id: 2,
        name: 'تونر',
        slug: 'toner',
        count: 2,
    },
    {
        id: 3,
        name: 'المكياج',
        slug: 'makeup',
        count: 4,
    },
    {
        id: 4,
        name: 'الشعر',
        slug: 'hair',
        count: 3,
    },
    {
        id: 5,
        name: 'السيروم',
        slug: 'serum',
        count: 4,
    },
    {
        id: 6,
        name: 'العناية من الشمس',
        slug: 'suncare',
        count: 2,
    },
    {
        id: 7,
        name: 'مكافحة الشيخوخة',
        slug: 'anti-aging',
        count: 2,
    },
    {
        id: 8,
        name: 'حب الشباب',
        slug: 'acne',
        count: 2,
    },
    {
        id: 9,
        name: 'أدوات',
        slug: 'tools',
        count: 3,
    },
    {
        id: 10,
        name: 'منظفات',
        slug: 'cleansers',
        count: 2,
    },
    {
        id: 11,
        name: 'العناية بالجسم',
        slug: 'body-care',
        count: 4,
    },
    {
        id: 12,
        name: 'ماسكات',
        slug: 'masks',
        count: 3,
    },
    {
        id: 13,
        name: 'العطور',
        slug: 'fragrances',
        count: 2,
    },
];
