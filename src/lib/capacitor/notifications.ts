import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';

export async function requestNotificationPermission(): Promise<boolean> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      const pushRes = await PushNotifications.requestPermissions();
      const localRes = await LocalNotifications.requestPermissions();
      return pushRes.receive === 'granted' && localRes.display === 'granted';
    } catch (e) {
      console.warn('Native notification permission error:', e);
      return false;
    }
  }

  // Web Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  return false;
}

export async function initPushNotifications(
  onTokenReceived?: (token: string) => void,
  onNotificationReceived?: (notification: any) => void
) {
  if (!isNativePlatform()) return;

  try {
    const perm = await requestNotificationPermission();
    if (!perm) return;

    await PushNotifications.register();

    // On token registration
    await PushNotifications.addListener('registration', (token) => {
      console.log('🔔 Push registration token:', token.value);
      if (onTokenReceived) onTokenReceived(token.value);
    });

    // Registration error
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('🔔 Push registration error:', error);
    });

    // Received push notification in foreground/background
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('🔔 Push notification received:', notification);
      if (onNotificationReceived) onNotificationReceived(notification);
    });

    // Action performed on notification tap
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('🔔 Push notification tapped:', action);
    });
  } catch (err) {
    console.error('Failed to initialize push notifications:', err);
  }
}

export async function scheduleLocalNotification(title: string, body: string, id: number = Date.now()): Promise<void> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: id % 100000,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      return;
    } catch (e) {
      console.warn('LocalNotifications schedule error:', e);
    }
  }

  // Web fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
