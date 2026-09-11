import { ResourceProvider, ResourceResult, SearchOptions } from './types';
import { OpenStaxProvider } from './providers/OpenStaxProvider';
import { GutendexProvider } from './providers/GutendexProvider';
import { OpenLibraryProvider } from './providers/OpenLibraryProvider';
import { CommunityDriveProvider } from './providers/CommunityDriveProvider';

export class ResourceSearchOrchestrator {
  private providers: Map<string, ResourceProvider> = new Map();
  private activeAbortController: AbortController | null = null;

  constructor() {
    // Register default providers
    this.registerProvider(new OpenStaxProvider());
    this.registerProvider(new CommunityDriveProvider());
    this.registerProvider(new GutendexProvider());
    this.registerProvider(new OpenLibraryProvider());
  }

  public registerProvider(provider: ResourceProvider): void {
    this.providers.set(provider.id, provider);
  }

  public unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  public getProviders(): ResourceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Concurrently searches all registered providers with timeout, normalization,
   * deduplication, and relevance ranking.
   */
  public async search(query: string, options?: SearchOptions): Promise<ResourceResult[]> {
    // Cancel previous inflight search
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }
    this.activeAbortController = new AbortController();
    const currentSignal = this.activeAbortController.signal;

    const trimmed = query.trim();
    const providersList = Array.from(this.providers.values());

    // Run all providers concurrently with timeout protection
    const timeoutMs = 7000;

    const promises = providersList.map(async (provider) => {
      try {
        const timeoutPromise = new Promise<ResourceResult[]>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        const searchPromise = provider.search(trimmed, {
          ...options,
          signal: currentSignal,
        });

        return await Promise.race([searchPromise, timeoutPromise]);
      } catch (err: any) {
        if (err?.name === 'AbortError') return [];
        console.warn(`[ResourceSearchOrchestrator] Provider "${provider.name}" failed:`, err?.message || err);
        return [];
      }
    });

    const settledResults = await Promise.allSettled(promises);
    const allResults: ResourceResult[] = [];

    for (const res of settledResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allResults.push(...res.value);
      }
    }

    // Deduplicate results by normalized title & author or ID
    const deduped: ResourceResult[] = [];
    const seenKeys = new Set<string>();

    for (const item of allResults) {
      const key = `${(item.code || '').toLowerCase()}_${item.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (!seenKeys.has(key) && !seenKeys.has(item.id)) {
        seenKeys.add(key);
        seenKeys.add(item.id);
        deduped.push(item);
      }
    }

    // Rank results according to user query relevance
    return this.rankResults(deduped, trimmed);
  }

  /**
   * Relevance ranking algorithm
   * 1. Exact code match (e.g. "MTH 101")
   * 2. Title begins with query
   * 3. Title contains query
   * 4. Author contains query
   * 5. Description / notes contains query
   */
  private rankResults(items: ResourceResult[], query: string): ResourceResult[] {
    if (!query) return items;
    const q = query.toLowerCase();

    return [...items].sort((a, b) => {
      const aCode = (a.code || '').toLowerCase();
      const bCode = (b.code || '').toLowerCase();
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      // 1. Exact course code match
      if (aCode === q && bCode !== q) return -1;
      if (bCode === q && aCode !== q) return 1;

      // 2. Code starts with query
      if (aCode.startsWith(q) && !bCode.startsWith(q)) return -1;
      if (bCode.startsWith(q) && !aCode.startsWith(q)) return 1;

      // 3. Title exact match
      if (aTitle === q && bTitle !== q) return -1;
      if (bTitle === q && aTitle !== q) return 1;

      // 4. Title starts with query
      if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1;
      if (bTitle.startsWith(q) && !aTitle.startsWith(q)) return 1;

      // 5. Title contains query
      const aHasTitle = aTitle.includes(q);
      const bHasTitle = bTitle.includes(q);
      if (aHasTitle && !bHasTitle) return -1;
      if (bHasTitle && !aHasTitle) return 1;

      return 0;
    });
  }
}

export const resourceSearchOrchestrator = new ResourceSearchOrchestrator();
