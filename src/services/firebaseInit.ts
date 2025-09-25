import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebase.config';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase App
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  console.log('Firebase initialization error:', error.message);
  // If already initialized, this is fine
  if (error.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'yatra-app');
  }
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set authentication persistence based on platform
if (Platform.OS === 'web') {
  // For web, use browser local storage persistence
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Auth persistence set to localStorage for web');
    })
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
} else {
  // For React Native, Firebase Auth automatically persists
  // But we can ensure it's enabled
  console.log('Firebase initialized for:', Platform.OS);
  console.log('Auth persistence is automatic on mobile');
}

export default app;
