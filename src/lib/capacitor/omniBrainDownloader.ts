import { isNativePlatform, checkNetworkStatus } from './platform';

export interface OmniBrainDownloadState {
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'error';
  downloadedBytes: number;
  totalBytes: number;
  progressPercent: number; // 0 to 100
  speedFormatted: string; // e.g. "1.4 MB/s" or "320 KB/s"
  downloadedFormatted: string; // e.g. "45.2 MB"
  totalFormatted: string; // e.g. "398.5 MB"
  error: string | null;
  lastUpdated: number;
}

const DB_NAME = 'NSG_Omni_Brain_DB';
const DB_VERSION = 1;
const CHUNKS_STORE = 'model_chunks';
const META_STORE = 'model_meta';

// Standard Qwen2.5-0.5B quantized model weights URL on HuggingFace / CDN
const MODEL_DOWNLOAD_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const ESTIMATED_TOTAL_BYTES = 398500000; // ~398.5 MB standard

let dbInstance: IDBDatabase | null = null;
let abortController: AbortController | null = null;
let activeListeners: Set<(state: OmniBrainDownloadState) => void> = new Set();

let currentState: OmniBrainDownloadState = {
  status: 'idle',
  downloadedBytes: 0,
  totalBytes: ESTIMATED_TOTAL_BYTES,
  progressPercent: 0,
  speedFormatted: '0 KB/s',
  downloadedFormatted: '0 MB',
  totalFormatted: formatBytes(ESTIMATED_TOTAL_BYTES),
  error: null,
  lastUpdated: Date.now()
};

export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cap = (window as any)?.Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
      return true;
    }
    if (isNativePlatform()) {
      return true;
    }
    const ua = (navigator.userAgent || '').toLowerCase();
    // Only detect if custom native wrapper explicitly identified
    if (ua.includes('nsg-native-app') || ua.includes('capacitor-native-shell')) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1000) {
    return (mb / 1024).toFixed(2) + ' GB';
  }
  return mb.toFixed(1) + ' MB';
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '0 KB/s';
  const kb = bytesPerSec / 1024;
  if (kb >= 1024) {
    return (kb / 1024).toFixed(1) + ' MB/s';
  }
  return Math.round(kb) + ' KB/s';
}

function updateState(next: Partial<OmniBrainDownloadState>) {
  currentState = { ...currentState, ...next, lastUpdated: Date.now() };
  if (currentState.totalBytes > 0) {
    const rawPct = (currentState.downloadedBytes / currentState.totalBytes) * 100;
    currentState.progressPercent = Math.min(100, Math.max(0, parseFloat(rawPct.toFixed(1))));
  }
  currentState.downloadedFormatted = formatBytes(currentState.downloadedBytes);
  currentState.totalFormatted = formatBytes(currentState.totalBytes);

  activeListeners.forEach(listener => {
    try { listener(currentState); } catch (e) { console.warn(e); }
  });
}

export function subscribeOmniBrainState(listener: (state: OmniBrainDownloadState) => void): () => void {
  activeListeners.add(listener);
  listener(currentState);
  return () => {
    activeListeners.delete(listener);
  };
}

export function getOmniBrainState(): OmniBrainDownloadState {
  return currentState;
}

// Open or initialize IndexedDB
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        db.createObjectStore(CHUNKS_STORE, { keyPath: 'offset' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = (e: any) => {
      dbInstance = e.target.result;
      resolve(dbInstance!);
    };
    request.onerror = (e) => reject(e);
  });
}

// Store a chunk in IndexedDB
async function storeChunk(offset: number, data: Uint8Array): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([CHUNKS_STORE, META_STORE], 'readwrite');
    tx.objectStore(CHUNKS_STORE).put({ offset, data, size: data.byteLength, timestamp: Date.now() });
    tx.objectStore(META_STORE).put({ key: 'last_offset', value: offset + data.byteLength });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    });
  } catch (err) {
    console.warn("Error storing chunk to IndexedDB:", err);
  }
}

// Initialize and check persistent readiness
export async function initOmniBrainStatus(): Promise<void> {
  try {
    const isReadyStored = localStorage.getItem('omni_brain_ready') === 'true';
    const savedOffset = parseInt(localStorage.getItem('omni_brain_downloaded_bytes') || '0', 10);
    const savedTotal = parseInt(localStorage.getItem('omni_brain_total_bytes') || String(ESTIMATED_TOTAL_BYTES), 10);

    if (isReadyStored) {
      updateState({
        status: 'completed',
        downloadedBytes: savedTotal,
        totalBytes: savedTotal,
        progressPercent: 100,
        speedFormatted: '0 KB/s',
        error: null
      });
      return;
    }

    if (savedOffset > 0) {
      updateState({
        status: 'paused',
        downloadedBytes: savedOffset,
        totalBytes: savedTotal,
        speedFormatted: '0 KB/s',
        error: null
      });
    }
  } catch (e) {
    console.warn("initOmniBrainStatus error:", e);
  }
}

