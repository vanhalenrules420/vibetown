import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration object goes here
// Replace this placeholder with your actual config when you provide it
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
const analytics = getAnalytics(app);

// Get Auth and Firestore instances
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore, analytics };
