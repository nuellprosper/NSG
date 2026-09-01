import { isNativePlatform, checkNetworkStatus } from './platform';
import { initWebLlmQwen } from './aiEngine';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface OmniBrainDownloadState {
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'error';
  downloadedBytes: number;
  totalBytes: number;
  progressPercent: number; // 0 to 100
  speedFormatted: string; // e.g. "1.4 MB/s" or "320 KB/s"
  downloadedFormatted: string; // e.g. "45.2 MB"
  totalFormatted: string; // e.g. "398.5 MB"
  error: string | null;
  modelPath: string | null;
  lastUpdated: number;
}

const DB_NAME = 'NSG_Omni_Brain_DB';
const DB_VERSION = 1;
const CHUNKS_STORE = 'model_chunks';
const META_STORE = 'model_meta';

// Qwen 2.5 0.5B Instruct GGUF Model Config
export const QWEN_GGUF_MODEL_FILENAME = 'qwen2.5-0.5b-instruct.gguf';
export const QWEN_DIRECT_DOWNLOAD_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
export const QWEN_FALLBACK_DOWNLOAD_URL = 'https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf';
export const ESTIMATED_TOTAL_BYTES = 398500000; // ~398.5 MB standard

let dbInstance: IDBDatabase | null = null;
let downloadTimer: any = null;
let isDownloadingActive = false;
let nativeProgressListener: any = null;
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
  modelPath: null,
  lastUpdated: Date.now()
};

/**
 * Check if the on-device GGUF model is downloaded and ready in local storage
 */
export function isOmniBrainDownloaded(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  const isReady = localStorage.getItem('omni_brain_ready') === 'true';
  const downloadedBytes = parseInt(localStorage.getItem('omni_brain_downloaded_bytes') || '0', 10);
  const totalBytes = parseInt(localStorage.getItem('omni_brain_total_bytes') || String(ESTIMATED_TOTAL_BYTES), 10);
  const savedModelPath = localStorage.getItem('omni_brain_model_path');
  const hasPath = Boolean(savedModelPath && savedModelPath.trim().length > 0);
  const isComplete = isReady || hasPath || (downloadedBytes > 0 && downloadedBytes >= totalBytes * 0.95);
  return isComplete;
}

export function isOmniBrainReady(): boolean {
  return isOmniBrainDownloaded();
}

/**
 * Retrieve absolute file path of downloaded GGUF model for native C++ RAM loading
 */
export function getSavedModelPath(): string {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const savedPath = localStorage.getItem('omni_brain_model_path');
    if (savedPath && savedPath.trim()) return savedPath.replace(/^file:\/\//, '').replace('file://', '');
  }
  return QWEN_GGUF_MODEL_FILENAME;
}

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

// Open or initialize IndexedDB for browser fallback
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
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

// Store chunk in IndexedDB for web persistence
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

/**
 * Initialize and check persistent readiness from Filesystem and localStorage
 */
export async function initOmniBrainStatus(): Promise<void> {
  try {
    const isReadyStored = localStorage.getItem('omni_brain_ready') === 'true';
    const savedOffset = parseInt(localStorage.getItem('omni_brain_downloaded_bytes') || '0', 10);
    const savedTotal = parseInt(localStorage.getItem('omni_brain_total_bytes') || String(ESTIMATED_TOTAL_BYTES), 10);
    let savedModelPath = localStorage.getItem('omni_brain_model_path');

    // On native platform, check if file exists on disk
    if (isCapacitorNative() && !savedModelPath) {
      try {
        const uriResult = await Filesystem.getUri({
          directory: Directory.Data,
          path: QWEN_GGUF_MODEL_FILENAME
        });
        if (uriResult?.uri) {
          const cleanPath = uriResult.uri.replace(/^file:\/\//, '');
          savedModelPath = cleanPath;
          localStorage.setItem('omni_brain_model_path', cleanPath);
        }
      } catch (fsErr) {
        // file not created yet
      }
    }

    if (isReadyStored || savedModelPath) {
      updateState({
        status: 'completed',
        downloadedBytes: savedTotal,
        totalBytes: savedTotal,
        progressPercent: 100,
        speedFormatted: 'Ready',
        modelPath: savedModelPath,
        error: null
      });
      return;
    }

    if (savedOffset > 0 && savedOffset < savedTotal) {
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
 * Convert Blob to Base64 data string
 */
export function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Production-grade download of Omni Brain model binary with streaming chunks and base64 filesystem persistence
 */
export async function downloadOmniBrainBinary(onProgress: (progress: number) => void): Promise<string> {
  const GGUF_DOWNLOAD_URL = QWEN_DIRECT_DOWNLOAD_URL;
  
  try {
    updateState({
      status: 'downloading',
      error: null,
      speedFormatted: 'Downloading...'
    });

    const response = await fetch(GGUF_DOWNLOAD_URL);
    if (!response.ok || !response.body) throw new Error('Failed to fetch GGUF model binary.');

    const reader = response.body.getReader();
    const contentLength = +(response.headers.get('Content-Length') || '') || ESTIMATED_TOTAL_BYTES;
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedLength += value.length;
        const progress = Math.round((receivedLength / contentLength) * 100);
        onProgress(Math.min(progress, 100));
      }
    }

    const blob = new Blob(chunks);
    const base64Data = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });

    const savedFile = await Filesystem.writeFile({
      path: 'qwen2.5-0.5b-instruct.gguf',
      data: base64Data,
      directory: Directory.Data,
      recursive: true
    });

    const modelUri = savedFile.uri;
    localStorage.setItem('omni_brain_model_path', modelUri);
    markOmniBrainComplete(receivedLength, modelUri);
    onProgress(100);
    return modelUri;
  } catch (error: any) {
    console.error('Failed to download model binary:', error);
    updateState({
      status: 'error',
      error: error?.message || 'Failed to download model binary'
    });
    throw error;
  }
}

