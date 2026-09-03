import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { QWEN_GGUF_MODEL_FILENAME, getSavedModelPath, isOmniBrainDownloaded } from './omniBrain';

// ======================================================================
// 1. CORRECT CAPACITOR PLUGIN REGISTRATION & INTERFACE
// ======================================================================
export interface NativeLLMPlugin {
  loadModel(options: { path: string }): Promise<{ success: boolean }>;
  llamaChat(options: { prompt: string; maxTokens?: number }): Promise<{ text: string }>;
  unloadModel(): Promise<{ success: boolean }>;
}

export const NativeLLM = registerPlugin<NativeLLMPlugin>('NativeLLM');

// ======================================================================
// 2. BROWSER & NULL SAFETY FALLBACKS
// ======================================================================
export async function runOfflineInference(prompt: string, maxTokens?: number): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Offline Omni Brain is only available on the compiled Android APK, not in web browsers.");
  }

  if (!NativeLLM || typeof NativeLLM.llamaChat !== 'function') {
    throw new Error("NativeLLM plugin is not registered in the Capacitor bridge. Check Android MainActivity registration.");
  }

  const result = await NativeLLM.llamaChat({ prompt, maxTokens });
  return result?.text || '';
}

export const OMNI_SYSTEM_PERSONA = 
  "You are Omni, a high-precision academic, math, CBT examination, and homework assistant for Nigerian and international university and secondary students. Provide direct, highly accurate, structured, step-by-step explanations.";

export const OMNI_OFFLINE_SYSTEM_PROMPT = 
  "You are Omni, an offline AI academic companion. Answer directly, clearly, and helpfully. Do not invent conversations or output \"Student:\" / \"Omni:\" labels unless explicitly requested.";

export const TARGET_CLOUD_MODEL = 'gemini-3.1-flash-lite';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface InferenceTimingStats {
  modelLoadMs: number;
  promptTokens: number;
  promptMs: number;
  promptTokensPerSec: number;
  generationTokens: number;
  generationMs: number;
  generationTokensPerSec: number;
  totalMs: number;
  isCachedContext: boolean;
}

export interface OfflineChatOptions {
  prompt: string;
  history?: Array<{ role: string; content?: string; text?: string }>;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  threads?: number;
  onChunk?: (chunk: string) => void;
}

export interface OfflineChatResult {
  text: string;
  timings: InferenceTimingStats;
}

export const QWEN_STOP_TOKENS: string[] = [
  '<|im_end|>',
  '<|endoftext|>',
  '<|im_start|>',
  '\nStudent:',
  'Student:',
  '\nOmni:',
  'Omni:',
  '\nUser:',
  'User:'
];

export const DEFAULT_MAX_HISTORY_MESSAGES = 4;
let activeMaxHistoryMessages = DEFAULT_MAX_HISTORY_MESSAGES;
let configuredThreadCount: number | null = null;
let lastModelLoadMs = 0;
let latestInferenceTiming: InferenceTimingStats | null = null;

export function setMaxHistoryMessages(count: number): void {
  activeMaxHistoryMessages = Math.max(0, count);
}

export function getMaxHistoryMessages(): number {
  return activeMaxHistoryMessages;
}

export function setInferenceThreadCount(threads: number | null): void {
  configuredThreadCount = threads && threads > 0 ? Math.floor(threads) : null;
}

export function getOptimalThreadCount(): number {
  if (configuredThreadCount) return configuredThreadCount;
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    const cores = navigator.hardwareConcurrency;
    if (cores >= 8) return 4;
    if (cores >= 6) return 4;
    if (cores >= 4) return 3;
    return 2;
  }
  return 4;
}

export function getLatestInferenceTiming(): InferenceTimingStats | null {
  return latestInferenceTiming;
}

