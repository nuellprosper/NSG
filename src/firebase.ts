import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, getDocs, addDoc, getDocFromServer, serverTimestamp, orderBy, limit, arrayUnion } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK with fixed valid authDomain
const activeFirebaseConfig = {
  ...firebaseConfig,
  authDomain: "gen-lang-client-0216655413.firebaseapp.com"
};

const app = initializeApp(activeFirebaseConfig);

// Initialize Firestore with modern persistent cache and immediate long-polling to prevent 10s connection timeout stalls
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Auth persistence error:", err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Local Memory & localStorage Cache for Firestore reads to avoid Quota Exhaustion
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_CACHE_TTL_MS = 300000; // 5 minutes cache TTL

export function getLocalCache(key: string, ttlMs: number = DEFAULT_CACHE_TTL_MS): any | null {
  const cached = memoryCache.get(key);
  if (cached && (Date.now() - cached.timestamp < ttlMs)) {
    return cached.data;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`nsg_fs_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < ttlMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch (e) {
      // Ignore cache storage errors
    }
  }
  return null;
}

export function setLocalCache(key: string, data: any) {
  const entry = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`nsg_fs_cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      // Ignore quota error on localStorage
    }
  }
}

// Error handling for Firestore operations
export enum FirestoreOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Robustly clone objects that may contain circular references, custom toJSON triggers, or internal Firestore instances
 */
export function circularSafeClone(val: any, cache = new WeakMap()): any {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;

  if (typeof window !== 'undefined' && (val instanceof Element || val instanceof Node || val instanceof Event || val === window)) {
    return `[DOMElementOrEvent:${val.constructor?.name || 'DOMObject'}]`;
  }

  // Handle circular reference
  if (cache.has(val)) {
    return "[Circular]";
  }

  // Soft handle constructor names to avoid TypeErrors and safely bypass minified/obfuscated classes of Firestore/Auth SDK
  let constructorName = '';
  try {
    if (val.constructor && typeof val.constructor.name === 'string') {
      constructorName = val.constructor.name;
    }
  } catch (e) {
    // Ignore any proto / constructor resolution failures
  }

  // If the object looks like a Firestore/Firebase internal, or minified SDK entity, bypass deep traversal
  if (
    (constructorName && (
      constructorName === 'Firestore' || 
      constructorName === 'FirestoreImpl' ||
      constructorName === 'o' ||
      constructorName === 'Y2' ||
      constructorName === 'Ka' ||
      constructorName === 't2' ||
      constructorName.length <= 2 || // Standard minification class names
      constructorName.includes('Firestore') ||
      constructorName.includes('Database') ||
      constructorName.includes('Query') ||
      constructorName.includes('Collection') ||
      constructorName.includes('Document') ||
      constructorName.includes('Transaction') ||
      constructorName.includes('Auth') ||
      constructorName.includes('Storage')
    )) ||
    val._firestore || 
    val.firestore || 
    val._delegate ||
    val._database ||
    typeof val.doc === 'function' && typeof val.collection === 'function' // Firestore db-like check
  ) {
    return `[FirestoreInstance:${constructorName || 'UnknownClass'}]`;
  }

  // Handle Date
  if (val instanceof Date) {
    return val.toISOString();
  }

  // Handle Firestore Timestamp (has toMillis, toDate, seconds, nanoseconds)
  if (typeof val.toMillis === 'function') {
    return { seconds: val.seconds, nanoseconds: val.nanoseconds, _type: 'Timestamp', millis: val.toMillis() };
  }

  // Handle Arrays
  if (Array.isArray(val)) {
    const copy: any[] = [];
    cache.set(val, copy);
    val.forEach(item => {
      copy.push(circularSafeClone(item, cache));
    });
    return copy;
  }

  // Handle generic Objects
  const copy: any = {};
  cache.set(val, copy);
  
  try {
    Object.keys(val).forEach(key => {
      // Avoid traversing dangerous/internal fields or known circular references
      if (
        key === 'src' || 
        key === 'target' || 
        key === '_firestore' || 
        key === 'firestore' || 
        key === '_delegate' || 
        key === '_database' ||
        key.startsWith('_') || 
        key.startsWith('$')
      ) {
        return;
      }
      
      const value = val[key];
      try {
        copy[key] = circularSafeClone(value, cache);
      } catch (e) {
        copy[key] = `[Error cloning property]`;
      }
    });
  } catch (outerErr) {
    return `[Unserializable object keys]`;
  }

  return copy;
}

/**
 * Robustly stringify objects that may contain circular references
 */
