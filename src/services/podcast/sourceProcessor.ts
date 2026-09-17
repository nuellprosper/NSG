import { 
  SourceNode, 
  PodcastSourceType 
} from '../../types/podcast';
import { 
  extractPdfDetails, 
  extractTextFromDocument, 
  getAiInstance, 
  FLASH_MODEL 
} from '../../utils';

// Global in-memory cache to prevent duplicate extraction across session
const processedSourceCache = new Map<string, SourceNode[]>();

/**
 * Fast, deterministic DJB2-based string hash for content tracking
 */
export function calculateContentHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash).toString(36)}_${input.length}`;
}

/**
 * Strips HTML tags and normalizes whitespace from rich-text editor content
 */
export function normalizeHtmlText(html: string): string {
  if (!html) return '';
  // Basic DOM parser if in browser
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return (doc.body.textContent || '').trim();
    } catch (e) {
      // Fallback regex
    }
  }
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>|<\/div>|<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Processes plain note text into structured source nodes (sections)
 */
export function processNoteText(noteId: string, noteTitle: string, rawContent: string): SourceNode[] {
  const cleanText = normalizeHtmlText(rawContent);
  if (!cleanText) return [];

  const baseHash = calculateContentHash(cleanText);
  const cacheKey = `note_text_${noteId}_${baseHash}`;
  if (processedSourceCache.has(cacheKey)) {
    return processedSourceCache.get(cacheKey)!;
  }

  const nodes: SourceNode[] = [];
  const now = new Date().toISOString();

  // Root note text node
  const rootNode: SourceNode = {
    id: `src_note_${noteId}`,
    type: 'note_text',
    name: noteTitle || 'Note Body',
    sourceVersion: 1,
    contentHash: baseHash,
    extractedContent: cleanText,
    summary: cleanText.slice(0, 300) + (cleanText.length > 300 ? '...' : ''),
    processedAt: now,
    metadata: {
      charCount: cleanText.length,
      wordCount: cleanText.split(/\s+/).filter(Boolean).length
    }
  };
  nodes.push(rootNode);

  // Split into manageable paragraphs / sections for precise grounding
  const paragraphs = cleanText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  paragraphs.forEach((p, idx) => {
    const pHash = calculateContentHash(p);
    nodes.push({
      id: `src_sec_${noteId}_${idx + 1}`,
      type: 'text_section',
      name: `${noteTitle} - Section ${idx + 1}`,
      sourceVersion: 1,
      contentHash: pHash,
      sectionIndex: idx + 1,
      extractedContent: p,
      summary: p.slice(0, 150),
      processedAt: now,
      metadata: {
        parentSourceId: rootNode.id
      }
    });
  });

  processedSourceCache.set(cacheKey, nodes);
  return nodes;
}

/**
 * Extracts and analyzes an image using Gemini Vision to produce educational insights
 */
export async function processImageSource(
  imageItem: { id?: string; name?: string; url: string },
  noteId: string,
  folderId?: string
): Promise<SourceNode[]> {
  const url = imageItem.url;
  if (!url) return [];

  const cacheKey = `img_${calculateContentHash(url)}`;
  if (processedSourceCache.has(cacheKey)) {
    return processedSourceCache.get(cacheKey)!;
  }

  const now = new Date().toISOString();
  const imageName = imageItem.name || 'Diagram / Image';
  let extractedContent = '';

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const mimeType = blob.type || 'image/jpeg';

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = (reader.result as string).split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const aiInstance = getAiInstance();
    const prompt = `You are an expert academic visual analyst for an educational podcast.
Analyze this academic image or diagram thoroughly:
1. Identify and transcribe any visible formulas, equations, text, labels, or numbers.
2. If this is a diagram, flowchart, or graph, explain exactly what process, relationship, or data it communicates.
3. Highlight key concepts, variables, and potential student misconceptions.
Be comprehensive and grounded. Return clear, educational markdown.`;

    const response = await aiInstance.models.generateContent({
      model: FLASH_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      ]
    });

    extractedContent = response.text || `Visual image: ${imageName}`;
  } catch (err: any) {
    console.warn(`Vision extraction note for ${imageName}:`, err);
    extractedContent = `[Educational Image: ${imageName}. Direct vision analysis offline or unavailable.]`;
  }

  const node: SourceNode = {
    id: imageItem.id || `src_img_${Math.random().toString(36).substring(7)}`,
    type: 'image',
    name: imageName,
    folderId,
    sourceVersion: 1,
    contentHash: calculateContentHash(extractedContent + url),
    extractedContent,
    summary: extractedContent.slice(0, 200),
    mediaUrl: url,
    processedAt: now,
    metadata: {
      originalUrl: url
    }
  };

  const results = [node];
  processedSourceCache.set(cacheKey, results);
  return results;
}

/**
 * Transcribes audio recordings or audio notes using Gemini Audio Transcription
 */
export async function processAudioSource(
  audioItem: { id?: string; name?: string; url?: string; audioUrl?: string; duration?: number },
  noteId: string,
  folderId?: string
): Promise<SourceNode[]> {
  const audioUrl = audioItem.url || audioItem.audioUrl;
  if (!audioUrl) return [];

  const cacheKey = `aud_${calculateContentHash(audioUrl)}`;
  if (processedSourceCache.has(cacheKey)) {
    return processedSourceCache.get(cacheKey)!;
  }

  const now = new Date().toISOString();
  const audioName = audioItem.name || 'Voice Lecture Recording';
  let transcript = '';

  try {
    const res = await fetch(audioUrl);
    const blob = await res.blob();
    const mimeType = blob.type || 'audio/webm';

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = (reader.result as string).split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const aiInstance = getAiInstance();
    const prompt = `You are an expert academic audio transcriber.
