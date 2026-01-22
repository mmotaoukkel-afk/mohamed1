/**
 * Fetch Real Products from Kataraa.com WooCommerce
 * Syncs real products to Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

// Firebase Config
const firebaseConfig = {
    apiKey: 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    projectId: 'first-app-95051',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// WooCommerce API
const WC_URL = 'https://kataraa.com/wp-json/wc/v3/products';
const CONSUMER_KEY = 'ck_5a4ad731227ef0c632f5255ab64c523eb48ec55c';
const CONSUMER_SECRET = 'cs_c81c240df13ab27084a83a6c85ed618b57c6b009';

async function fetchWooProducts() {
    console.log('🔄 Fetching products from kataraa.com...\n');

    try {
        const response = await fetch(
            `${WC_URL}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&per_page=100&status=publish`,
            {
                headers: {
                    'Accept': 'application/json',
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const products = await response.json();
        console.log(`✅ Fetched ${products.length} products from WooCommerce\n`);

        // Show sample
        console.log('📦 Sample products:');
        products.slice(0, 5).forEach(p => {
            console.log(`   - ${p.name} (${p.price} KWD)`);
        });
        console.log('');

        return products;
    } catch (error) {
        console.error('❌ Error fetching from WooCommerce:', error.message);
        throw error;
    }
}

async function clearOldProducts() {
    console.log('🗑️ Clearing old products...');
    const snapshot = await getDocs(collection(db, 'products'));
    let count = 0;
    for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'products', docSnap.id));
        count++;
    }
    console.log(`   Deleted ${count} old products\n`);
}

async function syncToFirestore(wooProducts) {
    console.log('📤 Syncing to Firestore...\n');

    let success = 0;
    let errors = 0;

    for (const product of wooProducts) {
        try {
            // Transform WooCommerce format to Firestore format
            const firestoreProduct = {
                name: product.name,
                description: product.short_description || product.description || '',
                price: product.price || '0',
                regular_price: product.regular_price || product.price || '0',
                sale_price: product.sale_price || null,
                on_sale: product.on_sale || false,
                onSale: product.on_sale || false,
                stock: product.stock_quantity || (product.stock_status === 'instock' ? 50 : 0),
                stock_status: product.stock_status,
                lowStockThreshold: 5,
                category: product.categories?.[0]?.slug || 'skincare',
                categories: product.categories || [],
                tags: product.tags?.map(t => t.name) || [],
                images: product.images?.map(img => ({ src: img.src })) || [],
                sku: product.sku || '',
                status: 'active',
                isPublished: true,
                wooId: product.id,
                permalink: product.permalink,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'products'), firestoreProduct);
            success++;
            console.log(`✅ [${success}] ${product.name}`);
        } catch (err) {
            errors++;
            console.error(`❌ Failed: ${product.name}`, err.message);
        }
    }

    console.log('\n========================================');
    console.log(`✅ SUCCESS: ${success} products synced`);
    if (errors > 0) console.log(`❌ ERRORS: ${errors}`);
    console.log('========================================');
}

async function main() {
    try {
        // 1. Fetch from WooCommerce
        const wooProducts = await fetchWooProducts();

        if (wooProducts.length === 0) {
            console.log('⚠️ No products found!');
            process.exit(1);
        }

        // 2. Clear old products
        await clearOldProducts();

        // 3. Sync to Firestore
        await syncToFirestore(wooProducts);

        console.log('\n🎉 Real products are now live in your app!');
        console.log('   Refresh the app to see them.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

main();
