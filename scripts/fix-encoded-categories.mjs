/**
 * Fix URL-encoded categories in Firestore
 * Decodes strings like "%d8%ac%d9%85..." back to readable Arabic/Text
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    projectId: 'first-app-95051',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixCategories() {
    console.log('🔧 Starting Category Fix...\n');

    const snapshot = await getDocs(collection(db, 'products'));
    let updateCount = 0;

    for (const d of snapshot.docs) {
        const data = d.data();
        const originalCategory = data.category || '';

        // Skip if empty or doesn't look encoded
        if (!originalCategory || !originalCategory.includes('%')) continue;

        try {
            // Try to decode
            let decoded = decodeURIComponent(originalCategory);

            // Sometimes it might be double encoded or have hyphens instead of spaces
            decoded = decoded.replace(/-/g, ' ');

            if (decoded !== originalCategory) {
                console.log(`📝 Fixing: [${d.id}]`);
                console.log(`   Old: ${originalCategory}`);
                console.log(`   New: ${decoded}`);

                await updateDoc(doc(db, 'products', d.id), {
                    category: decoded
                });
                updateCount++;
            }
        } catch (e) {
            console.error(`❌ Failed to decode: ${originalCategory}`, e.message);
        }
    }

    console.log(`\n✅ Finished! Fixed ${updateCount} products.`);
    process.exit(0);
}

fixCategories().catch(console.error);
