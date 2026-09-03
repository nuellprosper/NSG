export * from '../../services/aiEngine';
import { 
  loadModelToRAM, 
  cleanupRAM, 
  formatQwenChatML, 
  executeNativeInference,
  executeOfflineQwenChat,
  runOfflineInference,
  NativeLLM,
  NativeLLMPlugin,
  OMNI_OFFLINE_SYSTEM_PROMPT,
  OMNI_SYSTEM_PERSONA,
  getQwenProgressState,
  subscribeQwenProgress
} from '../../services/aiEngine';
import { isOmniBrainDownloaded } from '../../services/omniBrain';

export { getQwenProgressState, subscribeQwenProgress, runOfflineInference, NativeLLM };
export type { NativeLLMPlugin };

export interface AIRequestPayload {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: 'application/json' | 'text/plain';
  context?: string;
  maxTokens?: number;
  historyMessages?: Array<{ role: string; content?: string; text?: string }>;
}

export interface AIResponseResult {
  text: string;
  isLocalInference: boolean;
  engine: 'cloud-gemini' | 'on-device-qwen';
}

export function formatQwenPrompt(payload: AIRequestPayload): string {
  return formatQwenChatML(payload.prompt || '', payload.historyMessages || [], payload.systemInstruction || OMNI_OFFLINE_SYSTEM_PROMPT);
}

export async function cleanupLlamaModel(): Promise<void> {
  return cleanupRAM();
}

export async function runLocalQwenInference(payload: AIRequestPayload): Promise<string> {
  if (!isOmniBrainDownloaded()) {
    return "Omni Brain is not downloaded yet. Please go to Settings to download the offline model.";
  }

  const prompt = (payload.prompt || '').trim();
  const maxTokens = payload.maxTokens || 384;

  const result = await executeOfflineQwenChat({
    prompt,
    history: payload.historyMessages,
    systemInstruction: payload.systemInstruction,
    maxTokens
  });

  return result.text;
}

export async function initWebLlmQwen(): Promise<any> {
  return null;
}

