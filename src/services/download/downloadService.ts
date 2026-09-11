import { DownloadService, DownloadOptions, DownloadedAsset } from './types';
import { ResourceAsset } from '../resources/types';
import { validateBlobContent, validateBinaryContent } from './validator';
import { localManifest } from '../resources/localManifest';
import { saveBinaryAsset, getBinaryAsset, deleteBinaryAsset, triggerFileDownload } from '../../utils/assetStorage';

// Lazy-load Capacitor Filesystem to prevent crash on web-only runs
let capacitorFilesystem: any = null;
let isNativePlatform = false;

if (typeof window !== 'undefined') {
  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    isNativePlatform = cap.isNativePlatform();
  }
}

async function getFilesystem() {
  if (!capacitorFilesystem && isNativePlatform) {
    try {
      const mod = await import('@capacitor/filesystem');
      capacitorFilesystem = mod.Filesystem;
    } catch (e) {
      console.warn('[DownloadService] Capacitor Filesystem not available, falling back to Web storage:', e);
      isNativePlatform = false;
    }
  }
  return capacitorFilesystem;
}

export class PlatformDownloadService implements DownloadService {
  /**
   * Main download entry point. Enforces capabilities, validates magic bytes,
   * stores to offline vault, registers in local manifest, and triggers download.
   */
  public async download(
    resourceId: string,
    asset: ResourceAsset,
    resourceTitle: string,
    options?: DownloadOptions
  ): Promise<DownloadedAsset> {
    // 1. Strict capability verification
    if (!asset.downloadable) {
      throw new Error('This asset is not marked as downloadable according to provider rights/capabilities.');
    }

    if (!asset.url) {
      throw new Error('Asset has no valid download URL.');
    }

    // Never accept webpage URLs as downloadable file URLs
    if (asset.url.endsWith('.html') && asset.type !== 'html') {
      throw new Error('Invalid download URL: Webpage URL cannot be downloaded as binary document.');
    }

    const cleanFileName = asset.fileName || `${resourceTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${asset.type}`;

    // 2. Route to Native Capacitor or Web IndexedDB
    if (isNativePlatform) {
      try {
        return await this.downloadNativeCapacitor(resourceId, asset, cleanFileName, resourceTitle, options);
      } catch (nativeErr: any) {
        console.warn('[DownloadService] Native download error, trying web streaming fallback:', nativeErr);
        // Fallback to web IndexedDB download if native fails
        return await this.downloadWeb(resourceId, asset, cleanFileName, resourceTitle, options);
      }
    } else {
      return await this.downloadWeb(resourceId, asset, cleanFileName, resourceTitle, options);
    }
  }