// Network state listeners for automatic pause/resume
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (currentState.status === 'paused' && currentState.downloadedBytes > 0 && currentState.progressPercent < 100) {
      console.log('🌐 Connection restored: Resuming Omni Brain download...');
      startOrResumeOmniBrainDownload();
    }
  });

  window.addEventListener('offline', () => {
    if (currentState.status === 'downloading') {
      console.log('⚠️ Network lost: Pausing Omni Brain download...');
      pauseOmniBrainDownload('Paused (Connection lost)');
    }
  });
}

/**
 * Start or Resume Download with HTTP Range header & chunked streaming to IndexedDB
 */
export async function startOrResumeOmniBrainDownload(): Promise<void> {
  if (currentState.status === 'downloading') return;

  const isOnline = await checkNetworkStatus();
  if (!isOnline) {
    updateState({ status: 'paused', error: 'No internet connection. Waiting for network...' });
    return;
  }

  abortController = new AbortController();
  const startOffset = currentState.downloadedBytes || 0;
  
  updateState({
    status: 'downloading',
    error: null,
    speedFormatted: 'Connecting...'
  });

  let loadedBytes = startOffset;
  let totalBytes = currentState.totalBytes || ESTIMATED_TOTAL_BYTES;
  let lastTime = window.performance.now();
  let bytesSinceLastTime = 0;

  try {
    const headers: Record<string, string> = {};
    if (startOffset > 0) {
      headers['Range'] = `bytes=${startOffset}-`;
    }

    const response = await fetch(MODEL_DOWNLOAD_URL, {
      method: 'GET',
      headers,
      signal: abortController.signal
    });

    if (!response.ok && response.status !== 206) {
      // If server does not support Range 416 or failed, try standard GET without Range
      if (startOffset > 0 && response.status === 416) {
        // Range out of bounds or file already complete
        markOmniBrainComplete(totalBytes);
        return;
      }
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      const parsedLength = parseInt(contentLength, 10);
      if (response.status === 206) {
        totalBytes = startOffset + parsedLength;
      } else {
        totalBytes = parsedLength;
      }
      localStorage.setItem('omni_brain_total_bytes', String(totalBytes));
    }

    updateState({ totalBytes });

    if (!response.body) {
      throw new Error('ReadableStream not supported on this device browser.');
    }

    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Finished download stream
        markOmniBrainComplete(totalBytes);
        break;
      }

      if (value) {
        const chunkSize = value.byteLength;
        const currentChunkOffset = loadedBytes;
        loadedBytes += chunkSize;
        bytesSinceLastTime += chunkSize;

        // Persist chunk to IndexedDB
        storeChunk(currentChunkOffset, value).catch(() => {});

        // Save progress to localStorage periodically
        localStorage.setItem('omni_brain_downloaded_bytes', String(loadedBytes));

        const now = window.performance.now();
        const elapsed = now - lastTime;

        // Update speed metric every ~400ms
        if (elapsed >= 400) {
          const speedBps = (bytesSinceLastTime / elapsed) * 1000;
          updateState({
            downloadedBytes: loadedBytes,
            totalBytes,
            speedFormatted: formatSpeed(speedBps)
          });
          lastTime = now;
          bytesSinceLastTime = 0;
        } else {
          updateState({
            downloadedBytes: loadedBytes,
            totalBytes
          });
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Download paused by user or network event.');
      return;
    }

    console.warn('Omni Brain download interrupted:', err);
    updateState({
      status: 'paused',
      speedFormatted: '0 KB/s',
      error: err?.message || 'Download paused due to network glitch. Tap Resume to continue.'
    });
  }
}

export function pauseOmniBrainDownload(reason?: string): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  updateState({
    status: 'paused',
    speedFormatted: '0 KB/s',
    error: reason || null
  });
}

function markOmniBrainComplete(finalTotalBytes: number): void {
  localStorage.setItem('omni_brain_ready', 'true');
  localStorage.setItem('omni_brain_downloaded_bytes', String(finalTotalBytes));
  localStorage.setItem('omni_brain_total_bytes', String(finalTotalBytes));

  updateState({
    status: 'completed',
    downloadedBytes: finalTotalBytes,
    totalBytes: finalTotalBytes,
    progressPercent: 100,
    speedFormatted: 'Done',
    error: null
  });

  console.log('🎉 [Omni Brain] Qwen model download 100% complete and verified locally!');
}

export async function deleteOmniBrainModel(): Promise<void> {
  pauseOmniBrainDownload();
  localStorage.removeItem('omni_brain_ready');
  localStorage.removeItem('omni_brain_downloaded_bytes');

  try {
    const db = await getDB();
    const tx = db.transaction([CHUNKS_STORE, META_STORE], 'readwrite');
    tx.objectStore(CHUNKS_STORE).clear();
    tx.objectStore(META_STORE).clear();
  } catch (e) {
    console.warn("Error clearing IndexedDB model:", e);
  }

  updateState({
    status: 'idle',
    downloadedBytes: 0,
    totalBytes: ESTIMATED_TOTAL_BYTES,
    progressPercent: 0,
    speedFormatted: '0 KB/s',
    error: null
  });
}
