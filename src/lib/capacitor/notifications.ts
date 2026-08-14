import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';

export async function requestNotificationPermission(): Promise<boolean> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      // Create Android Notification Channels for High-Visibility Status Bar Delivery
      try {
        await LocalNotifications.createChannel({
          id: 'nsg_scholar_achievements',
          name: 'Scholar Achievements & Badges',
          description: 'Notifications about scholar rankings, streak milestones, and achievements',
          importance: 5, // High / Heads-up
          visibility: 1,
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#7C3AED'
        });

        await LocalNotifications.createChannel({
          id: 'nsg_scholar_did_you_know',
          name: 'Did You Know? & Study Hacks',
          description: 'Daily academic insights, memory retention tips, and scientific study facts',
          importance: 4,
          visibility: 1,
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#2563EB'
        });

        await LocalNotifications.createChannel({
          id: 'nsg_scholar_activity',
          name: 'Community & Academic Activity',
          description: 'Live updates on community discussions, uploaded notes, and practice challenges',
          importance: 4,
          visibility: 1,
          sound: 'default',
          vibration: true
        });
      } catch (channelErr) {
        console.warn('Channel creation info:', channelErr);
      }

      const pushRes = await PushNotifications.requestPermissions().catch(() => ({ receive: 'prompt' }));
      const localRes = await LocalNotifications.requestPermissions().catch(() => ({ display: 'prompt' }));
      return localRes.display === 'granted' || pushRes.receive === 'granted';
    } catch (e) {
      console.warn('Native notification permission error:', e);
      return false;
    }
  }

  // Web Notification API
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

