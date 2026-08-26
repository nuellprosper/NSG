import React, { useEffect, useRef } from 'react';
import { 
  requestAllPermissions, 
  initNotificationListeners, 
  schedulePeriodicBackgroundNotifications, 
  scheduleEmotionalEngagementNotifications,
  initPushNotifications,
  useUniversalDeepLinking,
  ParsedDeepLink
} from '../lib/capacitor';

export interface AppBootstrapperProps {
  userName?: string;
  onNavigateQuiz?: (quizId?: string) => void;
  onNavigateCourse?: (courseId: string) => void;
  onNavigateGrammar?: () => void;
  onNavigateTools?: (toolId?: string) => void;
  onDeepLink?: (link: ParsedDeepLink) => void;
}

/**
 * Production-Grade Global App Bootstrapper Component
 * 1. Immediate Global Permissions on Launch (Mic, Notifications, Calendar, Camera/Photos)
 * 2. Background Notification Action Channels & Foreground/Background Dispatchers
 * 3. Emotional Engagement & Recurring Study Alarms
 * 4. Universal Deep Linking for Android App Links (nuellstudyguide.name.ng)
 */
export const AppBootstrapper: React.FC<AppBootstrapperProps> = ({
  userName,
  onNavigateQuiz,
  onNavigateCourse,
  onNavigateGrammar,
  onNavigateTools,
  onDeepLink
}) => {
  const isInitialized = useRef(false);

  // 1. Universal Deep Linking Listener (Android App Links & Web)
  useUniversalDeepLinking((parsedLink: ParsedDeepLink) => {
    if (onDeepLink) {
      onDeepLink(parsedLink);
    }
    if (parsedLink.quizId && onNavigateQuiz) {
      onNavigateQuiz(parsedLink.quizId);
    } else if (parsedLink.courseId && onNavigateCourse) {
      onNavigateCourse(parsedLink.courseId);
    } else if (parsedLink.toolId === 'grammar' && onNavigateGrammar) {
      onNavigateGrammar();
    } else if (parsedLink.toolId && onNavigateTools) {
      onNavigateTools(parsedLink.toolId);
    }
  });

  // 2. Global Initialization & Permission Request on Mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    async function bootstrapNativeApp() {
      console.log('🚀 [NSG Bootstrapper] Initializing native permissions, alarms, and background listeners...');

      // 1. Request All Native Permissions immediately on first launch
      try {
        const perms = await requestAllPermissions();
        console.log('📱 [NSG Bootstrapper] Native permissions state:', perms);
      } catch (err) {
        console.warn('Native permissions bootstrapper error:', err);
      }

      // 2. Setup Notification Action Listeners (Dismiss, Snooze, Recording controls, Engagement routing)
      try {
        await initNotificationListeners({
          onNavigateQuiz,
          onNavigateCourse,
          onNavigateGrammar,
          onNavigateTools
        });
      } catch (err) {
        console.warn('Notification listener bootstrapper error:', err);
      }

      // 3. Setup Recurring Study Notifications & Emotional Check-ins
      try {
        await schedulePeriodicBackgroundNotifications();
        await scheduleEmotionalEngagementNotifications(userName);
      } catch (err) {
        console.warn('Background notifications scheduler error:', err);
      }

      // 4. Initialize Push Notifications (FCM / APNs)
      try {
        await initPushNotifications();
      } catch (err) {}
    }

    bootstrapNativeApp();
  }, [userName, onNavigateQuiz, onNavigateCourse, onNavigateGrammar, onNavigateTools]);

  return null; // Headless component providing continuous background lifecycle management
};

export default AppBootstrapper;
