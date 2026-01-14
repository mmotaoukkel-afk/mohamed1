/**
 * Debug Script - Extract Product Images from Favorites
 * Run this in your app to see the product image URLs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const extractFavoriteImages = async (userEmail) => {
    try {
        const key = `@kataraa_favorites_${userEmail.toLowerCase()}`;
        const saved = await AsyncStorage.getItem(key);

        if (saved) {
            const favorites = JSON.parse(saved);
            console.log('=== FAVORITE PRODUCTS ===');
            favorites.forEach((product, index) => {
                console.log(`\n${index + 1}. ${product.name}`);
                console.log(`   ID: ${product.id}`);
                console.log(`   Price: ${product.price}`);
                console.log(`   Image: ${product.image || product.images?.[0]?.src}`);
            });
            return favorites;
        }

        console.log('No favorites found');
        return [];
    } catch (error) {
        console.error('Error extracting favorites:', error);
        return [];
    }
};

// To use in your app:
// import { extractFavoriteImages } from './src/debug/extractImages';
// extractFavoriteImages('your-email@gmail.com');
