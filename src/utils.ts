import { GoogleGenAI } from "@google/genai";
import { HfInference } from "@huggingface/inference";
import axios from 'axios';
import JSZip from 'jszip';
import { 
  runLocalQwenInference, 
  isOmniBrainDownloaded, 
  executeAITask, 
  OFFLINE_MODEL_NOT_DOWNLOADED_MSG 
} from './lib/capacitor';

export { executeAITask, isOmniBrainDownloaded, OFFLINE_MODEL_NOT_DOWNLOADED_MSG };

export const extractTextFromRawPdfBuffer = (arrayBuffer: ArrayBuffer): string => {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(arrayBuffer);
    
    const textBlocks: string[] = [];
    const btRegex = /BT[\s\S]*?ET/g;
    let match;
    while ((match = btRegex.exec(rawText)) !== null) {
      const block = match[0];
      const stringMatches = block.match(/\(([^)]+)\)\s*T[jJ]/g) || block.match(/\[([^\]]+)\]\s*TJ/g) || block.match(/\(([^)]+)\)/g);
      if (stringMatches) {
        stringMatches.forEach(s => {
          const cleaned = s.replace(/[\(\)\[\]]/g, '').replace(/\\([0-9]{3})/g, '').trim();
          if (cleaned.length > 1 && !/^[0-9\s.\/]+$/.test(cleaned)) {
            textBlocks.push(cleaned);
          }
        });
      }
    }

    if (textBlocks.length > 3) {
      return textBlocks.join(' ');
    }

    const allStrings = rawText.match(/\(([^)]+)\)/g);
    if (allStrings && allStrings.length > 5) {
      const filtered = allStrings
        .map(s => s.replace(/[\(\)]/g, '').trim())
        .filter(s => s.length > 3 && /[a-zA-Z]{3,}/.test(s));
      if (filtered.length > 3) return filtered.join(' ');
    }
  } catch (e) {
    console.warn("Raw PDF buffer fallback parsing error:", e);
  }
  return '';
};

export const extractPdfDetails = async (file: File): Promise<{ text: string; pageImages: string[]; pageCount: number; truncated: boolean }> => {
  const pageImages: string[] = [];
  let fullText = '';
  let pageCount = 0;
  let truncated = false;

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Attempt standard PDF.js document loading
    try {
      const pdfjsLib = await import('pdfjs-dist');
      if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
      }
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      pageCount = pdf.numPages;
      if (pageCount > 20) {
        truncated = true;
      }
      const pagesToRender = Math.min(pageCount, 20);

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';

        if (i <= pagesToRender) {
          try {
            const viewport = page.getViewport({ scale: 1.2 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            if (context) {
              await page.render({ canvasContext: context, viewport, canvas } as any).promise;
              const imgDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              pageImages.push(imgDataUrl);
            }
          } catch (canvasErr) {
            console.warn(`Canvas render error on PDF page ${i}:`, canvasErr);
          }
        }
      }
    } catch (pdfJsErr) {
      console.warn("PDF.js worker/document parsing error, executing stream fallback:", pdfJsErr);
      const fallbackText = extractTextFromRawPdfBuffer(arrayBuffer);
      if (fallbackText.trim().length > 0) {
        fullText = fallbackText;
      }
    }

    if (fullText.trim().length === 0) {
      const rawText = extractTextFromRawPdfBuffer(arrayBuffer);
      if (rawText.trim().length > 0) {
        fullText = rawText;
      }
    }
  } catch (err) {
    console.error("PDF details extraction failed:", err);
  }

  return { text: fullText.trim(), pageImages, pageCount: pageCount || 1, truncated };
};

