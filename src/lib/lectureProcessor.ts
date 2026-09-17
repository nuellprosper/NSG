/**
 * Lecture Audio Recording & Hierarchical Processing Engine
 * Manages faithful verbatim transcription with speaker turns and
 * comprehensive academic lecture explanations across structured child notes.
 */

export interface TranscriptSegment {
  id: string;
  speaker: string; // e.g. "Speaker 1", "Speaker 2", "Lecturer"
  text: string;
  startTime?: string;
  endTime?: string;
  index: number;
  status: 'transcribing' | 'completed' | 'error';
}

export interface ExplanationSection {
  id: string;
  title: string;
  content: string;
  keyPoints?: string[];
  index: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export const VERBATIM_TRANSCRIPTION_SYSTEM_PROMPT = `You are an expert verbatim speech-to-text transcriber for academic lectures.
CRITICAL MANDATES:
1. Provide an exact, faithful transcript of what is actually spoken in the audio.
2. DO NOT summarize, shorten, paraphrase, or convert into study notes.
3. Transcribe the exact words spoken, preserving all technical terms, questions, and discussions.
4. Format the transcript with clean speaker turns when distinct voices are heard:
   Speaker 1: <spoken words>
   Speaker 2: <spoken words>
   If timestamps are discernible, format as:
   [HH:MM:SS] Speaker 1: <spoken words>
   Do NOT invent personal names; use neutral labels like "Speaker 1", "Speaker 2", or "Lecturer".
5. If only a single speaker is present or distinct speakers cannot be separated, transcribe as:
   Speaker 1: <spoken words>
6. Output ONLY the faithful transcript without introductory or concluding conversational text.`;

export const LECTURE_EXPLANATION_SYSTEM_PROMPT = `You are a distinguished university professor and academic master.
Analyze the following faithful verbatim lecture transcript:

Produce a comprehensive, deeply educational academic explanation and study guide of what was taught in this lecture.
Organize into the following distinct sections with Markdown headings:

## 1. Overview & Core Thesis
Provide a comprehensive executive overview of what was taught, the central problem or subject matter, and its academic significance.

## 2. Fundamental Principles & In-Depth Deconstruction
Break down every primary concept, law, mechanism, or principle covered in the lecture. Explain difficult ideas thoroughly with clarity and depth.

## 3. Detailed Academic Explanations of Topics Taught
Elaborate on each topic in detail, expanding definitions, showing connections between related concepts, and illustrating mechanisms.

## 4. Real-World Examples & Case Studies
Highlight, clarify, and expand upon the specific examples, real-world analogies, or case studies given by the lecturer.

## 5. Key Terminology & Technical Definitions
List all specialized terminology, jargon, and technical vocabulary introduced, followed by concise, accurate definitions.

## 6. High-Yield Exam Takeaways & Revision Points
List critical concepts, likely test questions, key formulas/rules, and memorable summary bullet points for revision.

RULES:
- Ground everything strictly in the content and subject matter of the lecture.
- Write with high clarity, academic rigor, and structured Markdown.`;

/**
 * Parses raw verbatim transcription text into structured TranscriptSegments
 */
export function parseTranscriptIntoSegments(
  rawText: string,
  startIndex: number = 0,
  defaultTimestamp: string = ''
): TranscriptSegment[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const segments: TranscriptSegment[] = [];
  let currentSpeaker = 'Speaker 1';
  let currentTime = defaultTimestamp;
  let currentBuffer: string[] = [];
  let segIndex = startIndex;

  // Regex to match speaker pattern e.g. "[00:01:23] Speaker 1: Hello" or "Speaker 2: Hello" or "Lecturer: Hello"
  const speakerRegex = /^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*)?(Speaker\s*\d+|Lecturer|Professor|Student\s*\d*|Audience):\s*(.*)$/i;

  const flush = () => {
    if (currentBuffer.length > 0) {
      const text = currentBuffer.join(' ').trim();
      if (text) {
        segments.push({
          id: `seg-${Date.now()}-${segIndex}`,
          speaker: currentSpeaker,
          text,
          startTime: currentTime || undefined,
          index: segIndex++,
          status: 'completed'
        });
      }
      currentBuffer = [];
    }
  };

