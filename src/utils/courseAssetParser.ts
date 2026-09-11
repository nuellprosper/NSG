// NSG Multi-Media Course Asset Parser
// Inspects any course entry and parses:
// - Text notes (for the main WYSIWYG note body)
// - Attached PDFs (for downloadable study guides and textbooks)
// - Audio notes (for lecture recordings and voice memos)
// - Video notes (for video lectures and media guides)

export interface ParsedPdfDoc {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  isVerified?: boolean;
  license?: string;
  dataUrl?: string;
}

export interface ParsedAudioNote {
  id: string;
  name: string;
  audioUrl: string;
  duration?: number;
  createdAt: number;
  source?: string;
}

export interface ParsedVideoNote {
  id: string;
  title: string;
  videoUrl: string;
  duration?: number;
  thumbnailUrl?: string;
  createdAt: number;
  source?: string;
}

export interface ParsedCoursePackage {
  title: string;
  courseCode: string;
  faculty: string;
  department: string;
  level: string;
  semester: string;
  credits: number;
  source: string;
  isOpenStax: boolean;
  openstaxPageUrl?: string;
  rexReaderUrl?: string;
  uploaderName?: string;
  // Content blocks
  textContent: string;
  attachedPdfs: ParsedPdfDoc[];
  audioNotes: ParsedAudioNote[];
  videoNotes: ParsedVideoNote[];
  hasAudio: boolean;
  hasVideo: boolean;
  hasPdf: boolean;
  hasText: boolean;
}

/**
 * Parses any course object (OpenStax, Community, or Live Search) into structured multi-media components
 */
