import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications, ActionPerformed } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';
import { pauseBackgroundRecording, resumeBackgroundRecording, stopBackgroundRecording } from './backgroundRecorder';

export type AlarmSoundOption = 'default' | 'alarm_bell.mp3' | 'digital_alarm.wav' | 'gentle_chime.mp3' | 'mute';

export const ALARM_SOUND_STORAGE_KEY = 'nsg_alarm_sound_setting';
export const ALARM_VIBRATION_STORAGE_KEY = 'nsg_alarm_vibration_setting';

/**
 * Retrieve user's configured alarm sound
 */
export function getSelectedAlarmSound(): AlarmSoundOption {
  if (typeof window === 'undefined') return 'default';
  return (localStorage.getItem(ALARM_SOUND_STORAGE_KEY) as AlarmSoundOption) || 'default';
}

/**
 * Update user's configured alarm sound
 */
export function setSelectedAlarmSound(sound: AlarmSoundOption): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ALARM_SOUND_STORAGE_KEY, sound);
}

/**
 * Retrieve user's configured alarm vibration setting
 */
export function getAlarmVibrationEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(ALARM_VIBRATION_STORAGE_KEY);
  return val !== 'false';
}

/**
 * Update user's configured alarm vibration setting
 */
export function setAlarmVibrationEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ALARM_VIBRATION_STORAGE_KEY, enabled ? 'true' : 'false');
}

/**
 * Initialize all NSG Notification Channels & Action Types
 */
export async function initScholarNotificationChannels(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // 1. Register Action Types for Exam Alarms, Emotional Prompts, and Media Controls
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'EXAM_ALARM_ACTION',
          actions: [
            {
              id: 'snooze_exam',
              title: '⏰ Snooze (5m)',
              foreground: false // Crucial: Executes in background without opening app
            },
            {
              id: 'dismiss_exam',
              title: '✕ Dismiss',
              foreground: false, // Crucial: Dismisses in background without opening app
              destructive: true
            }
          ]
        },
        {
          id: 'EMOTIONAL_QUIZ_ACTION',
          actions: [
            {
              id: 'take_quiz',
              title: '⚡ Take 1 Quiz',
              foreground: true
            },
            {
              id: 'dismiss_emotional',
              title: 'Later',
              foreground: false
            }
          ]
        },
        {
          id: 'EMOTIONAL_GRAMMAR_ACTION',
          actions: [
            {
              id: 'check_grammar',
              title: '📝 Check Grammar',
              foreground: true
            },
            {
              id: 'dismiss_emotional',
              title: 'Later',
              foreground: false
            }
          ]
        },
        {
          id: 'RECORDING_ACTIONS',
          actions: [
            {
              id: 'pause_recording',
              title: '⏸️ Pause',
              foreground: false
            },
            {
              id: 'resume_recording',
              title: '▶️ Continue',
              foreground: false
            },
            {
              id: 'end_recording',
              title: '⏹️ End & Save',
              foreground: true
            }
          ]
        },
        {
          id: 'SCHOLAR_QUIZ_ACTION',
          actions: [
            {
              id: 'start_quiz',
              title: '⚡ Start Practice',
              foreground: true
            },
            {
              id: 'open_vault',
              title: '📖 View Vault',
              foreground: true
            }
          ]
        },
        {
          id: 'SCHOLAR_HACK_ACTION',
          actions: [
            {
              id: 'read_hack',
              title: '💡 Read Hack',
              foreground: true
            }
          ]
        },
        {
          id: 'COMMUNITY_ACTION',
          actions: [
            {
              id: 'view_discussions',
              title: '💬 Join Discussion',
              foreground: true
            }
          ]
        }
      ]
    });
  } catch (actionErr) {
    console.warn('Action types registration notice:', actionErr);
  }

  try {
    const soundChoice = getSelectedAlarmSound();
    const soundFile = soundChoice === 'mute' ? undefined : (soundChoice === 'default' ? 'default' : soundChoice);

    // Channel 1: High Priority Exam Alarms
    await LocalNotifications.createChannel({
      id: 'nsg_exam_alarms',
      name: 'Exam Alarms & Reminders',
      description: 'High-priority timed countdown alarms for university examinations',
      importance: 5, // Maximum heads-up banner
      visibility: 1,
      sound: soundFile,
      vibration: getAlarmVibrationEnabled(),
      lights: true,
      lightColor: '#DC2626'
    });

    // Channel 2: Emotional & Engaging Study Prompts
    await LocalNotifications.createChannel({
      id: 'nsg_emotional_engagement',
      name: 'Study Reminders & Engagement',
      description: 'Engaging study nudges, quiz suggestions, and grammar practice alerts',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#7C3AED'
    });

    // Channel 3: Lecture Alarms
    await LocalNotifications.createChannel({
      id: 'nsg_lecture_alarms',
      name: 'Lecture Timetable Alarms',
      description: 'Class schedule reminders before lectures start',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true
    });

    // Channel 4: Reading Timetable Alarms
    await LocalNotifications.createChannel({
      id: 'nsg_reading_alarms',
      name: 'Study & Reading Alarms',
      description: 'Reminders for planned personal study sessions',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true
    });

    // Channel 5: Achievements & Rankings
    await LocalNotifications.createChannel({
      id: 'nsg_scholar_achievements',
      name: 'Scholar Achievements & Milestones',
      description: 'Notifications about scholar rankings, streak milestones, and achievements',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#7C3AED'
    });

    // Channel 6: Study Hacks & Did You Know
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

    // Channel 7: Community Activity
    await LocalNotifications.createChannel({
      id: 'nsg_scholar_activity',
      name: 'Community & Academic Activity',
      description: 'Live updates on community discussions and shared notes',
      importance: 3,
      visibility: 1,
      sound: 'default',
      vibration: true
    });
  } catch (channelErr) {
    console.warn('Channel creation notice:', channelErr);
  }
}

