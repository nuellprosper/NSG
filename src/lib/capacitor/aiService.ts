import { checkNetworkStatus, isNativePlatform } from './platform';
import { 
  runLocalQwenInference, 
  cleanupLlamaModel,
  AIRequestPayload, 
  AIResponseResult, 
  initWebLlmQwen,
  getQwenProgressState
} from './aiEngine';
import { isOmniBrainDownloaded, getOmniBrainState, getSavedModelPath, ESTIMATED_TOTAL_BYTES } from './omniBrainDownloader';
import { getApiKey, MODEL_NAME, FLASH_MODEL } from '../../utils';

export interface AIStatusOverview {
  isOnline: boolean;
  isModelDownloaded: boolean;
  canExecuteOffline: boolean;
  statusMessage: string;
}

export const OFFLINE_MODEL_NOT_DOWNLOADED_MSG = 
  "Omni Brain is not downloaded yet. Please go to Settings to download the offline model.";

/**
 * Check if the on-device Qwen model weights are downloaded and ready
 */
export function isLocalQwenModelDownloaded(): boolean {
  return isOmniBrainDownloaded();
}

export { cleanupLlamaModel, getSavedModelPath };

/**
 * Get comprehensive network and AI model availability status
 */
export async function getNetworkAndAIStatus(): Promise<AIStatusOverview> {
  const isOnline = await checkNetworkStatus();
  const isModelDownloaded = isLocalQwenModelDownloaded();
  const canExecuteOffline = isModelDownloaded;

  let statusMessage = "Online - Cloud AI Active";
  if (!isOnline) {
    statusMessage = isModelDownloaded 
      ? "Offline - On-Device Qwen Native AI Active" 
      : "Offline - Model Not Downloaded (~398.5 MB needed)";
  }

  return {
    isOnline,
    isModelDownloaded,
    canExecuteOffline,
    statusMessage
  };
}

/**
 * Reliable Cloud AI Fetcher with strict Timeout (AbortController)
 * Prevents hanging states if the network drops mid-request.
 */
export async function fetchCloudAIWithTimeout(
  payload: AIRequestPayload,
  timeoutMs = 15000
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const model = MODEL_NAME || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents: any[] = [];
  if (payload.systemInstruction) {
    // Gemini supports systemInstruction or prepended text
  }

  const promptText = payload.systemInstruction 
    ? `${payload.systemInstruction}\n\nStudent: ${payload.prompt}\nOmni:`
    : payload.prompt;

  const requestBody = {
    contents: [
      {
        parts: [{ text: promptText }]
      }
    ],
    generationConfig: {
      temperature: payload.responseMimeType === 'application/json' ? 0.2 : 0.7,
      maxOutputTokens: payload.maxTokens || 1024,
      responseMimeType: payload.responseMimeType || 'text/plain'
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Cloud API HTTP Error ${res.status}: ${errBody || res.statusText}`);
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;
    
    if (!textPart) {
      throw new Error("Cloud AI returned empty response.");
    }

    return textPart.trim();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Cloud AI request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw err;
  }
}

/**
 * Core AI Service Executor
 * 
 * Routes tasks to Cloud APIs when online (with strict timeout),
 * or to the On-Device Qwen Native Engine when offline.
 * Enforces strict offline isolation (zero backend/Firebase/external API calls when offline).
 */
export async function executeAITask(
  payload: AIRequestPayload,
  customCloudFetcher?: (p: AIRequestPayload) => Promise<string>
): Promise<AIResponseResult> {
  const isOnline = await checkNetworkStatus();
  const isModelReady = isLocalQwenModelDownloaded();

  // 1. OFFLINE EXECUTION PATH
  if (!isOnline) {
    if (!isModelReady) {
      console.warn("⚠️ Offline AI Task blocked: Qwen GGUF model is not downloaded yet.");
      return {
        text: OFFLINE_MODEL_NOT_DOWNLOADED_MSG,
        isLocalInference: false,
        engine: 'on-device-qwen'
      };
    }

    console.log("⚡ [AI Service] Device is offline. Routing directly to On-Device Native Qwen Engine (RAM-infused).");
    try {
      const localResultText = await runLocalQwenInference(payload);
      return {
        text: localResultText,
        isLocalInference: true,
        engine: 'on-device-qwen'
      };
    } catch (localErr: any) {
      console.error("❌ On-Device Qwen local inference failure:", localErr);
      throw localErr;
    }
  }

  // 2. ONLINE EXECUTION PATH (WITH OFFLINE FALLBACK ON NETWORK DROP)
  const cloudFetcher = customCloudFetcher || ((p) => fetchCloudAIWithTimeout(p, 15000));

  try {
    const cloudResultText = await cloudFetcher(payload);
    return {
      text: cloudResultText,
      isLocalInference: false,
      engine: 'cloud-gemini'
    };
  } catch (networkErr: any) {
    const errMsg = String(networkErr?.message || networkErr).toLowerCase();
    const isConnectionIssue = 
      errMsg.includes("failed to fetch") || 
      errMsg.includes("networkerror") || 
      errMsg.includes("offline") ||
      errMsg.includes("timeout") ||
      errMsg.includes("load failed") ||
      errMsg.includes("abort") ||
      errMsg.includes("econnrefused") ||
      !navigator.onLine;

    if (isConnectionIssue) {
      console.warn("⚠️ Cloud AI fetch encountered a network failure. Evaluating local Qwen fallback...", networkErr);
      if (isModelReady) {
        console.log("⚡ [AI Service] Network dropped. Falling back to On-Device Qwen Native Engine...");
        const fallbackText = await runLocalQwenInference(payload);
        return {
          text: fallbackText,
          isLocalInference: true,
          engine: 'on-device-qwen'
        };
      } else {
        return {
          text: OFFLINE_MODEL_NOT_DOWNLOADED_MSG,
          isLocalInference: false,
          engine: 'on-device-qwen'
        };
      }
    }

    // Rate-limiting / quota issue fallback
    if (isModelReady && (errMsg.includes("quota") || errMsg.includes("rate limit") || errMsg.includes("busy") || errMsg.includes("429"))) {
      console.log("⚡ [AI Service] Cloud quota reached. Falling back to On-Device Qwen Native Engine...");
      const fallbackText = await runLocalQwenInference(payload);
      return {
        text: fallbackText,
        isLocalInference: true,
        engine: 'on-device-qwen'
      };
    }

    throw networkErr;
  }
}
