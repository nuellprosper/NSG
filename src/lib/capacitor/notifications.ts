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

export const BACKGROUND_NOTIFICATIONS_POOL = [
  {
    title: "📜 Scholar Inspiration",
    body: "“Success is no accident. It is hard work, perseverance, learning, and study.” Keep pushing forward!",
    category: "quote"
  },
  {
    title: "💬 Community Activity",
    body: "New academic notes and practice questions were uploaded to the Scholar Community! Explore now.",
    category: "community"
  },
  {
    title: "🏆 Scholar Achievement",
    body: "Maintain your study streak today! Complete 1 quick Omni Quiz to gain +50 Leaderboard points.",
    category: "achievement"
  },
  {
    title: "⚡ Daily Knowledge Challenge",
    body: "Ready for a 2-minute study boost? Generate an instant practice quiz with Omni AI.",
    category: "quiz"
  },
  {
    title: "💡 Mindset Boost",
    body: "“The beautiful thing about learning is that no one can take it away from you.” – B.B. King",
    category: "quote"
  },
  {
    title: "🔥 Trending in Community",
    body: "Students are actively discussing upcoming exam solutions and summaries in the Community feed.",
    category: "community"
  },
  {
    title: "🌟 Scholar Milestone",
    body: "You're close to unlocking the next Scholar Rank! Take a practice CBT exam today.",
    category: "achievement"
  },
  {
    title: "📚 Audio Note Reminder",
    body: "Record your lecture audio or import notes to create auto-summaries with NSG Scholar Omni.",
    category: "reminder"
  },
  {
    title: "🧠 Wisdom of the Day",
    body: "“Action is the foundational key to all success.” – Pablo Picasso. Start your study session now!",
    category: "quote"
  },
  {
    title: "🎓 Academic Progress Alert",
    body: "Review your past CBT practice answers to catch weak spots before exam day.",
    category: "achievement"
  }
];

export async function schedulePeriodicBackgroundNotifications(): Promise<void> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      const permRes = await LocalNotifications.checkPermissions();
      if (permRes.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }

      // Cancel previous scheduled items to prevent stacking duplicates
      const pending = await LocalNotifications.getPending();
      if (pending && pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }

      // Schedule pool items over future intervals (e.g. 2h, 5h, 12h, 24h, 36h, 48h, 72h)
      const intervalsInMinutes = [120, 300, 720, 1440, 2160, 2880, 4320, 5760, 7200, 8640];
      const notificationsToSchedule = BACKGROUND_NOTIFICATIONS_POOL.map((item, index) => {
        const delayMs = (intervalsInMinutes[index % intervalsInMinutes.length] || ((index + 1) * 120)) * 60 * 1000;
        const triggerTime = new Date(Date.now() + delayMs);
        
        return {
          title: item.title,
          body: item.body,
          id: 20000 + index,
          schedule: { at: triggerTime },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: { category: item.category }
        };
      });

      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`📱 Scheduled ${notificationsToSchedule.length} background OS status-bar notifications for native device.`);
    } catch (err) {
      console.warn('Failed to schedule periodic native background notifications:', err);
    }
  } else {
    // Web environment periodic fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        if (!sessionStorage.getItem('nsg_scheduled_web_quote')) {
          sessionStorage.setItem('nsg_scheduled_web_quote', 'true');
          setTimeout(() => {
            const randomItem = BACKGROUND_NOTIFICATIONS_POOL[Math.floor(Math.random() * BACKGROUND_NOTIFICATIONS_POOL.length)];
            scheduleLocalNotification(randomItem.title, randomItem.body);
          }, 45000); // 45 sec after launch
        }
      }
    }
  }
}

export async function scheduleLocalNotification(title: string, body: string, id: number = Date.now()): Promise<void> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      const permRes = await LocalNotifications.checkPermissions();
      if (permRes.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: (Math.floor(Math.random() * 90000) + 10000),
            schedule: { at: new Date(Date.now() + 100) },
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
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, { body, icon: '/icon.svg', badge: '/icon.svg' });
        } else {
          new Notification(title, { body, icon: '/icon.svg' });
        }
      } catch (err) {
        new Notification(title, { body, icon: '/icon.svg' });
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/icon.svg' });
        }
      });
    }
  }
}
