/**
 * Fix Product Format
 * Converts images from strings to {src: string} objects
 * Adds on_sale field for compatibility
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function fixProducts() {
    console.log('🔧 Fixing product format in Firestore...\n');

    const snapshot = await getDocs(collection(db, 'products'));
    let fixed = 0;

    for (const docSnap of snapshot.docs) {
        const product = docSnap.data();
        const updates = {};
        let needsUpdate = false;

        // Fix images format: convert strings to {src: string} objects
        if (product.images && product.images.length > 0) {
            const firstImage = product.images[0];
            if (typeof firstImage === 'string') {
                updates.images = product.images.map(src => ({ src }));
                needsUpdate = true;
            }
        }

        // Add on_sale field if missing (for compatibility)
        if (product.on_sale === undefined && product.onSale !== undefined) {
            updates.on_sale = product.onSale;
            needsUpdate = true;
        }

        // Add sale_price if missing
        if (!product.sale_price && product.salePrice) {
            updates.sale_price = String(product.salePrice);
            needsUpdate = true;
        }

        // Add regular_price if missing
        if (!product.regular_price && product.compareAtPrice) {
            updates.regular_price = String(product.compareAtPrice);
            needsUpdate = true;
        }

        // Ensure price is string format
        if (typeof product.price === 'number') {
            updates.price = String(product.price.toFixed(3));
            needsUpdate = true;
        }

        if (needsUpdate) {
            await updateDoc(doc(db, 'products', docSnap.id), updates);
            fixed++;
            console.log(`✅ Fixed: ${product.name}`);
        }
    }

    console.log(`\n========================================`);
    console.log(`✅ Fixed ${fixed}/${snapshot.size} products`);
    console.log(`========================================`);
    console.log(`\n🎉 Refresh your app to see products!`);

    process.exit(0);
}

fixProducts().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
