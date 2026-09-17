import { ResourceProvider, ResourceResult, ResourceAsset, SearchOptions } from '../types';

function normalizeGutenbergCategory(subjects?: string[], bookshelves?: string[]): string {
  const combined = [...(subjects || []), ...(bookshelves || [])].join(' ').toLowerCase();
  if (combined.includes('math') || combined.includes('calculus') || combined.includes('algebra') || combined.includes('geometry')) {
    return 'Mathematics';
  }
  if (combined.includes('physic') || combined.includes('chemist') || combined.includes('biolog') || combined.includes('astronom') || combined.includes('geolog') || combined.includes('science')) {
    return 'Science';
  }
  if (combined.includes('philosoph') || combined.includes('ethics') || combined.includes('logic')) {
    return 'Philosophy';
  }
  if (combined.includes('histor') || combined.includes('war') || combined.includes('civilization') || combined.includes('revolution')) {
    return 'History';
  }
  if (combined.includes('econom') || combined.includes('business') || combined.includes('finance') || combined.includes('commerce')) {
    return 'Business & Economics';
  }
  if (combined.includes('law') || combined.includes('politics') || combined.includes('government') || combined.includes('political')) {
    return 'Social Sciences & Law';
  }
  if (combined.includes('art') || combined.includes('music') || combined.includes('theater') || combined.includes('poetry') || combined.includes('drama')) {
    return 'Arts & Humanities';
  }
  if (combined.includes('fiction') || combined.includes('literature') || combined.includes('novel') || combined.includes('story') || combined.includes('stories')) {
    return 'Classic Literature';
  }
  return 'General Literature';
}

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
          : undefined;

        const publisherUrl = `https://www.gutenberg.org/ebooks/${book.id}`;
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
            sourceUrl: publisherUrl,
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
            sourceUrl: publisherUrl,
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
            sourceUrl: publisherUrl,
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
            sourceUrl: publisherUrl,
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
          coverUrl: coverUrl || '',
          providerId: this.id,
          providerName: this.name,
          sourceUrl: publisherUrl,
          publisherUrl,
          readingUrl: htmlUrl || '',
          license: 'Public Domain / Project Gutenberg License',
          category: normalizeGutenbergCategory(book.subjects, book.bookshelves),
          providerBadgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
          capabilities: {
            readableOnline: isReadableOnline,
            downloadable: isDownloadable,
            borrowable: false,
          },
          assets,

          // Safe compatibility fields
          code: `PG-${book.id}`,
          faculty: 'General Academic',
          department: 'Literature & Humanities',
          level: '100L',
          notes: description,
          likesCount: book.download_count ? Math.min(book.download_count, 999) : 42,
          rating: 4.8,
          reviewsCount: Math.max(1, Math.floor((book.download_count || 100) / 50)),
          uploaderName: 'Project Gutenberg',
          source: 'gutendex',
          status: 'approved',
          rexReaderUrl: htmlUrl || undefined,
          openstaxPageUrl: publisherUrl,
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
