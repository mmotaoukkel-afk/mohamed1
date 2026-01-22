/**
 * Inspect product categories
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    projectId: 'first-app-95051',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCategories() {
    console.log('🔍 Checking product categories...\n');

    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const categories = new Set();
    products.forEach(p => {
        if (p.category) categories.add(p.category);
    });

    console.log('📂 Found Categories:');
    categories.forEach(c => console.log(`   - "${c}"`));

    process.exit(0);
}

checkCategories().catch(console.error);
