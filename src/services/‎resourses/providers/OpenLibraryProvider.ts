import { ResourceProvider, ResourceResult, ResourceAsset, SearchOptions } from '../types';

export class OpenLibraryProvider implements ResourceProvider {
  public readonly id = 'openlibrary';
  public readonly name = 'Open Library';

  public async search(query: string, options?: SearchOptions): Promise<ResourceResult[]> {
    const q = query.trim();
    if (!q || q.length < 2) return [];

    const limit = options?.limit || 12;
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,ebook_access,ia,has_fulltext,lending_edition_s,public_scan_b`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: options?.signal,
      });

      if (!response.ok) {
        console.warn(`[OpenLibraryProvider] API returned HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.docs)) {
        return [];
      }

      const results: ResourceResult[] = [];

      for (const doc of data.docs) {
        const title = (doc.title || 'Untitled Work').trim();
        const author = Array.isArray(doc.author_name) && doc.author_name.length > 0
          ? doc.author_name.slice(0, 2).join(', ')
          : 'Open Library Author';

        const coverUrl = doc.cover_i 
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` 
          : undefined;

        const sourceUrl = doc.key ? `https://openlibrary.org${doc.key}` : `https://openlibrary.org/search?q=${encodeURIComponent(title)}`;
        const ebookAccess = doc.ebook_access || 'no_ebook';
        const isPublic = ebookAccess === 'public';
        const isBorrowable = ebookAccess === 'borrowable';

        const assets: ResourceAsset[] = [];

        // 1. If public full text is available for online reading
        if (isPublic && doc.has_fulltext) {
          const readUrl = doc.ia && doc.ia.length > 0
            ? `https://archive.org/details/${doc.ia[0]}/mode/2up`
            : sourceUrl;

          assets.push({
            id: `ol-read-${doc.key.replace(/[^a-zA-Z0-9]/g, '_')}`,
            type: 'html',
            url: readUrl,
            mimeType: 'text/html',
            downloadable: false,
            sourceUrl,
            label: 'Read Online (Open Access Archive)',
          });
        }

        // 2. If borrowable digital lending
        if (isBorrowable) {
          const borrowUrl = doc.lending_edition_s
            ? `https://openlibrary.org/books/${doc.lending_edition_s}`
            : sourceUrl;

          assets.push({
            id: `ol-borrow-${doc.key.replace(/[^a-zA-Z0-9]/g, '_')}`,
            type: 'html',
            url: borrowUrl,
            mimeType: 'text/html',
            downloadable: false,
            sourceUrl: borrowUrl,
            label: 'Borrow on Open Library Lending',
          });
        }

        const description = `Published in ${doc.first_publish_year || 'various editions'}. Available through Open Library & Internet Archive digital lending collection.`;

        // Strict capability assignment
        const capabilities = {
          readableOnline: isPublic && Boolean(doc.has_fulltext),
          downloadable: false, // Open Library controlled lending does not permit raw binary downloads without DRM/checkout
          borrowable: isBorrowable,
        };

        const cleanKeyId = doc.key ? doc.key.replace('/works/', 'ol-') : `ol-${Math.random().toString(36).slice(2)}`;

        results.push({
          id: cleanKeyId,
          title,
          author,
          description,
          coverUrl,
          providerId: this.id,
          providerName: this.name,
          sourceUrl,
          license: isPublic ? 'Public Access / Open Library' : 'Controlled Digital Lending (Internet Archive)',
          capabilities,
          assets,

          // Compatibility fields
          code: `OL-${doc.first_publish_year || 'BOOK'}`,
          faculty: 'Faculty of Arts / Humanities',
          department: 'Academic Library Collection',
          level: isBorrowable ? 'Borrowable Digital Edition' : 'Library Record',
          semester: 'Digital Lending',
          notes: description,
          likesCount: 18,
          rating: 4.7,
          reviewsCount: 12,
          uploaderName: 'Open Library',
          source: 'openlibrary',
          status: 'approved',
          openstaxPageUrl: sourceUrl,
          rexReaderUrl: assets.length > 0 ? assets[0].url : undefined,
        });
      }

      return results;
    } catch (err: any) {
      if (err?.name === 'AbortError') return [];
      console.warn('[OpenLibraryProvider] Search error:', err?.message || err);
      return [];
    }
  }
}
