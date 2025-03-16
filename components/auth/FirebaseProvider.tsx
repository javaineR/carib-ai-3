'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Auth, 
  User, 
  getAuth, 
  onAuthStateChanged 
} from 'firebase/auth';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3_sMBhOQQPgnRLqgnQhIxCzYVxCuEx-k",
  authDomain: "carib-ai.firebaseapp.com",
  projectId: "carib-ai",
  storageBucket: "carib-ai.appspot.com", // Using standard appspot.com domain
  messagingSenderId: "294528335993",
  appId: "1:294528335993:web:a25c9be197d770099d94a8",
  measurementId: "G-ZZCBQS07KV"
};

// Firebase context type
interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  analytics: Analytics | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// Create the Firebase context
const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
  storage: null,
  analytics: null,
  user: null,
  loading: true,
  error: null
});

// Hook to use Firebase context
export const useFirebase = () => useContext(FirebaseContext);

// This ensures Firebase is only initialized once across components
let firebaseInitialized = false;
let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: FirebaseStorage | null = null;
let cachedAnalytics: Analytics | null = null;

// Firebase Provider Component
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Initialize Firebase
  useEffect(() => {
    // Skip initialization if not hydrated yet or if not on client
    if (!hydrated || typeof window === 'undefined') {
      console.log('Skipping Firebase initialization: ', 
        !hydrated ? 'Not hydrated yet' : 'Not on client side');
      return;
    }
    
    if (firebaseInitialized) {
      console.log('Using cached Firebase instances');
      setFirebaseApp(cachedApp);
      setAuth(cachedAuth);
      setDb(cachedDb);
      setStorage(cachedStorage);
      setAnalytics(cachedAnalytics);
      
      // Still need to set up auth state listener
      if (cachedAuth) {
        const unsubscribe = onAuthStateChanged(cachedAuth, (user) => {
          setUser(user);
          setLoading(false);
          console.log('Auth state updated from cached instance:', user ? 'User logged in' : 'No user');
        });
        
        return unsubscribe;
      }
      
      setLoading(false);
      return;
    }
    
    // Define an async function for Firebase initialization
    const initializeFirebase = async () => {
      console.log('Starting Firebase initialization...');
      console.log('Next.js environment:', process.env.NODE_ENV);
      console.log('Is browser:', typeof window !== 'undefined');
      
      try {
        // Initialize Firebase if not already initialized
        let app: FirebaseApp;
        if (!getApps().length) {
          console.log('Creating new Firebase app instance with config:', {
            apiKey: firebaseConfig.apiKey ? 'VALID' : 'MISSING',
            projectId: firebaseConfig.projectId ? 'VALID' : 'MISSING',
            authDomain: firebaseConfig.authDomain ? 'VALID' : 'MISSING',
            // Log other config values similarly
          });
          app = initializeApp(firebaseConfig);
        } else {
          console.log('Reusing existing Firebase app instance');
          app = getApps()[0];
        }
        
        // Initialize services with explicit error handling
        console.log('Initializing Firebase Auth...');
        const authInstance = getAuth(app);
        console.log('Firebase Auth initialized successfully.');
        
        console.log('Initializing Firestore...');
        const dbInstance = getFirestore(app);
        
        // Enable offline persistence for Firestore
        try {
          // Enable offline data persistence
          await enableIndexedDbPersistence(dbInstance);
          console.log('Firestore offline persistence enabled successfully.');
        } catch (err: any) {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.warn('Firestore persistence failed: Multiple tabs open');
          } else if (err.code === 'unimplemented') {
            // The current browser doesn't support offline persistence
            console.warn('Firestore persistence not supported by this browser');
          } else {
            console.error('Error enabling Firestore persistence:', err);
          }
        }
        
        console.log('Firestore initialized successfully.');
        
        console.log('Initializing Storage...');
        const storageInstance = getStorage(app);
        console.log('Storage initialized successfully.');
        
        // Only initialize analytics in production and on client side
        let analyticsInstance: Analytics | null = null;
        if (process.env.NODE_ENV === 'production') {
          console.log('Initializing Analytics...');
          analyticsInstance = getAnalytics(app);
          console.log('Analytics initialized successfully.');
        }
        
        // Cache the instances
        cachedApp = app;
        cachedAuth = authInstance;
        cachedDb = dbInstance;
        cachedStorage = storageInstance;
        cachedAnalytics = analyticsInstance;
        firebaseInitialized = true;
        
        // Set state
        setFirebaseApp(app);
        setAuth(authInstance);
        setDb(dbInstance);
        setStorage(storageInstance);
        setAnalytics(analyticsInstance);
        
        console.log('All Firebase services initialized successfully.');
        
        // Monitor auth state
        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
          setUser(user);
          setLoading(false);
          console.log('Auth state updated:', user ? 'User logged in' : 'No user');
        });
        
        // Return unsubscribe function for cleanup
        return unsubscribe;
      } catch (error: any) {
        console.error('Error initializing Firebase:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        setError(error);
        setLoading(false);
        return undefined;
      }
    };
    
    // Call the async initialization function
    let unsubscribe: (() => void) | undefined;
    initializeFirebase().then(cleanup => {
      unsubscribe = cleanup;
    });
    
    // Return cleanup function
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [hydrated]);

  const value = {
    app: firebaseApp,
    auth,
    db,
    storage,
    analytics,
    user,
    loading,
    error
  };

  // Don't render children until hydrated to prevent hydration mismatch
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export default FirebaseProvider; 