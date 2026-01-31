/**
 * Sync Mock Products to Firestore
 * Run this once to upload all mock products to Firestore
 */

import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { MOCK_PRODUCTS } from './mockData';

const PRODUCTS_COLLECTION = 'products';

/**
 * Upload all mock products to Firestore
 * This transforms the mock data format to Firestore format
 */

const getCategorySlug = (categories) => {
    const catNames = categories.map(c => c.name);
    // Specific checks first
    if (catNames.some(c => c.includes('سيروم') || c.includes('السيروم'))) return 'serum';
    if (catNames.some(c => c.includes('شمس') || c.includes('واقي'))) return 'sunscreen';
    if (catNames.some(c => c.includes('تونر'))) return 'toner';
    if (catNames.some(c => c.includes('ماسك'))) return 'mask';
    if (catNames.some(c => c.includes('عين') || c.includes('العين'))) return 'eyecare';
    if (catNames.some(c => c.includes('شعر') || c.includes('الشعر'))) return 'haircare';
    if (catNames.some(c => c.includes('حب الشباب'))) return 'acne';
    if (catNames.some(c => c.includes('تجاعيد') || c.includes('شيخوخة'))) return 'antiaging';
    if (catNames.some(c => c.includes('مسحات'))) return 'pads';
    if (catNames.some(c => c.includes('مكياج') || c.includes('المكياج'))) return 'makeup';
    if (catNames.some(c => c.includes('غسول') || c.includes('منظفات'))) return 'cleanser';
    if (catNames.some(c => c.includes('مرطب'))) return 'moisturizer';

    // Fallback
    return 'skincare';
};

export const syncMockProductsToFirestore = async () => {
    try {
        console.log('🔄 Starting sync of mock products to Firestore...');

        let successCount = 0;
        let errorCount = 0;

        for (const product of MOCK_PRODUCTS) {
            try {
                // Transform mock product to Firestore format
                const firestoreProduct = {
                    name: product.name,
                    description: product.description || '',
                    price: parseFloat(product.price) || 0,
                    compareAtPrice: parseFloat(product.regular_price) || 0,
                    salePrice: product.on_sale ? parseFloat(product.sale_price || product.price) : null,
                    onSale: product.on_sale || false,
                    stock: product.stock_status === 'instock' ? 50 : 0, // Default 50 stock if in stock
                    lowStockThreshold: 5,
                    category: getCategorySlug(product.categories || []),
                    tags: product.categories?.map(c => c.name) || [],
                    images: product.images?.map(img => img.src) || [],
                    status: 'active',
                    isPublished: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                };

                await addDoc(collection(db, PRODUCTS_COLLECTION), firestoreProduct);
                successCount++;
                console.log(`✅ Uploaded: ${product.name}`);
            } catch (err) {
                errorCount++;
                console.error(`❌ Failed to upload ${product.name}:`, err);
            }
        }

        console.log(`\n📊 Sync Complete:`);
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);

        return { success: successCount, errors: errorCount };
    } catch (error) {
        console.error('❌ Sync failed:', error);
        throw error;
    }
};

/**
 * Clear all products from Firestore
 * WARNING: This will delete ALL products!
 */
export const clearAllProducts = async () => {
    try {
        console.log('🗑️ Clearing all products from Firestore...');

        const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
        let count = 0;

        for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, PRODUCTS_COLLECTION, docSnap.id));
            count++;
        }

        console.log(`✅ Deleted ${count} products`);
        return count;
    } catch (error) {
        console.error('❌ Clear failed:', error);
        throw error;
    }
};

/**
 * Check how many products exist in Firestore
 */
export const getProductCount = async () => {
    try {
        const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
        return snapshot.size;
    } catch (error) {
        console.error('Error getting count:', error);
        return 0;
    }
};
