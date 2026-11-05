import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);

// Configure Google OAuth Provider with OpenID Connect & Profile Scopes
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('openid');
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the access token in memory only (never localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleAuthResult {
  user: User;
  accessToken: string;
  email: string;
  displayName: string;
  photoUrl: string;
  uid: string;
}

/**
 * Initiates the real Google Sign-In popup flow with Google Identity Services.
 * Returns verified user credentials from Google servers.
 */
export const signInWithGooglePopup = async (): Promise<GoogleAuthResult> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';
    cachedAccessToken = accessToken;

    const user = result.user;
    const email = user.email || '';
    if (!email) {
      throw new Error('Google account did not return a verified email address.');
    }

    return {
      user,
      accessToken,
      email,
      displayName: user.displayName || email.split('@')[0] || 'Cadet',
      photoUrl: user.photoURL || '',
      uid: user.uid,
    };
  } catch (error: any) {
    console.error('[Google Auth] Sign-in error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in window closed before completing Google verification.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in attempt was interrupted. Please click to try again.');
    }
    throw new Error(error.message || 'Google account verification failed.');
  } finally {
    isSigningIn = false;
  }
};

/**
 * Signs the user out of the Firebase Google session and clears the in-memory token.
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await signOut(firebaseAuth);
  } catch (err) {
    console.warn('[Google Auth] Sign out error:', err);
  } finally {
    cachedAccessToken = null;
  }
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const isGoogleConfigured = (): boolean => {
  return Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId);
};