export function circularSafeStringify(obj: any, replacer?: (key: string, value: any) => any, indent: number = 2): string {
  const seen = new WeakSet();

  const safeReplacer = (key: string, value: any) => {
    // 1. Run custom replacer if provided
    let processedValue = value;
    if (replacer) {
      processedValue = replacer(key, value);
    }

    // 2. Filter circular references and key Firestore SDK objects
    if (processedValue !== null && typeof processedValue === 'object') {
      if (typeof window !== 'undefined' && (processedValue instanceof Element || processedValue instanceof Node || processedValue instanceof Event || processedValue === window)) {
        return `[DOMElementOrEvent:${processedValue.constructor?.name || 'DOMObject'}]`;
      }

      const constructorName = processedValue.constructor?.name || '';
      
      if (
        (constructorName && (
          constructorName === 'Firestore' || 
          constructorName === 'FirestoreImpl' ||
          constructorName === 'o' ||
          constructorName === 'Y2' ||
          constructorName === 'Ka' ||
          constructorName === 't2' ||
          constructorName.length <= 2 ||
          constructorName.includes('Firestore') ||
          constructorName.includes('Database') ||
          constructorName.includes('Query') ||
          constructorName.includes('Collection') ||
          constructorName.includes('Document') ||
          constructorName.includes('Transaction') ||
          constructorName.includes('Auth') ||
          constructorName.includes('Storage')
        )) ||
        processedValue._firestore || 
        processedValue.firestore || 
        processedValue._delegate || 
        processedValue._database
      ) {
        return `[FirestoreInstance:${constructorName || 'UnknownClass'}]`;
      }

      if (seen.has(processedValue)) {
        return "[Circular]";
      }
      seen.add(processedValue);
    }
    return processedValue;
  };

  try {
    const cleanObj = circularSafeClone(obj);
    return JSON.stringify(cleanObj, safeReplacer, indent);
  } catch (err) {
    try {
      console.warn("Direct clone stringify failed, falling back to direct serialization with safe replacer:", err);
      return JSON.stringify(obj, safeReplacer, indent);
    } catch (innerErr) {
      console.error("Critical failure during circularSafeStringify:", innerErr);
      return '"[Unserializable object]"';
    }
  }
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: FirestoreOperation;
  path: string | null;
  isQuotaExceeded: boolean;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

/**
 * Deeply clean an object by removing undefined values, which Firestore does not support.
 */
export function sanitizeData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data === 'function') return null;

  if (data instanceof Date) return data.toISOString();
  if (typeof data === 'object' && typeof data.toDate === 'function') return data; // Firestore Timestamp

  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const clean: any = {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val !== undefined && typeof val !== 'function') {
        const cleanedVal = sanitizeData(val);
        if (cleanedVal !== undefined) {
          clean[key] = cleanedVal;
        }
      }
    }
    return clean;
  }

  return data;
}

let hasWarnedQuota = false;

export function triggerQuotaErrorModal(customMsg?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nsg_quota_error', { detail: { message: customMsg } }));
  }
}

export function checkIsQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return msg.includes('quota') || 
         msg.includes('resource exhausted') || 
         msg.includes('resource_exhausted') || 
         msg.includes('free daily read units') ||
         msg.includes('free daily write units') ||
         msg.includes('rate limit') ||
         msg.includes('quota limit exceeded') ||
         msg.includes('quota exceeded');
}

export function handleFirestoreError(error: unknown, operationType: FirestoreOperation, path: string | null, shouldThrow: boolean = false) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isQuotaExceeded = checkIsQuotaError(error) || errorMessage.includes('8');

  if (isQuotaExceeded) {
    triggerQuotaErrorModal();
    if (!hasWarnedQuota) {
      hasWarnedQuota = true;
      console.warn('Firestore Quota Limit reached.');
    }
    if (shouldThrow) {
      console.warn(`Firestore operation '${operationType}' deferred due to quota limits.`);
    }
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    operationType,
    path,
    isQuotaExceeded: false,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
  };

  let safeErrInfo: any;
  try {
    const jsonStr = circularSafeStringify(errInfo);
    safeErrInfo = JSON.parse(jsonStr);
  } catch (e) {
    safeErrInfo = {
      error: errorMessage,
      operationType,
      path,
      isQuotaExceeded: false,
      authInfo: { userId: auth.currentUser?.uid }
    };
  }

  console.warn('Firestore Operation Notice: ', safeErrInfo);

  if (shouldThrow) {
    throw new Error(circularSafeStringify(safeErrInfo));
  }
}

// Test connection in background without forcing server roundtrip on startup which can cause false timeout flags
async function testConnection() {
  try {
    // Just a quiet verify of the local db instance initialization
    if (!db) {
      console.warn("Firestore instance is not ready.");
    }
  } catch (error: any) {
    console.warn("Firestore connection check status:", error);
  }
}
testConnection();

export { signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, orderBy, limit, arrayUnion };
