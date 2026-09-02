import { Capacitor } from '@capacitor/core';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithPopup,
  UserCredential,
  Auth 
} from 'firebase/auth';

export const GOOGLE_WEB_CLIENT_ID = '780956680320-g2gripd8rmlalln7flapch5el5bijpbb.apps.googleusercontent.com';

let isGoogleAuthInitialized = false;

/**
 * Initialize the GoogleAuth plugin.
 * Explicitly initializes with clientId, serverClientId, and scopes, and ensures it is awaited.
 */
export async function initGoogleAuth(): Promise<void> {
  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    await (GoogleAuth.initialize as any)({
      clientId: GOOGLE_WEB_CLIENT_ID,
      serverClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
      forceCodeForRefreshToken: true
    });
    isGoogleAuthInitialized = true;
    console.log('✅ GoogleAuth initialized successfully with serverClientId:', GOOGLE_WEB_CLIENT_ID);
  } catch (error) {
    const errString = JSON.stringify(error, Object.getOwnPropertyNames(error));
    console.warn('⚠️ GoogleAuth initialize note:', errString);
  }
}

/**
 * Perform Google Authentication flow:
 * - Native Android APK: Explicitly awaits GoogleAuth.initialize() BEFORE calling GoogleAuth.signIn(),
 *   extracts the ID token, and authenticates with Firebase via signInWithCredential.
 * - Web / Browser: Uses signInWithPopup.
 * - Wraps the entire flow in a robust try/catch that logs stringified errors to prevent unhandled native crashes.
 */
export async function performGoogleAuth(authInstance: Auth): Promise<UserCredential> {
  const isNative = typeof window !== 'undefined' && (
    Capacitor.isNativePlatform() || 
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android' ||
    (window as any)?.Capacitor?.getPlatform?.() === 'ios'
  );

  if (!isNative) {
    console.log('🌐 Web platform detected: Using Firebase signInWithPopup...');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return await signInWithPopup(authInstance, provider);
    } catch (popupErr: any) {
      const errStr = JSON.stringify(popupErr, Object.getOwnPropertyNames(popupErr));
      console.error('❌ Web Google sign-in error:', errStr);
      throw popupErr;
    }
  }

  // Native Android / iOS execution path
  try {
    // 1. Explicitly await GoogleAuth.initialize() BEFORE signIn() is ever called
    await initGoogleAuth();

    console.log('📱 Invoking native Google Sign-In account picker...');
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    
    let googleUser: any = null;
    try {
      googleUser = await GoogleAuth.signIn();
    } catch (signInErr: any) {
      const stringifiedErr = JSON.stringify(signInErr, Object.getOwnPropertyNames(signInErr));
      console.error('❌ Native GoogleAuth.signIn error details:', stringifiedErr);
      
      const msg = signInErr?.message || String(signInErr);
      const isCancelled = msg.toLowerCase().includes('cancelled') || 
                          msg.toLowerCase().includes('canceled') || 
                          msg.toLowerCase().includes('user cancelled') ||
                          msg.toLowerCase().includes('12501'); // 12501 = Google Sign-In Cancelled

      if (!isCancelled) {
        console.warn('⚠️ Native account picker failed, attempting fallback to web popup...');
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          return await signInWithPopup(authInstance, provider);
        } catch (fallbackPopupErr: any) {
          const fallbackErrStr = JSON.stringify(fallbackPopupErr, Object.getOwnPropertyNames(fallbackPopupErr));
          console.error('❌ Fallback web popup error details:', fallbackErrStr);
        }
      }
      
      throw new Error(isCancelled ? 'Sign-in cancelled' : `Google Sign-In error: ${msg}`);
    }

    console.log('✅ Native GoogleAuth response received:', googleUser ? 'User credentials present' : 'Empty response');

    if (!googleUser || !googleUser.authentication) {
      const errMsg = 'No authentication details received from Google Sign-In.';
      console.error(`❌ ${errMsg}`, JSON.stringify(googleUser));
      throw new Error(errMsg);
    }

    const idToken = googleUser.authentication.idToken;
    if (!idToken) {
      const errMsg = 'Missing Google ID Token from native authentication response.';
      console.error(`❌ ${errMsg}`, JSON.stringify(googleUser));
      throw new Error(errMsg);
    }

    // Authenticate with Firebase using the Google ID token
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(authInstance, credential);
    console.log('✅ Firebase native credential sign-in success for:', userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    const fullErrorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
    console.error('❌ performGoogleAuth top-level handled error:', fullErrorDetails);
    throw error;
  }
}
