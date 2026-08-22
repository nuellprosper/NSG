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

export interface AIStatusOverview {
  isOnline: boolean;
  isModelDownloaded: boolean;
  canExecuteOffline: boolean;
  statusMessage: string;
}

export const OFFLINE_MODEL_NOT_DOWNLOADED_MSG = 
  "⚠️ Offline AI Notice: You are currently offline, and the offline Qwen 0.5B AI Model (~398.5 MB) has not been downloaded yet. Please connect to the internet once and download the offline model in Settings > Omni Brain to enable 100% offline study & quiz generation.";

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
 * Core AI Service Executor
 * 
 * Routes tasks to Cloud APIs when online, or to the On-Device Qwen Native Engine when offline.
 * Enforces strict offline isolation (zero backend/Firebase/external API calls when offline).
 */
export async function executeAITask(
  payload: AIRequestPayload,
  cloudFetcher?: (p: AIRequestPayload) => Promise<string>
): Promise<AIResponseResult> {
  const isOnline = await checkNetworkStatus();
  const isModelReady = isLocalQwenModelDownloaded();

  // 1. OFFLINE EXECUTION PATH
  if (!isOnline) {
    if (!isModelReady) {
      console.warn("⚠️ Offline AI Task blocked: Qwen GGUF model is not downloaded yet.");
      throw new Error(OFFLINE_MODEL_NOT_DOWNLOADED_MSG);
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

  // 2. ONLINE EXECUTION PATH (WITH OFFLINE FALLBACK)
  if (cloudFetcher) {
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
        errMsg.includes("econnrefused") ||
        !navigator.onLine;

      if (isConnectionIssue) {
        console.warn("⚠️ Cloud AI fetch encountered a network failure. Evaluating local Qwen fallback...", networkErr);
        if (isModelReady) {
          console.log("⚡ [AI Service] Falling back to On-Device Qwen Native Engine...");
          const fallbackText = await runLocalQwenInference(payload);
          return {
            text: fallbackText,
            isLocalInference: true,
            engine: 'on-device-qwen'
          };
        } else {
          throw new Error(`Network connection failed. To use AI while offline, please download the offline Qwen 0.5B model (~398.5 MB) in Settings > Omni Brain. (${networkErr?.message || 'Network error'})`);
        }
      }

      // If it's a quota or rate-limit issue, also attempt local model if downloaded
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

  // If no cloud fetcher was passed, route directly to local model
  if (!isModelReady) {
    throw new Error(OFFLINE_MODEL_NOT_DOWNLOADED_MSG);
  }

  const localText = await runLocalQwenInference(payload);
  return {
    text: localText,
    isLocalInference: true,
    engine: 'on-device-qwen'
  };
}
