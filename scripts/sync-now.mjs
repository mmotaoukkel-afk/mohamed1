/**
 * Quick Product Sync Script
 * Syncs 30 original products to Firestore
 * Run with: node --experimental-vm-modules scripts/sync-now.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

// Firebase Config
const firebaseConfig = {
    apiKey: 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    authDomain: 'first-app-95051.firebaseapp.com',
    projectId: 'first-app-95051',
    storageBucket: 'first-app-95051.firebasestorage.app',
    messagingSenderId: '1076765269610',
    appId: '1:1076765269610:android:e07a1461338ec94947b413',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock Products Data
const MOCK_PRODUCTS = [
    // ===== السيرومات (Serums) =====
    {
        id: 1,
        name: 'سيروم فيتامين سي الكوري',
        price: '25.500',
        regular_price: '30.000',
        sale_price: '25.500',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 5, name: 'السيروم' }],
        description: 'سيروم فيتامين سي للبشرة الناعمة والمشرقة',
    },
    {
        id: 8,
        name: 'سيروم الهيالورونيك أسيد',
        price: '28.000',
        regular_price: '28.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 5, name: 'السيروم' }],
        description: 'سيروم مرطب للبشرة الجافة',
    },
    {
        id: 9,
        name: 'سيروم النياسيناميد',
        price: '22.000',
        regular_price: '25.000',
        sale_price: '22.000',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 5, name: 'السيروم' }],
        description: 'سيروم لتوحيد لون البشرة وتقليل المسام',
    },
    // ===== الكريمات (Creams) =====
    {
        id: 2,
        name: 'كريم الكولاجين المرطب',
        price: '18.750',
        regular_price: '18.750',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'كريم كولاجين للترطيب العميق',
    },
    {
        id: 5,
        name: 'كريم العين المضاد للتجاعيد',
        price: '22.000',
        regular_price: '22.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'كريم للعين يحارب التجاعيد',
    },
    {
        id: 10,
        name: 'كريم الريتينول الليلي',
        price: '32.000',
        regular_price: '32.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 7, name: 'مكافحة الشيخوخة' }],
        description: 'كريم ليلي بالريتينول لمكافحة التجاعيد',
    },
    // ===== الماسكات (Masks) =====
    {
        id: 3,
        name: 'ماسك الوجه بالفحم',
        price: '12.000',
        regular_price: '15.000',
        sale_price: '12.000',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 12, name: 'ماسكات' }],
        description: 'ماسك منظف بالفحم النشط',
    },
    {
        id: 11,
        name: 'ماسك الطين المغربي',
        price: '14.500',
        regular_price: '14.500',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 12, name: 'ماسكات' }],
        description: 'ماسك طين مغربي طبيعي لتنظيف عميق',
    },
    {
        id: 12,
        name: 'ماسك الشاي الأخضر',
        price: '13.000',
        regular_price: '16.000',
        sale_price: '13.000',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 12, name: 'ماسكات' }],
        description: 'ماسك بالشاي الأخضر المهدئ',
    },
    // ===== الغسول والمنظفات (Cleansers) =====
    {
        id: 4,
        name: 'غسول الوجه بالصبار',
        price: '9.500',
        regular_price: '9.500',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 10, name: 'منظفات' }],
        description: 'غسول منعش بخلاصة الصبار',
    },
    {
        id: 13,
        name: 'غسول الوجه الرغوي',
        price: '11.000',
        regular_price: '11.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 10, name: 'منظفات' }],
        description: 'غسول رغوي ناعم للبشرة الحساسة',
    },
    // ===== واقيات الشمس (Sunscreen) =====
    {
        id: 6,
        name: 'واقي الشمس SPF 50',
        price: '16.500',
        regular_price: '20.000',
        sale_price: '16.500',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 6, name: 'العناية من الشمس' }],
        description: 'حماية قوية من أشعة الشمس',
    },
    {
        id: 14,
        name: 'واقي الشمس المعدني SPF 30',
        price: '14.000',
        regular_price: '14.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }, { id: 6, name: 'العناية من الشمس' }],
        description: 'واقي شمس معدني للبشرة الحساسة',
    },
    // ===== التونر (Toners) =====
    {
        id: 7,
        name: 'تونر ماء الورد',
        price: '11.000',
        regular_price: '11.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400' }],
        categories: [{ id: 2, name: 'تونر' }],
        description: 'تونر طبيعي بماء الورد',
    },
    {
        id: 15,
        name: 'تونر حمض الساليسيليك',
        price: '13.500',
        regular_price: '13.500',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400' }],
        categories: [{ id: 2, name: 'تونر' }, { id: 2, name: 'حب الشباب' }],
        description: 'تونر لعلاج حب الشباب',
    },
    // ===== اللاصقات (Patches) =====
    {
        id: 16,
        name: 'لاصقات حب الشباب',
        price: '8.000',
        regular_price: '10.000',
        sale_price: '8.000',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400' }],
        categories: [{ id: 2, name: 'حب الشباب' }],
        description: 'لاصقات شفافة لعلاج البثور',
    },
    {
        id: 17,
        name: 'لاصقات تحت العين الذهبية',
        price: '12.500',
        regular_price: '12.500',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'لاصقات ذهبية لتقليل الهالات السوداء',
    },
    {
        id: 18,
        name: 'لاصقات الأنف لإزالة الرؤوس السوداء',
        price: '7.000',
        regular_price: '9.000',
        sale_price: '7.000',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'لاصقات لإزالة الرؤوس السوداء',
    },
    // ===== الأدوات (Tools) =====
    {
        id: 19,
        name: 'رولر الوجه من اليشم',
        price: '15.000',
        regular_price: '15.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'رولر من حجر اليشم الطبيعي',
    },
    {
        id: 20,
        name: 'جهاز التنظيف بالموجات الصوتية',
        price: '45.000',
        regular_price: '55.000',
        sale_price: '45.000',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'جهاز تنظيف الوجه بتقنية الموجات الصوتية',
    },
    {
        id: 21,
        name: 'أداة جوا شا من الكوارتز الوردي',
        price: '12.000',
        regular_price: '12.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'أداة جوا شا للتدليك وشد البشرة',
    },
    // ===== المكياج (Makeup) =====
    {
        id: 22,
        name: 'كوشن BB للترطيب',
        price: '18.000',
        regular_price: '22.000',
        sale_price: '18.000',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400' }],
        categories: [{ id: 3, name: 'المكياج' }],
        description: 'كوشن BB كريم بتغطية طبيعية',
    },
    {
        id: 23,
        name: 'طقم فرش المكياج الاحترافي',
        price: '28.000',
        regular_price: '28.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400' }],
        categories: [{ id: 3, name: 'المكياج' }],
        description: 'طقم 12 قطعة من فرش المكياج',
    },
    {
        id: 24,
        name: 'بالت ظلال العيون',
        price: '24.000',
        regular_price: '30.000',
        sale_price: '24.000',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400' }],
        categories: [{ id: 3, name: 'المكياج' }],
        description: 'بالت 16 لون من ظلال العيون',
    },
    // ===== العناية بالشعر (Hair Care) =====
    {
        id: 25,
        name: 'شامبو الأرجان المغربي',
        price: '16.000',
        regular_price: '16.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400' }],
        categories: [{ id: 4, name: 'الشعر' }],
        description: 'شامبو بزيت الأرجان المغربي الأصلي',
    },
    {
        id: 26,
        name: 'بلسم إصلاح الشعر التالف',
        price: '14.500',
        regular_price: '18.000',
        sale_price: '14.500',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400' }],
        categories: [{ id: 4, name: 'الشعر' }],
        description: 'بلسم لإصلاح الشعر التالف',
    },
    {
        id: 27,
        name: 'سيروم الشعر بالكيراتين',
        price: '19.000',
        regular_price: '19.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400' }],
        categories: [{ id: 4, name: 'الشعر' }],
        description: 'سيروم كيراتين لتنعيم الشعر',
    },
    // ===== العناية بالجسم (Body Care) =====
    {
        id: 28,
        name: 'لوشن الجسم المرطب',
        price: '13.000',
        regular_price: '13.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'لوشن مرطب للجسم برائحة منعشة',
    },
    {
        id: 29,
        name: 'سكراب الجسم بالقهوة',
        price: '11.500',
        regular_price: '14.000',
        sale_price: '11.500',
        on_sale: true,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'سكراب طبيعي بالقهوة لتقشير الجسم',
    },
    {
        id: 30,
        name: 'زبدة الشيا الطبيعية',
        price: '10.000',
        regular_price: '10.000',
        on_sale: false,
        stock_status: 'instock',
        images: [{ src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400' }],
        categories: [{ id: 1, name: 'العناية بالبشرة' }],
        description: 'زبدة شيا نقية 100% للترطيب العميق',
    },
];

// Check current products
async function checkProducts() {
    const snapshot = await getDocs(collection(db, 'products'));
    return snapshot.size;
}

// Sync products to Firestore
async function syncProducts() {
    console.log('🔄 Starting product sync to Firestore...\n');

    const currentCount = await checkProducts();
    console.log(`📊 Current products in Firestore: ${currentCount}`);

    if (currentCount >= 25) {
        console.log('✅ Products already exist! No sync needed.');
        process.exit(0);
    }

    let success = 0;
    let errors = 0;

    for (const product of MOCK_PRODUCTS) {
        try {
            const firestoreProduct = {
                name: product.name,
                description: product.description || '',
                price: parseFloat(product.price) || 0,
                compareAtPrice: parseFloat(product.regular_price) || 0,
                salePrice: product.on_sale ? parseFloat(product.sale_price || product.price) : null,
                onSale: product.on_sale || false,
                on_sale: product.on_sale || false, // Keep compatibility
                sale_price: product.sale_price,
                regular_price: product.regular_price,
                stock: 50,
                lowStockThreshold: 5,
                category: product.categories?.[0]?.name === 'العناية بالبشرة' ? 'skincare'
                    : product.categories?.[0]?.name === 'المكياج' ? 'makeup'
                        : product.categories?.[0]?.name === 'الشعر' ? 'haircare'
                            : product.categories?.[0]?.name === 'حب الشباب' ? 'skincare'
                                : product.categories?.[0]?.name === 'تونر' ? 'skincare'
                                    : 'skincare',
                tags: product.categories?.map(c => c.name) || [],
                images: product.images?.map(img => ({ src: img.src })) || [],
                status: 'active',
                isPublished: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'products'), firestoreProduct);
            success++;
            console.log(`✅ [${success}/${MOCK_PRODUCTS.length}] ${product.name}`);
        } catch (err) {
            errors++;
            console.error(`❌ Failed: ${product.name}`, err.message);
        }
    }

    console.log('\n========================================');
    console.log(`✅ SUCCESS: ${success} products synced`);
    if (errors > 0) console.log(`❌ ERRORS: ${errors}`);
    console.log('========================================');
    console.log('\n🎉 Products are now live in your app!');
    console.log('   Refresh the app to see them.');

    process.exit(0);
}

syncProducts().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
});
