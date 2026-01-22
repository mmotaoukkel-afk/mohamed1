/**
 * Check and Remove Duplicate Products
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    projectId: 'first-app-95051',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDuplicates() {
    console.log('🔍 Checking for duplicate products...\n');

    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

    console.log(`📊 Total documents in Firestore: ${products.length}\n`);

    // Check for duplicates by name
    const nameMap = {};
    products.forEach(p => {
        const name = p.name?.trim();
        if (!nameMap[name]) {
            nameMap[name] = [];
        }
        nameMap[name].push(p);
    });

    // Find duplicates
    const duplicates = Object.entries(nameMap).filter(([name, items]) => items.length > 1);

    if (duplicates.length === 0) {
        console.log('✅ No duplicates found!');
        console.log(`\n📦 Unique products: ${Object.keys(nameMap).length}`);
        process.exit(0);
    }

    console.log(`⚠️ Found ${duplicates.length} products with duplicates:\n`);
    duplicates.slice(0, 10).forEach(([name, items]) => {
        console.log(`   "${name}" - ${items.length} copies`);
    });

    // Remove duplicates (keep first, delete rest)
    console.log('\n🗑️ Removing duplicates...\n');
    let deleted = 0;

    for (const [name, items] of duplicates) {
        // Keep the first one, delete the rest
        for (let i = 1; i < items.length; i++) {
            await deleteDoc(doc(db, 'products', items[i].docId));
            deleted++;
        }
    }

    console.log(`✅ Deleted ${deleted} duplicate documents`);

    // Verify
    const finalSnapshot = await getDocs(collection(db, 'products'));
    console.log(`\n📦 Products remaining: ${finalSnapshot.size}`);

    process.exit(0);
}

checkDuplicates().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
