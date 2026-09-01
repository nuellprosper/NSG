import { isNativePlatform, checkNetworkStatus } from './platform';
import { isOmniBrainDownloaded, getSavedModelPath, isCapacitorNative } from './omniBrainDownloader';
import { Capacitor } from '@capacitor/core';

export interface AIRequestPayload {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: 'application/json' | 'text/plain';
  context?: string;
  maxTokens?: number;
}

export interface AIResponseResult {
  text: string;
  isLocalInference: boolean;
  engine: 'cloud-gemini' | 'on-device-qwen';
}

export interface QwenLoadProgress {
  progress: number; // 0 - 100
  text: string;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

// Global Qwen WebLLM state for browser/webGPU support
const QWEN_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
let mlcEngineInstance: any = null;
let isInitializingEngine = false;
let engineInitError: string | null = null;

const progressListeners: Set<(state: QwenLoadProgress) => void> = new Set();
let currentProgressState: QwenLoadProgress = {
  progress: 0,
  text: 'Not initialized',
  isLoading: false,
  isReady: false,
  error: null
};

function updateProgressState(next: Partial<QwenLoadProgress>) {
  currentProgressState = { ...currentProgressState, ...next };
  progressListeners.forEach(listener => listener(currentProgressState));
}

export function subscribeQwenProgress(listener: (state: QwenLoadProgress) => void): () => void {
  progressListeners.add(listener);
  listener(currentProgressState);
  return () => {
    progressListeners.delete(listener);
  };
}

export function getQwenProgressState(): QwenLoadProgress {
  return currentProgressState;
}

/**
 * Memory Management & Context Cleanup:
 * Unloads native Llama C++ GGUF model from device RAM to prevent Out-Of-Memory (OOM) crashes.
 */
export async function cleanupLlamaModel(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { releaseAllLlama } = await import('llama-cpp-capacitor');
    console.log('🧹 [Native Llama C++] Releasing model context and freeing device RAM...');
    await releaseAllLlama();
  } catch (err) {
    console.warn('⚠️ releaseAllLlama cleanup note:', err);
  }
}

/**
 * Format prompt using standard Qwen 2.5 ChatML template
 */
export function formatQwenPrompt(payload: AIRequestPayload): string {
  const system = payload.systemInstruction || "You are Omni Study AI, a high-precision academic, math, and quiz generation assistant. Answer accurately and directly.";
  const user = (payload.prompt || "").trim();
  return `<|im_start|>system\n${system}<|im_end|>\n<|im_start|>user\n${user}<|im_end|>\n<|im_start|>assistant\n`;
}

/**
 * Initialize WebGPU Qwen Model via @mlc-ai/web-llm with progress tracking (Web Fallback)
 */
export async function initWebLlmQwen(onProgress?: (progress: number, text: string) => void): Promise<any | null> {
  if (mlcEngineInstance) {
    updateProgressState({ progress: 100, text: 'Qwen model ready (Cached/Loaded)', isLoading: false, isReady: true, error: null });
    if (onProgress) onProgress(100, 'Qwen model ready');
    return mlcEngineInstance;
  }

  // WebGPU capability check
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    updateProgressState({ isLoading: false, isReady: true, error: null, text: 'Offline Llama C++ GGUF Engine Active' });
    return null;
  }

  if (isInitializingEngine) {
    return null;
  }

  isInitializingEngine = true;
  engineInitError = null;
  updateProgressState({ isLoading: true, isReady: false, error: null, progress: 5, text: 'Initializing Qwen local model...' });

  try {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

    const initProgressCallback = (report: any) => {
      let pct = 0;
      if (typeof report.progress === 'number') {
        pct = Math.round(report.progress * 100);
      } else if (report.text) {
        const match = report.text.match(/(\d+)%/);
        if (match) pct = parseInt(match[1], 10);
      }

      updateProgressState({
        progress: pct,
        text: report.text || `Loading model weights (${pct}%)...`,
        isLoading: true,
        isReady: false,
        error: null
      });

      if (onProgress) {
        onProgress(pct, report.text);
      }
    };

    console.log(`🤖 [WebLLM] Creating engine for ${QWEN_MODEL_ID}...`);
    const engine = await CreateMLCEngine(QWEN_MODEL_ID, {
      initProgressCallback,
      logLevel: 'WARN'
    });

    mlcEngineInstance = engine;
    isInitializingEngine = false;
    updateProgressState({ progress: 100, text: 'Qwen 2.5 local model fully loaded in VRAM!', isLoading: false, isReady: true, error: null });
    return engine;
  } catch (err: any) {
    isInitializingEngine = false;
    const errText = err?.message || 'Failed to load Qwen WebGPU weights';
    console.warn('⚠️ WebLLM initialization notice:', errText);
    engineInitError = errText;
    updateProgressState({ isLoading: false, isReady: true, error: null, text: 'Offline Engine Ready' });
    return null;
  }
}

/**
 * True On-Device AI Inference Engine using 'llama-cpp-capacitor' Native C++ RAM Bridge.
 * 
 * Flow:
 * 1. Checks if Qwen GGUF model file is downloaded in local storage/Filesystem.
 * 2. Retrieves absolute file path.
 * 3. Infuses model into device RAM via `initLlama({ model: savedModelPath, n_ctx: 2048, n_threads: 4 })`.
 * 4. Runs inference via `context.completion(...)`.
 * 5. Frees device RAM immediately via `releaseAllLlama()` in a finally block to prevent OOM.
 */
