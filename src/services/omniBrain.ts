import { Filesystem, Directory, ProgressStatus } from '@capacitor/filesystem';
import { PluginListenerHandle } from '@capacitor/core';

export const QWEN_GGUF_MODEL_FILENAME = 'qwen2.5-0.5b-instruct.gguf';
export const QWEN_LEGACY_MODEL_FILENAME = 'qwen2-0.5b-instruct.gguf';

// High-speed direct raw Hugging Face resolve download URLs (direct binary, never HTML blob pages)
export const QWEN_DIRECT_DOWNLOAD_URL = 
  'https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf';

export const QWEN_FALLBACK_DOWNLOAD_URL = 
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';

export const ESTIMATED_TOTAL_BYTES = 398_000_000; // ~398 MB

export type OmniBrainStatus = 'idle' | 'downloading' | 'paused' | 'completed' | 'error';

export interface OmniBrainDownloadState {
  status: OmniBrainStatus;
  downloadedBytes: number;
  totalBytes: number;
  downloadedFormatted: string;
  totalFormatted: string;
  progressPercent: number;
  speedFormatted: string;
  error: string | null;
  modelLocalPath?: string | null;
  modelPath?: string | null;
  lastUpdated?: number;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec < 1024 * 1024) {
    return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
}

let currentState: OmniBrainDownloadState = {
  status: 'idle',
  downloadedBytes: 0,
  totalBytes: ESTIMATED_TOTAL_BYTES,
  downloadedFormatted: '0 MB',
  totalFormatted: formatBytes(ESTIMATED_TOTAL_BYTES),
  progressPercent: 0,
  speedFormatted: '0 KB/s',
  error: null,
  modelLocalPath: null,
  modelPath: null,
  lastUpdated: Date.now()
};

const listeners: Set<(state: OmniBrainDownloadState) => void> = new Set();
let progressListenerHandle: PluginListenerHandle | null = null;
let isDownloadingActive = false;
let lastBytes = 0;
let lastTimestamp = 0;

function updateState(next: Partial<OmniBrainDownloadState>) {
  const merged = { ...currentState, ...next };
  const total = merged.totalBytes > 0 ? merged.totalBytes : ESTIMATED_TOTAL_BYTES;
  const progress = Math.min(100, Math.max(0, Math.round((merged.downloadedBytes / total) * 100)));
  const path = merged.modelLocalPath || merged.modelPath || null;

  currentState = {
    ...merged,
    downloadedFormatted: formatBytes(merged.downloadedBytes),
    totalFormatted: formatBytes(total),
    progressPercent: merged.status === 'completed' ? 100 : progress,
    modelLocalPath: path,
    modelPath: path,
    lastUpdated: Date.now()
  };

  listeners.forEach(fn => {
    try { fn(currentState); } catch (e) {}
  });
}

export function subscribeOmniBrainState(listener: (state: OmniBrainDownloadState) => void): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

export function getOmniBrainState(): OmniBrainDownloadState {
  return currentState;
}

export function isOmniBrainDownloaded(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('omni_brain_ready') === 'true';
}

export async function initOmniBrainStatus(): Promise<OmniBrainDownloadState> {
  await verifyOmniBrainFile();
  return currentState;
}

export function getSavedModelPath(): string {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const savedPath = localStorage.getItem('omni_brain_model_path');
    if (savedPath) return savedPath;
  }
  return QWEN_GGUF_MODEL_FILENAME;
}

/**
 * Verify if the model file is physically present in Directory.Data
 */