/**
 * Schedule Exam Countdown Alarms (1 Hour and 5 Minutes Before)
 * Strict Requirement:
 * - 1 Hour Before: "You have [Subject] in the Next 1hr at [Exam hall], prepare!"
 * - 5 Mins Before: "Hope you are at [Exam hall] now, you have only five minutes to Sit for [Exam]"
 * - Action buttons: "Dismiss" and "Snooze" (snoozes for 5 mins in background)
 */
export async function scheduleExamAlarms(exam: {
  id: string;
  courseCode: string;
  courseTitle?: string;
  venue?: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // "09:00"
}): Promise<boolean> {
  const isNative = isNativePlatform();
  const venueStr = exam.venue || 'Exam Hall';
  const subjectStr = exam.courseCode || 'Exam';

  try {
    const [y, m, d] = (exam.examDate || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const [startH, startM] = (exam.startTime || '09:00').split(':').map(Number);
    const examStartDateTime = new Date(y, m - 1, d, startH, startM);
    const examStartMs = examStartDateTime.getTime();

    if (isNaN(examStartMs)) return false;

    const oneHourBeforeMs = examStartMs - (60 * 60 * 1000);
    const fiveMinsBeforeMs = examStartMs - (5 * 60 * 1000);
    const nowMs = Date.now();

    const soundChoice = getSelectedAlarmSound();
    const soundFile = soundChoice === 'mute' ? undefined : (soundChoice === 'default' ? 'default' : soundChoice);

    const notificationsToSchedule: any[] = [];
    const baseId = Math.abs(hashCode(exam.id || exam.courseCode)) % 10000;

    // 1 Hour Before Notification
    if (oneHourBeforeMs > nowMs) {
      notificationsToSchedule.push({
        id: 70000 + baseId,
        title: `⏰ 1-Hour Exam Alarm: ${subjectStr}`,
        body: `You have ${subjectStr} in the Next 1hr at ${venueStr}, prepare!`,
        schedule: { at: new Date(oneHourBeforeMs), allowWhileIdle: true },
        channelId: 'nsg_exam_alarms',
        sound: soundFile,
        actionTypeId: 'EXAM_ALARM_ACTION',
        extra: {
          type: 'exam_alarm',
          timeframe: '1hr',
          examId: exam.id,
          subject: subjectStr,
          venue: venueStr,
          startTime: exam.startTime
        }
      });
    }

    // 5 Minutes Before Notification
    if (fiveMinsBeforeMs > nowMs) {
      notificationsToSchedule.push({
        id: 80000 + baseId,
        title: `🚨 Final Call: ${subjectStr} Exam in 5 Mins`,
        body: `Hope you are at ${venueStr} now, you have only five minutes to Sit for ${subjectStr}`,
        schedule: { at: new Date(fiveMinsBeforeMs), allowWhileIdle: true },
        channelId: 'nsg_exam_alarms',
        sound: soundFile,
        actionTypeId: 'EXAM_ALARM_ACTION',
        extra: {
          type: 'exam_alarm',
          timeframe: '5min',
          examId: exam.id,
          subject: subjectStr,
          venue: venueStr,
          startTime: exam.startTime
        }
      });
    }

    if (isNative && notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`⏰ Scheduled ${notificationsToSchedule.length} countdown alarms for ${subjectStr} exam.`);
      return true;
    }

    return true;
  } catch (err) {
    console.error('Error scheduling exam alarms:', err);
    return false;
  }
}

