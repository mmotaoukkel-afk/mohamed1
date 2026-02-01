/**
 * Notification Diagnostic Script
 * Run with: node diagnose-notifs.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTokens() {
    console.log('🔍 Checking user_tokens collection in Firestore...');
    try {
        const snapshot = await getDocs(collection(db, 'user_tokens'));
        if (snapshot.empty) {
            console.log('❌ No tokens found! The collection is empty.');
            console.log('👉 Conclusion: No device has successfully registered yet.');
            return;
        }

        console.log(`✅ Found ${snapshot.size} registered devices:`);
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`- User: ${doc.id} | Role: ${data.role} | Device: ${data.model} (${data.platform})`);
            console.log(`  Token: ${data.token ? data.token.substring(0, 20) + '...' : 'MISSING'}`);
        });

    } catch (error) {
        console.error('Error reading tokens:', error);
    }
}

checkTokens();