export async function initPushNotifications(
  onTokenReceived?: (token: string) => void,
  onNotificationReceived?: (notification: any) => void
) {
  if (!isNativePlatform()) return;

  try {
    const perm = await requestNotificationPermission();
    if (!perm) return;

    await PushNotifications.register().catch((err) => {
      console.warn('PushNotifications register notice:', err);
    });

    // On token registration
    await PushNotifications.addListener('registration', (token) => {
      console.log('🔔 Push registration token:', token.value);
      if (onTokenReceived) onTokenReceived(token.value);
    });

    // Registration error
    await PushNotifications.addListener('registrationError', (error) => {
      console.warn('🔔 Push registration error:', error);
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
    console.warn('Push notification initialization notice:', err);
  }
}

export const BACKGROUND_NOTIFICATIONS_POOL = [
  // 1. Scholar Achievements & Milestones
  {
    title: "🏆 Scholar Achievement Alert",
    body: "Maintain your daily study streak! Complete 1 quick Omni Quiz today to gain +50 XP and climb the Leaderboard.",
    channelId: "nsg_scholar_achievements",
    category: "achievement"
  },
  {
    title: "🌟 Scholar Rank Milestone",
    body: "You're getting closer to advancing your Scholar Division! Practice 5 CBT questions to lock in your rank.",
    channelId: "nsg_scholar_achievements",
    category: "achievement"
  },
  {
    title: "🎖️ Consistency Badge Unlocked",
    body: "Great scholars build daily habits. Open your Lecture Vault to review key formula summaries.",
    channelId: "nsg_scholar_achievements",
    category: "achievement"
  },
  {
    title: "🔥 Study Streak Shield Active",
    body: "Keep your study momentum alive! Solve today's daily question to keep your streak intact.",
    channelId: "nsg_scholar_achievements",
    category: "achievement"
  },

  // 2. Did You Know? (Academic Insights & Brain Hacks)
  {
    title: "💡 Did You Know? (Study Science)",
    body: "Testing yourself on Omni AI quizzes creates 3x stronger neural recall pathways than passively re-reading textbooks!",
    channelId: "nsg_scholar_did_you_know",
    category: "did_you_know"
  },
  {
    title: "💡 Did You Know? (Spaced Repetition)",
    body: "Reviewing lecture notes 24 hours after class boosts long-term memory retention in the hippocampus by up to 60%.",
    channelId: "nsg_scholar_did_you_know",
    category: "did_you_know"
  },
  {
    title: "💡 Did You Know? (Active Recall)",
    body: "Explaining a concept in simple terms (the Feynman Technique) exposes knowledge gaps immediately. Try it in Omni Chat!",
    channelId: "nsg_scholar_did_you_know",
    category: "did_you_know"
  },
  {
    title: "💡 Did You Know? (CBT Mastery)",
    body: "Practicing timed CBT questions 10 minutes a day reduces exam-day anxiety by over 45% and improves pacing.",
    channelId: "nsg_scholar_did_you_know",
    category: "did_you_know"
  },
  {
    title: "💡 Did You Know? (Audio Recall)",
    body: "Re-listening to your transcribed lecture audio summaries while commuting strengthens auditory memory recognition.",
    channelId: "nsg_scholar_did_you_know",
    category: "did_you_know"
  },

  // 3. Daily Scholar Activity & Community
  {
    title: "⚡ Daily Scholar Activity",
    body: "Fellow students have uploaded new high-yield lecture notes and practice solutions in the Community feed!",
    channelId: "nsg_scholar_activity",
    category: "activity"
  },
  {
    title: "💬 Community Discussion Alert",
    body: "Active academic discussions are happening now on upcoming exam topics. Tap to join the study group.",
    channelId: "nsg_scholar_activity",
    category: "activity"
  },
  {
    title: "📚 Academic Progress Reminder",
    body: "Don't let lecture notes pile up! Record your next class audio or import slides for instant AI summarization.",
    channelId: "nsg_scholar_activity",
    category: "activity"
  },
  {
    title: "🧠 Focus Booster",
    body: "“Success is the sum of small efforts repeated day in and day out.” Start your 15-minute study block now!",
    channelId: "nsg_scholar_did_you_know",
    category: "quote"
  }
];

export async function schedulePeriodicBackgroundNotifications(): Promise<void> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      await requestNotificationPermission();

      const permRes = await LocalNotifications.checkPermissions();
      if (permRes.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }

      // Cancel previous scheduled items to prevent stacking duplicates
      const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
      if (pending && pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending).catch(() => {});
      }

      // Schedule pool items over future intervals (e.g. 10m, 45m, 2h, 4h, 8h, 14h, 24h, 36h, 48h, 72h)
      const intervalsInMinutes = [10, 45, 120, 240, 480, 840, 1440, 2160, 2880, 4320, 5760, 7200];
      const notificationsToSchedule = BACKGROUND_NOTIFICATIONS_POOL.map((item, index) => {
        const delayMs = (intervalsInMinutes[index % intervalsInMinutes.length] || ((index + 1) * 60)) * 60 * 1000;
        const triggerTime = new Date(Date.now() + delayMs);
        
        return {
          title: item.title,
          body: item.body,
          id: 30000 + index,
          schedule: { at: triggerTime, allowWhileIdle: true },
          channelId: item.channelId || 'nsg_scholar_achievements',
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: { category: item.category }
        };
      });

      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`📱 Scheduled ${notificationsToSchedule.length} status-bar notifications across channels for native Android.`);
    } catch (err) {
      console.warn('Periodic native notifications scheduling notice:', err);
    }
  } else {
    // Web environment periodic reminder
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        if (!sessionStorage.getItem('nsg_scheduled_web_quote')) {
          sessionStorage.setItem('nsg_scheduled_web_quote', 'true');
          setTimeout(() => {
            const randomItem = BACKGROUND_NOTIFICATIONS_POOL[Math.floor(Math.random() * BACKGROUND_NOTIFICATIONS_POOL.length)];
            scheduleLocalNotification(randomItem.title, randomItem.body);
          }, 30000);
        }
      }
    }
  }
}

export async function scheduleLocalNotification(
  title: string, 
  body: string, 
  id: number = Date.now(),
  channelId: string = 'nsg_scholar_achievements'
): Promise<void> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      const permRes = await LocalNotifications.checkPermissions().catch(() => ({ display: 'prompt' }));
      if (permRes.display !== 'granted') {
        await LocalNotifications.requestPermissions().catch(() => {});
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: (Math.floor(Math.random() * 90000) + 10000),
            schedule: { at: new Date(Date.now() + 150), allowWhileIdle: true },
            channelId: channelId,
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      return;
    } catch (e) {
      console.warn('LocalNotifications schedule notice:', e);
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
        try {
          new Notification(title, { body, icon: '/icon.svg' });
        } catch (e) {}
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/icon.svg' });
        }
      }).catch(() => {});
    }
  }
}