export function parseCourseAssets(course: any): ParsedCoursePackage {
  if (!course) {
    return {
      title: 'Untitled Course',
      courseCode: 'COURSE',
      faculty: 'General Academic',
      department: 'General',
      level: '100L',
      semester: 'First Semester',
      credits: 3,
      source: 'community',
      isOpenStax: false,
      textContent: '<p>No content available.</p>',
      attachedPdfs: [],
      audioNotes: [],
      videoNotes: [],
      hasAudio: false,
      hasVideo: false,
      hasPdf: false,
      hasText: false,
    };
  }

  const courseCode = (course.code || 'COURSE').toUpperCase().trim();
  const title = course.title || course.name || 'Untitled Course';
  const faculty = course.faculty || 'General Academic';
  const department = course.department || 'General';
  const level = course.level || '100L';
  const semester = course.semester || 'First Semester';
  const credits = Number(course.credits) || 3;
  const source = course.isOpenStax ? 'openstax' : (course.source || 'community');
  const isOpenStax = Boolean(course.isOpenStax || source === 'openstax');
  const uploaderName = course.uploaderName || (isOpenStax ? 'OpenStax Educator' : 'Omni Contributor');

  // 1. EXTRACT ATTACHED PDFS
  const attachedPdfs: ParsedPdfDoc[] = [];

  // Primary textbook / study guide PDF
  const primaryPdfUrl = course.verifiedPdfUrl || course.pdfUrl;
  if (primaryPdfUrl) {
    const cleanDocName = `${courseCode}_${title.replace(/[^a-zA-Z0-9]/g, '_')}_Textbook.pdf`;
    attachedPdfs.push({
      id: `pdf-primary-${course.id || Date.now()}`,
      name: cleanDocName,
      size: Number(course.totalSizeBytes) || 24000000,
      type: 'application/pdf',
      url: primaryPdfUrl,
      isVerified: true,
      license: course.license || 'Creative Commons Attribution (CC BY 4.0)',
    });
  } else if (course.driveFileId) {
    attachedPdfs.push({
      id: `drive-doc-${course.driveFileId}`,
      name: `${courseCode}_Study_Guide.pdf`,
      size: Number(course.totalSizeBytes) || 12000000,
      type: 'application/pdf',
      url: `/api/drive/download/${course.driveFileId}`,
      isVerified: true,
      license: 'Community Peer-Reviewed Document',
    });
  }

  // Check attachedDocs array from course
  if (Array.isArray(course.attachedDocs)) {
    course.attachedDocs.forEach((docItem: any, idx: number) => {
      const docUrl = docItem.verifiedPdfUrl || docItem.url || docItem.dataUrl;
      const isPdf = (docItem.type === 'pdf') || (docItem.name && docItem.name.toLowerCase().endsWith('.pdf')) || (docUrl && docUrl.toLowerCase().includes('.pdf'));
      
      // Prevent duplicates of the primary PDF
      if (docUrl && !attachedPdfs.some(p => p.url === docUrl || (p.name && docItem.name && p.name === docItem.name))) {
        attachedPdfs.push({
          id: docItem.id || `pdf-doc-${idx}-${Date.now()}`,
          name: docItem.name || `${courseCode}_material_${idx + 1}.pdf`,
          size: Number(docItem.size) || 1000000,
          type: docItem.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
          url: docUrl,
          dataUrl: docItem.dataUrl,
          isVerified: Boolean(docItem.verifiedPdfUrl || isOpenStax),
          license: docItem.license || course.license,
        });
      }
    });
  }

  // 2. EXTRACT AUDIO NOTES
  const audioNotes: ParsedAudioNote[] = [];

  // Check direct audioUrl or podcastAudioUrl
  if (course.audioUrl || course.podcastAudioUrl || course.lectureAudioUrl) {
    const aUrl = course.audioUrl || course.podcastAudioUrl || course.lectureAudioUrl;
    audioNotes.push({
      id: `audio-lecture-${course.id || Date.now()}`,
      name: `${courseCode} Audio Lecture & Audio Notes`,
      audioUrl: aUrl,
      duration: course.audioDuration || 600,
      createdAt: Date.now(),
      source: 'Lecture Audio',
    });
  }

  // Check audioRecordings array
  if (Array.isArray(course.audioRecordings)) {
    course.audioRecordings.forEach((aItem: any, idx: number) => {
      const aUrl = aItem.audioUrl || aItem.url;
      if (aUrl && !audioNotes.some(a => a.audioUrl === aUrl)) {
        audioNotes.push({
          id: aItem.id || `audio-${idx}-${Date.now()}`,
          name: aItem.name || `${courseCode} Audio Note ${idx + 1}`,
          audioUrl: aUrl,
          duration: aItem.duration || 180,
          createdAt: aItem.createdAt || Date.now(),
          source: aItem.source || 'Voice Memo',
        });
      }
    });
  }

  // Check audioNotes array
  if (Array.isArray(course.audioNotes)) {
    course.audioNotes.forEach((aItem: any, idx: number) => {
      const aUrl = typeof aItem === 'string' ? aItem : (aItem.url || aItem.audioUrl);
      if (aUrl && !audioNotes.some(a => a.audioUrl === aUrl)) {
        audioNotes.push({
          id: aItem.id || `audio-note-${idx}-${Date.now()}`,
          name: aItem.name || aItem.title || `${courseCode} Audio Lecture Summary ${idx + 1}`,
          audioUrl: aUrl,
          duration: aItem.duration || 240,
          createdAt: aItem.createdAt || Date.now(),
          source: 'Audio Summary',
        });
      }
    });
  }

  // 3. EXTRACT VIDEO NOTES
  const videoNotes: ParsedVideoNote[] = [];

  if (course.videoUrl || course.lectureVideoUrl) {
    const vUrl = course.videoUrl || course.lectureVideoUrl;
    videoNotes.push({
      id: `video-lecture-${course.id || Date.now()}`,
      title: `${courseCode} Video Lecture Guide`,
      videoUrl: vUrl,
      thumbnailUrl: course.thumbnailUrl || course.coverUrl,
      duration: course.videoDuration || 1200,
      createdAt: Date.now(),
      source: 'Video Lecture',
    });
  }

  if (Array.isArray(course.videoNotes)) {
    course.videoNotes.forEach((vItem: any, idx: number) => {
      const vUrl = typeof vItem === 'string' ? vItem : (vItem.url || vItem.videoUrl);
      if (vUrl && !videoNotes.some(v => v.videoUrl === vUrl)) {
        videoNotes.push({
          id: vItem.id || `video-${idx}-${Date.now()}`,
          title: vItem.title || vItem.name || `${courseCode} Video Overview ${idx + 1}`,
          videoUrl: vUrl,
          thumbnailUrl: vItem.thumbnailUrl || course.thumbnailUrl,
          duration: vItem.duration || 300,
          createdAt: vItem.createdAt || Date.now(),
          source: vItem.source || 'Video Notes',
        });
      }
    });
  }

  if (Array.isArray(course.videos)) {
    course.videos.forEach((vItem: any, idx: number) => {
      const vUrl = typeof vItem === 'string' ? vItem : (vItem.url || vItem.videoUrl);
      if (vUrl && !videoNotes.some(v => v.videoUrl === vUrl)) {
        videoNotes.push({
          id: vItem.id || `video-item-${idx}-${Date.now()}`,
          title: vItem.title || `${courseCode} Video Tutorial ${idx + 1}`,
          videoUrl: vUrl,
          thumbnailUrl: vItem.thumbnailUrl,
          duration: vItem.duration || 450,
          createdAt: Date.now(),
          source: 'Course Video',
        });
      }
    });
  }

  // 4. SYNTHESIZE RICH TEXT NOTES CONTENT
  let rawNotesText = course.notes || course.content || course.description || course.about || '';
  if (!rawNotesText && isOpenStax) {
    rawNotesText = `This peer-reviewed college course is authored by faculty experts under a Creative Commons license.\nIt provides comprehensive coverage of key topics, sample problems, chapter outlines, and student learning outcomes.`;
  }

  // Format the structured text content
  const formattedSections: string[] = [];
  formattedSections.push(`# ${courseCode}: ${title}`);
  formattedSections.push(`**Faculty**: ${faculty} | **Department**: ${department} | **Level**: ${level} (${semester})`);
  formattedSections.push(`**Author / Uploader**: ${uploaderName} | **Credits**: ${credits} Units`);
  
  if (course.license) {
    formattedSections.push(`**License**: ${course.license}`);
  }

  formattedSections.push(`\n---\n`);
  formattedSections.push(`## Course Overview & Lecture Notes\n`);
  formattedSections.push(rawNotesText);

  if (course.syllabus) {
    formattedSections.push(`\n## Official Syllabus & Learning Modules\n`);
    formattedSections.push(course.syllabus);
  }

  if (course.rexReaderUrl) {
    formattedSections.push(`\n## Web Reader & Digital Edition\n`);
    formattedSections.push(`Read the complete textbook online with interactive navigation at: [OpenStax Digital Reader](${course.rexReaderUrl})`);
  }

  const textContent = formattedSections.join('\n\n');

  return {
    title,
    courseCode,
    faculty,
    department,
    level,
    semester,
    credits,
    source,
    isOpenStax,
    openstaxPageUrl: course.openstaxPageUrl,
    rexReaderUrl: course.rexReaderUrl,
    uploaderName,
    textContent,
    attachedPdfs,
    audioNotes,
    videoNotes,
    hasAudio: audioNotes.length > 0,
    hasVideo: videoNotes.length > 0,
    hasPdf: attachedPdfs.length > 0,
    hasText: textContent.trim().length > 0,
  };
}
