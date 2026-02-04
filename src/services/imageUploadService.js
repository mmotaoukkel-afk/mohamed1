import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload image to Firebase Storage
 * @param {string} uri - Local file URI
 * @param {string} path - Storage path (optional, default: 'products')
 * @returns {Promise<string>} - Download URL
 */
export const uploadImage = async (uri, path = 'products') => {
    try {
        console.log('Starting upload for URI:', uri);

        // Use XMLHttpRequest to get the blob directly. 
        // This is often more reliable than fetch().blob() in React Native/Expo.
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function (e) {
                console.error('XHR Error:', e);
                reject(new TypeError('Network request failed'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });

        // Generate unique filename
        const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const storageRef = ref(storage, `${path}/${filename}`);

        console.log('Uploading to path:', storageRef.fullPath);

        // Upload without metadata to let Firebase infer type from Blob
        const result = await uploadBytes(storageRef, blob);
        console.log('Upload success, metadata:', result.metadata);

        // Clean up blob if supported
        if (blob && typeof blob.close === 'function') {
            blob.close();
        }

        const downloadURL = await getDownloadURL(storageRef);
        console.log('Download URL obtained:', downloadURL);

        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        if (error.code === 'storage/unknown') {
            console.error('This is an unknown storage error. Check your Firebase Storage Rules.');
            console.error('If you are on Web, check CORS.');
            console.error('Ensure your rules allow writes: match /{allPaths=**} { allow read, write: if true; } (for development only)');
        }
        throw error;
    }
};
