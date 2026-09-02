import { Capacitor } from '@capacitor/core';
import { isNativePlatform } from './platform';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithPopup,
  UserCredential,
  Auth 
} from 'firebase/auth';

export const GOOGLE_WEB_CLIENT_ID = '780956680320-g2gripd8rmlalln7flapch5el5bijpbb.apps.googleusercontent.com';

/**
 * Initialize the GoogleAuth plugin.
 * On Android/iOS (Capacitor.isNativePlatform()), DO NOT call GoogleAuth.initialize() with a config object,
 * as it overrides strings.xml and causes a Code 10 error.
 * Just log that native auto-init is used.
 * If the platform is Web, call it with the clientId and scopes.
 */
export async function initGoogleAuth(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      console.log('✅ Native GoogleAuth: Using native auto-init from strings.xml (no config object passed to prevent Code 10 error)');
      return;
    }

    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    await GoogleAuth.initialize({
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    console.log('✅ Web GoogleAuth initialized successfully with client ID:', GOOGLE_WEB_CLIENT_ID);
  } catch (error) {
    console.warn('⚠️ GoogleAuth initialize note:', error);
  }
}

/**
 * Perform Google Authentication flow:
 * - Native Android APK: Uses @codetrix-studio/capacitor-google-auth account picker + signInWithCredential.
 * - Web / Browser Preview: Uses signInWithPopup to ensure seamless operation in web environments.
 */
export async function performGoogleAuth(authInstance: Auth): Promise<UserCredential> {
  if (!isNativePlatform()) {
    console.log('🌐 Web platform detected: Using Firebase signInWithPopup...');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(authInstance, provider);
  }

  // Native Android flow
  try {
    await initGoogleAuth();

    console.log('📱 Invoking native Google Sign-In account picker...');
    let googleUser: any = null;
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      googleUser = await GoogleAuth.signIn();
    } catch (signInErr: any) {
      console.error('❌ Native GoogleAuth.signIn error:', signInErr);
      const msg = signInErr?.message || String(signInErr);
      const isCancelled = msg.toLowerCase().includes('cancelled') || 
                          msg.toLowerCase().includes('canceled') || 
                          msg.toLowerCase().includes('user cancelled') ||
                          msg.toLowerCase().includes('12501'); // 12501 is Google sign-in cancelled code

      if (!isCancelled) {
        console.warn('⚠️ Native sign in failed, trying fallback to web popup...');
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          return await signInWithPopup(authInstance, provider);
        } catch (popupErr) {
          console.error('Fallback web popup error:', popupErr);
        }
      }
      throw new Error(isCancelled ? 'Sign-in cancelled' : `Google Sign-In failed: ${msg}`);
    }

    console.log('✅ Native GoogleAuth response received:', googleUser);

    if (!googleUser || !googleUser.authentication) {
      const errMsg = 'No authentication details received from Google Sign-In.';
      console.error(`❌ ${errMsg}`, googleUser);
      throw new Error(errMsg);
    }

    const idToken = googleUser.authentication.idToken;
    if (!idToken) {
      const errMsg = 'Missing Google ID Token from native authentication response. Please verify client configuration.';
      console.error(`❌ ${errMsg}`, googleUser);
      throw new Error(errMsg);
    }

    // Create Firebase Google Auth Credential using the native ID token
    const credential = GoogleAuthProvider.credential(idToken);

    // Authenticate seamlessly with Firebase
    const userCredential = await signInWithCredential(authInstance, credential);
    console.log('✅ Firebase native credential sign-in success:', userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    console.error('❌ performGoogleAuth top-level error:', error);
    throw error;
  }
}
