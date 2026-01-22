/**
 * Fetch Categories from WooCommerce
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    projectId: 'first-app-95051',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// WooCommerce API
const WC_URL = 'https://kataraa.com/wp-json/wc/v3';
const CONSUMER_KEY = 'ck_5a4ad731227ef0c632f5255ab64c523eb48ec55c';
const CONSUMER_SECRET = 'cs_c81c240df13ab27084a83a6c85ed618b57c6b009';

async function fetchCategories() {
    console.log('🔍 Fetching categories from WooCommerce...\n');

    const response = await fetch(
        `${WC_URL}/products/categories?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&per_page=100`
    );
    const categories = await response.json();

    console.log('📁 WooCommerce Categories:');
    categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.count} products) [slug: ${cat.slug}]`);
    });

    // Also check what's in Firestore products
    console.log('\n\n📦 Categories in Firestore products:');
    const snapshot = await getDocs(collection(db, 'products'));
    const categoryMap = {};

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const cats = data.categories || [];
        cats.forEach(c => {
            const name = c.name || c;
            categoryMap[name] = (categoryMap[name] || 0) + 1;
        });
    });

    Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
            console.log(`   - ${name}: ${count} products`);
        });

    process.exit(0);
}

fetchCategories().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
