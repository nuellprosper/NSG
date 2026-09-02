export * from '../../services/aiEngine';
import { 
  loadModelToRAM, 
  cleanupRAM, 
  formatQwenChatML, 
  executeNativeInference,
  OMNI_SYSTEM_PERSONA,
  getQwenProgressState,
  subscribeQwenProgress
} from '../../services/aiEngine';
import { isOmniBrainDownloaded } from '../../services/omniBrain';

export { getQwenProgressState, subscribeQwenProgress };

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

export function formatQwenPrompt(payload: AIRequestPayload): string {
  return formatQwenChatML(payload.prompt || '', [], payload.systemInstruction || OMNI_SYSTEM_PERSONA);
}

export async function cleanupLlamaModel(): Promise<void> {
  return cleanupRAM();
}

export async function runLocalQwenInference(payload: AIRequestPayload): Promise<string> {
  if (!isOmniBrainDownloaded()) {
    return "Omni Brain is not downloaded yet. Please go to Settings to download the offline model.";
  }

  const prompt = (payload.prompt || '').trim();
  const formattedPrompt = formatQwenChatML(prompt, [], payload.systemInstruction || OMNI_SYSTEM_PERSONA);
  const maxTokens = payload.maxTokens || 512;

  return await executeNativeInference(formattedPrompt, maxTokens);
}

export async function initWebLlmQwen(): Promise<any> {
  return null;
}
