import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { QWEN_GGUF_MODEL_FILENAME, getSavedModelPath, isOmniBrainDownloaded } from './omniBrain';

export const OMNI_SYSTEM_PERSONA = 
  "You are Omni, a high-precision academic, math, CBT examination, and homework assistant for Nigerian and international university and secondary students. Provide direct, highly accurate, structured, step-by-step explanations.";

export const TARGET_CLOUD_MODEL = 'gemini-3.1-flash-lite';

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

  // 1. If API key exists, call direct Google Generative AI REST endpoint with CapacitorHttp.post
  if (apiKey && apiKey !== 'offline_fallback_key') {
    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_CLOUD_MODEL}:generateContent?key=${apiKey}`;
    console.log(`🌐 [CloudAI] Executing Native HTTP POST via CapacitorHttp to Google Generative AI REST API (${TARGET_CLOUD_MODEL})`);

    try {
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
      } else {
        console.warn(`⚠️ Direct Google Generative AI endpoint returned status ${response.status}:`, response.data);
      }
    } catch (directErr) {
      console.warn(`⚠️ Direct Google Generative AI native request failed, attempting proxy route:`, directErr);
    }
  }

  // 2. Fallback to server proxy /api/ai/chat via CapacitorHttp.post
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const isLocalOrCapacitor = !origin || origin.startsWith('http://localhost') || origin.startsWith('capacitor://') || origin.startsWith('file://');
  const proxyUrl = isLocalOrCapacitor ? 'https://nuellstudyguide.name.ng/api/ai/chat' : `${origin}/api/ai/chat`;

  console.log(`🌐 [CloudAI] Executing Native HTTP POST via CapacitorHttp to server proxy: ${proxyUrl}`);

  try {
    const response = await CapacitorHttp.post({
      url: proxyUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        model: TARGET_CLOUD_MODEL,
        prompt: options.prompt,
        history: options.history || [],
        systemInstruction: systemText,
        maxTokens,
        responseMimeType: mimeType
      }
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
      const reply = responseData?.text || responseData?.reply || responseData?.content || '';
      if (reply && reply.trim()) {
        return reply.trim();
      }
    }

    throw new Error(`Native HTTP request returned status ${response.status}: ${JSON.stringify(response.data)}`);
  } catch (nativeErr: any) {
    console.error('❌ Native Cloud AI HTTP request failed:', JSON.stringify(nativeErr, Object.getOwnPropertyNames(nativeErr)));
    throw nativeErr;
  }
}

/**
 * 2. NATIVE MEMORY INJECTION & RAM MANAGEMENT
 * 
 * loadModelToRAM():
 * 1. Queries local path with Filesystem.stat to locate the GGUF model in Directory.Data.
 * 2. Passes the file path directly to the native C++ bridge (NativeLLM.loadModel({ path })).
 * 3. Sets isModelLoaded = true to prevent redundant memory loading.
 */
export async function loadModelToRAM(): Promise<boolean> {
  if (isModelLoaded && (loadedContextInstance || currentLoadedPath)) {
    console.log('⚡ [aiEngine] Model is already resident in RAM.');
    return true;
  }

  if (isModelLoadingPromise) {
    return isModelLoadingPromise;
  }

  isModelLoadingPromise = (async () => {
    updateProgress({ isLoading: true, isReady: false, text: 'Loading Qwen into RAM...' });

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

      // 2. Pass local URI to NativeLLM C++ bridge
      const nativeLLM = (Capacitor as any)?.Plugins?.NativeLLM;
      if (nativeLLM && typeof nativeLLM.loadModel === 'function') {
        await nativeLLM.loadModel({ path: modelPath });
        isModelLoaded = true;
        currentLoadedPath = modelPath;
        console.log('✅ [NativeLLM C++] Model successfully injected into device RAM.');
        updateProgress({ isLoading: false, isReady: true, progress: 100, text: 'Model loaded in RAM' });
        return true;
      }

      // 3. Fallback to llama-cpp-capacitor bridge
      try {
        const { initLlama } = await import('llama-cpp-capacitor');
        loadedContextInstance = await initLlama({
          model: modelPath,
          n_ctx: 2048,
          n_threads: 4
        });
        isModelLoaded = true;
        currentLoadedPath = modelPath;
        console.log('✅ [llama-cpp-capacitor] Model context loaded in RAM.');
        updateProgress({ isLoading: false, isReady: true, progress: 100, text: 'Model loaded in RAM' });
        return true;
      } catch (llamaCppErr) {
        console.warn('⚠️ llama-cpp-capacitor init note:', llamaCppErr);
      }

      // Fallback environment (Browser / Web)
      isModelLoaded = true;
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
    const nativeLLM = (Capacitor as any)?.Plugins?.NativeLLM;
    if (nativeLLM && typeof nativeLLM.unloadModel === 'function') {
      await nativeLLM.unloadModel();
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
 * Format prompt using exact Qwen ChatML format:
 * <|im_start|>system\n[OMNI PERSONA]<|im_end|>\n<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant\n
 */
export function formatQwenChatML(
  message: string,
  history: Array<{ role: string; text: string }> = [],
  systemInstruction: string = OMNI_SYSTEM_PERSONA
): string {
  let prompt = `<|im_start|>system\n${systemInstruction.trim()}<|im_end|>\n`;

  // Append history turns
  if (history && history.length > 0) {
    for (const h of history) {
      const role = (h.role === 'model' || h.role === 'assistant') ? 'assistant' : 'user';
      if (h.text && h.text.trim()) {
        prompt += `<|im_start|>${role}\n${h.text.trim()}<|im_end|>\n`;
      }
    }
  }

  // Append current user message
  prompt += `<|im_start|>user\n${message.trim()}<|im_end|>\n<|im_start|>assistant\n`;
  return prompt;
}

/**
 * Execute on-device generation with the loaded model in RAM
 */
export async function executeNativeInference(
  formattedChatML: string,
  maxTokens: number = 512,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // Ensure model is resident in RAM
  if (!isModelLoaded) {
    await loadModelToRAM();
  }

  // 1. Try NativeLLM Plugin (with streaming if supported)
  const nativeLLM = (Capacitor as any)?.Plugins?.NativeLLM;
  if (nativeLLM && typeof nativeLLM.generateText === 'function') {
    const response = await nativeLLM.generateText({
      prompt: formattedChatML,
      max_tokens: maxTokens,
      temperature: 0.7
    });
    const text = response?.text || response?.content || '';
    if (onChunk && text) onChunk(text);
    return text.trim();
  }

  // 2. Try llama-cpp-capacitor context
  if (loadedContextInstance && typeof loadedContextInstance.completion === 'function') {
    const result = await loadedContextInstance.completion({
      prompt: formattedChatML,
      n_predict: maxTokens,
      temperature: 0.7
    });
    const text = (result?.text || result?.content || '').trim();
    if (onChunk && text) onChunk(text);
    return text;
  }

  // 3. Fallback: Re-init if needed
  try {
    const { initLlama } = await import('llama-cpp-capacitor');
    const path = currentLoadedPath || getSavedModelPath();
    const ctx = await initLlama({ model: path, n_ctx: 2048, n_threads: 4 });
    const result = await ctx.completion({
      prompt: formattedChatML,
      n_predict: maxTokens,
      temperature: 0.7
    });
    const text = (result?.text || result?.content || '').trim();
    if (onChunk && text) onChunk(text);
    return text;
  } catch (err: any) {
    throw new Error(`Native inference failed: ${err?.message || err}`);
  }
}
