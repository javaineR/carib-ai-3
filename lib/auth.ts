'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useFirebase } from "@/components/auth/FirebaseProvider";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Client-side authentication functions - to be used within React components
export function useAuth() {
  const { auth, db, user, loading, error, storage } = useFirebase();

  // User registration
  const registerUser = async (email: string, password: string, name: string) => {
    if (!auth || !db) {
      console.error("Firebase not initialized", { auth: !!auth, db: !!db });
      return {
        success: false,
        error: "Authentication service not available. Please try refreshing the page or clearing your browser cache.",
        code: "auth/not-initialized"
      };
    }

    try {
      console.log("Attempting to register user:", { email, name });
      
      // Firebase implementation
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User registered successfully:", user.uid);

      // Update profile with display name
      await updateProfile(user, {
        displayName: name,
      });
      console.log("User profile updated with display name");

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        name,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("User document created in Firestore");

      return { success: true, user };
    } catch (error: any) {
      console.error("Error registering user:", error);
      console.error("Error details:", { 
        code: error.code, 
        message: error.message, 
        stack: error.stack 
      });
      
      // Log additional information to help diagnose issues
      if (error.code === 'auth/configuration-not-found') {
        console.error("Firebase Auth configuration not found. This typically means:");
        console.error("1. Firebase Auth service may not be enabled in the Firebase Console");
        console.error("2. The authDomain in your configuration may be incorrect");
        console.error("3. The Firebase project may not be properly set up for web authentication");
        
        // Log environment info for debugging
        console.error("Environment info:", {
          isClient: typeof window !== 'undefined',
          nodeEnv: process.env.NODE_ENV,
          firebaseInitialized: !!auth
        });
      }
      
      // Provide more user-friendly error messages
      let errorMessage = "Failed to register user";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please try logging in instead.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/password registration is not enabled. Please contact support.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Please choose a stronger password.";
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = "Authentication service is temporarily unavailable. Please try refreshing the page or clearing your browser cache.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
  };

  // User login
  const loginUser = async (email: string, password: string) => {
    if (!auth) {
      console.error("Firebase Auth not initialized", { user, loading, error });
      return {
        success: false,
        error: "Authentication service not available. Please try refreshing the page or clearing your browser cache.",
        code: "auth/not-initialized"
      };
    }

    try {
      console.log("Attempting to log in user:", email);
      
      // Firebase implementation
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User logged in successfully:", user.uid);
      
      return { success: true, user };
    } catch (error: any) {
      console.error("Error logging in:", error);
      console.error("Error details:", { 
        code: error.code, 
        message: error.message, 
        stack: error.stack 
      });
      
      // Log additional information to help diagnose issues
      if (error.code === 'auth/configuration-not-found') {
        console.error("Firebase Auth configuration not found. This typically means:");
        console.error("1. Firebase Auth service may not be enabled in the Firebase Console");
        console.error("2. The authDomain in your configuration may be incorrect");
        console.error("3. The Firebase project may not be properly set up for web authentication");
        
        // Log environment info for debugging
        console.error("Environment info:", {
          isClient: typeof window !== 'undefined',
          nodeEnv: process.env.NODE_ENV,
          firebaseInitialized: !!auth
        });
      }

      // Provide more user-friendly error messages
      let errorMessage = "Failed to login";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later.";
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = "Authentication service is temporarily unavailable. Please try refreshing the page or clearing your browser cache.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
  };

  // User logout
  const logoutUser = async () => {
    if (!auth) {
      console.error("Firebase Auth not initialized");
      return {
        success: false,
        error: "Authentication service not available. Please try refreshing the page.",
        code: "auth/not-initialized"
      };
    }

    try {
      console.log("Attempting to log out user");
      
      // Firebase implementation
      await signOut(auth);
      console.log("User logged out successfully");
      
      return { success: true };
    } catch (error: any) {
      console.error("Error logging out:", error);
      console.error("Error details:", { 
        code: error.code, 
        message: error.message, 
        stack: error.stack 
      });
      
      return {
        success: false,
        error: "Failed to logout. Please try again.",
        code: error.code
      };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = (): boolean => {
    return user !== null;
  };

  // Get the current user
  const getCurrentUser = (): User | null => {
    return user;
  };

  // Update user profile
  const updateUserProfile = async (profileData: {
    name?: string;
    bio?: string;
    role?: string;
    institution?: string;
    profileImage?: File | null;
  }) => {
    if (!auth || !db || !user) {
      console.error("Firebase not initialized or user not logged in");
      return {
        success: false,
        error: "You must be logged in to update your profile.",
        code: "auth/not-authenticated"
      };
    }

    try {
      console.log("Updating user profile:", profileData);
      const uid = user.uid;
      const updates: any = {};
      let photoURL = user.photoURL;

      // Upload profile image if provided
      if (profileData.profileImage && storage) {
        const storageRef = ref(storage, `profile_images/${uid}`);
        await uploadBytes(storageRef, profileData.profileImage);
        photoURL = await getDownloadURL(storageRef);
        console.log("Profile image uploaded:", photoURL);
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profileData.name,
        photoURL: photoURL
      });
      console.log("Firebase Auth profile updated");

      // Prepare Firestore updates
      if (profileData.name) updates.name = profileData.name;
      if (profileData.bio) updates.bio = profileData.bio;
      if (profileData.role) updates.role = profileData.role;
      if (profileData.institution) updates.institution = profileData.institution;
      if (photoURL) updates.photoURL = photoURL;
      
      updates.updatedAt = serverTimestamp();

      // Update Firestore document
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, updates);
      console.log("Firestore user document updated");

      return { 
        success: true,
        message: "Profile updated successfully"
      };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      console.error("Error details:", { 
        code: error.code, 
        message: error.message, 
        stack: error.stack 
      });

      return {
        success: false,
        error: "Failed to update profile. Please try again.",
        code: error.code
      };
    }
  };

  return {
    user,
    loading,
    error,
    registerUser,
    loginUser,
    logoutUser,
    isAuthenticated,
    getCurrentUser,
    updateUserProfile,
  };
}

export type AuthHook = ReturnType<typeof useAuth>;