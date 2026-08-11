import { Camera, PermissionStatus as CameraPermissionStatus } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';

export interface NativePermissionResult {
  camera: boolean;
  microphone: boolean;
  notifications: boolean;
}

/**
 * Ensures system permissions (Camera, Microphone, Notifications) are requested
 * through Capacitor Native Plugins when on mobile app environment, or Web APIs when on Web.
 */
export async function requestAppPermissions(): Promise<NativePermissionResult> {
  const isNative = isNativePlatform();
  const results: NativePermissionResult = {
    camera: false,
    microphone: false,
    notifications: false
  };

  if (isNative) {
    // 1. Camera Native Permission
    try {
      const cameraStatus: CameraPermissionStatus = await Camera.checkPermissions();
      if (cameraStatus.camera !== 'granted') {
        const req = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
        results.camera = req.camera === 'granted';
      } else {
        results.camera = true;
      }
    } catch (e) {
      console.warn('Native camera permission check error:', e);
    }

    // 2. Push & Local Notifications Native Permissions
    try {
      const pushReq = await PushNotifications.requestPermissions();
      const localReq = await LocalNotifications.requestPermissions();
      results.notifications = pushReq.receive === 'granted' && localReq.display === 'granted';
    } catch (e) {
      console.warn('Native notification permission check error:', e);
    }

    // 3. Microphone Native Permission via WebRTC navigator mediaDevices fallback on native WebView
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        results.microphone = true;
      }
    } catch (e) {
      console.warn('Native microphone permission error:', e);
    }

    return results;
  }

  // Web Standard Permissions Fallback
  if (typeof window !== 'undefined') {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      results.notifications = res === 'granted';
    }
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(track => track.stop());
        results.camera = true;
        results.microphone = true;
      } catch (e) {
        console.warn('Web media stream permission error:', e);
      }
    }
  }

  return results;
}
