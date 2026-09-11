import { LocalAssetManifestEntry } from './types';

const MANIFEST_STORAGE_KEY = 'nsg_offline_assets_manifest_v1';

/**
 * Manages the offline local assets manifest across IndexedDB and localStorage
 */
class LocalManifestManager {
  private inMemoryCache: Map<string, LocalAssetManifestEntry> = new Map();
  private isLoaded = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(MANIFEST_STORAGE_KEY);
      if (raw) {
        const list: LocalAssetManifestEntry[] = JSON.parse(raw);
        this.inMemoryCache.clear();
        for (const item of list) {
          this.inMemoryCache.set(this.buildKey(item.resourceId, item.assetId), item);
        }
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn('[LocalManifestManager] Failed to load manifest from storage:', err);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const list = Array.from(this.inMemoryCache.values());
      localStorage.setItem(MANIFEST_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('[LocalManifestManager] Failed to save manifest to storage:', err);
    }
  }

  private buildKey(resourceId: string, assetId?: string): string {
    return assetId ? `${resourceId}::${assetId}` : resourceId;
  }

  public registerLocalAsset(entry: LocalAssetManifestEntry): void {
    const key = this.buildKey(entry.resourceId, entry.assetId);
    this.inMemoryCache.set(key, entry);
    this.saveToStorage();
  }

  public getLocalAsset(resourceId: string, assetId?: string): LocalAssetManifestEntry | null {
    if (!this.isLoaded) this.loadFromStorage();
    if (assetId) {
      return this.inMemoryCache.get(this.buildKey(resourceId, assetId)) || null;
    }
    // If no specific assetId, find any asset for this resource
    for (const [k, v] of this.inMemoryCache.entries()) {
      if (k.startsWith(`${resourceId}::`) || v.resourceId === resourceId) {
        return v;
      }
    }
    return null;
  }

  public getAssetsForResource(resourceId: string): LocalAssetManifestEntry[] {
    if (!this.isLoaded) this.loadFromStorage();
    const results: LocalAssetManifestEntry[] = [];
    for (const v of this.inMemoryCache.values()) {
      if (v.resourceId === resourceId) {
        results.push(v);
      }
    }
    return results;
  }

  public isResourceOffline(resourceId: string): boolean {
    if (!this.isLoaded) this.loadFromStorage();
    return this.getAssetsForResource(resourceId).length > 0;
  }

  public getAllLocalAssets(): LocalAssetManifestEntry[] {
    if (!this.isLoaded) this.loadFromStorage();
    return Array.from(this.inMemoryCache.values());
  }

  public removeLocalAsset(resourceId: string, assetId?: string): void {
    if (assetId) {
      this.inMemoryCache.delete(this.buildKey(resourceId, assetId));
    } else {
      const keysToDelete: string[] = [];
      for (const [k, v] of this.inMemoryCache.entries()) {
        if (v.resourceId === resourceId) keysToDelete.push(k);
      }
      for (const k of keysToDelete) {
        this.inMemoryCache.delete(k);
      }
    }
    this.saveToStorage();
  }
}

export const localManifest = new LocalManifestManager();
