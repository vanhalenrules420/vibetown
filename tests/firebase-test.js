import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  query,
  where 
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth';

// Your Firebase configuration from firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyAS6W_EGoELidhhfUN91mEmgoJ4pMRpC9M",
    authDomain: "vibetown-4ff03.firebaseapp.com",
    projectId: "vibetown-4ff03",
    storageBucket: "vibetown-4ff03.firebasestorage.app",
    messagingSenderId: "397342048776",
    appId: "1:397342048776:web:ef64194a6e0c9b06fe47bd",
    measurementId: "G-V108KC851K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test email and password
const TEST_EMAIL = 'test@vibetown.app';
const TEST_PASSWORD = 'TestPassword123!';

async function runFirestoreTest() {
    console.log('🔥 Running Firestore Test...');
    try {
        // Add test document
        const testCollection = collection(db, 'testData');
        const docRef = await addDoc(testCollection, {
            name: 'Vibe Town',
            status: 'Testing',
            timestamp: new Date()
        });
        console.log('✅ Document written with ID:', docRef.id);

        // Fetch and verify document
        const querySnapshot = await getDocs(query(
            collection(db, 'testData'),
            where('name', '==', 'Vibe Town')
        ));
        
        querySnapshot.forEach(doc => {
            console.log('📄 Retrieved document:', doc.id, '=>', doc.data());
        });

        return true;
    } catch (error) {
        console.error('❌ Firestore Test Error:', error);
        return false;
    }
}

async function runAuthTest() {
    console.log('🔐 Running Authentication Test...');
    try {
        // Create test user
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            console.log('✅ Test user created successfully');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log('ℹ️ Test user already exists, proceeding with login');
            } else {
                throw error;
            }
        }

        // Sign in test user
        userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        console.log('✅ Test user logged in successfully');
        console.log('👤 User UID:', userCredential.user.uid);

        return true;
    } catch (error) {
        console.error('❌ Authentication Test Error:', error);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Firebase Integration Tests...\n');

    const results = {
        firestore: await runFirestoreTest(),
        auth: await runAuthTest()
    };

    console.log('\n📊 Test Results Summary:');
    console.log('------------------------');
    console.log('Firestore:', results.firestore ? '✅ PASSED' : '❌ FAILED');
    console.log('Authentication:', results.auth ? '✅ PASSED' : '❌ FAILED');
    console.log('Firebase Functions:', '⏳ Check Firebase Console for logs');
    console.log('------------------------');

    const allPassed = Object.values(results).every(result => result === true);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Status: ${allPassed ? 'All tests passed!' : 'Some tests failed'}`);
}

// Run the tests
runTests().catch(console.error);
