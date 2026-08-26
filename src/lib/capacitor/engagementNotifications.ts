/**
 * Emotional Engagement Notifications Scheduler
 * Re-engages students with empathetic messages and direct routing to Quizzes or Grammar Tool
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';

export const ENGAGEMENT_CHANNEL_ID = 'nsg_student_engagement_channel';
export const ENGAGEMENT_ACTION_TYPE = 'EMOTIONAL_ENGAGEMENT_ACTION';

export type EngagementTargetRoute = '/quiz' | '/tools/grammar' | '/tools';

export interface EngagementNotificationPayload {
  id: number;
  title: string;
  body: string;
  targetRoute: EngagementTargetRoute;
  actionTitle: string;
}

/**
 * Register Action Types & Channels for Emotional Engagement Notifications
 */
export async function registerEngagementActionTypes(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await LocalNotifications.createChannel({
      id: ENGAGEMENT_CHANNEL_ID,
      name: 'NSG Study Motivations & Reminders',
      description: 'Encouraging study check-ins, grammar tool challenges, and quick quizzes',
      importance: 3,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#6366F1'
    }).catch(() => {});

    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: ENGAGEMENT_ACTION_TYPE,
          actions: [
            {
              id: 'open_quiz',
              title: '📝 Take Quick Quiz',
              foreground: true
            },
            {
              id: 'open_grammar',
              title: '✨ Check Grammar',
              foreground: true
            }
          ]
        }
      ]
    }).catch(() => {});
  } catch (e) {
    console.warn('Engagement action types registration error:', e);
  }
}

/**
 * Build personalized emotional engagement notifications
 */
export function getEngagementTemplates(userName: string = 'Scholar'): EngagementNotificationPayload[] {
  const cleanName = userName && userName !== 'Student' ? userName : 'Scholar';

  return [
    {
      id: 91001,
      title: `Hey ${cleanName} 😭`,
      body: `Hey ${cleanName}, I am about to faint😭 Just one quiz will do.`,
      targetRoute: '/quiz',
      actionTitle: 'Take 1 Quiz'
    },
    {
      id: 91002,
      title: `I thought you loved me😭!`,
      body: `I thought you loved me😭! Come back and solve a quick 3-question revision round.`,
      targetRoute: '/quiz',
      actionTitle: 'Open Quiz'
    },
    {
      id: 91003,
      title: `I am so bored 🥱`,
      body: `I am so bored 🥱, let's check your grammar at the specific tools page`,
      targetRoute: '/tools/grammar',
      actionTitle: 'Check Grammar'
    }
  ];
}

/**
 * Schedule periodic emotional engagement notifications
 * (e.g. 6 hours from now, 24 hours, and 48 hours)
 */
export async function scheduleEmotionalEngagementNotifications(userName?: string): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await registerEngagementActionTypes();

    const templates = getEngagementTemplates(userName);
    const intervalsHours = [6, 24, 48];

    const notificationsToSchedule = templates.map((item, idx) => {
      const delayHours = intervalsHours[idx] || (idx + 1) * 12;
      const scheduledTime = new Date(Date.now() + delayHours * 60 * 60 * 1000);

      return {
        id: item.id,
        title: item.title,
        body: item.body,
        channelId: ENGAGEMENT_CHANNEL_ID,
        actionTypeId: ENGAGEMENT_ACTION_TYPE,
        schedule: { at: scheduledTime, allowWhileIdle: true },
        extra: {
          type: 'emotional_engagement',
          targetRoute: item.targetRoute,
          itemIndex: idx
        }
      };
    });

    await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    console.log('✅ Scheduled emotional engagement notifications.');
  } catch (err) {
    console.warn('Could not schedule engagement notifications:', err);
  }
}
