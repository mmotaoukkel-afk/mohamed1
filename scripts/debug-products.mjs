/**
 * Debug Products Script
 * Check product statuses and fix if needed
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

async function debugProducts() {
    console.log('🔍 Checking products in Firestore...\n');

    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`📊 Total products: ${products.length}\n`);

    // Count by status
    const statusCounts = {};
    products.forEach(p => {
        const status = p.status || 'NO_STATUS';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📈 Products by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
    });

    // Show first 5 products
    console.log('\n📦 Sample products:');
    products.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name}`);
        console.log(`     status: ${p.status || 'undefined'}`);
        console.log(`     images: ${p.images?.length || 0}`);
    });

    // Fix products without 'active' status
    const needFix = products.filter(p => p.status !== 'active');
    if (needFix.length > 0) {
        console.log(`\n⚠️ Found ${needFix.length} products without 'active' status`);
        console.log('🔧 Fixing...\n');

        for (const p of needFix) {
            await updateDoc(doc(db, 'products', p.id), {
                status: 'active',
                isPublished: true
            });
            console.log(`   ✅ Fixed: ${p.name}`);
        }

        console.log('\n✨ All products now have status: active');
    } else {
        console.log('\n✅ All products already have status: active');
    }

    process.exit(0);
}

debugProducts().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
