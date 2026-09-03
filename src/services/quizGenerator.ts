import { CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { 
  executeOfflineQwenChat, 
  loadModelToRAM, 
  cleanupRAM 
} from './aiEngine';
import { isOmniBrainDownloaded } from './omniBrain';

/**
 * STRICT QUIZ GENERATION SYSTEM INSTRUCTION
 * Enforces raw, pure JSON array output for both Online (Gemini) and Offline (Qwen 0.5B).
 */
export const QUIZ_JSON_SYSTEM_INSTRUCTION = `You are an expert academic quiz generator for university engineering and science students. When given a topic and count, generate multiple-choice questions. 
CRITICAL RULE: You must output ONLY a valid JSON array. Do not include markdown code blocks, conversational filler, or intro text. 
Format strictly as:
[
  {
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A) Option 1",
    "explanation": "Brief explanation of why this is correct."
  }
]`;

export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index for app UI buttons (0, 1, 2, 3)
  correctAnswerText: string; // "A) Option 1"
  explanation: string;
}

export interface QuizRouterOptions {
  difficulty?: string;
  forceOfflineToggle?: boolean;
  isOnline?: boolean;
  onProgress?: (message: string) => void;
}

export interface GeneratedQuizResult {
  topic: string;
  questions: GeneratedQuizQuestion[];
  source: 'online-cloud' | 'offline-native';
  rawOutput?: string;
}

const TARGET_CLOUD_MODEL = 'gemini-3.1-flash-lite';

/**
 * Retrieve Gemini API key from localStorage or environment
 */
function getEffectiveApiKey(): string {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('gemini_api_key') || localStorage.getItem('google_api_key');
    if (saved && saved.trim()) return saved.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
  if (envKey && String(envKey).trim()) return String(envKey).trim();
  return '';
}

/**
 * Check network connectivity status
 */
async function checkNetworkOnline(): Promise<boolean> {
  try {
    const status = await Network.getStatus();
    return !!status.connected;
  } catch (e) {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
}

/**
 * Normalize raw correct answer to 0-based numeric index and string
 */
export function normalizeCorrectAnswerIndex(rawAnswer: any, options: string[]): number {
  if (typeof rawAnswer === 'number' && rawAnswer >= 0 && rawAnswer < options.length) {
    return Math.floor(rawAnswer);
  }

  const str = String(rawAnswer || '').trim();

  // Match A), B), C), D) or A., B., C., D.
  const prefixMatch = str.match(/^([A-D])[\)\.\:\s]/i);
  if (prefixMatch) {
    const letter = prefixMatch[1].toUpperCase();
    const idx = letter.charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return idx;
  }

  // Exact match against options array
  const exactIdx = options.findIndex(opt => opt.trim().toLowerCase() === str.toLowerCase());
  if (exactIdx !== -1) return exactIdx;

  // Substring match
  const subIdx = options.findIndex(opt => {
    const o = opt.toLowerCase();
    const s = str.toLowerCase();
    return o.includes(s) || s.includes(o);
  });
  if (subIdx !== -1) return subIdx;

  // Standalone letter A, B, C, D
  if (/^[A-D]$/i.test(str)) {
    const idx = str.toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return idx;
  }

  // Standalone integer index
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 0 && num < options.length) return num;

  return 0;
}

/**
 * Strict JSON parsing and schema validation for quiz questions.
 * Throws clean, transparent errors if output cannot be parsed.
 */
export function parseAndValidateQuizQuestions(rawText: string, topic: string): GeneratedQuizQuestion[] {
  if (!rawText || !rawText.trim()) {
    throw new Error(`[Quiz Engine Error]: AI output is empty for topic "${topic}".`);
  }

  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Extract outermost array
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    // If output was wrapped in an object like { "questions": [...] }
    try {
      const alt = JSON.parse(rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
      if (Array.isArray(alt)) {
        parsed = alt;
      } else if (Array.isArray(alt?.questions)) {
        parsed = alt.questions;
      }
    } catch (e2) {}
  }

  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`[Quiz Engine Error]: AI failed to generate a valid JSON array of questions for topic "${topic}". Raw output: "${rawText.slice(0, 200)}..."`);
  }

  const validatedQuestions: GeneratedQuizQuestion[] = parsed.map((item: any, idx: number) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`[Quiz Engine Error]: Question #${idx + 1} is not a valid question object.`);
    }

    const questionText = item.question || item.q || '';
    if (!questionText || typeof questionText !== 'string' || !questionText.trim()) {
      throw new Error(`[Quiz Engine Error]: Question #${idx + 1} is missing a valid "question" statement.`);
    }

    let options: string[] = [];
    if (Array.isArray(item.options)) {
      options = item.options.map(String).map(s => s.trim()).filter(Boolean);
    }
    if (options.length < 2) {
      throw new Error(`[Quiz Engine Error]: Question #${idx + 1} ("${questionText.slice(0, 35)}...") has fewer than 2 answer options.`);
    }

    const rawCorrect = item.correctAnswer ?? item.answer ?? item.correct_answer ?? 0;
    const correctIdx = normalizeCorrectAnswerIndex(rawCorrect, options);
    const correctText = typeof rawCorrect === 'string' && rawCorrect.trim() 
      ? rawCorrect.trim() 
      : (options[correctIdx] || String(rawCorrect));

    const explanation = typeof item.explanation === 'string' && item.explanation.trim()
      ? item.explanation.trim()
      : `The correct option is: ${options[correctIdx] || correctText}.`;

    return {
      question: questionText.trim(),
      options,
      correctAnswer: correctIdx,
      correctAnswerText: correctText,
      explanation
    };
  });

  return validatedQuestions;
}