export const extractTextFromDocument = async (file: File): Promise<string> => {
  const nameLower = file.name.toLowerCase();
  if (nameLower.endsWith('.txt') || nameLower.endsWith('.md') || nameLower.endsWith('.csv') || nameLower.endsWith('.json')) {
    try {
      return (await file.text()).trim();
    } catch (e) {
      console.warn("Text read error:", e);
    }
  }
  if (nameLower.endsWith('.pdf')) {
    try {
      const details = await extractPdfDetails(file);
      if (details.text.trim().length > 0) return details.text.trim();
    } catch (err) {
      console.warn("PDF parsing fallback:", err);
    }
  }
  if (nameLower.endsWith('.docx')) {
    try {
      const zip = await JSZip.loadAsync(file);
      const docXml = await zip.file('word/document.xml')?.async('text');
      if (docXml) {
        const matches = docXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (matches && matches.length > 0) {
          const extracted = matches
            .map(m => m.replace(/<[^>]+>/g, ''))
            .filter(Boolean)
            .join(' ');
          if (extracted.trim().length > 0) {
            return extracted.trim();
          }
        }
        const cleanXml = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        if (cleanXml.trim().length > 0) return cleanXml.trim();
      }
    } catch (docxErr) {
      console.warn("DOCX ZIP extraction error:", docxErr);
    }
  }
  // Fallback text reader for doc/other files
  try {
    const rawText = await file.text();
    const cleaned = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    return cleaned.trim();
  } catch (err) {
    console.error("Document text extraction error:", err);
    return '';
  }
};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[safeStorage] Failed to getItem '${key}':`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`[safeStorage] Failed to setItem '${key}':`, e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[safeStorage] Failed to removeItem '${key}':`, e);
    }
  }
};

export const getUserRank = (points: number) => {
  if (points >= 341000) return "Pearl League";
  if (points >= 85000) return "Ruby League";
  if (points >= 21000) return "Platinum League";
  if (points >= 5000) return "Gold League";
  if (points >= 1000) return "Silver League";
  return "Bronze League";
};

export const getScholarTierInfo = (points: number) => {
  const rank = getUserRank(points);
  if (rank === "Pearl League") return { color: "text-pink-300", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "🦪", badgeStyle: "shadow-[0_0_15px_rgba(244,143,177,0.3)] text-pink-300 border-pink-300/30 bg-pink-950/40" };
  if (rank === "Ruby League") return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: "🌹", badgeStyle: "shadow-[0_0_12px_rgba(244,63,94,0.2)] text-rose-500 border-rose-500/30 bg-rose-950/40" };
  if (rank === "Platinum League") return { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "🛡️", badgeStyle: "shadow-[0_0_15px_rgba(34,211,238,0.25)] text-cyan-400 border-cyan-500/30 bg-cyan-950/40" };
  if (rank === "Gold League") return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "🏆", badgeStyle: "shadow-[0_0_15px_rgba(251,191,36,0.25)] text-amber-400 border-amber-500/30 bg-amber-950/40" };
  if (rank === "Silver League") return { color: "text-slate-350", bg: "bg-slate-300/10", border: "border-slate-300/20", icon: "🥈", badgeStyle: "text-slate-300 border-slate-400/30 bg-slate-900/40" };
  return { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "🥉", badgeStyle: "text-orange-400 border-orange-500/30 bg-orange-950/40" };
};

export const getScholarLeagueInfo = (points: number) => {
  const rank = getUserRank(points);
  if (rank === "Pearl League") return { text: "Pearl League", emoji: "🦪", textColor: "text-pink-300", bgClass: "bg-pink-500/10" };
  if (rank === "Ruby League") return { text: "Ruby League", emoji: "🌹", textColor: "text-rose-500", bgClass: "bg-rose-500/10" };
  if (rank === "Platinum League") return { text: "Platinum League", emoji: "🛡️", textColor: "text-cyan-400", bgClass: "bg-cyan-400/10" };
  if (rank === "Gold League") return { text: "Gold League", emoji: "🏆", textColor: "text-amber-400", bgClass: "bg-amber-500/10" };
  if (rank === "Silver League") return { text: "Silver League", emoji: "🥈", textColor: "text-slate-350", bgClass: "bg-slate-300/10" };
  return { text: "Bronze League", emoji: "🥉", textColor: "text-orange-400", bgClass: "bg-orange-500/10" };
};

