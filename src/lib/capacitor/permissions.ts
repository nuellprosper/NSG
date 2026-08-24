import { Camera, PermissionStatus as CameraPermissionStatus } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';

export interface NativePermissionResult {
  camera: boolean;
  photos: boolean;
  microphone: boolean;
  notifications: boolean;
}

/**
 * Request microphone permission explicitly via Capacitor VoiceRecorder or WebRTC getUserMedia
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  const isNative = isNativePlatform();

  // Try Capacitor VoiceRecorder first if native
  if (isNative) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      const hasPerm = await VoiceRecorder.hasAudioRecordingPermission();
      if (hasPerm.value) {
        return true;
      }
      const req = await VoiceRecorder.requestAudioRecordingPermission();
      if (req.value) {
        return true;
      } else {
        console.warn('Microphone permission denied via VoiceRecorder plugin.');
        return false;
      }
    } catch (pluginErr) {
      console.warn('VoiceRecorder permission error, falling back to WebRTC:', pluginErr);
    }
  }

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    console.warn('navigator.mediaDevices.getUserMedia is unavailable in this environment.');
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    // Immediately release tracks once permission is confirmed
    stream.getTracks().forEach(track => {
      try { track.stop(); } catch (e) {}
    });
    return true;
  } catch (err: any) {
    console.warn('Microphone permission request error/denied:', err);
    return false;
  }
}

/**
 * Request Storage / Photo gallery permissions via Capacitor Camera plugin
 */
export async function requestStoragePermission(): Promise<boolean> {
  const isNative = isNativePlatform();
  if (!isNative) return true;

  try {
    const req = await Camera.requestPermissions({ permissions: ['photos', 'camera'] });
    return req.photos === 'granted' || req.camera === 'granted';
  } catch (e) {
    console.warn('Storage/Photos permission request error:', e);
    return false;
  }
}

/**
 * Ensures system permissions (Camera, Photos/Storage, Microphone, Notifications) are requested
 * through Capacitor Native Plugins when on mobile app environment, or Web APIs when on Web.
 */
export async function requestAppPermissions(): Promise<NativePermissionResult> {
  const isNative = isNativePlatform();
  const results: NativePermissionResult = {
    camera: false,
    photos: false,
    microphone: false,
    notifications: false
  };

  if (isNative) {
    // 1. Camera & Photos/Storage Native Permissions
    try {
      const cameraStatus: CameraPermissionStatus = await Camera.checkPermissions().catch(() => ({ camera: 'prompt', photos: 'prompt' } as any));
      if (cameraStatus.camera !== 'granted' || cameraStatus.photos !== 'granted') {
        const req = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
        results.camera = req.camera === 'granted';
        results.photos = req.photos === 'granted';
      } else {
        results.camera = true;
        results.photos = true;
      }
    } catch (e) {
      console.warn('Native camera/photos permission check error:', e);
    }

    // 2. Push & Local Notifications Native Permissions
    try {
      const pushReq = await PushNotifications.requestPermissions().catch(() => ({ receive: 'prompt' }));
      const localReq = await LocalNotifications.requestPermissions().catch(() => ({ display: 'prompt' }));
      results.notifications = pushReq.receive === 'granted' || localReq.display === 'granted';
    } catch (e) {
      console.warn('Native notification permission check error:', e);
    }

    // 3. Microphone Native Permission
    try {
      results.microphone = await requestMicrophonePermission();
    } catch (e) {
      console.warn('Native microphone permission check error:', e);
    }

    return results;
  }

  // Web Standard Permissions Fallback - do not aggressively prompt without user gesture
  if (typeof window !== 'undefined') {
    if ('Notification' in window && Notification.permission === 'granted') {
      results.notifications = true;
    }
    if (navigator?.mediaDevices?.getUserMedia) {
      results.microphone = true;
      results.camera = true;
      results.photos = true;
    }
  }

  return results;
}

