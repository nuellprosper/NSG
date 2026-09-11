// NSG Local Binary Asset Storage & Streamer
// Uses browser IndexedDB to store multi-megabyte binary PDFs, audio notes, and media files locally
// bypassing localStorage 5MB quota restrictions.

const DB_NAME = 'nsg_media_vault';
const DB_VERSION = 1;
const STORE_NAME = 'binary_assets';

interface StoredAsset {
  id: string;
  blob: Blob;
  name: string;
  mimeType: string;
  size: number;
  courseId?: string;
  savedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment.'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('courseId', 'courseId', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Save a binary Blob (PDF, audio, video) into IndexedDB local storage
 */
export async function saveBinaryAsset(
  id: string,
  blob: Blob,
  metadata: { name: string; mimeType?: string; courseId?: string }
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredAsset = {
        id,
        blob,
        name: metadata.name,
        mimeType: metadata.mimeType || blob.type || 'application/octet-stream',
        size: blob.size,
        courseId: metadata.courseId,
        savedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to save binary asset to IndexedDB'));
    });
  } catch (err) {
    console.warn('[AssetStorage] IndexedDB save error:', err);
  }
}

/**
 * Retrieve a binary asset from IndexedDB
 */
export async function getBinaryAsset(id: string): Promise<StoredAsset | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('Failed to get binary asset from IndexedDB'));
    });
  } catch (err) {
    console.warn('[AssetStorage] IndexedDB get error:', err);
    return null;
  }
}

/**
 * Delete a binary asset from IndexedDB
 */
export async function deleteBinaryAsset(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to delete asset'));
    });
  } catch (err) {
    console.warn('[AssetStorage] IndexedDB delete error:', err);
  }
}

/**
 * Trigger direct client file download from a Blob or URL
 * Creates a genuine binary file stream to the user's downloads folder.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._\- ]/g, '_');
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = safeFilename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  }, 45000);
}

/**
 * Fetch binary data directly via download proxy with progress or fallback
 */
export async function fetchAndStreamBinaryFile(
  targetUrl: string,
  filename: string,
  courseId?: string
): Promise<Blob> {
  // Construct proxy URL to bypass CORS and ensure direct binary attachment stream
  const proxyUrl = `/api/courses/direct-download?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(filename)}&courseId=${encodeURIComponent(courseId || '')}`;

  const response = await fetch(proxyUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf,application/octet-stream,*/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}: Failed to download binary file.`);
  }

  const blob = await response.blob();
  if (blob.size < 100) {
    // If under 100 bytes, might be a text error payload
    const txt = await blob.text();
    if (txt.startsWith('{') && txt.includes('"error"')) {
      throw new Error('Server reported an error during download stream.');
    }
  }

  return blob;
}
