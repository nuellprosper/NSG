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
 * 1. STRICT NATIVE CAPACITOR AUTH:
 *    - Never call signInWithRedirect or signInWithPopup on native Android (Capacitor.isNativePlatform()).
 *    - Await GoogleAuth.initialize() to prevent native race conditions.
 *    - Trigger native Android account picker: const googleUser = await GoogleAuth.signIn();
 *    - Extract ID Token: const idToken = googleUser.authentication.idToken;
 *    - Construct Firebase credential: const credential = GoogleAuthProvider.credential(idToken);
 *    - Authenticate silently in the background: const userCredential = await signInWithCredential(authInstance, credential);
 * 2. WEB BROWSER AUTH:
 *    - Falls back to signInWithPopup only when running on web browser.
 */
export async function performGoogleAuth(authInstance: Auth): Promise<UserCredential> {
  const isNative = typeof window !== 'undefined' && (
    Capacitor.isNativePlatform() || 
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android' ||
    (window as any)?.Capacitor?.getPlatform?.() === 'ios'
  );

  // Web Browser fallback ONLY
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

  // Strict Native Android / iOS execution path
  try {
    // 1. Explicitly await GoogleAuth.initialize() BEFORE signIn() is called
    await initGoogleAuth();

    console.log('📱 Invoking native Google Sign-In account picker...');
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    
    // 2. Call the native plugin
    const googleUser = await GoogleAuth.signIn();

    if (!googleUser || !googleUser.authentication) {
      const errMsg = 'No authentication details received from native Google Sign-In.';
      console.error(`❌ ${errMsg}`, JSON.stringify(googleUser));
      throw new Error(errMsg);
    }

    // 3. Extract the ID token
    const idToken = googleUser.authentication.idToken;
    if (!idToken) {
      const errMsg = 'Missing Google ID Token from native authentication response.';
      console.error(`❌ ${errMsg}`, JSON.stringify(googleUser));
      throw new Error(errMsg);
    }

    // 4. Create a Firebase credential
    const credential = GoogleAuthProvider.credential(idToken);

    // 5. Authenticate silently in the background
    const userCredential = await signInWithCredential(authInstance, credential);
    console.log('✅ Firebase native token exchange sign-in successful for:', userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    const fullErrorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
    console.error('❌ Native performGoogleAuth error:', fullErrorDetails);
    throw error;
  }
}
