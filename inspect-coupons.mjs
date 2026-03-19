import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Load firebase config from the project
const configContent = readFileSync('./src/services/firebaseConfig.js', 'utf8');
const configMatch = configContent.match(/const firebaseConfig = ({[\s\S]+?});/);
if (!configMatch) {
    console.error('Could not find firebaseConfig in src/services/firebaseConfig.js');
    process.exit(1);
}

const firebaseConfig = JSON.parse(configMatch[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectCoupons() {
    console.log('--- Inspecting Coupons ---');
    const snapshot = await getDocs(collection(db, 'coupons'));
    console.log(`Total Coupons: ${snapshot.docs.length}`);

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id} | Code: ${data.code} | CreatedAt: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 'N/A'}`);
    });
    console.log('--- End of Inspection ---');
}

inspectCoupons().catch(console.error);