/**
 * UNIFIED QUIZ GENERATION ROUTER (ONLINE & OFFLINE)
 * - Online: Uses Cloud AI (gemini-3.1-flash-lite) via CapacitorHttp.post with strict JSON mimeType.
 * - Offline: Loads local Qwen 2.5 0.5B model into RAM via native C++ bridge, generates raw JSON array.
 * - Throws transparent, descriptive error messages on failure — NEVER silently feeds fake mock questions.
 */
export async function generateQuizRouter(
  topic: string,
  count: number = 5,
  options: QuizRouterOptions = {}
): Promise<GeneratedQuizResult> {
  const cleanTopic = (topic || '').trim() || 'Engineering Assessment';
  const cleanCount = Math.max(1, Math.min(20, count || 5));

  // Determine connectivity
  const isNetworkOnline = options.isOnline !== undefined ? options.isOnline : await checkNetworkOnline();
  const shouldUseOffline = options.forceOfflineToggle === true || !isNetworkOnline;

  console.log(`🧩 [QuizRouter] Routing quiz request for "${cleanTopic}" (${cleanCount} questions). Mode: ${shouldUseOffline ? 'OFFLINE LOCAL QWEN' : 'ONLINE CLOUD GEMINI'}`);

  let rawGeneratedText = '';
  let routingSource: 'online-cloud' | 'offline-native' = 'online-cloud';

  // ==========================================
  // PATH A: OFFLINE ROUTING (LOCAL QWEN 2.5 0.5B)
  // ==========================================
  if (shouldUseOffline) {
    routingSource = 'offline-native';

    if (!isOmniBrainDownloaded()) {
      throw new Error("Omni Brain model (qwen2.5-0.5b-instruct-q4_k_m.gguf) is not downloaded. Please download it in Settings or the Omni Brain tab for offline quiz generation.");
    }

    if (options.onProgress) {
      options.onProgress('Loading Qwen 2.5 0.5B model into RAM...');
    }

    // Ensure model is resident in RAM via native C++ bridge
    await loadModelToRAM();

    if (options.onProgress) {
      options.onProgress(`Generating ${cleanCount} questions on "${cleanTopic}" via offline Omni Brain...`);
    }

    const offlinePrompt = `Topic: "${cleanTopic}"\nCount: ${cleanCount}\nGenerate multiple-choice questions now. Output strictly the raw JSON array:`;

    const maxTokens = Math.min(2048, Math.max(512, cleanCount * 170));
    const result = await executeOfflineQwenChat({
      prompt: offlinePrompt,
      systemInstruction: QUIZ_JSON_SYSTEM_INSTRUCTION,
      maxTokens
    });

    rawGeneratedText = result.text;
  } 
  // ==========================================
  // PATH B: ONLINE ROUTING (GEMINI-3.1-FLASH-LITE VIA CAPACITORHTTP)
  // ==========================================
  else {
    routingSource = 'online-cloud';

    // Free RAM from offline model while performing cloud generation
    cleanupRAM().catch(() => {});

    const apiKey = getEffectiveApiKey();
    if (!apiKey || apiKey === 'offline_fallback_key') {
      throw new Error("Missing Gemini API Key. Please provide a valid Gemini API key or switch to Omni Brain offline mode.");
    }

    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_CLOUD_MODEL}:generateContent?key=${apiKey}`;

    const userPrompt = `Generate a high-yield ${cleanCount}-question multiple-choice quiz on "${cleanTopic}".
Strict rule: Output ONLY the valid JSON array conforming to the system instruction.`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: QUIZ_JSON_SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    };

    console.log(`🌐 [QuizRouter] Sending Native HTTP POST to Google Generative AI REST API (${TARGET_CLOUD_MODEL})`);

    const response = await CapacitorHttp.post({
      url: directUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: requestBody
    });

    if (response.status >= 200 && response.status < 300) {
      let responseData = response.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          rawGeneratedText = responseData.trim();
        }
      }

      if (!rawGeneratedText) {
        const candidate = responseData?.candidates?.[0];
        const textPart = candidate?.content?.parts?.[0]?.text;
        if (textPart && textPart.trim()) {
          rawGeneratedText = textPart.trim();
        } else {
          throw new Error(`[Quiz Engine Error]: Cloud AI returned no candidate text. Response: ${JSON.stringify(responseData, null, 2)}`);
        }
      }
    } else {
      throw new Error(`[Quiz Engine Error]: Cloud AI endpoint returned HTTP ${response.status}: ${JSON.stringify(response.data, null, 2)}`);
    }
  }

  // Parse, strictly validate schema, and return questions
  const validatedQuestions = parseAndValidateQuizQuestions(rawGeneratedText, cleanTopic);

  return {
    topic: cleanTopic,
    questions: validatedQuestions,
    source: routingSource,
    rawOutput: rawGeneratedText
  };
}
