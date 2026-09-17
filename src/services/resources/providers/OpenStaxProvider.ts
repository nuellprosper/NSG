import { ResourceProvider, ResourceResult, ResourceAsset, SearchOptions } from '../types';
import { OPENSTAX_STARTER_CATALOG, matchOrSynthesizeOpenStaxCourse } from '../../../data/openstaxCatalog';

export class OpenStaxProvider implements ResourceProvider {
  public readonly id = 'openstax';
  public readonly name = 'OpenStax';

  public async search(query: string, options?: SearchOptions): Promise<ResourceResult[]> {
    const q = query.trim().toLowerCase();
    const results: ResourceResult[] = [];

    // 1. Search local verified OpenStax catalog
    let matchedEntries = OPENSTAX_STARTER_CATALOG.filter(entry => {
      const codeMatch = entry.code.toLowerCase().includes(q);
      const titleMatch = entry.title.toLowerCase().includes(q);
      const deptMatch = entry.department.toLowerCase().includes(q);
      const facultyMatch = entry.faculty.toLowerCase().includes(q);
      const notesMatch = entry.notes ? entry.notes.toLowerCase().includes(q) : false;
      return codeMatch || titleMatch || deptMatch || facultyMatch || notesMatch;
    });

    // Filter by faculty if specified
    if (options?.faculty && options.faculty !== 'ALL') {
      matchedEntries = matchedEntries.filter(e => e.faculty === options.faculty);
    }

    // 2. If nothing matched and query length >= 2, execute synthesizer / matcher
    if (matchedEntries.length === 0 && q.length >= 2) {
      const synthesized = matchOrSynthesizeOpenStaxCourse(query);
      if (synthesized) {
        matchedEntries = [synthesized];
      }
    }

    // 3. Map into Normalized ResourceResult model
    for (const entry of matchedEntries) {
      const assets: ResourceAsset[] = [];

      // Primary verified PDF asset
      if (entry.verifiedPdfUrl) {
        assets.push({
          id: `openstax-pdf-${entry.id}`,
          type: 'pdf',
          url: entry.verifiedPdfUrl,
          mimeType: 'application/pdf',
          fileName: `${entry.code.replace(/\s+/g, '_')}_${entry.title.replace(/[^a-zA-Z0-9]/g, '_')}_OpenStax.pdf`,
          sizeBytes: entry.totalSizeBytes || 24000000,
          downloadable: true,
          sourceUrl: entry.openstaxPageUrl || entry.verifiedPdfUrl,
          label: 'Official Textbook PDF',
        });
      }

      // Online Interactive Rex Reader asset (Readable Online)
      if (entry.rexReaderUrl || entry.openstaxPageUrl) {
        assets.push({
          id: `openstax-web-${entry.id}`,
          type: 'html',
          url: entry.rexReaderUrl || entry.openstaxPageUrl,
          mimeType: 'text/html',
          downloadable: false,
          sourceUrl: entry.openstaxPageUrl,
          label: 'Interactive Web Reader',
        });
      }

      // Attached additional study guides
      if (Array.isArray(entry.attachedDocs)) {
        entry.attachedDocs.forEach((doc, idx) => {
          if (doc.url && doc.url !== entry.verifiedPdfUrl) {
            assets.push({
              id: doc.id || `openstax-doc-${idx}`,
              type: 'pdf',
              url: doc.url,
              mimeType: 'application/pdf',
              fileName: doc.name || `${entry.code}_Guide_${idx + 1}.pdf`,
              sizeBytes: doc.size || 5000000,
              downloadable: true,
              sourceUrl: entry.openstaxPageUrl || doc.url,
              label: doc.name || 'Study Material',
            });
          }
        });
      }

      const publisherUrl = entry.openstaxPageUrl || (entry.slug ? `https://openstax.org/details/books/${entry.slug}` : undefined);
      const readingUrl = entry.rexReaderUrl || entry.openstaxPageUrl || undefined;

      results.push({
        id: entry.id,
        title: entry.title,
        author: entry.uploaderName || 'OpenStax, Rice University',
        description: entry.notes,
        coverUrl: entry.coverUrl,
        providerId: this.id,
        providerName: this.name,
        sourceUrl: publisherUrl || `https://openstax.org/details/books/${entry.slug}`,
        publisherUrl,
        readingUrl,
        license: entry.license || 'Creative Commons Attribution 4.0 (CC BY 4.0)',
        category: entry.department || entry.faculty || 'Open Educational Resource',
        providerBadgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
        capabilities: {
          readableOnline: Boolean(readingUrl),
          downloadable: Boolean(entry.verifiedPdfUrl),
          borrowable: false,
        },
        assets,

        // Backwards compatibility with CourseMaterial
        code: entry.code,
        faculty: entry.faculty,
        department: entry.department,
        level: entry.level,
        semester: entry.semester,
        notes: entry.notes,
        likesCount: entry.likesCount || 0,
        rating: entry.rating || 5.0,
        reviewsCount: entry.reviewsCount || 0,
        uploaderName: entry.uploaderName,
        totalSizeBytes: entry.totalSizeBytes,
        isOpenStax: true,
        source: 'openstax',
        verifiedPdfUrl: entry.verifiedPdfUrl,
        openstaxPageUrl: entry.openstaxPageUrl,
        rexReaderUrl: entry.rexReaderUrl,
        status: 'approved',
        attachedDocs: entry.attachedDocs,
      });
    }

    return results.slice(0, options?.limit || 20);
  }
}
