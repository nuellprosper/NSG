/**
 * Exam Alarm Scheduler with 1-Hour & 5-Minute Warning Triggers
 * Supports background Snooze (5 mins) & Dismiss actions without bringing the app to the foreground
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';

export interface ExamScheduleItem {
  id: string;
  courseCode: string;
  courseTitle?: string;
  examDate: string; // YYYY-MM-DD
  examTime: string; // HH:mm
  examHall: string;
}

export type AlarmSoundType = 'default' | 'beep_alarm.mp3' | 'chime_alarm.wav' | 'school_bell.mp3' | 'mute';

export const ALARM_SOUND_STORAGE_KEY = 'nsg_exam_alarm_sound_preference';
export const EXAM_ALARM_CHANNEL_ID = 'nsg_exam_alarms_channel';
export const EXAM_ALARM_ACTION_TYPE = 'EXAM_ALARM_ACTION';

/**
 * Get current alarm sound preference
 */
export function getAlarmSoundPreference(): AlarmSoundType {
  try {
    const saved = localStorage.getItem(ALARM_SOUND_STORAGE_KEY);
    if (saved) return saved as AlarmSoundType;
  } catch (e) {}
  return 'beep_alarm.mp3';
}

/**
 * Update alarm sound preference
 */
export function setAlarmSoundPreference(sound: AlarmSoundType): void {
  try {
    localStorage.setItem(ALARM_SOUND_STORAGE_KEY, sound);
  } catch (e) {}
}

/**
 * Register Action Types & Notification Channel for Exam Alarms
 */
export async function registerExamAlarmActionTypes(): Promise<void> {
  if (!isNativePlatform()) return;

  const soundPref = getAlarmSoundPreference();
  const isMute = soundPref === 'mute';
  const soundFile = (soundPref !== 'default' && soundPref !== 'mute') ? soundPref : undefined;

  try {
    // 1. Create or update Exam Alarm Channel
    await LocalNotifications.createChannel({
      id: EXAM_ALARM_CHANNEL_ID,
      name: 'NSG Exam Countdown Alarms',
      description: 'Critical 1-Hour and 5-Minute alarms before scheduled exams with custom sounds',
      importance: 5, // Maximum urgency / heads-up notification
      visibility: 1, // Public on lockscreen
      sound: isMute ? undefined : soundFile,
      vibration: true,
      lights: true,
      lightColor: '#DC2626'
    }).catch(() => {});

    // 2. Register Background "Dismiss" & "Snooze" Actions
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: EXAM_ALARM_ACTION_TYPE,
          actions: [
            {
              id: 'snooze_5min',
              title: '⏰ Snooze 5m',
              foreground: false // CRUCIAL: Executes silently in the background
            },
            {
              id: 'dismiss_alarm',
              title: '❌ Dismiss',
              foreground: false, // CRUCIAL: Clears immediately without opening app
              destructive: true
            }
          ]
        }
      ]
    }).catch((err) => {
      console.warn('Exam alarm action types registration error:', err);
    });
  } catch (e) {
    console.warn('Error setting up exam alarm action types:', e);
  }
}

/**
 * Generate stable unique numerical notification IDs based on exam ID and warning type
 */
