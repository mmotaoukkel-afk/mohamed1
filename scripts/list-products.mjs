/**
 * List all products to check for visual duplicates
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    projectId: 'first-app-95051',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listAll() {
    console.log('🔍 Listing all products...\n');

    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Sort by name for easier visual check
    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log(`📊 Total: ${products.length} products\n`);

    products.forEach((p, i) => {
        console.log(`${i + 1}. [${p.id}] "${p.name}"`);
    });

    // Also check for same images
    const imageMap = {};
    products.forEach(p => {
        if (p.images && p.images.length > 0) {
            const img = p.images[0].src || p.images[0];
            if (!imageMap[img]) imageMap[img] = [];
            imageMap[img].push(p.name);
        }
    });

    const imgDuplicates = Object.entries(imageMap).filter(([img, names]) => names.length > 1);
    if (imgDuplicates.length > 0) {
        console.log('\n⚠️ Found products with same image:\n');
        imgDuplicates.forEach(([img, names]) => {
            console.log(`   IMAGE: ${img.substring(0, 50)}...`);
            names.forEach(n => console.log(`      - ${n}`));
        });
    }

    process.exit(0);
}

listAll().catch(console.error);
