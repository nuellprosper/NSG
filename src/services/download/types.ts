import { ResourceAsset } from '../resources/types';

export interface DownloadOptions {
  onProgress?: (progressPercent: number) => void;
  signal?: AbortSignal;
}

export interface DownloadedAsset {
  resourceId: string;
  assetId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  localUri: string;
  blob?: Blob;
  downloadedAt: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

export interface DownloadService {
  download(
    resourceId: string,
    asset: ResourceAsset,
    resourceTitle: string,
    options?: DownloadOptions
  ): Promise<DownloadedAsset>;
  
  isAvailableOffline(resourceId: string, assetId?: string): Promise<boolean>;
  
  getLocalAsset(resourceId: string, assetId?: string): Promise<DownloadedAsset | null>;
  
  removeDownloadedAsset(resourceId: string, assetId?: string): Promise<void>;
}
