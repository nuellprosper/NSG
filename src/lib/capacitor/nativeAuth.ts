import { isNativePlatform } from './platform';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithCredential, Auth } from 'firebase/auth';

/**
 * Perform Google Authentication dynamically depending on Native vs Web
 */
export async function performGoogleAuth(authInstance: Auth): Promise<any> {
  const isNative = isNativePlatform();

  if (isNative) {
    console.log('📱 Native Google Auth requested - invoking OS System Account Picker...');
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth').catch(() => ({ GoogleAuth: null }));
      
      if (GoogleAuth) {
        try {
          await GoogleAuth.initialize({
            clientId: '780956680320-web-native.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
          });
        } catch (initErr) {
          console.warn('GoogleAuth initialize warning:', initErr);
        }

        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser?.authentication?.idToken || googleUser?.idToken || (googleUser as any)?.serverAuthCode;
        
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          const userCred = await signInWithCredential(authInstance, credential);
          return userCred;
        }
      }
    } catch (nativeErr: any) {
      console.warn('Native Google Auth error:', nativeErr);
      if (nativeErr?.message?.includes('user cancelled') || nativeErr?.code === '12501' || nativeErr?.code === '12500') {
        throw new Error('Sign in cancelled by user.');
      }
      // On native, do not open web popup redirect loops if user explicitly cancelled or picker opened
      throw new Error(nativeErr?.message || 'Google sign-in failed on native device.');
    }
  }

  // Web Auth (for Browser / Web Preview)
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    return await signInWithPopup(authInstance, provider);
  } catch (err: any) {
    console.warn("signInWithPopup failed or was blocked in iframe context:", err);
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
      console.log("Attempting fallback signInWithRedirect...");
      return await signInWithRedirect(authInstance, provider);
    }
    throw err;
  }
}

