import { LocalNotifications, ActionPerformed, Channel } from '@capacitor/local-notifications';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed as PushActionPerformed } from '@capacitor/push-notifications';
import { isNativePlatform } from './platform';
import { 
  registerExamAlarmActionTypes, 
  handleAlarmSnooze, 
  handleAlarmDismiss,
  EXAM_ALARM_CHANNEL_ID,
  EXAM_ALARM_ACTION_TYPE 
} from './examAlarms';
import { 
  registerRecordingActionTypes, 
  pauseBackgroundLectureRecording, 
  resumeBackgroundLectureRecording 
} from './backgroundRecording';
import { 
  registerEngagementActionTypes,
  ENGAGEMENT_CHANNEL_ID,
  ENGAGEMENT_ACTION_TYPE
} from './engagementNotifications';

export interface NotificationActionCallbacks {
  onNavigateQuiz?: (quizId?: string) => void;
  onNavigateCourse?: (courseId: string) => void;
  onNavigateGrammar?: () => void;
  onNavigateTools?: (toolId?: string) => void;
  onEndRecording?: () => void;
}

/**
 * 1. Register ALL Notification Channels & Interactive Action Types
 */
export async function registerAllNotificationActionTypes(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // 1. General study channels
    await LocalNotifications.createChannel({
      id: 'nsg_study_reminders',
      name: 'NSG Daily Study Reminders',
      description: 'Daily revision, flashcards and quiz notifications',
      importance: 3,
      visibility: 1,
      vibration: true
    }).catch(() => {});

    // 2. Exam alarms channel & action types
    await registerExamAlarmActionTypes();

    // 3. Recording media controller channel & action types
    await registerRecordingActionTypes();

    // 4. Emotional engagement channel & action types
    await registerEngagementActionTypes();
  } catch (err) {
    console.warn('Error setting up notification channels & action types:', err);
  }
}

/**
 * 2. Unified Notification Action Performed Listener
 * Catches background buttons ("Dismiss", "Snooze", "Pause", "Continue")
 * and foreground routing ("Take Quiz", "Check Grammar", tap on notification)
 */
export async function initNotificationListeners(callbacks: NotificationActionCallbacks = {}): Promise<() => void> {
  if (!isNativePlatform()) return () => {};

  await registerAllNotificationActionTypes();

  // Local Notifications Action Listener
  const actionListener = await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    async (notificationAction: ActionPerformed) => {
      const actionId = notificationAction.actionId;
      const notification = notificationAction.notification;
      const extra = notification.extra || {};

      console.log('🔔 [Local Notification Action Triggered]:', actionId, extra);

      // 1. Background Exam Alarm Actions (Must NOT bring app to front)
      if (actionId === 'snooze_5min') {
        await handleAlarmSnooze(notification);
        return;
      }
      if (actionId === 'dismiss_alarm') {
        await handleAlarmDismiss(notification.id);
        return;
      }

      // 2. Background Lecture Recording Actions
      if (actionId === 'pause_recording') {
        await pauseBackgroundLectureRecording();
        return;
      }
      if (actionId === 'resume_recording') {
        await resumeBackgroundLectureRecording();
        return;
      }
      if (actionId === 'end_recording') {
        if (callbacks.onEndRecording) {
          callbacks.onEndRecording();
        }
        return;
      }

      // 3. Emotional Engagement & Routing Actions
      if (actionId === 'open_quiz' || extra.targetRoute === '/quiz') {
        if (callbacks.onNavigateQuiz) {
          callbacks.onNavigateQuiz(extra.quizId);
        }
        return;
      }

      if (actionId === 'open_grammar' || extra.targetRoute === '/tools/grammar') {
        if (callbacks.onNavigateGrammar) {
          callbacks.onNavigateGrammar();
        } else if (callbacks.onNavigateTools) {
          callbacks.onNavigateTools('grammar');
        }
        return;
      }

      if (extra.targetRoute === '/tools') {
        if (callbacks.onNavigateTools) {
          callbacks.onNavigateTools(extra.toolId);
        }
        return;
      }

      if (extra.courseId && callbacks.onNavigateCourse) {
        callbacks.onNavigateCourse(extra.courseId);
        return;
      }

      if (extra.quizId && callbacks.onNavigateQuiz) {
        callbacks.onNavigateQuiz(extra.quizId);
        return;
      }
    }
  );

  return () => {
    actionListener.remove();
  };
}

/**
 * 3. Schedule Recurring Study Notifications
 */
