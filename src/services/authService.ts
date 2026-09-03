import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export interface StoredOtpRecord {
  email: string;
  otp: string;
  expiresAt: number; // Unix timestamp in milliseconds (Date.now() + 5 * 60 * 1000)
  type: 'signup' | 'forgot-password' | 'profile-change' | string;
  createdAt: number;
  verified?: boolean;
}

const LOCAL_STORAGE_OTP_KEY = 'nsg_active_otp_session';
export const OTP_EXPIRATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Gets the secure app secret used to authenticate requests to the serverless relay
 */
export function getAppSecret(): string {
  const envSecret = 
    (import.meta as any).env?.VITE_NSG_APP_SECRET || 
    (import.meta as any).env?.NSG_APP_SECRET;
  if (envSecret && String(envSecret).trim()) {
    return String(envSecret).trim();
  }
  return 'nsg-super-secure-app-secret-2026';
}

/**
 * Resolves the absolute backend API base URL for CapacitorHttp requests
 */
export function resolveApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const customUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_SERVER_URL;
    if (customUrl && String(customUrl).trim()) {
      return `${String(customUrl).trim().replace(/\/$/, '')}${cleanPath}`;
    }

    const origin = window.location.origin;
    // On web browser (non-file/non-capacitor origin), relative or origin is fine
    if (origin && !origin.includes('localhost:5173') && !origin.startsWith('capacitor://') && !origin.startsWith('ionic://')) {
      return `${origin.replace(/\/$/, '')}${cleanPath}`;
    }
  }

  // Fallback to active app domain for Android APK native HTTP requests
  const fallbackHost = (import.meta as any).env?.VITE_APP_URL || 'https://ais-dev-rumylq2hbsylarrx6vsq5h-648855362704.europe-west2.run.app';
  return `${fallbackHost.replace(/\/$/, '')}${cleanPath}`;
}

/**
 * Generates a cryptographically randomized 6-digit numeric OTP code
 */
export function generateOTP(): string {
  // 6-digit number between 100000 and 999999
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const code = 100000 + (array[0] % 900000);
    return code.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Stores an OTP session with a strict 5-minute expiration timestamp
 */
export async function storeOtpSession(email: string, otp: string, type: 'signup' | 'forgot-password' | 'profile-change' | string): Promise<StoredOtpRecord> {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + OTP_EXPIRATION_WINDOW_MS;
  const record: StoredOtpRecord = {
    email: normalizedEmail,
    otp: otp.trim(),
    expiresAt,
    type,
    createdAt: Date.now(),
    verified: false
  };

  // 1. Store in client-side persistence (failsafe & fast)
  try {
    localStorage.setItem(LOCAL_STORAGE_OTP_KEY, JSON.stringify(record));
  } catch (e) {
    console.warn('[authService] Failed to cache OTP locally:', e);
  }

  // 2. Integrate with Firestore database if online & available
  try {
    const docId = normalizedEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    await setDoc(doc(db, 'otps', docId), {
      email: normalizedEmail,
      otp: otp.trim(),
      expiresAt,
      type,
      verified: false,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`🔒 [authService] OTP session synced with Firestore for ${normalizedEmail}. Expires in 5 minutes.`);
  } catch (err) {
    // Non-blocking in case user is not logged in or offline; local storage handles verification
    console.warn('[authService] Firestore OTP sync note (non-blocking):', err);
  }

  return record;
}

/**
 * Retrieves the active stored OTP record for an email
 */
export async function getStoredOtp(email: string): Promise<StoredOtpRecord | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check local storage first
  try {
    const localRaw = localStorage.getItem(LOCAL_STORAGE_OTP_KEY);
    if (localRaw) {
      const parsed: StoredOtpRecord = JSON.parse(localRaw);
      if (parsed.email === normalizedEmail) {
        return parsed;
      }
    }
  } catch (e) {}

  // Check Firestore fallback
  try {
    const docId = normalizedEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    const snap = await getDoc(doc(db, 'otps', docId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        email: data.email,
        otp: data.otp,
        expiresAt: data.expiresAt,
        type: data.type,
        createdAt: data.createdAt || Date.now(),
        verified: data.verified
      };
    }
  } catch (e) {}

  return null;
}

/**
 * 5-MINUTE EXPIRATION HANDLER & VERIFICATION
 * Validates the user's submitted OTP against expiration and code accuracy.
 */
export async function verifyOTP(
  email: string, 
  submittedCode: string, 
  expectedType?: string
): Promise<{ valid: boolean; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = String(submittedCode || '').trim();

  if (!cleanCode) {
    return { valid: false, error: 'Please enter the 6-digit verification code.' };
  }

  const record = await getStoredOtp(cleanEmail);

  if (!record) {
    return { valid: false, error: 'No verification code found for this email. Please request a new code.' };
  }

  // Check 5-minute expiration timestamp
  const currentTime = Date.now();
  if (currentTime > record.expiresAt) {
    console.warn(`⏳ [authService] OTP Expired for ${cleanEmail}. Expired ${Math.round((currentTime - record.expiresAt) / 1000)}s ago.`);
    return { 
      valid: false, 
      error: 'OTP Expired. Verification codes are only valid for 5 minutes. Please request a new code.' 
    };
  }

  // Check type if specified
  if (expectedType && record.type && record.type !== expectedType) {
    console.warn(`⚠️ [authService] OTP type mismatch: expected ${expectedType}, got ${record.type}`);
  }

  // Check code match
  if (cleanCode !== record.otp) {
    return { 
      valid: false, 
      error: 'Incorrect verification code. Please check your email and try again.' 
    };
  }

  // Mark as verified & clean up
  try {
    record.verified = true;
    localStorage.removeItem(LOCAL_STORAGE_OTP_KEY);
    const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    await setDoc(doc(db, 'otps', docId), { verified: true, verifiedAt: serverTimestamp() }, { merge: true }).catch(() => {});
  } catch (e) {}

  console.log(`✅ [authService] OTP successfully verified for ${cleanEmail}`);
  return { valid: true };
}

/**
 * FRONTEND DISPATCHER: Dispatches an OTP via /api/send-otp using CapacitorHttp.post
 */
export async function sendOtpEmail(
  email: string,
  type: 'signup' | 'forgot-password' | 'profile-change' = 'signup'
): Promise<{ success: boolean; otp?: string; expiresAt?: number; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  // 1. Generate 6-digit OTP & store with 5-minute expiration
  const code = generateOTP();
  const record = await storeOtpSession(cleanEmail, code, type);

  // 2. Dispatch to /api/send-otp via CapacitorHttp.post
  const targetUrl = resolveApiUrl('/api/send-otp');
  const appSecret = getAppSecret();

  console.log(`🚀 [authService] Sending OTP to ${cleanEmail} via backend relay: ${targetUrl}`);

  try {
    const response = await CapacitorHttp.post({
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-app-secret': appSecret,
        'x-nsg-secret': appSecret
      },
      data: {
        email: cleanEmail,
        otp: code,
        type
      }
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`🎉 [authService] OTP email transmitted successfully to ${cleanEmail}`);
      return { 
        success: true, 
        otp: code, 
        expiresAt: record.expiresAt 
      };
    } else {
      const errorMsg = response.data?.error || `Server responded with status ${response.status}`;
      console.error(`❌ [authService] /api/send-otp returned error:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ [authService] CapacitorHttp dispatch failed:`, message);

    // If fetch fallback on browser
    if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
      try {
        console.log('🔄 Attempting browser fetch fallback to /api/send-otp...');
        const fetchRes = await fetch('/api/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-secret': appSecret
          },
          body: JSON.stringify({ email: cleanEmail, otp: code, type })
        });
        const resData = await fetchRes.json();
        if (fetchRes.ok && resData.success) {
          return { success: true, otp: code, expiresAt: record.expiresAt };
        }
        return { success: false, error: resData.error || 'Failed to send OTP' };
      } catch (fetchErr: any) {
        return { success: false, error: fetchErr.message || 'Network error sending verification code' };
      }
    }

    return { 
      success: false, 
      error: `Network error sending verification code: ${message}` 
    };
  }
}

