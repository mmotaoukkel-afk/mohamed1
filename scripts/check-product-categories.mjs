/**
 * Debug Script: Check Product Categories in Firestore
 * This script will help us understand what category values are stored in the database
 */

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../src/services/firebaseConfig.js';

async function checkProductCategories() {
    try {
        console.log('🔍 Fetching sample products to check category values...\n');

        const q = query(collection(db, 'products'), limit(20));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('⚠️ No products found in Firestore!');
            return;
        }

        console.log(`Found ${snapshot.size} products in database\n`);
        console.log('='.repeat(80));
        console.log('Product Categories in Database:');
        console.log('='.repeat(80));

        const categoryCount = {};

        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            const category = data.category || 'NO_CATEGORY';

            // Count categories
            categoryCount[category] = (categoryCount[category] || 0) + 1;

            // Show first few examples
            if (index < 10) {
                console.log(`${index + 1}. Name: ${data.name || 'No name'}`);
                console.log(`   Category: "${category}"`);
                console.log(`   Status: ${data.status || 'N/A'}`);
                console.log('-'.repeat(80));
            }
        });

        console.log('\n' + '='.repeat(80));
        console.log('Category Distribution:');
        console.log('='.repeat(80));
        Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, count]) => {
                console.log(`  "${cat}": ${count} products`);
            });
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkProductCategories();