function generateNotificationId(examId: string, type: '1hr' | '5min' | 'snooze'): number {
  let hash = 0;
  const str = `${examId}_${type}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const base = Math.abs(hash % 900000) + 10000;
  return base;
}

/**
 * Schedule 1-Hour and 5-Minute Exam Alarm Notifications
 */
export async function scheduleExamAlarm(exam: ExamScheduleItem): Promise<boolean> {
  if (!exam.examDate || !exam.examTime) return false;

  // Compute exact exam timestamp
  const examDateTimeStr = `${exam.examDate}T${exam.examTime}:00`;
  const examDateObj = new Date(examDateTimeStr);
  const examTimeMs = examDateObj.getTime();

  if (isNaN(examTimeMs) || examTimeMs <= Date.now()) {
    console.log('Skipping past exam alarm:', exam.courseCode);
    return false;
  }

  await registerExamAlarmActionTypes();

  const soundPref = getAlarmSoundPreference();
  const isMute = soundPref === 'mute';
  const soundFile = (soundPref !== 'default' && soundPref !== 'mute') ? soundPref : undefined;

  const subject = exam.courseCode.trim() || 'Exam';
  const examHall = exam.examHall?.trim() || 'Assigned Examination Center';

  const notificationsToSchedule: any[] = [];

  // 1. One Hour Before Warning
  const oneHourBeforeMs = examTimeMs - (60 * 60 * 1000);
  if (oneHourBeforeMs > Date.now()) {
    const id1hr = generateNotificationId(exam.id, '1hr');
    notificationsToSchedule.push({
      id: id1hr,
      title: `⏰ ${subject} Exam in 1 Hour`,
      body: `You have ${subject} in the Next 1hr at ${examHall}, prepare!`,
      channelId: EXAM_ALARM_CHANNEL_ID,
      actionTypeId: EXAM_ALARM_ACTION_TYPE,
      sound: isMute ? undefined : soundFile,
      schedule: { at: new Date(oneHourBeforeMs), allowWhileIdle: true },
      extra: {
        type: 'exam_alarm',
        alertType: '1hr',
        examId: exam.id,
        subject,
        examHall,
        examTimeMs
      }
    });
  }

  // 2. Five Minutes Before Warning
  const fiveMinsBeforeMs = examTimeMs - (5 * 60 * 1000);
  if (fiveMinsBeforeMs > Date.now()) {
    const id5min = generateNotificationId(exam.id, '5min');
    notificationsToSchedule.push({
      id: id5min,
      title: `🚨 Urgent: 5 Minutes to ${subject}`,
      body: `Hope you are at ${examHall} now, you have only five minutes to Sit for ${subject}`,
      channelId: EXAM_ALARM_CHANNEL_ID,
      actionTypeId: EXAM_ALARM_ACTION_TYPE,
      sound: isMute ? undefined : soundFile,
      schedule: { at: new Date(fiveMinsBeforeMs), allowWhileIdle: true },
      extra: {
        type: 'exam_alarm',
        alertType: '5min',
        examId: exam.id,
        subject,
        examHall,
        examTimeMs
      }
    });
  }

  if (notificationsToSchedule.length > 0 && isNativePlatform()) {
    try {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`✅ Successfully scheduled ${notificationsToSchedule.length} alarms for ${subject}`);
      return true;
    } catch (e) {
      console.warn('Error scheduling native exam alarm:', e);
    }
  }

  return false;
}

/**
 * Background Handler for Snooze Action:
 * Reschedules notification for 5 minutes in the future silently
 */
export async function handleAlarmSnooze(notification: any): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const extra = notification.extra || {};
    const subject = extra.subject || 'Your Exam';
    const examHall = extra.examHall || 'Exam Hall';
    const soundPref = getAlarmSoundPreference();
    const isMute = soundPref === 'mute';
    const soundFile = (soundPref !== 'default' && soundPref !== 'mute') ? soundPref : undefined;

    const snoozeNotificationId = Math.floor(Math.random() * 80000) + 10000;
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes later

    await LocalNotifications.schedule({
      notifications: [
        {
          id: snoozeNotificationId,
          title: `⏰ Snoozed: ${subject} Exam Reminder`,
          body: `Snooze reminder: You have ${subject} soon at ${examHall}. Head to your seat!`,
          channelId: EXAM_ALARM_CHANNEL_ID,
          actionTypeId: EXAM_ALARM_ACTION_TYPE,
          sound: isMute ? undefined : soundFile,
          schedule: { at: snoozeTime, allowWhileIdle: true },
          extra: {
            ...extra,
            alertType: 'snooze'
          }
        }
      ]
    });

    console.log(`💤 Exam alarm snoozed for 5 minutes until ${snoozeTime.toLocaleTimeString()}`);
  } catch (e) {
    console.warn('Error snoozing exam alarm in background:', e);
  }
}

/**
 * Background Handler for Dismiss Action:
 * Clears the notification immediately
 */
export async function handleAlarmDismiss(notificationId: number): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });
    console.log(`❌ Exam alarm ${notificationId} dismissed in background.`);
  } catch (e) {
    console.warn('Error dismissing exam alarm:', e);
  }
}
