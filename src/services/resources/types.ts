// Normalized Resource & Provider Types for "Courses & Books"

export type ResourceAssetType = 'pdf' | 'epub' | 'docx' | 'txt' | 'html' | 'audio' | 'video' | 'other';

export interface ResourceAsset {
  id: string;
  type: ResourceAssetType;
  url: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
  downloadable: boolean;
  sourceUrl: string;
  label?: string;
}

export interface ResourceCapabilities {
  readableOnline: boolean;
  downloadable: boolean;
  borrowable: boolean;
}

export interface ResourceResult {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  providerId: string;
  providerName: string;
  sourceUrl: string;
  publisherUrl?: string;
  readingUrl?: string;
  borrowUrl?: string;
  license?: string;
  category?: string;
  providerBadgeClass?: string;
  capabilities: ResourceCapabilities;
  assets: ResourceAsset[];

  // Compatibility fields with existing CourseMaterial / CourseCard / Preview UI UX:
  code?: string;
  faculty?: string;
  department?: string;
  level?: string;
  semester?: string;
  notes?: string;
  likesCount?: number;
  rating?: number;
  reviewsCount?: number;
  uploaderName?: string;
  uploaderAvatar?: string;
  uploaderUid?: string;
  totalSizeBytes?: number;
  isOpenStax?: boolean;
  source?: 'openstax' | 'community' | 'gutendex' | 'openlibrary' | 'admin';
  isNonCommercial?: boolean;
  verifiedPdfUrl?: string;
  openstaxPageUrl?: string;
  rexReaderUrl?: string;
  rexWebUrl?: string;
  status?: 'pending' | 'approved' | 'rejected';
  driveFileId?: string;
  attachedDocs?: any[];
  galleryImages?: string[];
  reviews?: any[];
  createdAt?: any;
}

export interface ResourceDetails extends ResourceResult {
  fullDescription?: string;
  subjects?: string[];
  tableOfContents?: string[];
  publishYear?: number | string;
}

export interface SearchOptions {
  limit?: number;
  faculty?: string;
  department?: string;
  level?: string;
  signal?: AbortSignal;
}

export interface ResourceProvider {
  id: string;
  name: string;
  search(query: string, options?: SearchOptions): Promise<ResourceResult[]>;
  getDetails?(resourceId: string): Promise<ResourceDetails>;
  getAssets?(resource: ResourceResult | ResourceDetails): Promise<ResourceAsset[]>;
}

export interface LocalAssetManifestEntry {
  resourceId: string;
  assetId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  localUri: string;
  downloadedAt: number;
  title: string;
  providerId: string;
  type: ResourceAssetType;
}
