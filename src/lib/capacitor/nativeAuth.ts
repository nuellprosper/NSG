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
 * Initialize the native GoogleAuth plugin.
 * Can be called during app/component initialization or before sign-in.
 */
export async function initGoogleAuth(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    await GoogleAuth.initialize({
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    console.log('✅ GoogleAuth initialized successfully with client ID:', GOOGLE_WEB_CLIENT_ID);
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
  await initGoogleAuth();

  console.log('📱 Invoking native Google Sign-In account picker...');
  let googleUser: any;
  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    googleUser = await GoogleAuth.signIn();
  } catch (signInErr: any) {
    console.error('❌ Native GoogleAuth.signIn error:', signInErr);
    const msg = signInErr?.message || 'Google Sign-In was cancelled or failed to initialize.';
    if (!msg.toLowerCase().includes('cancelled') && !msg.toLowerCase().includes('canceled') && !msg.toLowerCase().includes('user cancelled')) {
      alert(`Google Sign-In Error: ${msg}`);
    }
    throw new Error(`Google Sign-In failed: ${msg}`);
  }

  console.log('✅ Native GoogleAuth response received:', googleUser);

  if (!googleUser || !googleUser.authentication) {
    const errMsg = 'No authentication details received from Google Sign-In.';
    console.error(`❌ ${errMsg}`, googleUser);
    alert(`Google Sign-In Error: ${errMsg}`);
    throw new Error(errMsg);
  }

  const idToken = googleUser.authentication.idToken;
  if (!idToken) {
    const errMsg = 'Missing Google ID Token from native authentication response. Please ensure forceCodeForRefreshToken is false and your Web Client ID / SHA-1 certificates are correctly configured in Firebase.';
    console.error(`❌ ${errMsg}`, googleUser);
    alert(`Google Authentication Error: ${errMsg}`);
    throw new Error(errMsg);
  }

  try {
    // Create Firebase Google Auth Credential using the native ID token
    const credential = GoogleAuthProvider.credential(idToken);

    // Authenticate seamlessly with Firebase
    const userCredential = await signInWithCredential(authInstance, credential);
    console.log('✅ Firebase native credential sign-in success:', userCredential.user.email);
    return userCredential;
  } catch (firebaseErr: any) {
    console.error('❌ Firebase credential sign-in error:', firebaseErr);
    const errMsg = firebaseErr?.message || 'Failed to authenticate with Firebase using Google credential.';
    alert(`Firebase Sign-In Error: ${errMsg}`);
    throw firebaseErr;
  }
}