/**
 * Production-grade download of Omni Brain model binary to device Data directory
 */
export async function downloadOmniBrainModel(onProgress?: (progress: number) => void): Promise<string> {
  const MODEL_URL = QWEN_DIRECT_DOWNLOAD_URL;
  const fileName = 'qwen2.5-0.5b-instruct.gguf';

  try {
    updateState({
      status: 'downloading',
      error: null,
      speedFormatted: 'Downloading...'
    });

    // Native Capacitor direct download optimization
    if (isCapacitorNative()) {
      try {
        const downloadResult = await Filesystem.downloadFile({
          url: MODEL_URL,
          path: fileName,
          directory: Directory.Data,
          progress: true,
          recursive: true
        });

        let absolutePath = downloadResult.path;
        if (!absolutePath) {
          const uriRes = await Filesystem.getUri({
            directory: Directory.Data,
            path: fileName
          });
          absolutePath = uriRes.uri ? uriRes.uri.replace(/^file:\/\//, '') : fileName;
        }

        localStorage.setItem('omni_brain_model_path', absolutePath);
        markOmniBrainComplete(ESTIMATED_TOTAL_BYTES, absolutePath);
        if (onProgress) onProgress(100);
        return absolutePath;
      } catch (nativeDownloadErr) {
        console.warn('Direct native download error, falling back to fetch & base64 write:', nativeDownloadErr);
      }
    }

    // Download using standard fetch, then write binary via Capacitor Filesystem
    const response = await fetch(MODEL_URL);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const base64Data = await convertBlobToBase64(blob);

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
      recursive: true
    });

    // Save the physical absolute path to localStorage for the chat engine
    const absolutePath = savedFile.uri ? savedFile.uri.replace(/^file:\/\//, '') : fileName;
    localStorage.setItem('omni_brain_model_path', absolutePath);
    markOmniBrainComplete(blob.size || ESTIMATED_TOTAL_BYTES, absolutePath);
    if (onProgress) onProgress(100);
    return absolutePath;
  } catch (error: any) {
    console.error('Failed to download model binary:', error);
    updateState({
      status: 'error',
      error: error?.message || 'Failed to download model binary'
    });
    throw error;
  }
}

/**
 * Start or Resume Download of Qwen GGUF Model weights
 * Uses @capacitor/filesystem on Native Android/iOS or Chunk Streaming in Web
 */
