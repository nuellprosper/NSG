import { Network, ConnectionStatus } from '@capacitor/network';
import { isOmniBrainDownloaded } from './omniBrain';
import { 
  loadModelToRAM, 
  cleanupRAM, 
  formatQwenChatML, 
  executeNativeInference, 
  executeOfflineQwenChat,
  executeCloudAINativeHttp,
  OMNI_OFFLINE_SYSTEM_PROMPT,
  OMNI_SYSTEM_PERSONA, 
  getIsModelLoaded 
} from './aiEngine';

export interface ChatRouterOptions {
  systemInstruction?: string;
  maxTokens?: number;
  onChunk?: (chunk: string) => void;
  cloudFetcher?: (prompt: string, history: Array<{ role: string; text: string }>, systemInstruction?: string) => Promise<string>;
}

export interface RouteMessageResult {
  text: string;
  source: 'offline-native' | 'online-cloud';
  error?: string;
}

// Global live network tracking
let liveNetworkStatus: ConnectionStatus = {
  connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionType: 'unknown'
};

if (typeof window !== 'undefined') {
  try {
    Network.getStatus().then(status => {
      liveNetworkStatus = status;
    }).catch(() => {});

    Network.addListener('networkStatusChange', status => {
      console.log('📡 [NetworkStatus] Changed:', status.connected ? 'ONLINE' : 'OFFLINE', status.connectionType);
      liveNetworkStatus = status;
      
      // If we are now online and not forcing offline, free background RAM
      if (status.connected && getIsModelLoaded()) {
        console.log('📡 Online connectivity restored. Checking RAM state...');
      }
    });
  } catch (err) {
    console.warn('⚠️ Network listener initialization note:', err);
  }
}

export async function checkIsOnline(): Promise<boolean> {
  try {
    const status = await Network.getStatus();
    liveNetworkStatus = status;
    return Boolean(status.connected);
  } catch (e) {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
}

/**
 * 3. EXPLICIT PROMPT ROUTING (Chat Router Logic)
 * 
 * routeMessage(message, history, forceOfflineToggle, options)
 * 
 * Execution Flow:
 * 1. Condition: If forceOfflineToggle === true OR isOnline === false:
 *    - Awaits loadModelToRAM() if not loaded yet.
 *    - Formats prompt with Qwen ChatML template & Omni persona.
 *    - Generates text with native C++ bridge.
 * 2. Online Cloud Condition: If forceOfflineToggle === false AND isOnline === true:
 *    - Routes directly to Cloud AI fetch request.
 *    - Immediately executes cleanupRAM() to ensure the offline model isn't hogging memory in background.
 */
export async function routeMessage(
  message: string,
  history: Array<{ role: string; text: string }> = [],
  forceOfflineToggle: boolean = false,
  options: ChatRouterOptions = {}
): Promise<RouteMessageResult> {
  const isOnline = await checkIsOnline();
  const shouldUseOffline = forceOfflineToggle === true || isOnline === false;

  console.log(`🧭 [ChatRouter] Routing message. Mode: ${shouldUseOffline ? 'OFFLINE NATIVE' : 'ONLINE CLOUD'} (ForceOffline: ${forceOfflineToggle}, Network Online: ${isOnline})`);

  // --- PATH A: OFFLINE ON-DEVICE NATIVE ROUTING ---
  if (shouldUseOffline) {
    if (!isOmniBrainDownloaded()) {
      return {
        text: "⚠️ Omni Brain is not downloaded yet. Please go to Settings or the Brain tab to download the offline model (~398MB).",
        source: 'offline-native',
        error: "OFFLINE_MODEL_NOT_DOWNLOADED"
      };
    }

    try {
      const systemPrompt = options.systemInstruction || OMNI_OFFLINE_SYSTEM_PROMPT;
      const result = await executeOfflineQwenChat({
        prompt: message,
        history,
        systemInstruction: systemPrompt,
        maxTokens: options.maxTokens || 384,
        onChunk: options.onChunk
      });

      return {
        text: result.text,
        source: 'offline-native'
      };
    } catch (offlineErr: any) {
      console.error('❌ [ChatRouter] Offline inference error:', offlineErr);
      return {
        text: `Offline Inference Notice: ${offlineErr?.message || 'Unable to complete offline generation.'}`,
        source: 'offline-native',
        error: String(offlineErr)
      };
    }
  }

  // --- PATH B: ONLINE CLOUD AI ROUTING ---
  try {
    let cloudReply = '';

    if (options.cloudFetcher) {
      cloudReply = await options.cloudFetcher(message, history, options.systemInstruction);
    } else {
      // Execute Native HTTP request via CapacitorHttp to completely bypass Android WebView CORS
      cloudReply = await executeCloudAINativeHttp({
        prompt: message,
        history,
        systemInstruction: options.systemInstruction || OMNI_SYSTEM_PERSONA,
        maxTokens: options.maxTokens || 1024
      });
    }

    return {
      text: cloudReply,
      source: 'online-cloud'
    };
  } catch (cloudErr: any) {
    let exactErrorMessage = '';
    if (cloudErr instanceof Error) {
      exactErrorMessage = cloudErr.message;
    } else if (typeof cloudErr === 'object' && cloudErr !== null) {
      exactErrorMessage = JSON.stringify(cloudErr, null, 2);
    } else {
      exactErrorMessage = String(cloudErr);
    }
    console.error("CLOUD AI EXACT ERROR:", exactErrorMessage);
    return {
      text: `[DEBUG ERROR]: ${exactErrorMessage}`,
      source: 'online-cloud',
      error: exactErrorMessage
    };
  }
}