export const formatSafeDate = (val: any, fallback = 'Recent'): string => {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toLocaleDateString();
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        return val.toDate().toLocaleDateString();
      } catch (e) {
        return fallback;
      }
    }
    if (val.seconds !== undefined) {
      try {
        return new Date(val.seconds * 1000).toLocaleDateString();
      } catch (e) {
        return fallback;
      }
    }
  }
  return fallback;
};

export const getApiKey = () => {
  let storedKey = '';
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    storedKey = localStorage.getItem('gemini_api_key') ||
                localStorage.getItem('nsg_gemini_api_key') ||
                localStorage.getItem('user_gemini_api_key') ||
                localStorage.getItem('GEMINI_API_KEY') ||
                localStorage.getItem('omni_cloud_api_key') ||
                localStorage.getItem('omni_api_key') ||
                localStorage.getItem('custom_gemini_api_key') || '';
  }

  const windowKey = typeof window !== 'undefined' ? ((window as any).__GEMINI_API_KEY__ || '') : '';
  const key = storedKey.trim() ||
              windowKey.trim() ||
              (typeof process !== 'undefined' && process.env ? (process.env.GEMINI_API_KEY || (process.env as any).VITE_GEMINI_API_KEY) : '') ||
              (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY) : '');
  const finalKey = (key || "").trim();
  return finalKey;
};

export const getHfKey = () => {
  const key = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  const finalKey = (key || "").trim();
  if (!finalKey) {
    console.warn("HuggingFace API Key is missing. Ensure VITE_HUGGINGFACE_API_KEY is set in your environment.");
  }
  return finalKey;
};

export let isHfDepletedGlobal = false;
export const handleHfErrorGlobal = (error: any, label: string) => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  const isDepleted = 
    errorMsg.includes("credits") || 
    errorMsg.includes("depleted") || 
    errorMsg.includes("limit") || 
    errorMsg.includes("429") ||
    errorMsg.includes("Inference Providers");

  if (isDepleted) {
    if (!isHfDepletedGlobal) {
      console.warn(`[AI] HF Info in ${label}: Credits depleted or rate limited. Fallback to Gemini/Together is now primary.`);
      isHfDepletedGlobal = true;
    }
  } else {
    console.error(`[AI] HF error in ${label}:`, errorMsg);
  }
};

function extractPromptFromArgs(args: any[]): { prompt: string; isAudioTranscription: boolean; mimeType?: 'application/json' | 'text/plain' } {
  if (!args || !args[0]) return { prompt: '', isAudioTranscription: false };
  const req = args[0];
  let promptText = '';
  let isAudioTranscription = false;
  let mimeType: 'application/json' | 'text/plain' | undefined = undefined;

  if (req.config?.responseMimeType === 'application/json') {
    mimeType = 'application/json';
  }

  const checkPart = (part: any) => {
    if (part?.text) promptText += ' ' + part.text;
    if (part?.inlineData?.mimeType?.startsWith('audio/') || part?.fileData?.mimeType?.startsWith('audio/')) {
      isAudioTranscription = true;
    }
  };

  if (typeof req.contents === 'string') {
    promptText = req.contents;
  } else if (Array.isArray(req.contents)) {
    for (const c of req.contents) {
      if (typeof c === 'string') promptText += ' ' + c;
      else if (c?.parts) {
        if (Array.isArray(c.parts)) c.parts.forEach(checkPart);
      } else if (c?.text) {
        promptText += ' ' + c.text;
      }
    }
  } else if (req.contents?.parts) {
    if (Array.isArray(req.contents.parts)) req.contents.parts.forEach(checkPart);
  } else if (req.contents) {
    promptText = JSON.stringify(req.contents);
  }

  if (promptText.toLowerCase().includes('transcribe this audio') || promptText.toLowerCase().includes('audio transcription') || promptText.toLowerCase().includes('transcribe literally')) {
    isAudioTranscription = true;
  }

  return { prompt: promptText.trim(), isAudioTranscription, mimeType };
}

