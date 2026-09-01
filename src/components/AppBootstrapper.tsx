import React, { useEffect, useRef } from 'react';
import { requestAllPermissions } from '../lib/capacitor/permissions';
import { 
  initScholarNotificationChannels, 
  setupNotificationActionListeners, 
  schedulePeriodicBackgroundNotifications 
} from '../lib/capacitor/notifications';
import { initNativeDeepLinks, ParsedDeepLink } from '../lib/capacitor/appEvents';

interface AppBootstrapperProps {
  children?: React.ReactNode;
  onNavigate?: (route: string, extra?: any) => void;
  onDeepLink?: (url: string) => void;
  userName?: string;
}

export const AppBootstrapper: React.FC<AppBootstrapperProps> = ({
  children,
  onNavigate,
  onDeepLink,
  userName
}) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    async function bootstrapNativeServices() {
      try {
        // 1. Request All Native Permissions on App Launch (Microphone, Notifications, Calendar, Camera)
        const permStatus = await requestAllPermissions();
        console.log('📱 Native Permissions Status:', permStatus);

        // 2. Initialize Native Scholar Notification Channels & Action Types (Dismiss, Snooze, Recording Media Controls)
        await initScholarNotificationChannels();

        // 3. Setup Notification Action Performed Listeners (Snooze, Dismiss, Emotional Quiz / Grammar routes)
        setupNotificationActionListeners((route: string, extra?: any) => {
          if (onNavigate) {
            onNavigate(route, extra);
          }
        });

        // 4. Setup Universal Deep Linking (e.g. https://nuellstudyguide.name.ng/course/12345 or /quiz/12345)
        const cleanupDeepLinks = initNativeDeepLinks((parsed: ParsedDeepLink) => {
          console.log('🔗 Universal Deep Link Captured in Bootstrapper:', parsed);
          if (onDeepLink) {
            onDeepLink(parsed.originalUrl);
          }
          if (onNavigate) {
            if (parsed.route === 'course' && parsed.id) {
              onNavigate('course_preview', { courseId: parsed.id, ...parsed.queryParams });
            } else if (parsed.route === 'quiz') {
              onNavigate('quiz', { quizId: parsed.id, topic: parsed.id, ...parsed.queryParams });
            } else if (parsed.route === 'tools') {
              onNavigate('tools', { tool: parsed.subTool || 'grammar', ...parsed.queryParams });
            } else if (parsed.route === 'vault') {
              onNavigate('vault', { tab: parsed.id || 'notes', ...parsed.queryParams });
            } else if (parsed.route === 'community') {
              onNavigate('community', { postId: parsed.id, ...parsed.queryParams });
            } else if (parsed.route === 'timetable') {
              onNavigate('timetable', { section: parsed.id || 'exam', ...parsed.queryParams });
            } else {
              onNavigate(parsed.route || 'home', parsed.queryParams);
            }
          }
        });

        // 5. Schedule Emotional Study Prompts and Background Insights
        await schedulePeriodicBackgroundNotifications(userName);

        return () => {
          if (cleanupDeepLinks) cleanupDeepLinks();
        };
      } catch (err) {
        console.warn('AppBootstrapper initialization notice:', err);
      }
    }

    bootstrapNativeServices();
  }, [onNavigate, onDeepLink, userName]);

  return <>{children}</>;
};