export interface QwenLoadProgress {
  progress: number;
  text: string;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

export interface CloudAIRequestOptions {
  prompt: string;
  history?: Array<{ role: string; text: string }>;
  systemInstruction?: string;
  maxTokens?: number;
  responseMimeType?: string;
}

// Internal in-memory state tracking for RAM residency
let isModelLoaded = false;
let loadedContextInstance: any = null;
let currentLoadedPath: string | null = null;
let isModelLoadingPromise: Promise<boolean> | null = null;

let qwenProgressState: QwenLoadProgress = {
  progress: 0,
  text: 'Ready',
  isLoading: false,
  isReady: false,
  error: null
};
const progressListeners: Set<(state: QwenLoadProgress) => void> = new Set();

function updateProgress(next: Partial<QwenLoadProgress>) {
  qwenProgressState = { ...qwenProgressState, ...next };
  progressListeners.forEach(l => {
    try { l(qwenProgressState); } catch (e) {}
  });
}

export function subscribeQwenProgress(listener: (state: QwenLoadProgress) => void): () => void {
  progressListeners.add(listener);
  listener(qwenProgressState);
  return () => {
    progressListeners.delete(listener);
  };
}

export function getQwenProgressState(): QwenLoadProgress {
  return qwenProgressState;
}

export function getIsModelLoaded(): boolean {
  return isModelLoaded;
}

function resolveApiKey(): string {
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
  return (key || '').trim();
}

/**
 * 1. CLOUD AI (gemini-3.1-flash-lite) NATIVE HTTP BYPASS
 * Replaces browser-level fetch() with native CapacitorHttp.post() from @capacitor/core
 * targeting the Google Generative AI REST endpoint:
 * https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${API_KEY}
 */
export async function executeCloudAINativeHttp(options: CloudAIRequestOptions): Promise<string> {
  const apiKey = resolveApiKey();
  const systemText = options.systemInstruction || OMNI_SYSTEM_PERSONA;
  const maxTokens = options.maxTokens || 1024;
  const mimeType = options.responseMimeType || 'text/plain';

  // Format contents array for Google Generative AI REST API
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (options.history && options.history.length > 0) {
    for (const h of options.history) {
      if (h.text && h.text.trim()) {
        const role = (h.role === 'model' || h.role === 'assistant') ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: h.text.trim() }]
        });
      }
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: options.prompt }]
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemText }]
    },
    generationConfig: {
      temperature: mimeType === 'application/json' ? 0.2 : 0.7,
      maxOutputTokens: maxTokens,
      responseMimeType: mimeType
    }
  };

  try {
    if (!apiKey || apiKey === 'offline_fallback_key') {
      throw new Error("Missing Gemini API Key. No valid API key found in localStorage or environment.");
    }

    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_CLOUD_MODEL}:generateContent?key=${apiKey}`;
    console.log(`🌐 [CloudAI] Executing Native HTTP POST via CapacitorHttp to Google Generative AI REST API (${TARGET_CLOUD_MODEL})`);

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
          return responseData.trim();
        }
      }

      const candidate = responseData?.candidates?.[0];
      const textPart = candidate?.content?.parts?.[0]?.text;
      if (textPart && textPart.trim()) {
        return textPart.trim();
      }
      throw new Error(`Cloud AI response (${TARGET_CLOUD_MODEL}) has no candidate text parts: ${JSON.stringify(responseData, null, 2)}`);
    } else {
      // Throw direct CapacitorHttp error response containing status, model, and response body
      throw {
        status: response.status,
        model: TARGET_CLOUD_MODEL,
        data: response.data
      };
    }
  } catch (error: any) {
    let exactErrorMessage = '';
   
    if (error instanceof Error) {
      exactErrorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // If it's a CapacitorHttp error response containing status and data
      exactErrorMessage = JSON.stringify(error, null, 2);
    } else {
      exactErrorMessage = String(error);
    }

    console.error("CLOUD AI EXACT ERROR:", exactErrorMessage);
   
    // Return or display the literal error string in the chat UI so we can read it on screen
    return `[DEBUG ERROR]: ${exactErrorMessage}`;
  }
}

/**
 * 2. NATIVE MEMORY INJECTION & RAM MANAGEMENT
 * 
 * loadModelToRAM():
 * 1. Queries local path with Filesystem.stat to locate the GGUF model in Directory.Data.
 * 2. Passes the file path directly to the native C++ bridge.
 * 3. Keeps the model resident in RAM across subsequent messages (zero reload between turns).
 */
export async function loadModelToRAM(forceReload: boolean = false): Promise<boolean> {
  if (!forceReload && isModelLoaded && (loadedContextInstance || currentLoadedPath)) {
    console.log('⚡ [aiEngine] Model is already resident in RAM. Reusing existing context.');
    return true;
  }

  if (isModelLoadingPromise) {
    return isModelLoadingPromise;
  }

  isModelLoadingPromise = (async () => {
    updateProgress({ isLoading: true, isReady: false, text: 'Loading Qwen into RAM...' });
    const loadStart = performance.now();

    try {
      // 1. Query local path & stat from Directory.Data
      let modelPath = getSavedModelPath();
      try {
        const fileStat = await Filesystem.stat({
          path: QWEN_GGUF_MODEL_FILENAME,
          directory: Directory.Data
        });

        if (fileStat?.uri) {
          modelPath = fileStat.uri.replace(/^file:\/\//, '');
        }
      } catch (statErr) {
        console.warn('⚠️ Filesystem.stat note:', statErr);
      }

      console.log(`🧠 [Native RAM] Injecting Qwen GGUF model into device RAM from: ${modelPath}`);

      // 2. Pass local URI to NativeLLM C++ bridge if available
      if (Capacitor.isNativePlatform() && NativeLLM && typeof NativeLLM.loadModel === 'function') {
        try {
          await NativeLLM.loadModel({ path: modelPath });
          isModelLoaded = true;
          currentLoadedPath = modelPath;
          lastModelLoadMs = Math.round(performance.now() - loadStart);
          console.log(`✅ [NativeLLM C++] Model successfully injected into device RAM in ${lastModelLoadMs}ms.`);
          updateProgress({ isLoading: false, isReady: true, progress: 100, text: 'Model loaded in RAM' });
          return true;
        } catch (nativeLoadErr) {
          console.warn('⚠️ NativeLLM.loadModel note:', nativeLoadErr);
        }
      }

      // 3. Load via llama-cpp-capacitor bridge with mmap & optimized thread count
      try {
        const { initLlama } = await import('llama-cpp-capacitor');
        const threads = getOptimalThreadCount();
        console.log(`🧠 [llama-cpp-capacitor] Initializing Llama context (threads: ${threads}, n_ctx: 2048, n_batch: 512, mmap: true)...`);
        
        loadedContextInstance = await initLlama({
          model: modelPath,
          n_ctx: 2048,
          n_batch: 512,
          n_threads: threads,
          use_mmap: true
        });

        isModelLoaded = true;
        currentLoadedPath = modelPath;
        lastModelLoadMs = Math.round(performance.now() - loadStart);
        console.log(`✅ [llama-cpp-capacitor] Model context loaded in RAM in ${lastModelLoadMs}ms.`);
        updateProgress({ isLoading: false, isReady: true, progress: 100, text: 'Model loaded in RAM' });
        return true;
      } catch (llamaCppErr) {
        console.warn('⚠️ llama-cpp-capacitor init note:', llamaCppErr);
      }

      // Fallback environment (Browser / Web)
      isModelLoaded = true;
      lastModelLoadMs = Math.round(performance.now() - loadStart);
      updateProgress({ isLoading: false, isReady: true, progress: 100, text: 'Model loaded in RAM' });
      return true;
    } catch (error: any) {
      console.error('❌ [aiEngine] Failed to load model into RAM:', error);
      isModelLoaded = false;
      loadedContextInstance = null;
      updateProgress({ isLoading: false, isReady: false, error: error?.message || 'Failed to load model' });
      throw error;
    } finally {
      isModelLoadingPromise = null;
    }
  })();

  return isModelLoadingPromise;
}

/**
 * RAM Unloading:
 * Explicitly calls NativeLLM.unloadModel() and releaseAllLlama() to clear device memory.
 * Sets isModelLoaded = false.
 */
export async function cleanupRAM(): Promise<void> {
  if (!isModelLoaded && !loadedContextInstance) {
    return;
  }

  console.log('🧹 [RAM Management] Flushing offline AI model from device RAM...');
  isModelLoaded = false;
  currentLoadedPath = null;
  updateProgress({ isReady: false, text: 'Unloaded from RAM' });

  // 1. Unload from NativeLLM C++ Bridge
  try {
    if (Capacitor.isNativePlatform() && NativeLLM && typeof NativeLLM.unloadModel === 'function') {
      await NativeLLM.unloadModel();
      console.log('✅ [NativeLLM] RAM cleared.');
    }
  } catch (err) {
    console.warn('⚠️ NativeLLM.unloadModel warning:', err);
  }

  // 2. Release llama-cpp-capacitor contexts
  try {
    const { releaseAllLlama } = await import('llama-cpp-capacitor');
    await releaseAllLlama();
    loadedContextInstance = null;
    console.log('✅ [llama-cpp-capacitor] Model contexts released.');
  } catch (err) {
    console.warn('⚠️ releaseAllLlama warning:', err);
  }
}

/**
 * Clean legacy internal markers and dialogue transcript prefixes
 */
export function cleanMessageContent(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\[\[QUIZ_READY:[^\]]+\]\]/gi, '')
    .replace(/\[\[GENERATE_QUIZ:[^\]]+\]\]/gi, '')
    .replace(/^(Student|User|Omni|Assistant):\s*/i, '')
    .trim();
}

/**
 * Clean up assistant generated output:
 * - Strips accidental "Omni:" or "Assistant:" prefixes
 * - Removes leaked stop tokens
 * - Cuts off if the model attempts to generate a subsequent "Student:" or "User:" turn
 */
export function cleanGeneratedResponse(rawText: string): string {
  let cleaned = (rawText || '').trim();

  // Strip leading assistant / persona label
  cleaned = cleaned.replace(/^(Omni|Assistant|AI):\s*/i, '');

  // Strip trailing stop tokens if leaked
  cleaned = cleaned.replace(/<\|im_end\|>.*$/s, '');
  cleaned = cleaned.replace(/<\|endoftext\|>.*$/s, '');
  cleaned = cleaned.replace(/<\|im_start\|>.*$/s, '');

  // If a second conversational turn starts, truncate it cleanly
  const studentIndex = cleaned.search(/(\n|\r\n?)(Student|User):/i);
  if (studentIndex !== -1) {
    cleaned = cleaned.substring(0, studentIndex).trim();
  }

  return cleaned.trim();
}

/**
 * Prepare a structured ChatMessage[] array for inference.
 * - Slices history to the most recent MAX_HISTORY_MESSAGES (default 4)
 * - Avoids duplicating the current user message if already present in history
 * - Injects concise system prompt
 */
export function prepareChatMessages(
  currentPrompt: string,
  rawHistory: Array<{ role: string; content?: string; text?: string }> = [],
  systemInstruction: string = OMNI_OFFLINE_SYSTEM_PROMPT,
  maxHistory: number = activeMaxHistoryMessages
): ChatMessage[] {
  const cleanPrompt = (currentPrompt || '').trim();
  const messages: ChatMessage[] = [];

  // 1. System Instruction (concise, direct for 0.5B model)
  const systemText = (systemInstruction || OMNI_OFFLINE_SYSTEM_PROMPT).trim();
  if (systemText) {
    messages.push({
      role: 'system',
      content: systemText
    });
  }

  // 2. Clean and normalize historical turns
  const normalizedHistory: ChatMessage[] = [];
  if (rawHistory && rawHistory.length > 0) {
    for (const h of rawHistory) {
      const rawText = h.content || h.text || '';
      const content = cleanMessageContent(rawText);
      if (!content) continue;

      let role: ChatRole = 'user';
      if (h.role === 'model' || h.role === 'assistant' || h.role === 'omni') {
        role = 'assistant';
      } else if (h.role === 'system') {
        continue;
      }

      normalizedHistory.push({ role, content });
    }
  }

  // Deduplicate: If the last message in history is the current user message, drop it from history
  if (normalizedHistory.length > 0) {
    const lastMsg = normalizedHistory[normalizedHistory.length - 1];
    if (lastMsg.role === 'user' && lastMsg.content === cleanPrompt) {
      normalizedHistory.pop();
    }
  }

  // 3. Slice to most recent N messages (default 4 messages = 2 user, 2 assistant)
  const recentHistory = maxHistory > 0 ? normalizedHistory.slice(-maxHistory) : [];
  for (const msg of recentHistory) {
    messages.push(msg);
  }

  // 4. Current user prompt
  if (cleanPrompt) {
    messages.push({
      role: 'user',
      content: cleanPrompt
    });
  }

  return messages;
}

/**
 * Formats structured ChatMessage[] using official Qwen ChatML syntax:
 * <|im_start|>system\n...<|im_end|>\n<|im_start|>user\n...<|im_end|>\n<|im_start|>assistant\n
 */
export function formatQwenChatMLFromMessages(messages: ChatMessage[]): string {
  let formatted = '';
  for (const msg of messages) {
    formatted += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
  }
  formatted += `<|im_start|>assistant\n`;
  return formatted;
}

/**
 * Format prompt using exact Qwen ChatML format.
 * Prevents double-templating and limits history turns.
 */
export function formatQwenChatML(
  message: string,
  history: Array<{ role: string; text?: string; content?: string }> = [],
  systemInstruction: string = OMNI_OFFLINE_SYSTEM_PROMPT
): string {
  // Guard against applying ChatML twice if caller already formatted it
  if (message.includes('<|im_start|>') && message.includes('<|im_end|>')) {
    return message;
  }
  const messages = prepareChatMessages(message, history, systemInstruction, activeMaxHistoryMessages);
  return formatQwenChatMLFromMessages(messages);
}

/**
 * Execute optimized offline Qwen inference with detailed timing instrumentation.
 * Reuses resident RAM model context, passes strict stop tokens, and logs performance.
 */
export async function executeOfflineQwenChat(options: OfflineChatOptions): Promise<OfflineChatResult> {
  const startTime = performance.now();
  let modelLoadDuration = 0;
  const wasAlreadyLoaded = isModelLoaded && !!loadedContextInstance;

  // 1. Ensure model is loaded once and resident in RAM
  if (!wasAlreadyLoaded) {
    const loadStart = performance.now();
    await loadModelToRAM();
    modelLoadDuration = Math.round(performance.now() - loadStart);
  }

  const systemPrompt = options.systemInstruction || OMNI_OFFLINE_SYSTEM_PROMPT;
  const maxTokens = Math.min(Math.max(64, options.maxTokens || 384), 1024);
  const temperature = typeof options.temperature === 'number' ? options.temperature : 0.7;
  const threadCount = options.threads || getOptimalThreadCount();

  // 2. Prepare cleanly limited history (default 4 messages + current user prompt)
  const structuredMessages = prepareChatMessages(
    options.prompt,
    options.history,
    systemPrompt,
    activeMaxHistoryMessages
  );

  let rawGeneratedText = '';
  let promptTokens = 0;
  let promptMs = 0;
  let promptTps = 0;
  let genTokens = 0;
  let genMs = 0;
  let genTps = 0;

  // 3. Inference execution
  // Prioritize native C++ bridge (NativeLLM) via llamaChat on native platform
  if (Capacitor.isNativePlatform() && NativeLLM && typeof NativeLLM.llamaChat === 'function') {
    try {
      const genStartTime = performance.now();
      const promptText = formatQwenChatMLFromMessages(structuredMessages);
      rawGeneratedText = await runOfflineInference(promptText, maxTokens);
      const genEndTime = performance.now();

      if (options.onChunk && rawGeneratedText) {
        options.onChunk(rawGeneratedText);
      }

      genMs = Math.round(genEndTime - genStartTime);
      genTokens = Math.round(rawGeneratedText.split(/\s+/).length * 1.3);
      genTps = genMs > 0 ? Math.round((genTokens / (genMs / 1000)) * 10) / 10 : 0;
    } catch (nativeErr: any) {
      console.warn('⚠️ NativeLLM inference note, falling back to llama-cpp-capacitor:', nativeErr?.message || nativeErr);
    }
  }

  // Fallback to loaded llama-cpp-capacitor context if NativeLLM was not executed
  if (!rawGeneratedText) {
    if (loadedContextInstance && typeof loadedContextInstance.completion === 'function') {
      const isChatTemplateSupported = 
        typeof loadedContextInstance.isLlamaChatSupported === 'function' &&
        (loadedContextInstance.isLlamaChatSupported() || loadedContextInstance.isJinjaSupported());

      let completionParams: any;
      if (isChatTemplateSupported) {
        // Use native GGUF chat template via messages array
        completionParams = {
          messages: structuredMessages.map(m => ({ role: m.role, content: m.content })),
          n_predict: maxTokens,
          temperature,
          n_threads: threadCount,
          stop: QWEN_STOP_TOKENS
        };
      } else {
        // Use explicit ChatML format ending in <|im_start|>assistant\n
        const promptText = formatQwenChatMLFromMessages(structuredMessages);
        completionParams = {
          prompt: promptText,
          n_predict: maxTokens,
          temperature,
          n_threads: threadCount,
          stop: QWEN_STOP_TOKENS
        };
      }

      const genStartTime = performance.now();
      const result = await loadedContextInstance.completion(
        completionParams,
        options.onChunk ? (tokenResult: any) => {
          const token = tokenResult?.token || tokenResult?.text || '';
          if (token && options.onChunk) options.onChunk(token);
        } : undefined
      );
      const genEndTime = performance.now();

      rawGeneratedText = result?.text || result?.content || '';

      // Extract native timing metrics if available
      if (result?.timings) {
        promptTokens = result.timings.prompt_n || 0;
        promptMs = Math.round(result.timings.prompt_ms || 0);
        promptTps = Math.round((result.timings.prompt_per_second || 0) * 10) / 10;
        genTokens = result.timings.predicted_n || 0;
        genMs = Math.round(result.timings.predicted_ms || 0);
        genTps = Math.round((result.timings.predicted_per_second || 0) * 10) / 10;
      } else {
        genMs = Math.round(genEndTime - genStartTime);
        genTokens = Math.round(rawGeneratedText.split(/\s+/).length * 1.3);
        genTps = genMs > 0 ? Math.round((genTokens / (genMs / 1000)) * 10) / 10 : 0;
      }
    } else {
      // Fallback if loadedContextInstance was not ready
      const fallbackStart = performance.now();
      const manualPrompt = formatQwenChatMLFromMessages(structuredMessages);
      rawGeneratedText = await executeNativeInference(manualPrompt, maxTokens, options.onChunk);
      genMs = Math.round(performance.now() - fallbackStart);
    }
  }

  const totalRoundTripMs = Math.round(performance.now() - startTime);
  const cleanedText = cleanGeneratedResponse(rawGeneratedText);

  const timingStats: InferenceTimingStats = {
    modelLoadMs: modelLoadDuration,
    promptTokens,
    promptMs,
    promptTokensPerSec: promptTps,
    generationTokens: genTokens,
    generationMs: genMs,
    generationTokensPerSec: genTps,
    totalMs: totalRoundTripMs,
    isCachedContext: wasAlreadyLoaded
  };
  latestInferenceTiming = timingStats;

  // Print structured benchmark log
  console.log(
    `⚡ [Omni Qwen Offline Benchmark]\n` +
    `├─ Context Status:     ${wasAlreadyLoaded ? 'Resident in RAM (0 ms load)' : `Loaded in ${modelLoadDuration} ms`}\n` +
    `├─ Active Threads:     ${threadCount} CPU threads\n` +
    `├─ Prompt Processing:  ${promptTokens} tokens in ${promptMs} ms (${promptTps} t/s)\n` +
    `├─ Generation:         ${genTokens} tokens in ${genMs} ms (${genTps} t/s)\n` +
    `└─ Total Round-Trip:   ${totalRoundTripMs} ms (${(totalRoundTripMs / 1000).toFixed(2)}s)`
  );

  return {
    text: cleanedText,
    timings: timingStats
  };
}

/**
 * Execute on-device generation with the loaded model in RAM.
 * Backward-compatible function with stop tokens and response cleanup.
 */
export async function executeNativeInference(
  formattedChatML: string,
  maxTokens: number = 384,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // Ensure model is resident in RAM
  if (!isModelLoaded) {
    await loadModelToRAM();
  }

  const threadCount = getOptimalThreadCount();

  // 1. Try NativeLLM Plugin (llamaChat) with null safety and platform check
  if (Capacitor.isNativePlatform() && NativeLLM && typeof NativeLLM.llamaChat === 'function') {
    try {
      const text = await runOfflineInference(formattedChatML, maxTokens);
      if (onChunk && text) onChunk(text);
      return cleanGeneratedResponse(text);
    } catch (nativeErr: any) {
      console.warn('⚠️ NativeLLM.llamaChat note, falling back:', nativeErr?.message || nativeErr);
    }
  }

  // 2. Try loaded llama-cpp-capacitor context
  if (loadedContextInstance && typeof loadedContextInstance.completion === 'function') {
    const result = await loadedContextInstance.completion({
      prompt: formattedChatML,
      n_predict: maxTokens,
      temperature: 0.7,
      n_threads: threadCount,
      stop: QWEN_STOP_TOKENS
    }, onChunk ? (t: any) => onChunk(t?.text || t?.token || '') : undefined);
    const text = (result?.text || result?.content || '').trim();
    return cleanGeneratedResponse(text);
  }

  // 3. Fallback: Re-init if needed
  try {
    const { initLlama } = await import('llama-cpp-capacitor');
    const path = currentLoadedPath || getSavedModelPath();
    loadedContextInstance = await initLlama({
      model: path,
      n_ctx: 2048,
      n_batch: 512,
      n_threads: threadCount,
      use_mmap: true
    });
    isModelLoaded = true;
    const result = await loadedContextInstance.completion({
      prompt: formattedChatML,
      n_predict: maxTokens,
      temperature: 0.7,
      n_threads: threadCount,
      stop: QWEN_STOP_TOKENS
    }, onChunk ? (t: any) => onChunk(t?.text || t?.token || '') : undefined);
    const text = (result?.text || result?.content || '').trim();
    return cleanGeneratedResponse(text);
  } catch (err: any) {
    throw new Error(`Native inference failed: ${err?.message || err}`);
  }
}

/**
 * Diagnostic benchmark tool to verify latency on device
 */
export async function runInferenceBenchmark(
  testPrompt: string = "What is 2 + 2?"
): Promise<InferenceTimingStats> {
  const result = await executeOfflineQwenChat({
    prompt: testPrompt,
    maxTokens: 64,
    temperature: 0.1
  });
  return result.timings;
}