export const getAiInstance = () => {
  const key = getApiKey();
  const instance = new GoogleGenAI({ apiKey: key || 'offline_fallback_key' });
  
  if (instance.models && typeof instance.models.generateContent === 'function') {
    const originalGenerateContent = instance.models.generateContent.bind(instance.models);
    instance.models.generateContent = async (...args: any[]) => {
      const { prompt, isAudioTranscription, mimeType } = extractPromptFromArgs(args);
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      // Handle offline mode directly
      if (!isOnline || !key) {
        if (isAudioTranscription) {
          throw new Error("⚠️ Audio transcription requires an active internet connection. Please connect to the internet to transcribe audio.");
        }

        if (!isOmniBrainDownloaded()) {
          console.warn("⚠️ Offline AI generation requested but Qwen model is not downloaded yet.");
          throw new Error(OFFLINE_MODEL_NOT_DOWNLOADED_MSG);
        }

        console.log("⚡ [Offline/Local Mode] Routing request to on-device Qwen AI model (zero network calls)...");
        const localText = await runLocalQwenInference({ prompt, responseMimeType: mimeType });
        return {
          text: localText,
          candidates: [{ content: { parts: [{ text: localText }] } }]
        };
      }

      let lastError: any = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          return await originalGenerateContent(...args);
        } catch (err: any) {
          lastError = err;
          const errMsg = String(err.message || err);
          console.warn(`[AI Attempt ${attempt} failed]:`, errMsg);

          // Network or offline error during request execution
          if (
            errMsg.toLowerCase().includes("failed to fetch") ||
            errMsg.toLowerCase().includes("networkerror") ||
            errMsg.toLowerCase().includes("offline") ||
            errMsg.toLowerCase().includes("api_key_invalid") ||
            errMsg.toLowerCase().includes("api key not valid") ||
            !navigator.onLine
          ) {
            if (isAudioTranscription) {
              throw new Error("⚠️ Audio transcription requires an active internet connection. Please connect to the internet to transcribe audio.");
            }

            if (isOmniBrainDownloaded()) {
              console.log("⚡ [Network Fallback] Offline or network error during fetch, routing to local Qwen engine...");
              const localText = await runLocalQwenInference({ prompt, responseMimeType: mimeType });
              return {
                text: localText,
                candidates: [{ content: { parts: [{ text: localText }] } }]
              };
            } else {
              throw new Error(OFFLINE_MODEL_NOT_DOWNLOADED_MSG);
            }
          }
          
          const containsBusy = errMsg.toLowerCase().includes("model") || 
                               errMsg.toLowerCase().includes("spikes") || 
                               errMsg.toLowerCase().includes("experiencing") ||
                               errMsg.toLowerCase().includes("rate limit") ||
                               errMsg.toLowerCase().includes("quota") ||
                               errMsg.toLowerCase().includes("busy");
                               
          if (attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 800 * attempt));
            continue;
          }
          
          if (containsBusy) {
            throw new Error("(the Ai is busy try again sooner)");
          } else {
            throw new Error("something went wrong, click the generate button again");
          }
        }
      }
      throw lastError || new Error("something went wrong, click the generate button again");
    };
  }
  return instance;
};

export const getHfInstance = () => {
  const key = getHfKey();
  if (!key) throw new Error("HuggingFace API Key is missing. Please set VITE_HUGGINGFACE_API_KEY in your environment.");
  return new HfInference(key);
};

export const MODEL_NAME = "gemini-3.1-flash-lite";
export const FLASH_MODEL = "gemini-3.1-flash-lite";

export const formatAiError = (error: any) => {
  const message = error.message || "Unknown error";
  if (message.toLowerCase().includes("model") || message.includes("404") || message.includes("not found")) {
    return `Model Error: The selected AI model (${MODEL_NAME}) might be unavailable or retired. Please check the configuration. Original error: ${message}`;
  }
  return `AI Error: ${message}`;
};