export async function verifyOmniBrainFile(): Promise<{ isReady: boolean; size: number; path: string | null }> {
  // Check main Qwen 2.5 filename first
  const filenamesToCheck = [QWEN_GGUF_MODEL_FILENAME, QWEN_LEGACY_MODEL_FILENAME];

  for (const filename of filenamesToCheck) {
    try {
      const statResult = await Filesystem.stat({
        path: filename,
        directory: Directory.Data
      });

      if (statResult && statResult.size > 0) {
        let cleanUri = statResult.uri || '';
        if (cleanUri.startsWith('file://')) {
          cleanUri = cleanUri.replace(/^file:\/\//, '');
        }

        localStorage.setItem('omni_brain_ready', 'true');
        if (cleanUri) {
          localStorage.setItem('omni_brain_model_path', cleanUri);
        }

        updateState({
          status: 'completed',
          downloadedBytes: statResult.size,
          totalBytes: statResult.size,
          progressPercent: 100,
          speedFormatted: '0 KB/s',
          modelLocalPath: cleanUri || filename,
          modelPath: cleanUri || filename,
          error: null
        });

        return { isReady: true, size: statResult.size, path: cleanUri || filename };
      }
    } catch (err) {
      // File not found on filesystem, check next
    }
  }

  localStorage.removeItem('omni_brain_ready');
  return { isReady: false, size: 0, path: null };
}

/**
 * 2. FIX OFFLINE QWEN DOWNLOAD MANAGER
 * - Uses Filesystem.downloadFile() from @capacitor/filesystem (NOT CapacitorHttp)
 * - Targets Directory.Data with recursive: true, progress: true
 * - Listens to Filesystem 'progress' event to compute speed and completion percentages
 * - Saves result.path for the llama-cpp-capacitor / native bridge init step
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
    // 1. Clean up any previous progress listeners
    if (progressListenerHandle) {
      try {
        await progressListenerHandle.remove();
      } catch (e) {}
      progressListenerHandle = null;
    }

    // 2. Register native Filesystem progress listener
    try {
      if (typeof Filesystem.addListener === 'function') {
        progressListenerHandle = await Filesystem.addListener('progress', (progressEvent: ProgressStatus | any) => {
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
      console.warn('⚠️ Native Filesystem progress listener registration note:', listenerErr);
    }

    console.log(`📥 [OmniBrain] Initiating direct raw binary download via Filesystem.downloadFile: ${QWEN_DIRECT_DOWNLOAD_URL}`);

    // 3. Execute Filesystem.downloadFile with direct raw Hugging Face resolve link
    let downloadResult: { path?: string } | null = null;
    let downloadError: any = null;

    const downloadCandidates = [
      QWEN_DIRECT_DOWNLOAD_URL,
      QWEN_FALLBACK_DOWNLOAD_URL
    ];

    for (let i = 0; i < downloadCandidates.length; i++) {
      const candidateUrl = downloadCandidates[i];
      try {
        console.log(`📥 [OmniBrain] Downloading model binary [${i + 1}/${downloadCandidates.length}] via Filesystem: ${candidateUrl}`);
        
        const result = await Filesystem.downloadFile({
          url: candidateUrl,
          path: QWEN_GGUF_MODEL_FILENAME,
          directory: Directory.Data,
          progress: true,
          recursive: true
        });

        if (result && result.path) {
          console.log(`✅ [OmniBrain] Filesystem.downloadFile completed successfully. Absolute path: ${result.path}`);
          downloadResult = result;
          downloadError = null;
          break;
        }
      } catch (mirrorErr: any) {
        downloadError = mirrorErr;
        const errDetail = mirrorErr instanceof Error ? mirrorErr.message : String(mirrorErr);
        console.warn(`⚠️ Download mirror [${i + 1}] failed:`, errDetail);
      }
    }

    if (!downloadResult && downloadError) {
      throw new Error(`Download failed across all mirrors: ${downloadError?.message || String(downloadError)}`);
    }

    // 4. VERIFICATION: Query local path and verify stat size > 0
    const stat = await Filesystem.stat({
      path: QWEN_GGUF_MODEL_FILENAME,
      directory: Directory.Data
    });

    if (!stat || stat.size === 0) {
      throw new Error('Downloaded model file is empty (0 bytes).');
    }

    let finalUri = downloadResult?.path || stat.uri || '';
    if (finalUri.startsWith('file://')) {
      finalUri = finalUri.replace(/^file:\/\//, '');
    }

    localStorage.setItem('omni_brain_ready', 'true');
    localStorage.setItem('omni_brain_model_path', finalUri || QWEN_GGUF_MODEL_FILENAME);

    updateState({
      status: 'completed',
      downloadedBytes: stat.size,
      totalBytes: stat.size,
      progressPercent: 100,
      speedFormatted: '0 KB/s',
      modelLocalPath: finalUri || QWEN_GGUF_MODEL_FILENAME,
      modelPath: finalUri || QWEN_GGUF_MODEL_FILENAME,
      error: null
    });

    console.log(`🎉 [OmniBrain] Model successfully saved and verified: ${stat.size} bytes at ${finalUri}`);
  } catch (error: any) {
    console.error('❌ [OmniBrain] Download failed:', error);
    updateState({
      status: 'error',
      error: error?.message || 'Download failed. Please check your connection and retry.',
      speedFormatted: '0 KB/s'
    });
  } finally {
    isDownloadingActive = false;
    if (progressListenerHandle) {
      try {
        await progressListenerHandle.remove();
      } catch (e) {}
      progressListenerHandle = null;
    }
  }
}

export async function pauseOmniBrainDownload(): Promise<void> {
  isDownloadingActive = false;
  if (progressListenerHandle) {
    try {
      await progressListenerHandle.remove();
    } catch (e) {}
    progressListenerHandle = null;
  }
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

  try {
    await Filesystem.deleteFile({
      path: QWEN_LEGACY_MODEL_FILENAME,
      directory: Directory.Data
    });
  } catch (e) {}

  localStorage.removeItem('omni_brain_ready');
  localStorage.removeItem('omni_brain_model_path');

  updateState({
    status: 'idle',
    downloadedBytes: 0,
    totalBytes: ESTIMATED_TOTAL_BYTES,
    progressPercent: 0,
    speedFormatted: '0 KB/s',
    modelLocalPath: null,
    modelPath: null,
    error: null
  });
}
