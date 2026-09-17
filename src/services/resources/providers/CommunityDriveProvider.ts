import { ResourceProvider, ResourceResult, ResourceAsset, SearchOptions } from '../types';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { apiUrl } from '../../apiConfig';

export class CommunityDriveProvider implements ResourceProvider {
  public readonly id = 'community';
  public readonly name = 'NSG Community Drive';

  public async search(queryText: string, options?: SearchOptions): Promise<ResourceResult[]> {
    const q = queryText.trim().toLowerCase();
    const results: ResourceResult[] = [];

    try {
      // 1. Query Firestore for approved resources ONLY.
      // HARD REQUIREMENT: Under NO circumstances may 'pending' or 'rejected' items be exposed.
      const coursesRef = collection(db, 'courses');
      const qConstraints = [
        where('status', '==', 'approved'),
        limit(options?.limit || 30)
      ];

      const snap = await getDocs(query(coursesRef, ...qConstraints));

      snap.forEach(docSnap => {
        const data = docSnap.data();

        // 2. Client-side Defense-in-Depth check:
        // Even if Firestore returned it, reject immediately if status is not strictly 'approved'
        if (data.status !== 'approved') {
          return;
        }

        // Match against query text (code, title, faculty, department, notes)
        if (q) {
          const code = (data.code || '').toLowerCase();
          const title = (data.title || data.name || '').toLowerCase();
          const dept = (data.department || '').toLowerCase();
          const faculty = (data.faculty || '').toLowerCase();
          const notes = (data.notes || '').toLowerCase();

          const matches = code.includes(q) || title.includes(q) || dept.includes(q) || faculty.includes(q) || notes.includes(q);
          if (!matches) {
            return;
          }
        }

        // Filter by faculty if specified
        if (options?.faculty && options.faculty !== 'ALL' && data.faculty !== options.faculty) {
          return;
        }

        const courseId = docSnap.id;
        const code = data.code || 'COURSE';
        const title = data.title || data.name || 'Community Resource';
        const driveFileId = data.driveFileId;
        const pdfUrl = data.verifiedPdfUrl || data.pdfUrl;

        const assets: ResourceAsset[] = [];

        // Primary PDF / Drive asset
        if (driveFileId) {
          assets.push({
            id: `comm-drive-${driveFileId}`,
            type: 'pdf',
            url: apiUrl(`/api/drive/download/${driveFileId}`),
            mimeType: 'application/pdf',
            fileName: `${code}_Study_Guide.pdf`,
            sizeBytes: data.totalSizeBytes || 12000000,
            downloadable: true,
            sourceUrl: apiUrl(`/api/drive/download/${driveFileId}`),
            label: 'Download Peer Study Guide (PDF)',
          });
        } else if (pdfUrl) {
          assets.push({
            id: `comm-pdf-${courseId}`,
            type: 'pdf',
            url: pdfUrl,
            mimeType: 'application/pdf',
            fileName: `${code}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            sizeBytes: data.totalSizeBytes || 10000000,
            downloadable: true,
            sourceUrl: pdfUrl,
            label: 'Download Verified Material (PDF)',
          });
        }

        // Additional attached documents
        if (Array.isArray(data.attachedDocs)) {
          data.attachedDocs.forEach((docItem: any, idx: number) => {
            const docUrl = docItem.verifiedPdfUrl || docItem.url;
            if (docUrl) {
              const isPdf = (docItem.type === 'pdf') || (docItem.name && docItem.name.toLowerCase().endsWith('.pdf'));
              assets.push({
                id: docItem.id || `comm-doc-${idx}`,
                type: isPdf ? 'pdf' : 'docx',
                url: docUrl,
                mimeType: isPdf ? 'application/pdf' : 'application/octet-stream',
                fileName: docItem.name || `${code}_attachment_${idx + 1}`,
                sizeBytes: docItem.size || 2000000,
                downloadable: true,
                sourceUrl: docUrl,
                label: docItem.name || 'Attached Resource',
              });
            }
          });
        }

        results.push({
          id: courseId,
          title,
          author: data.uploaderName || 'NSG Student Peer',
          description: data.notes || 'Peer-reviewed academic study guide and lecture materials.',
          coverUrl: data.coverUrl,
          providerId: this.id,
          providerName: this.name,
          sourceUrl: `/courses/${courseId}`,
          readingUrl: assets.length > 0 ? assets[0].url : '',
          license: 'Community Peer-Reviewed Educational Material',
          category: data.faculty || 'Peer Academic Material',
          providerBadgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
          capabilities: {
            readableOnline: true,
            downloadable: assets.length > 0,
            borrowable: false,
          },
          assets,

          // Compatibility fields
          code: data.code,
          faculty: data.faculty || 'General Academic',
          department: data.department || 'General',
          level: data.level || '100L',
          semester: data.semester || 'First Semester',
          notes: data.notes,
          likesCount: data.likesCount || 0,
          rating: data.rating || 4.9,
          reviewsCount: data.reviewsCount || 0,
          uploaderName: data.uploaderName,
          uploaderUid: data.uploaderUid,
          totalSizeBytes: data.totalSizeBytes,
          isOpenStax: false,
          source: 'community',
          verifiedPdfUrl: pdfUrl,
          driveFileId: data.driveFileId,
          status: 'approved',
          attachedDocs: data.attachedDocs,
          galleryImages: data.galleryImages,
          reviews: data.reviews,
        });
      });
    } catch (err: any) {
      console.warn('[CommunityDriveProvider] Firestore search error:', err?.message || err);
    }

    return results;
  }
}