export const robustJSONParse = (text: string) => {
  if (!text) return null;
  let cleaned = text.trim();
  
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/g, '').trim();
  }

  const fixControlCharacters = (str: string) => {
    let output = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (inString) {
        if (escape) {
          output += char;
          escape = false;
        } else if (char === '\\') {
          output += char;
          escape = true;
        } else if (char === '"') {
          output += char;
          inString = false;
        } else if (char === '\n') {
          output += '\\n';
        } else if (char === '\r') {
          output += '\\r';
        } else if (char === '\t') {
          output += '\\t';
        } else {
          const code = char.charCodeAt(0);
          if (code < 32) {
            if (code === 10) output += '\\n';
            else if (code === 13) output += '\\r';
            else if (code === 9) output += '\\t';
          } else {
            output += char;
          }
        }
      } else {
        if (char === '"') {
          inString = true;
        }
        output += char;
      }
    }
    return output;
  };

  const fixEscaping = (str: string) => {
    return str.replace(/\\(?![/"\\bfnrtu])/g, '\\\\');
  };

  // 1. Direct attempt
  try {
    return JSON.parse(fixControlCharacters(cleaned));
  } catch (e) {
    // Continue
  }

  // 2. Extract balanced JSON object or array (ignores trailing text outside the JSON)
  const findBalanced = (input: string): string | null => {
    const firstObj = input.indexOf('{');
    const firstArr = input.indexOf('[');
    if (firstObj === -1 && firstArr === -1) return null;

    let startIdx = -1;
    let openChar = '';
    let closeChar = '';

    if (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) {
      startIdx = firstObj;
      openChar = '{';
      closeChar = '}';
    } else {
      startIdx = firstArr;
      openChar = '[';
      closeChar = ']';
    }

    let depth = 0;
    let inStr = false;
    let escaped = false;

    for (let i = startIdx; i < input.length; i++) {
      const ch = input[i];
      if (inStr) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inStr = false;
        }
      } else {
        if (ch === '"') {
          inStr = true;
        } else if (ch === openChar) {
          depth++;
        } else if (ch === closeChar) {
          depth--;
          if (depth === 0) {
            return input.substring(startIdx, i + 1);
          }
        }
      }
    }
    return null;
  };

  const extracted = findBalanced(cleaned);
  if (extracted) {
    try {
      return JSON.parse(fixControlCharacters(extracted));
    } catch (err1) {
      try {
        return JSON.parse(fixControlCharacters(fixEscaping(extracted)));
      } catch (err2) {
        try {
          const noTrailing = fixControlCharacters(extracted).replace(/,\s*([\}\]])/g, '$1');
          return JSON.parse(noTrailing);
        } catch (err3) {
          console.warn("Robust JSON parse fallback exhausted for extracted text");
        }
      }
    }
  }

  return null;
};

export const HF_MODELS = {
  TEXT: "meta-llama/Llama-3.1-8B-Instruct",
  VISION: "meta-llama/Llama-3.2-11B-Vision-Instruct",
  IMAGE: "black-forest-labs/FLUX.1-schnell",
  AUDIO: "openai/whisper-large-v3-turbo"
};

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const GROQ_AUDIO_MODEL = "distil-whisper-large-v3-en";

export const OPENROUTER_MODELS = {
  TEXT_FAST: "google/gemma-2-9b-it:free",
  TEXT_PRO: "google/gemma-4-31b-it:free",
  TEXT_ALT: "nvidia/nemotron-3-super:free",
  IMAGE: "black-forest-labs/flux-1-schnell:free",
  AUDIO: "openai/whisper-large-v3-turbo",
  MULTIMODAL: "google/lyria-3-clip-preview:free"
};

export const TOGETHER_MODEL = "google/gemma-4-31b-it";

export let isOpenRouterDepletedGlobal = false;
export let isTogetherDepletedGlobal = false;

export const handleOpenRouterErrorGlobal = (error: any, label: string) => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error(`[AI] OpenRouter error in ${label}:`, errorMsg);
  if (errorMsg.includes("429") || errorMsg.includes("credit") || errorMsg.includes("balance")) {
    console.warn("[AI] OpenRouter credits may be depleted.");
    isOpenRouterDepletedGlobal = true;
  }
};

