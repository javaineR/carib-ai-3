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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
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
      return;
    }
    
    if (firebaseInitialized) {
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
        });
        
        return unsubscribe;
      }
      
      setLoading(false);
      return;
    }
    
    // Define an async function for Firebase initialization
    const initializeFirebase = async () => {
      try {
        // Initialize Firebase if not already initialized
        let app: FirebaseApp;
        if (!getApps().length) {
          app = initializeApp(firebaseConfig);
        } else {
          app = getApps()[0];
        }
        
        // Initialize services with explicit error handling
        const authInstance = getAuth(app);
        
        // Initialize Firestore
        const dbInstance = getFirestore(app);
        
        // Enable offline persistence for Firestore
        try {
          // Enable offline data persistence
          await enableIndexedDbPersistence(dbInstance);
        } catch (err: any) {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
          } else if (err.code === 'unimplemented') {
            // The current browser doesn't support offline persistence
          } else {
          }
        }
        
        console.log('Firestore initialized successfully.');
        
        console.log('Initializing Storage...');
        const storageInstance = getStorage(app);
        console.log('Storage initialized successfully.');
        
        // Only initialize analytics in production and on client side
        let analyticsInstance: Analytics | null = null;
        if (process.env.NODE_ENV === 'production') {
          analyticsInstance = getAnalytics(app);
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
        
        // Monitor auth state
        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
          setUser(user);
          setLoading(false);
        });
        
        // Return unsubscribe function for cleanup
        return unsubscribe;
      } catch (error: any) {
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