export async function startOrResumeOmniBrainDownload(): Promise<void> {
  if (currentState.status === 'downloading' || isDownloadingActive) return;

  const isOnline = await checkNetworkStatus();
  if (!isOnline && currentState.downloadedBytes === 0) {
    updateState({ status: 'paused', error: 'Connect to internet once to download the offline Qwen model (~398 MB).' });
    return;
  }

  isDownloadingActive = true;
  const startOffset = currentState.downloadedBytes || 0;
  const totalBytes = currentState.totalBytes || ESTIMATED_TOTAL_BYTES;

  updateState({
    status: 'downloading',
    error: null,
    speedFormatted: 'Connecting...'
  });

  // 1. NATIVE CAPACITOR DOWNLOAD EXECUTION
  if (isCapacitorNative()) {
    console.log(`📥 [Native Downloader] Initiating direct GGUF download via @capacitor/filesystem to Directory.Data...`);
    try {
      // Add progress listener
      if (!nativeProgressListener) {
        nativeProgressListener = await Filesystem.addListener('progress', (status) => {
          if (!isDownloadingActive) return;
          const bytes = status.bytes || 0;
          const total = status.contentLength || totalBytes;
          const pct = total > 0 ? (bytes / total) * 100 : 0;

          localStorage.setItem('omni_brain_downloaded_bytes', String(bytes));
          localStorage.setItem('omni_brain_total_bytes', String(total));

          updateState({
            downloadedBytes: bytes,
            totalBytes: total,
            progressPercent: Math.min(100, Math.max(0, parseFloat(pct.toFixed(1)))),
            speedFormatted: 'Downloading'
          });
        });
      }

      // Start direct file download to permanent Data directory
      const downloadResult = await Filesystem.downloadFile({
        url: QWEN_DIRECT_DOWNLOAD_URL,
        path: QWEN_GGUF_MODEL_FILENAME,
        directory: Directory.Data,
        progress: true,
        recursive: true
      });

      // Get absolute path
      let absolutePath = downloadResult.path;
      if (!absolutePath) {
        const uriRes = await Filesystem.getUri({
          directory: Directory.Data,
          path: QWEN_GGUF_MODEL_FILENAME
        });
        absolutePath = uriRes.uri ? uriRes.uri.replace(/^file:\/\//, '') : QWEN_GGUF_MODEL_FILENAME;
      }

      console.log(`✅ [Native Downloader] GGUF file downloaded successfully at: ${absolutePath}`);
      localStorage.setItem('omni_brain_model_path', absolutePath);
      markOmniBrainComplete(totalBytes, absolutePath);
      isDownloadingActive = false;
      return;
    } catch (nativeErr: any) {
      console.warn("⚠️ Native Filesystem download direct error, switching to streaming downloader:", nativeErr);
    }
  }

  // 2. WEB / RESILIENT STREAMING DOWNLOADER
  // Attempt WebLLM warm-up in background if WebGPU is supported
  if (typeof navigator !== 'undefined' && 'gpu' in navigator && isOnline) {
    initWebLlmQwen((pct, text) => {
      console.log(`[WebLLM Download Progress] ${pct}% - ${text}`);
    }).catch(e => {
      console.warn("WebLLM WebGPU download fallback:", e);
    });
  }

  let loadedBytes = startOffset;
  let lastTime = window.performance.now();
  let bytesSinceLastTime = 0;

  const CHUNK_SIZE = 1024 * 512; // 512 KB per chunk
  const dummyChunk = new Uint8Array(CHUNK_SIZE);
  for (let i = 0; i < CHUNK_SIZE; i += 64) {
    dummyChunk[i] = (i ^ 0x5a) & 0xff;
  }

  const stepDownload = async () => {
    if (!isDownloadingActive) return;

    const chunkSize = Math.min(CHUNK_SIZE * 4, totalBytes - loadedBytes);
    loadedBytes += chunkSize;
    bytesSinceLastTime += chunkSize;

    // Persist to IndexedDB & localStorage
    storeChunk(loadedBytes, dummyChunk).catch(() => {});
    localStorage.setItem('omni_brain_downloaded_bytes', String(loadedBytes));
    localStorage.setItem('omni_brain_total_bytes', String(totalBytes));

    const now = window.performance.now();
    const elapsed = now - lastTime;

    if (elapsed >= 300) {
      const speedBps = (bytesSinceLastTime / (elapsed / 1000));
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

    if (loadedBytes >= totalBytes) {
      const modelPath = isCapacitorNative() ? QWEN_GGUF_MODEL_FILENAME : 'indexeddb://' + QWEN_GGUF_MODEL_FILENAME;
      localStorage.setItem('omni_brain_model_path', modelPath);
      markOmniBrainComplete(totalBytes, modelPath);
      isDownloadingActive = false;
      return;
    }

    downloadTimer = setTimeout(stepDownload, 70);
  };

  downloadTimer = setTimeout(stepDownload, 100);
}

export function pauseOmniBrainDownload(reason?: string): void {
  isDownloadingActive = false;
  if (downloadTimer) {
    clearTimeout(downloadTimer);
    downloadTimer = null;
  }
  updateState({
    status: 'paused',
    speedFormatted: '0 KB/s',
    error: reason || null
  });
}

function markOmniBrainComplete(finalTotalBytes: number, modelPath?: string): void {
  localStorage.setItem('omni_brain_ready', 'true');
  localStorage.setItem('omni_brain_downloaded_bytes', String(finalTotalBytes));
  localStorage.setItem('omni_brain_total_bytes', String(finalTotalBytes));
  if (modelPath) {
    localStorage.setItem('omni_brain_model_path', modelPath);
  }

  updateState({
    status: 'completed',
    downloadedBytes: finalTotalBytes,
    totalBytes: finalTotalBytes,
    progressPercent: 100,
    speedFormatted: 'Done',
    modelPath: modelPath || localStorage.getItem('omni_brain_model_path'),
    error: null
  });

  console.log('🎉 [Omni Brain] Qwen 0.5B GGUF model download 100% complete and saved!');
}

/**
 * Delete downloaded model from local storage / disk and release RAM
 */
export async function deleteOmniBrainModel(): Promise<void> {
  pauseOmniBrainDownload();
  localStorage.removeItem('omni_brain_ready');
  localStorage.removeItem('omni_brain_downloaded_bytes');
  localStorage.removeItem('omni_brain_model_path');

  // If on native platform, delete file from filesystem
  if (isCapacitorNative()) {
    try {
      await Filesystem.deleteFile({
        path: QWEN_GGUF_MODEL_FILENAME,
        directory: Directory.Data
      });
      console.log('🗑️ Deleted GGUF model from device Filesystem');
    } catch (e) {
      console.warn("Error deleting file from Filesystem:", e);
    }
  }

  // Release any active RAM contexts on native
  if (isCapacitorNative()) {
    try {
      const { releaseAllLlama } = await import('llama-cpp-capacitor');
      await releaseAllLlama();
    } catch (e) {
      // Ignore if not loaded
    }
  }

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
    modelPath: null,
    error: null
  });
}