export const callOpenRouter = async (prompt: string, model: string = OPENROUTER_MODELS.TEXT_PRO, history: any[] = []) => {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key || isOpenRouterDepletedGlobal) return null;
  try {
    const messages = history.length > 0 ? history : [{ role: "user", content: prompt }];
    const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: model,
      messages: messages,
    }, {
      headers: {
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "NSG Applet",
      }
    });
    return res.data.choices[0].message.content || null;
  } catch (e) {
    handleOpenRouterErrorGlobal(e, "OpenRouterChat");
    return null;
  }
};

export const callTogetherAI = async (prompt: string, history: any[] = []) => {
  const key = import.meta.env.VITE_TOGETHER_API_KEY;
  if (!key || isTogetherDepletedGlobal) return null;
  try {
    const messages = history.length > 0 ? history : [{ role: "user", content: prompt }];
    const res = await axios.post("https://api.together.xyz/v1/chat/completions", {
      model: TOGETHER_MODEL,
      messages: messages,
    }, {
      headers: {
        "Authorization": `Bearer ${key}`
      }
    });
    return res.data.choices[0].message.content || null;
  } catch (e: any) {
    const msg = String(e?.message || e || "");
    const status = e?.response?.status;
    console.warn(`[TOGETHER ERROR] ${msg} (Status: ${status || 'unknown'})`);
    if (
      status === 402 || 
      status === 429 || 
      msg.includes("402") || 
      msg.includes("429") || 
      msg.toLowerCase().includes("credit") || 
      msg.toLowerCase().includes("payment") || 
      msg.toLowerCase().includes("quota")
    ) {
      console.warn("Together AI credits depleted or rate limit hit. Switching permanently to Gemini fallback.");
      isTogetherDepletedGlobal = true;
    }
    return null;
  }
};

export const LIMITS = {
  ASSIGNMENT: {
    NORMAL: { IMAGES: 2, DAILY: 3 },
    PREMIUM: { IMAGES: 10, DAILY: 30 }
  },
  QUIZ: {
    NORMAL: { WORDS: 300, DAILY: 7, IMAGES: 2 },
    PREMIUM: { WORDS: 20000, DAILY: 9999, IMAGES: 20 }
  },
  RECORD: {
    NORMAL: { DURATION: 90 * 60, DAILY: 3 },
    PREMIUM: { DURATION: 180 * 60, DAILY: 30 }
  },
  LIVE_TUTOR: {
    NORMAL: { DURATION: 5 * 60, DAILY: 3 },
    PREMIUM: { DURATION: 20 * 60, DAILY: 20 }
  }
};

export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_14a5b8ee0a06e063a8b0e46fc7e0e76ed66f2746";

export interface MediaFile {
  id: string;
  file?: File | null;
  preview?: string;
  url?: string;
  name?: string;
  type?: 'image' | 'audio' | string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  image?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  history: ChatMessage[];
  timestamp: string;
  isPinned?: boolean;
  uid: string;
}

export interface LectureSession {
  id: string;
  title: string;
  date: string;
  duration: string;
  imageCount: number;
  summary: string;
  fullAnalysis: string;
  refurbishedNote?: string;
  notes?: string;
  images: string[]; 
  audioUrl?: string;
  audioBase64?: string;
  isPinned?: boolean;
  status?: 'pending' | 'analyzed';
  timestamp?: number;
  createdAt?: any;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ExamQuestion extends QuizQuestion {
  id: string;
  subject?: string;
}

export interface SubjectScore {
  subject: string;
  score: number;
  total: number;
}

export interface StudentResult {
  uid?: string;
  matric: string;
  name: string;
  score: number;
  total: number;
  timestamp: string;
  hostUid?: string;
  subjectScores?: SubjectScore[];
}

export interface RegisteredStudent {
  matric: string;
  name: string;
  paymentEnabled: boolean;
  isActive?: boolean;
  lastActive?: number;
}

export interface SubjectConfig {
  name: string;
  questionsToAnswer: number;
  questionsToSit?: number;
}

export interface ExamConfig {
  questionCount: number;
  duration: number; 
  price: number; 
  poolCount?: number;
  warningMessage?: string;
  subjects?: SubjectConfig[];
}

export async function fileToGenerativePart(file: File | Blob) {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (result && result.includes(',')) {
        resolve(result.split(',')[1]);
      } else {
        reject(new Error("Failed to parse file data."));
      }
    };
    reader.onerror = () => reject(new Error("File reading failed."));
    reader.readAsDataURL(file);
  });
  
  let mimeType = file.type;
  if (!mimeType || mimeType === "") {
    mimeType = "audio/webm";
  }

  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType },
  };
}

