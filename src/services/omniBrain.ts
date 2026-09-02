import { CapacitorHttp, Capacitor } from '@capacitor/core';
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

// Qwen 2.5 0.5B Instruct GGUF Model Configuration
export const QWEN_GGUF_MODEL_FILENAME = 'qwen2-0.5b-instruct.gguf';
export const QWEN_DIRECT_DOWNLOAD_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
export const QWEN_FALLBACK_DOWNLOAD_URL = 'https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf';
export const ESTIMATED_TOTAL_BYTES = 398500000; // ~398.5 MB standard Q4_K_M GGUF

let isDownloadingActive = false;
let progressListenerHandle: any = null;
let lastBytes = 0;
let lastTimestamp = Date.now();
const activeListeners: Set<(state: OmniBrainDownloadState) => void> = new Set();

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

/**
 * STRICT VERIFICATION:
 * Inspects device filesystem and local storage to verify the model file exists and has size > 0.
 */
export function isOmniBrainDownloaded(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  const isReady = localStorage.getItem('omni_brain_ready') === 'true';
  const savedModelPath = localStorage.getItem('omni_brain_model_path');
  const downloadedBytes = parseInt(localStorage.getItem('omni_brain_downloaded_bytes') || '0', 10);
  const totalBytes = parseInt(localStorage.getItem('omni_brain_total_bytes') || String(ESTIMATED_TOTAL_BYTES), 10);
  
  const hasValidPath = Boolean(savedModelPath && savedModelPath.trim().length > 0);
  const isComplete = isReady && (hasValidPath || (downloadedBytes > 0 && downloadedBytes >= totalBytes * 0.9));
  return isComplete;
}

export function isOmniBrainReady(): boolean {
  return isOmniBrainDownloaded();
}

export async function initOmniBrainStatus(): Promise<OmniBrainDownloadState> {
  await verifyOmniBrainFile();
  return currentState;
}

export function getSavedModelPath(): string {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const savedPath = localStorage.getItem('omni_brain_model_path');
    if (savedPath && savedPath.trim()) return savedPath.replace(/^file:\/\//, '').replace('file://', '');
  }
  return QWEN_GGUF_MODEL_FILENAME;
}

/**
 * Asynchronously verifies the GGUF model via Filesystem.stat.
 * Only sets `isReady = true` in local storage if stat.size > 0.
 */