  for (const line of lines) {
    const match = line.match(speakerRegex);
    if (match) {
      flush();
      if (match[1]) currentTime = match[1];
      currentSpeaker = match[2].trim();
      if (match[3] && match[3].trim()) {
        currentBuffer.push(match[3].trim());
      }
    } else {
      currentBuffer.push(line);
    }
  }

  flush();

  // If no speaker matches were found in any line, return a single clean segment
  if (segments.length === 0 && rawText.trim()) {
    segments.push({
      id: `seg-${Date.now()}-${segIndex}`,
      speaker: 'Speaker 1',
      text: rawText.trim(),
      startTime: defaultTimestamp || undefined,
      index: segIndex,
      status: 'completed'
    });
  }

  return segments;
}

/**
 * Format transcript segments into readable Markdown for the Transcript child note
 */
export function formatSegmentsAsMarkdown(segments: TranscriptSegment[]): string {
  if (!segments || segments.length === 0) {
    return '*No speech transcribed yet.*';
  }

  return segments.map(seg => {
    const timeTag = seg.startTime ? `\`${seg.startTime}\` ` : '';
    return `### ${timeTag}${seg.speaker}\n${seg.text}\n`;
  }).join('\n');
}

/**
 * Creates the hierarchical note structure for an audio recording/upload session:
 * - The Main Folder Note shows the Verbatim Transcript.
 * - The Subfolder Note ("Transcript Summary") shows the comprehensive long summarization.
 */
export function createLectureNoteStructure(
  title: string,
  parentFolderId?: string | null,
  sessionId?: string
): {
  parentNote: any;
  summaryNote: any;
  transcriptNote: any;
  explanationNote: any;
  sessionId: string;
} {
  const finalSessionId = sessionId || `session-audio-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = Date.now();
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const parentId = `note-parent-${now}`;
  const summaryId = `note-summary-${now + 1}`;

  const cleanTitle = (title || 'Lecture').trim();

  // 1. Main Folder Note: Directly contains and displays the Verbatim Audio Transcript
  const parentNote = {
    id: parentId,
    parentId: parentFolderId || null,
    title: cleanTitle,
    folder: cleanTitle,
    isParentNote: true,
    isFolder: true,
    subType: 'audio_parent',
    sourceAudioSessionId: finalSessionId,
    type: 'audio',
    createdAt: now,
    updatedAt: now,
    date: dateStr,
    isPinned: false,
    processingStatus: 'transcribing',
    transcriptSegments: [] as TranscriptSegment[],
    content: `## Verbatim Audio Transcript\n\n*Recording and transcribing audio transcript...*`
  };

  // 2. Subfolder Note: Contains the comprehensive Transcript Summary
  const summaryNote = {
    id: summaryId,
    parentId: parentId,
    title: 'Transcript Summary',
    folder: cleanTitle,
    subType: 'summary',
    sourceAudioSessionId: finalSessionId,
    type: 'text',
    createdAt: now + 1,
    updatedAt: now + 1,
    date: dateStr,
    isPinned: false,
    processingStatus: 'pending',
    explanationSections: [] as ExplanationSection[],
    content: `## Transcript Summary\n\n*Audio transcription in progress. A comprehensive long summarization will be generated as soon as transcription completes.*`
  };

  return {
    parentNote,
    summaryNote,
    transcriptNote: parentNote, // Transcript is directly stored in the main note
    explanationNote: summaryNote, // Long summary is stored in the subfolder
    sessionId: finalSessionId
  };
}

/**
 * Generates an in-depth academic study guide and explanation from a lecture transcript
 */
export async function generateExplanationFromTranscript(
  transcriptText: string,
  generateTextFn: (prompt: string, systemPrompt: string) => Promise<string | null>
): Promise<string> {
  if (!transcriptText || !transcriptText.trim()) {
    return '## Lecture Explanation\n\n*No transcript available to generate academic explanation.*';
  }

  const prompt = `LECTURE VERBATIM TRANSCRIPT:\n\n${transcriptText}\n\nProduce the comprehensive academic explanation and study guide as instructed.`;
  const result = await generateTextFn(prompt, LECTURE_EXPLANATION_SYSTEM_PROMPT);
  return result || '## Lecture Explanation\n\n*Unable to generate explanation at this time.*';
}