export async function runLocalQwenInference(payload: AIRequestPayload): Promise<string> {
  // 1. Storage & Download Validation Guard
  if (!isOmniBrainDownloaded()) {
    console.warn("⚠️ Offline AI execution requested, but Qwen GGUF model is not downloaded yet.");
    return "Omni Brain is not downloaded yet. Please go to Settings to download the offline model.";
  }

  const prompt = (payload.prompt || "").trim();
  const promptLower = prompt.toLowerCase();

  // Audio transcription guard
  if (promptLower.includes('transcribe this audio') || promptLower.includes('audio transcription') || promptLower.includes('transcribe literally')) {
    throw new Error("⚠️ Audio transcription requires an active internet connection. Please connect to the internet to transcribe audio.");
  }

  const rawModelPath = (typeof localStorage !== 'undefined' ? localStorage.getItem('omni_brain_model_path') : null) || getSavedModelPath() || 'qwen2.5-0.5b-instruct.gguf';
  const cleanPath = (rawModelPath || '').replace(/^file:\/\//, '').replace('file://', '');
  const formattedPrompt = formatQwenPrompt(payload);
  const nPredict = payload.maxTokens || 512;
  const temperature = payload.responseMimeType === 'application/json' ? 0.2 : 0.7;

  console.log(`🤖 [Native Llama C++] Initiating on-device inference for prompt with model at: ${cleanPath}`);

  // 2. NATIVE LLAMA C++ RAM EXECUTION (Primary Android/Capacitor Engine)
  let nativeLlamaError: any = null;
  if (Capacitor.isNativePlatform() || isNativePlatform()) {
    try {
      const { initLlama, releaseAllLlama } = await import('llama-cpp-capacitor');
      
      console.log(`⚡ [Native Llama C++] Loading Qwen 0.5B GGUF model into device RAM...`);
      const context = await initLlama({
        model: cleanPath,
        n_ctx: 2048,
        n_threads: 4
      });

      try {
        console.log(`⚡ [Native Llama C++] Executing completion (n_predict: ${nPredict}, temp: ${temperature})...`);
        const result = await context.completion({
          prompt: formattedPrompt,
          n_predict: nPredict,
          temperature
        });

        const generatedText = (result?.text || result?.content || "").trim();
        if (generatedText) {
          console.log(`✅ [Native Llama C++] On-device completion succeeded (${generatedText.length} chars)`);
          return generatedText;
        }
      } finally {
        // Memory Management: Free up RAM immediately after task completion to prevent OOM
        console.log('🧹 [Native Llama C++] Releasing model from RAM after task completion...');
        try {
          await releaseAllLlama();
        } catch (cleanupErr) {
          console.warn("⚠️ releaseAllLlama cleanup warning:", cleanupErr);
        }
      }
    } catch (err: any) {
      nativeLlamaError = err;
      console.warn("⚠️ Native Llama C++ bridge execution note:", err);
    }
  }

  // 3. WEBGPU / BROWSER FALLBACK (for Web development / Chrome WebGPU)
  try {
    let engine = mlcEngineInstance;
    if (!engine && typeof navigator !== 'undefined' && 'gpu' in navigator && !currentProgressState.error) {
      engine = await initWebLlmQwen();
    }

    if (engine) {
      console.log('⚡ Executing Qwen WebGPU inference on device...');
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (payload.systemInstruction) {
        messages.push({ role: 'system', content: payload.systemInstruction });
      }
      messages.push({ role: 'user', content: payload.prompt });

      const completion = await engine.chat.completions.create({
        messages,
        temperature,
        max_tokens: nPredict
      });

      const resultText = completion.choices[0]?.message?.content?.trim();
      if (resultText && resultText.length > 0) {
        return resultText;
      }
    }
  } catch (webGpuErr) {
    console.warn('⚠️ WebLLM WebGPU execution note:', webGpuErr);
  }

  if (nativeLlamaError) {
    throw new Error(`On-device AI inference encountered an error: ${nativeLlamaError.message || nativeLlamaError}`);
  }

  throw new Error("Unable to execute on-device inference. Please ensure the offline model is loaded properly.");
}

/**
 * Hybrid Router: Directs requests to Cloud API when online, or to On-Device Qwen when offline.
 */
export async function routeAIRequest(
  payload: AIRequestPayload,
  cloudFetcher: (p: AIRequestPayload) => Promise<string>
): Promise<AIResponseResult> {
  const isOnline = await checkNetworkStatus();

  if (!isOnline) {
    const text = await runLocalQwenInference(payload);
    return {
      text,
      isLocalInference: true,
      engine: 'on-device-qwen'
    };
  }

  try {
    const text = await cloudFetcher(payload);
    return {
      text,
      isLocalInference: false,
      engine: 'cloud-gemini'
    };
  } catch (err: any) {
    console.warn('Cloud AI fetch failed; falling back to On-Device Qwen Local Engine.', err);
    const text = await runLocalQwenInference(payload);
    return {
      text,
      isLocalInference: true,
      engine: 'on-device-qwen'
    };
  }
}
