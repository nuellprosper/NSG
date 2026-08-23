import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  UserCredential,
  Auth 
} from 'firebase/auth';

export const GOOGLE_WEB_CLIENT_ID = '780956680320-g2gripd8rmlalln7flapch5el5bijpbb.apps.googleusercontent.com';

/**
 * Initialize the native GoogleAuth plugin.
 * Can be called during app/component initialization or before sign-in.
 */
export async function initGoogleAuth(): Promise<void> {
  try {
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
 * Perform Native Google Authentication flow:
 * 1. Initializes GoogleAuth if not already initialized.
 * 2. Triggers the native Android account picker via GoogleAuth.signIn().
 * 3. Extracts the idToken from the plugin response (googleUser.authentication.idToken).
 * 4. Creates a Firebase credential using GoogleAuthProvider.credential(idToken).
 * 5. Authenticates seamlessly into Firebase using signInWithCredential(auth, credential).
 */
export async function performGoogleAuth(authInstance: Auth): Promise<UserCredential> {
  // Ensure plugin is initialized
  await initGoogleAuth();

  console.log('📱 Invoking native Google Sign-In account picker...');
  const googleUser = await GoogleAuth.signIn();
  console.log('✅ Native GoogleAuth response received for:', googleUser?.email);

  if (!googleUser || !googleUser.authentication) {
    throw new Error('No authentication details received from Google Sign-In.');
  }

  const idToken = googleUser.authentication.idToken;
  if (!idToken) {
    throw new Error('Missing Google ID Token from native authentication response.');
  }

  // Create Firebase Google Auth Credential using the native ID token
  const credential = GoogleAuthProvider.credential(idToken);

  // Authenticate seamlessly with Firebase
  const userCredential = await signInWithCredential(authInstance, credential);
  console.log('✅ Firebase native credential sign-in success:', userCredential.user.email);

  return userCredential;
}