/**
 * ADMIN GOD MODE DISPATCHER: Dispatches a custom branded email via /api/send-custom
 */
export async function sendCustomAdminEmail(
  toEmail: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cleanEmail = toEmail.toLowerCase().trim();
  const cleanSubject = String(subject || '').trim();
  const cleanBody = String(htmlBody || '').trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid recipient email address is required.' };
  }
  if (!cleanSubject) {
    return { success: false, error: 'Email subject is required.' };
  }
  if (!cleanBody) {
    return { success: false, error: 'Email message content is required.' };
  }

  const targetUrl = resolveApiUrl('/api/send-custom');
  const appSecret = getAppSecret();

  console.log(`🚀 [authService] Dispatching custom admin email to ${cleanEmail} via: ${targetUrl}`);

  try {
    const response = await CapacitorHttp.post({
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-app-secret': appSecret,
        'x-nsg-secret': appSecret
      },
      data: {
        toEmail: cleanEmail,
        subject: cleanSubject,
        htmlBody: cleanBody
      }
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`🎉 [authService] Custom admin email successfully sent to ${cleanEmail}`);
      return { 
        success: true, 
        messageId: response.data?.messageId 
      };
    } else {
      const errorMsg = response.data?.error || `Server responded with status ${response.status}`;
      console.error(`❌ [authService] /api/send-custom returned error:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ [authService] CapacitorHttp custom email dispatch failed:`, message);

    // Browser fetch fallback
    if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
      try {
        const fetchRes = await fetch('/api/send-custom', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-secret': appSecret
          },
          body: JSON.stringify({ toEmail: cleanEmail, subject: cleanSubject, htmlBody: cleanBody })
        });
        const resData = await fetchRes.json();
        if (fetchRes.ok && resData.success) {
          return { success: true, messageId: resData.messageId };
        }
        return { success: false, error: resData.error || 'Failed to dispatch custom email' };
      } catch (fetchErr: any) {
        return { success: false, error: fetchErr.message || 'Network error sending custom email' };
      }
    }

    return { 
      success: false, 
      error: `Network error sending custom email: ${message}` 
    };
  }
}
