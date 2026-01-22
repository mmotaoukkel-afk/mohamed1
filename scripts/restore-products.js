/**
 * Restore Original Products Script
 * Run this once to restore 30 original products to Firestore
 */

import { syncMockProductsToFirestore } from '../src/services/syncProducts.js';

console.log('🔄 Starting product restoration...');
console.log('This will add 30 original products to Firestore');
console.log('-------------------------------------------');

syncMockProductsToFirestore()
    .then(result => {
        console.log('\n✅ SUCCESS!');
        console.log(`📦 ${result.success} products restored successfully`);
        if (result.errors > 0) {
            console.log(`⚠️ ${result.errors} products failed`);
        }
        console.log('\n✨ Products are now live in your app!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ FAILED!');
        console.error(error);
        process.exit(1);
    });
