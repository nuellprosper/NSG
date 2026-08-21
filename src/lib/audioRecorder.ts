/**
 * Audio Recording Helper for Cross-Platform Web & Capacitor Android / iOS
 */

import { requestMicrophonePermission } from './capacitor/permissions';

export { requestMicrophonePermission };

export function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return '';
  }

  const preferredTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];

  for (const type of preferredTypes) {
    try {
      if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch (e) {}
  }

  return '';
}

/**
 * Safely acquire a microphone MediaStream with robust fallbacks
 */
export async function getSafeAudioStream(): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone audio recording is not supported in this environment.');
  }

  // First request permission explicitly to trigger Android/iOS prompt
  await requestMicrophonePermission();

  // Try standard mobile-friendly constraints
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    return stream;
  } catch (err: any) {
    console.warn('Advanced audio constraints failed, falling back to basic audio stream:', err);
    // Fallback to basic audio stream
    const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return fallbackStream;
  }
}

/**
 * Creates a MediaRecorder configured with supported MIME types
 */
export function createSafeMediaRecorder(stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder {
  const supportedType = getSupportedAudioMimeType();
  const finalOptions: MediaRecorderOptions = { ...options };

  if (supportedType && !finalOptions.mimeType) {
    finalOptions.mimeType = supportedType;
  }

  try {
    if (finalOptions.mimeType) {
      return new MediaRecorder(stream, finalOptions);
    }
  } catch (e) {
    console.warn('Failed to initialize MediaRecorder with mimeType:', finalOptions.mimeType, 'Falling back to default.', e);
  }

  return new MediaRecorder(stream);
}
