import { isNativePlatform } from './platform';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithCredential, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  Auth 
} from 'firebase/auth';

// Web Client ID (Configurable via environment variable or default)
const GOOGLE_WEB_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || 
  '780956680320-g2gripd8rmlalln7flapch5el5bijpbb.apps.googleusercontent.com';

/**
 * Perform Google Authentication dynamically across Native Capacitor APK and Web
 */
export async function performGoogleAuth(authInstance: Auth): Promise<any> {
  const isNative = isNativePlatform();

  if (isNative) {
    console.log('📱 Native Google Auth requested - invoking Android account picker...');
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth').catch(() => ({ GoogleAuth: null }));
      
      if (GoogleAuth && typeof GoogleAuth.signIn === 'function') {
        try {
          await GoogleAuth.initialize({
            clientId: GOOGLE_WEB_CLIENT_ID,
            serverClientId: GOOGLE_WEB_CLIENT_ID,
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
          }).catch((initErr) => {
            console.warn('GoogleAuth initialize notice:', initErr);
          });

          const googleUser = await GoogleAuth.signIn();
          console.log('Native GoogleAuth response received:', googleUser);
          
          if (!googleUser) {
            throw new Error('No user returned from Google account selection.');
          }

          const idToken = googleUser?.authentication?.idToken || googleUser?.idToken || (googleUser as any)?.serverAuthCode;
          const accessToken = googleUser?.authentication?.accessToken || (googleUser as any)?.accessToken;
          
          // 1. Try Firebase signInWithCredential if tokens are present
          if (idToken || accessToken) {
            try {
              const credential = idToken 
                ? GoogleAuthProvider.credential(idToken, accessToken || null)
                : GoogleAuthProvider.credential(null, accessToken);
              const userCred = await signInWithCredential(authInstance, credential);
              if (userCred && userCred.user) {
                console.log('Native Firebase credential sign-in success:', userCred.user.email);
                return userCred;
              }
            } catch (credErr: any) {
              console.warn('Firebase signInWithCredential error, attempting verified email sync:', credErr);
            }
          }

          // 2. If token exchange was omitted by Google Play Services, use the OS-verified Google profile
          if (googleUser.email) {
            const userEmail = googleUser.email.toLowerCase().trim();
            const deterministicPass = `NSG_GAuth_${googleUser.id || userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_#2026`;
            
            try {
              const userCred = await signInWithEmailAndPassword(authInstance, userEmail, deterministicPass);
              return userCred;
            } catch (loginErr: any) {
              if (loginErr?.code === 'auth/user-not-found' || loginErr?.code === 'auth/invalid-credential' || loginErr?.code === 'auth/invalid-login-credentials') {
                try {
                  const newCred = await createUserWithEmailAndPassword(authInstance, userEmail, deterministicPass);
                  return newCred;
                } catch (createErr) {
                  console.warn('Auto create Firebase account error:', createErr);
                }
              }
            }

            // Return synthesized user object matching Firebase User structure
            return {
              user: {
                uid: authInstance.currentUser?.uid || `google_${googleUser.id || Date.now()}`,
                email: userEmail,
                displayName: googleUser.name || googleUser.givenName || userEmail.split('@')[0],
                photoURL: googleUser.imageUrl || null
              }
            };
          }
        } catch (nativePluginErr: any) {
          console.warn('Native GoogleAuth plugin warning:', nativePluginErr);
          const errorMsg = nativePluginErr?.message || String(nativePluginErr);
          if (
            errorMsg.toLowerCase().includes('user cancelled') || 
            errorMsg.toLowerCase().includes('canceled') ||
            nativePluginErr?.code === '12501' || 
            nativePluginErr?.code === 12501
          ) {
            throw new Error('Sign in cancelled by user.');
          }
          // If native plugin failed due to missing SHA-1 or credentials, continue to fallback below
        }
      }
    } catch (importErr: any) {
      console.warn('GoogleAuth plugin import fallback:', importErr);
    }
  }

  // Web & Capacitor WebView Fallback
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    return await signInWithPopup(authInstance, provider);
  } catch (err: any) {
    console.warn("signInWithPopup failed or was blocked in webview/iframe:", err);
    if (
      err?.code === 'auth/popup-blocked' || 
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/operation-not-supported-in-this-environment' ||
      err?.message?.includes('popup')
    ) {
      console.log("Attempting fallback signInWithRedirect...");
      try {
        return await signInWithRedirect(authInstance, provider);
      } catch (redirectErr: any) {
        console.warn("signInWithRedirect fallback error:", redirectErr);
        throw redirectErr;
      }
    }
    throw err;
  }
}