  /**
   * Web browser download implementation with IndexedDB storage & validation
   */
  private async downloadWeb(
    resourceId: string,
    asset: ResourceAsset,
    fileName: string,
    resourceTitle: string,
    options?: DownloadOptions
  ): Promise<DownloadedAsset> {
    options?.onProgress?.(10);

    // Determine target URL. If CORS might fail or if it's an OpenStax / Drive stream, use our proxy
    let streamUrl = asset.url;
    const isExternalUrl = asset.url.startsWith('http://') || asset.url.startsWith('https://');

    // If external, route through secure download proxy
    if (isExternalUrl) {
      streamUrl = `/api/courses/direct-download?url=${encodeURIComponent(asset.url)}&filename=${encodeURIComponent(fileName)}&courseId=${encodeURIComponent(resourceId)}`;
    }

    options?.onProgress?.(30);

    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf,application/epub+zip,application/octet-stream,*/*',
      },
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`Download failed with server HTTP status ${response.status} (${response.statusText}).`);
    }

    options?.onProgress?.(60);
    const blob = await response.blob();
    options?.onProgress?.(80);

    // 3. File Integrity & Magic Byte Validation
    const validation = await validateBlobContent(blob, asset.type);
    if (!validation.valid) {
      throw new Error(`File integrity check failed: ${validation.error || 'Corrupt or invalid file content.'}`);
    }

    // 4. Save verified binary file to IndexedDB
    const storageKey = `asset_${resourceId}_${asset.id}`;
    await saveBinaryAsset(storageKey, blob, {
      name: fileName,
      mimeType: asset.mimeType || blob.type,
      courseId: resourceId,
    });

    // 5. Trigger browser file saving to device Downloads folder
    triggerFileDownload(blob, fileName);

    // 6. Register verified asset in offline manifest
    const manifestEntry = {
      resourceId,
      assetId: asset.id,
      fileName,
      mimeType: asset.mimeType || blob.type || 'application/octet-stream',
      sizeBytes: blob.size,
      localUri: `indexeddb://${storageKey}`,
      downloadedAt: Date.now(),
      title: resourceTitle,
      providerId: asset.sourceUrl ? 'external' : 'local',
      type: asset.type,
    };
    localManifest.registerLocalAsset(manifestEntry);

    options?.onProgress?.(100);

    return {
      resourceId,
      assetId: asset.id,
      fileName,
      mimeType: manifestEntry.mimeType,
      sizeBytes: blob.size,
      localUri: manifestEntry.localUri,
      blob,
      downloadedAt: manifestEntry.downloadedAt,
    };
  }

  /**
   * Native Capacitor Android Download Implementation
   * Uses Filesystem.downloadFile to stream directly to disk without Base64/RAM overhead
   */
  private async downloadNativeCapacitor(
    resourceId: string,
    asset: ResourceAsset,
    fileName: string,
    resourceTitle: string,
    options?: DownloadOptions
  ): Promise<DownloadedAsset> {
    const fs = await getFilesystem();
    if (!fs) {
      throw new Error('Capacitor Filesystem plugin unavailable.');
    }

    options?.onProgress?.(15);

    // Destination path on Android device
    const subFolder = 'Documents/CoursesAndBooks';
    const filePath = `${subFolder}/${fileName}`;

    // Ensure directory exists
    try {
      await fs.mkdir({
        path: subFolder,
        directory: 'DOCUMENTS',
        recursive: true,
      });
    } catch {
      // Directory might already exist
    }

    options?.onProgress?.(30);

    // Use direct proxy if external to avoid CORS/redirect issues on Android WebView
    let downloadUrl = asset.url;
    if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
      downloadUrl = `/api/courses/direct-download?url=${encodeURIComponent(asset.url)}&filename=${encodeURIComponent(fileName)}&courseId=${encodeURIComponent(resourceId)}`;
      // Convert to absolute URL for Capacitor native layer if needed
      if (downloadUrl.startsWith('/')) {
        downloadUrl = window.location.origin + downloadUrl;
      }
    }

    // Call Filesystem.downloadFile
    const downloadRes = await fs.downloadFile({
      url: downloadUrl,
      path: filePath,
      directory: 'DOCUMENTS',
      recursive: true,
    });

    options?.onProgress?.(70);

    const savedUri = downloadRes.path || filePath;

    // Verify written file size & magic bytes
    try {
      const stat = await fs.stat({
        path: filePath,
        directory: 'DOCUMENTS',
      });

      if (stat.size < 100) {
        // Delete invalid file
        await fs.deleteFile({ path: filePath, directory: 'DOCUMENTS' }).catch(() => {});
        throw new Error(`Downloaded native file is suspiciously small (${stat.size} bytes).`);
      }

      // Read small header chunk to validate magic bytes
      const headerRead = await fs.readFile({
        path: filePath,
        directory: 'DOCUMENTS',
      });

      let headerData: Uint8Array;
      if (typeof headerRead.data === 'string') {
        // Base64 or binary string
        const binaryStr = atob(headerRead.data.slice(0, 128));
        headerData = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          headerData[i] = binaryStr.charCodeAt(i);
        }
      } else {
        headerData = new Uint8Array(headerRead.data);
      }

      const val = validateBinaryContent(headerData, asset.type);
      if (!val.valid) {
        // Delete corrupted native file immediately
        await fs.deleteFile({ path: filePath, directory: 'DOCUMENTS' }).catch(() => {});
        throw new Error(`File integrity validation failed: ${val.error}`);
      }

      // Register in offline manifest
      const manifestEntry = {
        resourceId,
        assetId: asset.id,
        fileName,
        mimeType: asset.mimeType || 'application/octet-stream',
        sizeBytes: stat.size,
        localUri: savedUri,
        downloadedAt: Date.now(),
        title: resourceTitle,
        providerId: 'native-android',
        type: asset.type,
      };
      localManifest.registerLocalAsset(manifestEntry);

      options?.onProgress?.(100);

      return {
        resourceId,
        assetId: asset.id,
        fileName,
        mimeType: manifestEntry.mimeType,
        sizeBytes: stat.size,
        localUri: savedUri,
        downloadedAt: manifestEntry.downloadedAt,
      };
    } catch (verifyErr: any) {
      await fs.deleteFile({ path: filePath, directory: 'DOCUMENTS' }).catch(() => {});
      throw verifyErr;
    }
  }

  public async isAvailableOffline(resourceId: string, assetId?: string): Promise<boolean> {
    const entry = localManifest.getLocalAsset(resourceId, assetId);
    if (!entry) return false;

    // Verify that the entry actually exists in local storage
    if (entry.localUri.startsWith('indexeddb://')) {
      const storageKey = entry.localUri.replace('indexeddb://', '');
      const asset = await getBinaryAsset(storageKey);
      return Boolean(asset);
    }
    return true;
  }

  public async getLocalAsset(resourceId: string, assetId?: string): Promise<DownloadedAsset | null> {
    const entry = localManifest.getLocalAsset(resourceId, assetId);
    if (!entry) return null;

    let blob: Blob | undefined;
    if (entry.localUri.startsWith('indexeddb://')) {
      const storageKey = entry.localUri.replace('indexeddb://', '');
      const stored = await getBinaryAsset(storageKey);
      if (stored) {
        blob = stored.blob;
      }
    }

    return {
      resourceId: entry.resourceId,
      assetId: entry.assetId,
      fileName: entry.fileName,
      mimeType: entry.mimeType,
      sizeBytes: entry.sizeBytes,
      localUri: entry.localUri,
      blob,
      downloadedAt: entry.downloadedAt,
    };
  }

  public async removeDownloadedAsset(resourceId: string, assetId?: string): Promise<void> {
    const entry = localManifest.getLocalAsset(resourceId, assetId);
    if (entry) {
      if (entry.localUri.startsWith('indexeddb://')) {
        const storageKey = entry.localUri.replace('indexeddb://', '');
        await deleteBinaryAsset(storageKey);
      } else if (isNativePlatform) {
        const fs = await getFilesystem();
        if (fs) {
          const subFolder = 'Documents/CoursesAndBooks';
          const filePath = `${subFolder}/${entry.fileName}`;
          await fs.deleteFile({ path: filePath, directory: 'DOCUMENTS' }).catch(() => {});
        }
      }
      localManifest.removeLocalAsset(resourceId, assetId);
    }
  }
}

export const downloadService = new PlatformDownloadService();
