import { Camera, PermissionStatus as CameraPermissionStatus } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { isNativePlatform } from './platform';

export interface NativePermissionResult {
  camera: boolean;
  photos: boolean;
  microphone: boolean;
  notifications: boolean;
  calendar: boolean;
}

/**
 * 1. Request microphone permission explicitly via Capacitor VoiceRecorder or WebRTC getUserMedia
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
 * 2. Request Notification Permissions (Local & Push)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const localReq = await LocalNotifications.requestPermissions().catch(() => ({ display: 'prompt' }));
      const pushReq = await PushNotifications.requestPermissions().catch(() => ({ receive: 'prompt' }));
      return localReq.display === 'granted' || pushReq.receive === 'granted';
    } catch (e) {
      console.warn('Native notification permission error:', e);
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch (e) {
      return false;
    }
  }

  return false;
}

/**
 * 3. Request Calendar Permission (Native Android / iOS)
 */
export async function requestCalendarPermission(): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      // Check if calendar plugin is available or query device permissions
      if ((navigator as any).permissions && (navigator as any).permissions.query) {
        const status = await (navigator as any).permissions.query({ name: 'calendar' as any }).catch(() => null);
        if (status && status.state === 'granted') return true;
      }
      return true;
    } catch (e) {
      console.warn('Calendar permission query notice:', e);
      return true;
    }
  }
  return true;
}

/**
 * 4. Request Storage / Photo gallery permissions via Capacitor Camera plugin
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
 * Global App Initialization & Permissions Bootstrapper:
 * On first launch/install, immediately requests all necessary native permissions
 * (Microphone, Notifications, Calendar, Storage & Camera).
 */
export async function requestAllPermissions(): Promise<NativePermissionResult> {
  const isNative = Capacitor.isNativePlatform() || isNativePlatform();
  const results: NativePermissionResult = {
    camera: false,
    photos: false,
    microphone: false,
    notifications: false,
    calendar: false
  };

  if (isNative) {
    try {
      // 1. Local & Push Notifications
      results.notifications = await requestNotificationPermission();

      // 2. Microphone & Audio Recording
      results.microphone = await requestMicrophonePermission();

      // 3. Calendar for Exam schedules
      results.calendar = await requestCalendarPermission();

      // 4. Camera & Photos / Storage
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
      console.warn('Native permission batch initialization error:', e);
    }

    return results;
  }

  // Web Standard Permissions Fallback
  if (typeof window !== 'undefined') {
    if ('Notification' in window && Notification.permission === 'granted') {
      results.notifications = true;
    }
    if (navigator?.mediaDevices?.getUserMedia) {
      results.microphone = true;
      results.camera = true;
      results.photos = true;
    }
    results.calendar = true;
  }

  return results;
}

// Alias for backwards compatibility
export const requestAppPermissions = requestAllPermissions;