export const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

export interface Course {
  code: string;
  name: string;
  description: string;
  title?: string;
  level?: string;
}

export function parseBatchQuestions(rawText: string, subjectName: string) {
  const lines = rawText.split('\n');
  const questions: ExamQuestion[] = [];
  const errors: { lineIndex: number; lineText: string; error: string }[] = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      errors.push({ lineIndex: idx + 1, lineText: trimmed, error: "Missing colon ':' introducing options" });
      return;
    }
    
    const questionText = trimmed.substring(0, colonIdx).trim();
    if (!questionText) {
      errors.push({ lineIndex: idx + 1, lineText: trimmed, error: "Missing question text before colon" });
      return;
    }
    
    const rest = trimmed.substring(colonIdx + 1).trim();
    
    const openBracket = rest.lastIndexOf('(');
    const closeBracket = rest.lastIndexOf(')');
    if (openBracket === -1 || closeBracket === -1 || closeBracket < openBracket) {
      errors.push({ lineIndex: idx + 1, lineText: trimmed, error: "Missing review explanation in brackets '(...)' at end" });
      return;
    }
    
    const explanation = rest.substring(openBracket + 1, closeBracket).trim();
    const optionsPart = rest.substring(0, openBracket).trim();
    
    const rawOpts = optionsPart.split(',').map(o => o.trim()).filter(Boolean);
    if (rawOpts.length < 2) {
      errors.push({ lineIndex: idx + 1, lineText: trimmed, error: `Too few options (minimum 2 required, found ${rawOpts.length})` });
      return;
    }
    if (rawOpts.length > 6) {
      errors.push({ lineIndex: idx + 1, lineText: trimmed, error: `More than 4 options noticed (${rawOpts.length} options provided)` });
      return;
    }
    
    let correctIdx = -1;
    const cleanOpts: string[] = [];
    
    rawOpts.forEach((opt, oIdx) => {
      if (opt.includes('*')) {
        correctIdx = oIdx;
        cleanOpts.push(opt.replace(/\*/g, '').trim());
      } else {
        cleanOpts.push(opt);
      }
    });
    
    if (correctIdx === -1) {
      errors.push({ lineIndex: idx + 1, lineText: trimmed, error: "Missing correct option asterisk '*' in front of correct option" });
      return;
    }
    
    questions.push({
      id: `q-batch-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      question: questionText,
      options: cleanOpts,
      correctAnswer: correctIdx,
      explanation: explanation || 'No review explanation provided.',
      subject: subjectName
    });
  });
  
  return { questions, errors, validCount: questions.length };
}

export function parseBatchStudents(rawText: string) {
  const entries = rawText.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
  const students: { matric: string; name: string }[] = [];
  const errors: string[] = [];
  
  entries.forEach((entry, i) => {
    const parts = entry.split(',').map(p => p.trim());
    if (parts.length < 2) {
      if (entry) errors.push(`Line/Entry ${i + 1}: Expected format 'matric,name'`);
      return;
    }
    students.push({
      matric: parts[0],
      name: parts[1]
    });
  });
  
  return { students, errors };
}


export interface HomeHistoryItem {
  id: string;
  title: string;
  type: 'quiz' | 'recording' | 'exam' | 'assignment' | 'faculty' | 'note';
  progress?: number;
  date?: string;
  score?: number;
  total?: number;
  timestamp?: number;
  data?: any; 
  answers?: any;
  questions?: any[];
  topic?: string;
  difficulty?: string;
  matric?: string;
  studentName?: string;
  subjectScores?: SubjectScore[];
}
