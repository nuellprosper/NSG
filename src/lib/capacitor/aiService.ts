import { CapacitorHttp } from '@capacitor/core';
import { checkNetworkStatus, isNativePlatform } from './platform';
import { 
  runLocalQwenInference, 
  cleanupLlamaModel,
  AIRequestPayload, 
  AIResponseResult, 
  initWebLlmQwen,
  getQwenProgressState,
  executeCloudAINativeHttp
} from './aiEngine';
import { isOmniBrainDownloaded, getOmniBrainState, getSavedModelPath, ESTIMATED_TOTAL_BYTES } from './omniBrainDownloader';
import { getApiKey, MODEL_NAME, FLASH_MODEL, callTogetherAI, callOpenRouter, getHfInstance, HF_MODELS } from '../../utils';

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
 * Get comprehensive network and AI status
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
 * Reliable Cloud AI Fetcher with strict Timeout (AbortController) and multi-provider fallback.
 * Prioritizes Server AI Proxy -> Direct Gemini -> Groq / Together / OpenRouter / HF -> Local Qwen
 */
export async function fetchCloudAIWithTimeout(
  payload: AIRequestPayload,
  timeoutMs = 15000
): Promise<string> {
  const promptText = payload.systemInstruction 
    ? `${payload.systemInstruction}\n\nStudent: ${payload.prompt}\nOmni:`
    : payload.prompt;

  // 1. Primary: Server AI Proxy Endpoint via Native HTTP (CapacitorHttp) - fastest, secure & CORS-immune
  try {
    const reply = await executeCloudAINativeHttp({
      prompt: payload.prompt,
      systemInstruction: payload.systemInstruction,
      maxTokens: payload.maxTokens || 1024,
      responseMimeType: payload.responseMimeType
    });
    if (reply && reply.trim()) {
      return reply.trim();
    }
  } catch (proxyErr) {
    // Server proxy unreached - continue to client-side direct fallbacks
  }

  // 2. Direct Gemini REST call via native CapacitorHttp if API Key is available
  const apiKey = getApiKey();
  if (apiKey && apiKey !== 'offline_fallback_key') {
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

        const res = await CapacitorHttp.post({
          url,
          headers: { 'Content-Type': 'application/json' },
          data: requestBody
        });

        if (res.status >= 200 && res.status < 300) {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          const candidate = data?.candidates?.[0];
          const textPart = candidate?.content?.parts?.[0]?.text;
          if (textPart && textPart.trim()) {
            return textPart.trim();
          }
        }
      } catch (geminiErr: any) {
        console.warn(`[Gemini REST ${model} attempt]:`, geminiErr?.message || geminiErr);
      }
    }
  }

  // 3. Try Together AI
  try {
    const togetherText = await callTogetherAI(promptText);
    if (togetherText && togetherText.trim()) {
      return togetherText.trim();
    }
  } catch (togetherErr) {}

  // 4. Try OpenRouter
  try {
    const openRouterText = await callOpenRouter(promptText);
    if (openRouterText && openRouterText.trim()) {
      return openRouterText.trim();
    }
  } catch (openRouterErr) {}

  // 5. Try Hugging Face
  try {
    const hfInstance = getHfInstance();
    if (hfInstance) {
      const hfRes = await hfInstance.chatCompletion({
        model: HF_MODELS?.TEXT || "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
          ...(payload.systemInstruction ? [{ role: "system" as const, content: payload.systemInstruction }] : []),
          { role: "user" as const, content: payload.prompt }
        ],
        max_tokens: payload.maxTokens || 1024,
      });
      const text = hfRes.choices[0]?.message?.content || '';
      if (text && text.trim()) {
        return text.trim();
      }
    }
  } catch (hfErr) {}

  // 6. If local model is downloaded, use local Qwen
  if (isLocalQwenModelDownloaded()) {
    return await runLocalQwenInference(payload);
  }

  throw new Error("Unable to connect to cloud AI service. Please check your internet connection or switch to Omni Brain (offline mode).");
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
      console.warn("⚠️ Offline AI Task: Qwen model is not downloaded yet.");
      return {
        text: OFFLINE_MODEL_NOT_DOWNLOADED_MSG,
        isLocalInference: false,
        engine: 'on-device-qwen'
      };
    }

    console.log("⚡ [AI Service] Device is offline. Routing directly to On-Device Native Qwen Engine.");
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
    console.warn("⚠️ Cloud AI fetch failed, checking local Qwen fallback...", networkErr?.message || networkErr);
    
    if (isModelReady) {
      try {
        console.log("⚡ [AI Service] Falling back to On-Device Qwen Native Engine...");
        const fallbackText = await runLocalQwenInference(payload);
        return {
          text: fallbackText,
          isLocalInference: true,
          engine: 'on-device-qwen'
        };
      } catch (localErr) {}
    }

    return {
      text: "I'm having trouble connecting to the cloud AI service right now. Please check your internet connection or download Omni Brain in settings for offline support.",
      isLocalInference: false,
      engine: 'cloud-gemini'
    };
  }
}