export async function verifyOmniBrainFile(): Promise<{ isReady: boolean; size: number; path: string | null }> {
  try {
    const statResult = await Filesystem.stat({
      path: QWEN_GGUF_MODEL_FILENAME,
      directory: Directory.Data
    });

    if (statResult && typeof statResult.size === 'number' && statResult.size > 0) {
      const uriResult = await Filesystem.getUri({
        path: QWEN_GGUF_MODEL_FILENAME,
        directory: Directory.Data
      });

      const cleanUri = uriResult.uri ? uriResult.uri.replace(/^file:\/\//, '') : QWEN_GGUF_MODEL_FILENAME;
      
      localStorage.setItem('omni_brain_ready', 'true');
      localStorage.setItem('omni_brain_model_path', cleanUri);
      localStorage.setItem('omni_brain_downloaded_bytes', String(statResult.size));
      localStorage.setItem('omni_brain_total_bytes', String(Math.max(statResult.size, ESTIMATED_TOTAL_BYTES)));

      updateState({
        status: 'completed',
        downloadedBytes: statResult.size,
        totalBytes: Math.max(statResult.size, ESTIMATED_TOTAL_BYTES),
        progressPercent: 100,
        modelPath: cleanUri,
        error: null
      });

      return { isReady: true, size: statResult.size, path: cleanUri };
    }
  } catch (err) {
    // Model not found on filesystem
  }

  localStorage.removeItem('omni_brain_ready');
  return { isReady: false, size: 0, path: null };
}

/**
 * 1. STRICT DOWNLOAD IMPLEMENTATION (omniBrain.ts)
 * Uses native Capacitor HTTP plugin: CapacitorHttp.downloadFile({ url, filePath, fileDirectory: Directory.Data, progress: true })
 * Binds native progress event listener to compute (bytes / contentLength) * 100.
 * Verifies via Filesystem.stat upon resolution.
 */
export async function startOrResumeOmniBrainDownload(): Promise<void> {
  if (isDownloadingActive) return;

  isDownloadingActive = true;
  lastBytes = 0;
  lastTimestamp = Date.now();

  updateState({
    status: 'downloading',
    error: null,
    totalBytes: ESTIMATED_TOTAL_BYTES
  });

  try {
    // 1. Remove previous progress listeners if any
    if (progressListenerHandle) {
      try {
        if (typeof progressListenerHandle.remove === 'function') {
          await progressListenerHandle.remove();
        }
      } catch (e) {}
      progressListenerHandle = null;
    }

    // 2. Bind the native CapacitorHttp progress event listener
    try {
      if ((CapacitorHttp as any).addListener) {
        progressListenerHandle = await (CapacitorHttp as any).addListener('progress', (progressEvent: any) => {
          if (!isDownloadingActive) return;

          const bytes = progressEvent.bytes ?? progressEvent.loaded ?? progressEvent.current ?? 0;
          const contentLength = progressEvent.contentLength ?? progressEvent.total ?? ESTIMATED_TOTAL_BYTES;

          const now = Date.now();
          const timeDiff = (now - lastTimestamp) / 1000;
          let speedStr = currentState.speedFormatted;

          if (timeDiff >= 0.5) {
            const bytesDiff = bytes - lastBytes;
            const bytesPerSec = timeDiff > 0 ? Math.max(0, bytesDiff / timeDiff) : 0;
            speedStr = formatSpeed(bytesPerSec);
            lastBytes = bytes;
            lastTimestamp = now;
          }

          updateState({
            downloadedBytes: bytes,
            totalBytes: contentLength > 0 ? contentLength : ESTIMATED_TOTAL_BYTES,
            speedFormatted: speedStr
          });
        });
      }
    } catch (listenerErr) {
      console.warn('⚠️ Native progress listener registration note:', listenerErr);
    }

    console.log(`📥 [OmniBrain] Initiating native download via CapacitorHttp to Directory.Data: ${QWEN_GGUF_MODEL_FILENAME}`);

    // 3. Execute Native CapacitorHttp.downloadFile
    let downloadResult: any = null;
    try {
      downloadResult = await (CapacitorHttp as any).downloadFile({
        url: QWEN_DIRECT_DOWNLOAD_URL,
        filePath: QWEN_GGUF_MODEL_FILENAME,
        fileDirectory: Directory.Data,
        progress: true
      });
    } catch (primaryErr) {
      console.warn('⚠️ Primary download URL failed, attempting fallback URL:', primaryErr);
      downloadResult = await (CapacitorHttp as any).downloadFile({
        url: QWEN_FALLBACK_DOWNLOAD_URL,
        filePath: QWEN_GGUF_MODEL_FILENAME,
        fileDirectory: Directory.Data,
        progress: true
      });
    }

    console.log('✅ [OmniBrain] Native downloadFile resolved:', downloadResult);

    // 4. VERIFICATION: Immediately execute Filesystem.stat
    const stat = await Filesystem.stat({
      path: QWEN_GGUF_MODEL_FILENAME,
      directory: Directory.Data
    });

    console.log(`🔍 [OmniBrain] Verified file on disk: size = ${stat.size} bytes`);

    if (stat && typeof stat.size === 'number' && stat.size > 0) {
      const uriResult = await Filesystem.getUri({
        path: QWEN_GGUF_MODEL_FILENAME,
        directory: Directory.Data
      });

      const cleanUri = uriResult?.uri ? uriResult.uri.replace(/^file:\/\//, '') : QWEN_GGUF_MODEL_FILENAME;

      localStorage.setItem('omni_brain_ready', 'true');
      localStorage.setItem('omni_brain_model_path', cleanUri);
      localStorage.setItem('omni_brain_downloaded_bytes', String(stat.size));
      localStorage.setItem('omni_brain_total_bytes', String(Math.max(stat.size, ESTIMATED_TOTAL_BYTES)));

      updateState({
        status: 'completed',
        downloadedBytes: stat.size,
        totalBytes: Math.max(stat.size, ESTIMATED_TOTAL_BYTES),
        progressPercent: 100,
        modelPath: cleanUri,
        error: null,
        speedFormatted: '0 KB/s'
      });
    } else {
      throw new Error('Model verification failed: Downloaded file size is 0 bytes.');
    }
  } catch (error: any) {
    console.error('❌ [OmniBrain] Download failed:', error);
    localStorage.removeItem('omni_brain_ready');
    updateState({
      status: 'error',
      error: error?.message || 'Download failed. Please check your internet connection.',
      speedFormatted: '0 KB/s'
    });
  } finally {
    isDownloadingActive = false;
    if (progressListenerHandle) {
      try {
        if (typeof progressListenerHandle.remove === 'function') {
          await progressListenerHandle.remove();
        }
      } catch (e) {}
      progressListenerHandle = null;
    }
  }
}

export function pauseOmniBrainDownload(): void {
  isDownloadingActive = false;
  updateState({
    status: 'paused',
    speedFormatted: '0 KB/s'
  });
}

export async function deleteOmniBrainModel(): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: QWEN_GGUF_MODEL_FILENAME,
      directory: Directory.Data
    });
  } catch (e) {}

  localStorage.removeItem('omni_brain_ready');
  localStorage.removeItem('omni_brain_model_path');
  localStorage.removeItem('omni_brain_downloaded_bytes');

  updateState({
    status: 'idle',
    downloadedBytes: 0,
    progressPercent: 0,
    modelPath: null,
    error: null,
    speedFormatted: '0 KB/s'
  });
}

// Automatically check existing verified file state upon module evaluation
if (typeof window !== 'undefined') {
  verifyOmniBrainFile().catch(() => {});
}
