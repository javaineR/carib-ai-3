// Explicitly mark as client-side only
'use client';

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3_sMBhOQQPgnRLqgnQhIxCzYVxCuEx-k",
  authDomain: "carib-ai.firebaseapp.com",
  projectId: "carib-ai",
  storageBucket: "carib-ai.appspot.com", // Using standard appspot.com domain
  messagingSenderId: "294528335993",
  appId: "1:294528335993:web:a25c9be197d770099d94a8",
  measurementId: "G-ZZCBQS07KV"
};

// For debugging purposes
console.log("Firebase module evaluated");

// Singleton pattern for Firebase
class FirebaseClient {
  private static instance: FirebaseClient;
  private _app: FirebaseApp;
  private _auth: Auth;
  private _db: Firestore;
  private _storage: FirebaseStorage;
  private _analytics: Analytics | null = null;
  
  private constructor() {
    if (typeof window === 'undefined') {
      throw new Error('Firebase Client cannot be instantiated on the server side');
    }

    try {
      console.log("Starting Firebase client initialization");
      
      if (getApps().length === 0) {
        console.log("No Firebase apps exist, initializing new app");
        this._app = initializeApp(firebaseConfig);
      } else {
        console.log("Reusing existing Firebase app");
        this._app = getApps()[0];
      }
      
      this._auth = getAuth(this._app);
      console.log("Firebase Auth initialized");
      
      this._db = getFirestore(this._app);
      console.log("Firestore initialized");
      
      this._storage = getStorage(this._app);
      console.log("Storage initialized");
      
      if (process.env.NODE_ENV === 'production') {
        this._analytics = getAnalytics(this._app);
        console.log("Analytics initialized");
      }
      
      console.log("Firebase client successfully initialized");
    } catch (error) {
      console.error("Error initializing Firebase client:", error);
      throw error;
    }
  }
  
  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance && typeof window !== 'undefined') {
      try {
        FirebaseClient.instance = new FirebaseClient();
      } catch (error) {
        console.error("Failed to initialize Firebase client:", error);
        throw error;
      }
    }
    return FirebaseClient.instance;
  }
  
  get app(): FirebaseApp {
    return this._app;
  }
  
  get auth(): Auth {
    return this._auth;
  }
  
  get db(): Firestore {
    return this._db;
  }
  
  get storage(): FirebaseStorage {
    return this._storage;
  }
  
  get analytics(): Analytics | null {
    return this._analytics;
  }
}

// Initialize Firebase only on the client side
let firebase: {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  analytics: Analytics | null;
} = {
  app: null,
  auth: null,
  db: null,
  storage: null,
  analytics: null
};

// Only run initialization on client side and only once
if (typeof window !== 'undefined') {
  try {
    console.log("Client environment detected, initializing Firebase");
    const client = FirebaseClient.getInstance();
    firebase = {
      app: client.app,
      auth: client.auth,
      db: client.db,
      storage: client.storage,
      analytics: client.analytics
    };
    console.log("Firebase initialized and ready for use");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// We explicitly export nullable types to force proper null-checks in consuming code
export const app = firebase.app;
export const auth = firebase.auth;
export const db = firebase.db;
export const storage = firebase.storage;
export const analytics = firebase.analytics;

/**
 * Utility functions for handling Firebase offline operations
 */

// Check if we're currently offline
export const isOffline = () => {
  return typeof navigator !== 'undefined' && !navigator.onLine;
};

// Handle Firebase operation with offline fallback
export const handleFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T | (() => T),
  options?: { 
    suppressError?: boolean,
    customErrorHandler?: (error: any) => void 
  }
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // Check if this is an offline error
    const isOfflineError = 
      error.code === 'failed-precondition' || 
      error.code === 'unavailable' || 
      error.message.includes('offline') ||
      error.message.includes('network');
    
    // Log the error unless suppressed
    if (!options?.suppressError) {
      if (isOfflineError) {
        console.warn('Firebase offline error:', error.message || error);
      } else {
        console.error('Firebase operation error:', error);
      }
    }
    
    // Call custom error handler if provided
    if (options?.customErrorHandler) {
      options.customErrorHandler(error);
    }
    
    // Return the fallback
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
  }
};

// Custom error to display to users
export class FirebaseOfflineError extends Error {
  constructor(message = 'Unable to connect to the server. Please check your internet connection.') {
    super(message);
    this.name = 'FirebaseOfflineError';
  }
}

// Custom error for stale or outdated data
export class FirebaseStaleDataError extends Error {
  constructor(message = 'You are viewing cached data which may be outdated.') {
    super(message);
    this.name = 'FirebaseStaleDataError';
  }
}

