import { ResourceProvider, ResourceResult, ResourceAsset, SearchOptions } from '../types';

export class GutendexProvider implements ResourceProvider {
  public readonly id = 'gutendex';
  public readonly name = 'Project Gutenberg';

  public async search(query: string, options?: SearchOptions): Promise<ResourceResult[]> {
    const q = query.trim();
    if (!q || q.length < 2) return [];

    const url = `https://gutendex.com/books?search=${encodeURIComponent(q)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: options?.signal,
      });

      if (!response.ok) {
        console.warn(`[GutendexProvider] API returned HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.results)) {
        return [];
      }

      const results: ResourceResult[] = [];

      for (const book of data.results) {
        const formats = book.formats || {};

        // Extract legitimate asset URLs directly from API
        const epubUrl = formats['application/epub+zip'] || formats['application/x-mobipocket-ebook'];
        const txtUrl = formats['text/plain; charset=utf-8'] || formats['text/plain'] || formats['text/plain; charset=us-ascii'];
        const htmlUrl = formats['text/html'] || formats['text/html; charset=utf-8'];
        const coverUrl = formats['image/jpeg'] || formats['image/png'];
        const pdfUrl = formats['application/pdf'];

        const authorName = Array.isArray(book.authors) && book.authors.length > 0
          ? this.formatAuthorName(book.authors[0].name)
          : 'Project Gutenberg Contributor';

        const sourcePageUrl = `https://www.gutenberg.org/ebooks/${book.id}`;
        const cleanTitle = (book.title || 'Untitled Book').replace(/[\r\n]+/g, ' ').trim();
        const safeTitleSlug = cleanTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);

        const assets: ResourceAsset[] = [];

        // 1. EPUB asset (legitimate downloadable)
        if (epubUrl) {
          assets.push({
            id: `gutenberg-epub-${book.id}`,
            type: 'epub',
            url: epubUrl,
            mimeType: 'application/epub+zip',
            fileName: `${safeTitleSlug}_Gutenberg.epub`,
            downloadable: true,
            sourceUrl: sourcePageUrl,
            label: 'Download EPUB E-Book',
          });
        }

        // 2. Plain Text asset (legitimate downloadable & readable in Notes)
        if (txtUrl) {
          assets.push({
            id: `gutenberg-txt-${book.id}`,
            type: 'txt',
            url: txtUrl,
            mimeType: 'text/plain',
            fileName: `${safeTitleSlug}_Gutenberg.txt`,
            downloadable: true,
            sourceUrl: sourcePageUrl,
            label: 'Download Plain Text (Notes)',
          });
        }

        // 3. PDF asset if present
        if (pdfUrl) {
          assets.push({
            id: `gutenberg-pdf-${book.id}`,
            type: 'pdf',
            url: pdfUrl,
            mimeType: 'application/pdf',
            fileName: `${safeTitleSlug}_Gutenberg.pdf`,
            downloadable: true,
            sourceUrl: sourcePageUrl,
            label: 'Download PDF',
          });
        }

        // 4. HTML Web Reader (Readable Online)
        if (htmlUrl) {
          assets.push({
            id: `gutenberg-html-${book.id}`,
            type: 'html',
            url: htmlUrl,
            mimeType: 'text/html',
            downloadable: false,
            sourceUrl: sourcePageUrl,
            label: 'Read Online in Browser',
          });
        }

        const subjects = Array.isArray(book.subjects) ? book.subjects.slice(0, 3).join(', ') : '';
        const description = subjects 
          ? `Public-domain digital edition from Project Gutenberg. Subjects: ${subjects}.`
          : 'Public-domain classic book and literary resource from Project Gutenberg.';

        const isDownloadable = Boolean(epubUrl || txtUrl || pdfUrl);
        const isReadableOnline = Boolean(htmlUrl);

        results.push({
          id: `gutendex-${book.id}`,
          title: cleanTitle,
          author: authorName,
          description,
          coverUrl,
          providerId: this.id,
          providerName: this.name,
          sourceUrl: sourcePageUrl,
          license: 'Public Domain / Project Gutenberg License',
          capabilities: {
            readableOnline: isReadableOnline,
            downloadable: isDownloadable,
            borrowable: false,
          },
          assets,

          // Compatibility fields
          code: `PG-${book.id}`,
          faculty: 'Faculty of Arts / Humanities',
          department: 'Literature and Classics',
          level: 'Public Domain',
          semester: 'Open Archive',
          notes: description,
          likesCount: book.download_count ? Math.min(book.download_count, 999) : 42,
          rating: 4.8,
          reviewsCount: Math.max(1, Math.floor((book.download_count || 100) / 50)),
          uploaderName: 'Project Gutenberg',
          source: 'gutendex',
          status: 'approved',
          rexReaderUrl: htmlUrl,
        });
      }

      return results.slice(0, options?.limit || 15);
    } catch (err: any) {
      if (err?.name === 'AbortError') return [];
      console.warn('[GutendexProvider] Search failed:', err?.message || err);
      return [];
    }
  }

  private formatAuthorName(name: string): string {
    if (!name) return 'Unknown Author';
    // Names often formatted as "Last, First"
    if (name.includes(',')) {
      const parts = name.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        return `${parts[1]} ${parts[0]}`;
      }
    }
    return name;
  }
}