/**
 * Schedule Emotional Engagement Notifications
 * Formats:
 * 1. "Hey [User Name], I am about to faint😭 Just one quiz will do."
 * 2. "I thought you loved me😭!"
 * 3. "I am so bored 🥱, let's check your grammar at the specific tools page"
 */
export async function scheduleEmotionalNotifications(userName?: string): Promise<void> {
  const isNative = isNativePlatform();
  const name = userName ? userName.split(' ')[0] : 'Scholar';

  const emotionalPool = [
    {
      id: 91001,
      title: "😭 Omni is waiting for you...",
      body: `Hey ${name}, I am about to faint😭 Just one quiz will do.`,
      actionTypeId: 'EMOTIONAL_QUIZ_ACTION',
      delayMinutes: 30, // 30 mins
      route: 'quiz',
      channelId: 'nsg_emotional_engagement'
    },
    {
      id: 91002,
      title: "💔 Did you forget our study goal?",
      body: "I thought you loved me😭!",
      actionTypeId: 'EMOTIONAL_QUIZ_ACTION',
      delayMinutes: 180, // 3 hours
      route: 'quiz',
      channelId: 'nsg_emotional_engagement'
    },
    {
      id: 91003,
      title: "🥱 Feeling rusty?",
      body: "I am so bored 🥱, let's check your grammar at the specific tools page",
      actionTypeId: 'EMOTIONAL_GRAMMAR_ACTION',
      delayMinutes: 360, // 6 hours
      route: 'tools/grammar',
      channelId: 'nsg_emotional_engagement'
    },
    {
      id: 91004,
      title: "⚡ Quick Brain Workout",
      body: `Hey ${name}, I am about to faint😭 Just one quiz will do.`,
      actionTypeId: 'EMOTIONAL_QUIZ_ACTION',
      delayMinutes: 720, // 12 hours
      route: 'quiz',
      channelId: 'nsg_emotional_engagement'
    }
  ];

  if (isNative) {
    try {
      const notifications = emotionalPool.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        schedule: { at: new Date(Date.now() + item.delayMinutes * 60 * 1000), allowWhileIdle: true },
        channelId: item.channelId,
        sound: 'default',
        actionTypeId: item.actionTypeId,
        extra: { route: item.route, emotional: true }
      }));

      await LocalNotifications.schedule({ notifications });
      console.log(`📱 Scheduled ${notifications.length} emotional engagement notifications.`);
    } catch (e) {
      console.warn('Emotional notifications schedule notice:', e);
    }
  }
}

/**
 * Central Listener for Notification Action Buttons & Taps
 * - Background Snooze & Dismiss handling without opening the app
 * - Media Notification control handling (Pause / Continue / End)
 * - Deep Link / Navigation callback execution for emotional quiz and grammar tools
 */
export function setupNotificationActionListeners(
  onNavigate?: (route: string, extra?: any) => void
): void {
  if (!isNativePlatform()) return;

  try {
    LocalNotifications.addListener('localNotificationActionPerformed', async (action: ActionPerformed) => {
      const actionId = action.actionId;
      const extra = action.notification.extra || {};

      console.log('🔔 User interacted with notification:', { actionId, notificationId: action.notification.id, extra });

      // 1. Handle Background Alarm Snooze (5 Minutes)
      if (actionId === 'snooze_exam') {
        const snoozeTime = new Date(Date.now() + (5 * 60 * 1000));
        const soundChoice = getSelectedAlarmSound();
        const soundFile = soundChoice === 'mute' ? undefined : (soundChoice === 'default' ? 'default' : soundChoice);

        await LocalNotifications.schedule({
          notifications: [
            {
              id: (Math.floor(Math.random() * 80000) + 10000),
              title: `⏰ Snoozed Alarm: ${extra.subject || 'Exam'}`,
              body: `Snooze finished! Get to ${extra.venue || 'your exam hall'} immediately!`,
              schedule: { at: snoozeTime, allowWhileIdle: true },
              channelId: 'nsg_exam_alarms',
              sound: soundFile,
              actionTypeId: 'EXAM_ALARM_ACTION',
              extra: extra
            }
          ]
        });
        return;
      }

      // 2. Handle Dismiss
      if (actionId === 'dismiss_exam' || actionId === 'dismiss_emotional' || actionId === 'dismiss_hack') {
        try {
          await LocalNotifications.cancel({ notifications: [{ id: action.notification.id }] });
        } catch (e) {}
        return;
      }

      // 3. Handle Background Media Controls
      if (actionId === 'pause_recording') {
        await pauseBackgroundRecording();
        return;
      }
      if (actionId === 'resume_recording') {
        await resumeBackgroundRecording();
        return;
      }
      if (actionId === 'end_recording') {
        await stopBackgroundRecording();
        if (onNavigate) onNavigate('vault', { tab: 'recordings' });
        return;
      }

      // 4. Handle Navigation Routes
      if (actionId === 'take_quiz' || actionId === 'start_quiz' || extra.route === 'quiz') {
        if (onNavigate) onNavigate('quiz', extra);
        return;
      }

      if (actionId === 'check_grammar' || extra.route === 'tools/grammar') {
        if (onNavigate) onNavigate('tools', { tool: 'grammar', ...extra });
        return;
      }

      if (actionId === 'open_vault' || extra.route === 'vault') {
        if (onNavigate) onNavigate('vault', extra);
        return;
      }

      if (actionId === 'view_discussions' || extra.route === 'community') {
        if (onNavigate) onNavigate('community', extra);
        return;
      }

      // Default tap on notification body
      if (extra.route && onNavigate) {
        onNavigate(extra.route, extra);
      }
    });
  } catch (err) {
    console.warn('Error setting up notification action listener:', err);
  }
}