export async function schedulePeriodicBackgroundNotifications(): Promise<void> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      const permRes = await LocalNotifications.checkPermissions();
      if (permRes.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }

      await registerAllNotificationActionTypes();

      const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
      // Filter out persistent recording notification so we don't clear an active recording
      const nonRecordingPending = pending.notifications.filter(n => n.id !== 88888);
      if (nonRecordingPending.length > 0) {
        await LocalNotifications.cancel({ notifications: nonRecordingPending }).catch(() => {});
      }

      const now = new Date();
      const notificationsToSchedule: any[] = [];

      // 1. Morning study spark
      const morningTime = new Date(now);
      morningTime.setHours(8, 30, 0, 0);
      if (morningTime.getTime() <= now.getTime()) {
        morningTime.setDate(morningTime.getDate() + 1);
      }
      notificationsToSchedule.push({
        id: 70001,
        title: '☀️ Rise & Revise with NSG Scholar',
        body: 'Start your morning with a 5-minute study sprint or review your flashcards!',
        channelId: 'nsg_study_reminders',
        schedule: { at: morningTime, allowWhileIdle: true },
        extra: { targetRoute: '/quiz' }
      });

      // 2. Evening grammar & quiz recap
      const eveningTime = new Date(now);
      eveningTime.setHours(19, 0, 0, 0);
      if (eveningTime.getTime() <= now.getTime()) {
        eveningTime.setDate(eveningTime.getDate() + 1);
      }
      notificationsToSchedule.push({
        id: 70002,
        title: '🧠 Evening Knowledge Check',
        body: 'Test your understanding before calling it a day. Tap to launch an AI quiz.',
        channelId: 'nsg_study_reminders',
        schedule: { at: eveningTime, allowWhileIdle: true },
        extra: { targetRoute: '/quiz' }
      });

      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    } catch (err) {
      console.warn('Native background notifications setup notice:', err);
    }
    return;
  }

  // Web Browser Notification fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    // Web scheduled reminder
  }
}

/**
 * 4. Initialize Push Notifications (FCM / APNs)
 */
export async function initPushNotifications(
  onTokenReceived?: (token: string) => void,
  onPushOpened?: (data: any) => void
): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission not granted.');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('📱 FCM Device Token registered:', token.value);
      try {
        localStorage.setItem('nsg_fcm_token', token.value);
      } catch (e) {}
      if (onTokenReceived) onTokenReceived(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.warn('FCM Registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received in foreground:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: PushActionPerformed) => {
      console.log('Push action performed:', notification);
      if (onPushOpened) onPushOpened(notification.notification.data);
    });
  } catch (err) {
    console.warn('Push initialization warning:', err);
  }
}

/**
 * Schedule a one-shot local notification (supports both options object and positional arguments)
 */
export async function scheduleLocalNotification(
  titleOrOptions: string | { title: string; body: string; id?: number; scheduleAt?: Date | string | number; extra?: any },
  bodyArg?: string,
  idArg?: number,
  scheduleAtArg?: Date | string | number,
  extraArg?: any
): Promise<void> {
  let title: string;
  let body: string;
  let id: number;
  let rawScheduleAt: Date | string | number | undefined;
  let extra: any;

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    title = titleOrOptions.title;
    body = titleOrOptions.body;
    id = titleOrOptions.id || Math.floor(Math.random() * 80000) + 1000;
    rawScheduleAt = titleOrOptions.scheduleAt;
    extra = titleOrOptions.extra;
  } else {
    title = String(titleOrOptions || '');
    body = String(bodyArg || '');
    id = idArg || Math.floor(Math.random() * 80000) + 1000;
    rawScheduleAt = scheduleAtArg;
    extra = extraArg;
  }

  let scheduleDate: Date | undefined = undefined;
  if (rawScheduleAt) {
    scheduleDate = rawScheduleAt instanceof Date ? rawScheduleAt : new Date(rawScheduleAt);
    if (isNaN(scheduleDate.getTime())) {
      scheduleDate = undefined;
    }
  }

  if (isNativePlatform()) {
    try {
      const permRes = await LocalNotifications.checkPermissions().catch(() => ({ display: 'prompt' }));
      if (permRes.display !== 'granted') {
        await LocalNotifications.requestPermissions().catch(() => {});
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: scheduleDate ? { at: scheduleDate, allowWhileIdle: true } : undefined,
            extra
          }
        ]
      });
    } catch (e) {
      console.warn('Local notification schedule notice:', e);
    }
    return;
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch (e) {}
  }
}

// Re-export submodules
export * from './examAlarms';
export * from './backgroundRecording';
export * from './engagementNotifications';