Transcribe this lecture recording accurately:
- Extract all spoken academic concepts, definitions, explanations, formulas, and teacher instructions.
- Preserve natural segments and note any speaker shifts or key emphasis.
- Provide a clean, organized verbatim transcription.`;

    const response = await aiInstance.models.generateContent({
      model: FLASH_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      ]
    });

    transcript = response.text || `Spoken audio: ${audioName}`;
  } catch (err: any) {
    console.warn(`Audio transcription note for ${audioName}:`, err);
    transcript = `[Audio recording: ${audioName}. Direct transcription unavailable.]`;
  }

  const rootAudioNode: SourceNode = {
    id: audioItem.id || `src_aud_${Math.random().toString(36).substring(7)}`,
    type: 'audio',
    name: audioName,
    folderId,
    sourceVersion: 1,
    contentHash: calculateContentHash(transcript + audioUrl),
    extractedContent: transcript,
    summary: transcript.slice(0, 250),
    mediaUrl: audioUrl,
    processedAt: now,
    metadata: {
      durationSeconds: audioItem.duration || 0
    }
  };

  const results: SourceNode[] = [rootAudioNode];

  // If transcript is long, create segment nodes for granular provenance
  const segments = transcript.split(/\n\n+/).filter(s => s.trim().length > 30);
  if (segments.length > 1) {
    segments.forEach((seg, sIdx) => {
      results.push({
        id: `${rootAudioNode.id}_seg_${sIdx + 1}`,
        type: 'audio_segment',
        name: `${audioName} (Segment ${sIdx + 1})`,
        folderId,
        sourceVersion: 1,
        contentHash: calculateContentHash(seg),
        extractedContent: seg.trim(),
        sectionIndex: sIdx + 1,
        summary: seg.slice(0, 150),
        processedAt: now,
        metadata: {
          parentAudioId: rootAudioNode.id
        }
      });
    });
  }

  processedSourceCache.set(cacheKey, results);
  return results;
}

/**
 * Extracts text and page breakdowns from PDFs and documents
 */
export async function processDocumentOrPdfSource(
  docItem: { id?: string; name: string; url: string; type?: string },
  noteId: string,
  folderId?: string
): Promise<SourceNode[]> {
  const url = docItem.url;
  const name = docItem.name || 'Document';
  if (!url) return [];

  const cacheKey = `doc_${calculateContentHash(url + name)}`;
  if (processedSourceCache.has(cacheKey)) {
    return processedSourceCache.get(cacheKey)!;
  }

  const now = new Date().toISOString();
  const isPdf = name.toLowerCase().endsWith('.pdf') || (docItem.type && docItem.type.includes('pdf'));
  const nodes: SourceNode[] = [];

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], name, { type: blob.type });

    if (isPdf) {
      const pdfDetails = await extractPdfDetails(file);
      const rootPdfNode: SourceNode = {
        id: docItem.id || `src_pdf_${Math.random().toString(36).substring(7)}`,
        type: 'pdf',
        name,
        folderId,
        sourceVersion: 1,
        contentHash: calculateContentHash(pdfDetails.text + url),
        extractedContent: pdfDetails.text,
        summary: pdfDetails.text.slice(0, 300) + '...',
        mediaUrl: url,
        processedAt: now,
        metadata: {
          pageCount: pdfDetails.pageCount,
          truncated: pdfDetails.truncated
        }
      };
      nodes.push(rootPdfNode);

      // Create page-specific nodes for pages that had text or diagrams
      const pageSections = pdfDetails.text.split(/\f|\n--- Page \d+ ---\n|\n\nPage \d+\n/);
      if (pageSections.length > 1) {
        pageSections.forEach((pText, pIdx) => {
          const trimmed = pText.trim();
          if (trimmed.length > 20) {
            nodes.push({
              id: `${rootPdfNode.id}_p_${pIdx + 1}`,
              type: 'pdf_page',
              name: `${name} (Page ${pIdx + 1})`,
              folderId,
              sourceVersion: 1,
              contentHash: calculateContentHash(trimmed),
              pageNumber: pIdx + 1,
              extractedContent: trimmed,
              summary: trimmed.slice(0, 150),
              processedAt: now,
              metadata: {
                parentPdfId: rootPdfNode.id
              }
            });
          }
        });
      }
    } else {
      // General docx, txt, md, etc.
      const docText = await extractTextFromDocument(file);
      nodes.push({
        id: docItem.id || `src_doc_${Math.random().toString(36).substring(7)}`,
        type: 'document',
        name,
        folderId,
        sourceVersion: 1,
        contentHash: calculateContentHash(docText + url),
        extractedContent: docText,
        summary: docText.slice(0, 300),
        mediaUrl: url,
        processedAt: now,
        metadata: {
          fileType: docItem.type || 'document'
        }
      });
    }
  } catch (err: any) {
    console.warn(`Document processing note for ${name}:`, err);
    nodes.push({
      id: docItem.id || `src_doc_err_${Math.random().toString(36).substring(7)}`,
      type: isPdf ? 'pdf' : 'document',
      name,
      folderId,
      sourceVersion: 1,
      contentHash: calculateContentHash(`error_${name}`),
      extractedContent: `[Document ${name}: extraction failed or file format unreadable.]`,
      summary: `Failed to extract ${name}`,
      mediaUrl: url,
      processedAt: now,
      metadata: { error: String(err) }
    });
  }

  processedSourceCache.set(cacheKey, nodes);
  return nodes;
}