/**
 * Request General Notification Permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      await initScholarNotificationChannels();
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

/**
 * Initialize Push Notifications
 */
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

    await PushNotifications.addListener('registration', (token) => {
      if (onTokenReceived) onTokenReceived(token.value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.warn('🔔 Push registration error:', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      if (onNotificationReceived) onNotificationReceived(notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('🔔 Push notification tapped:', action);
    });
  } catch (err) {
    console.warn('Push notification initialization notice:', err);
  }
}

export const BACKGROUND_NOTIFICATIONS_POOL = [
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
    title: "⚡ Daily Scholar Activity",
    body: "Fellow students have uploaded new high-yield lecture notes and practice solutions in the Community feed!",
    channelId: "nsg_scholar_activity",
    category: "activity"
  }
];

export async function schedulePeriodicBackgroundNotifications(userName?: string): Promise<void> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      await requestNotificationPermission();

      // Schedule pool items over future intervals
      const intervalsInMinutes = [15, 60, 180, 360, 720, 1440, 2880];
      const notificationsToSchedule = BACKGROUND_NOTIFICATIONS_POOL.map((item, index) => {
        const delayMs = (intervalsInMinutes[index % intervalsInMinutes.length] || ((index + 1) * 60)) * 60 * 1000;
        const triggerTime = new Date(Date.now() + delayMs);
        
        let actionTypeId = 'SCHOLAR_QUIZ_ACTION';
        if (item.category === 'did_you_know') {
          actionTypeId = 'SCHOLAR_HACK_ACTION';
        } else if (item.category === 'activity') {
          actionTypeId = 'COMMUNITY_ACTION';
        }

        return {
          title: item.title,
          body: item.body,
          id: 30000 + index,
          schedule: { at: triggerTime, allowWhileIdle: true },
          channelId: item.channelId || 'nsg_scholar_achievements',
          sound: 'default',
          actionTypeId: actionTypeId,
          extra: { category: item.category }
        };
      });

      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      await scheduleEmotionalNotifications(userName);
    } catch (err) {
      console.warn('Periodic native notifications scheduling notice:', err);
    }
  }
}

export async function scheduleLocalNotification(
  title: string, 
  body: string, 
  scheduledTimeOrId?: number,
  channelId: string = 'nsg_scholar_achievements',
  category?: string
): Promise<void> {
  const isNative = isNativePlatform();

  let actionTypeId = 'SCHOLAR_QUIZ_ACTION';
  if (category === 'did_you_know') {
    actionTypeId = 'SCHOLAR_HACK_ACTION';
  } else if (category === 'activity') {
    actionTypeId = 'COMMUNITY_ACTION';
  }

  const triggerAt = scheduledTimeOrId && scheduledTimeOrId > Date.now() 
    ? new Date(scheduledTimeOrId) 
    : new Date(Date.now() + 200);

  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: (Math.floor(Math.random() * 90000) + 10000),
            schedule: { at: triggerAt, allowWhileIdle: true },
            channelId: channelId,
            sound: 'default',
            actionTypeId: actionTypeId,
            extra: { category: category || 'general' }
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
        new Notification(title, { body, icon: '/icon.svg' });
      } catch (e) {}
    }
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
