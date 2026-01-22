/**
 * Check Product Format in Detail
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkFormat() {
    console.log('🔍 Checking product data format...\n');

    const snapshot = await getDocs(collection(db, 'products'));
    const product = snapshot.docs[0]?.data();

    console.log('📦 First product full data:');
    console.log(JSON.stringify(product, null, 2));

    console.log('\n\n📸 Image format check:');
    console.log('   images:', JSON.stringify(product?.images));

    console.log('\n💰 Price format check:');
    console.log('   price:', product?.price, typeof product?.price);
    console.log('   on_sale:', product?.on_sale, typeof product?.on_sale);
    console.log('   onSale:', product?.onSale, typeof product?.onSale);

    process.exit(0);
}

checkFormat().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
