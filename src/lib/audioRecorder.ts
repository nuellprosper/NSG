/**
 * Audio Recording Helper for Cross-Platform Web & Capacitor Android / iOS
 */

import { requestMicrophonePermission } from './capacitor/permissions';

export { requestMicrophonePermission };

export interface AudioSupportResult {
  supported: boolean;
  error?: string;
}

/**
 * Check if the current browser / web environment supports microphone recording
 */
export function checkAudioRecordingSupport(): AudioSupportResult {
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Window environment is unavailable.' };
  }

  // Check secure context (Microphone API requires HTTPS or localhost)
  const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '[::1]';

  if (!window.isSecureContext && !isLocalhost) {
    return {
      supported: false,
      error: 'Audio recording requires a secure connection (HTTPS). Please open the application over HTTPS.'
    };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      error: 'Microphone recording is not supported in this browser. Please use a modern browser such as Chrome, Safari, Edge, or Firefox.'
    };
  }

  if (typeof MediaRecorder === 'undefined') {
    return {
      supported: false,
      error: 'MediaRecorder is not supported in this browser.'
    };
  }

  return { supported: true };
}

/**
 * Translate browser media errors into clear, actionable user messages
 */
export function getHumanFriendlyMediaError(err: any): string {
  if (!err) return 'An unknown error occurred while accessing the microphone.';

  const errorName = err.name || '';
  const message = err.message || '';

  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Microphone permission was denied. Please tap or click the lock/settings icon in your browser address bar, enable Microphone access, and reload or try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone was detected on your device. Please connect an audio input device (or headset) and try again.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The microphone is already in use by another application or browser tab. Please close other recording apps or calls and try again.';
    case 'SecurityError':
      return 'Microphone access was blocked due to a browser security restriction. Please ensure the app is opened via HTTPS.';
    case 'AbortError':
      return 'The microphone request was aborted. Please try recording again.';
    case 'OverconstrainedError':
      return 'The audio hardware does not satisfy requested audio constraints. Retrying with basic audio.';
    default:
      return `Unable to access microphone (${errorName}: ${message}). Please verify device settings and browser permissions.`;
  }
}

/**
 * Identify the optimal supported audio MIME type
 */
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
 * Safely acquire a single microphone MediaStream with graceful constraint fallback
 */
export async function getSafeAudioStream(): Promise<MediaStream> {
  const check = checkAudioRecordingSupport();
  if (!check.supported) {
    throw new Error(check.error || 'Audio recording is unsupported in this environment.');
  }

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
    console.warn('Advanced audio constraints failed, attempting basic stream:', err);
    try {
      const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return basicStream;
    } catch (fallbackErr: any) {
      const userMessage = getHumanFriendlyMediaError(fallbackErr || err);
      const enhancedError = new Error(userMessage);
      (enhancedError as any).originalError = fallbackErr || err;
      throw enhancedError;
    }
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
