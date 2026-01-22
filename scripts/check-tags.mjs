/**
 * Inspect product tags to see if they contain garbage data
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    projectId: 'first-app-95051',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTags() {
    console.log('🔍 Checking product tags...\n');

    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    let messyTagsCount = 0;

    products.forEach(p => {
        if (p.tags && p.tags.length > 0) {
            // Check for tags that look like URL encoded strings or are very long
            const weirdTags = p.tags.filter(t => t.startsWith('%') || t.length > 30);

            if (weirdTags.length > 0) {
                console.log(`⚠️ Product: ${p.name}`);
                console.log(`   ID: ${p.id}`);
                console.log(`   Weird Tags:`, weirdTags);
                messyTagsCount++;
            }
        }
    });

    if (messyTagsCount === 0) {
        console.log('✅ No messy tags found.');
    } else {
        console.log(`\n❌ Found ${messyTagsCount} products with messy tags.`);
    }

    process.exit(0);
}

checkTags().catch(console.error);
