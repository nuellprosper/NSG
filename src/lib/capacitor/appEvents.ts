import { useEffect, useRef, useCallback } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { isNativePlatform } from './platform';

export interface ParsedDeepLink {
  originalUrl: string;
  route: string; // 'course' | 'quiz' | 'tools' | 'vault' | 'community' | 'timetable' | 'home'
  id?: string;
  subTool?: string;
  queryParams: Record<string, string>;
}

/**
 * Parse incoming App Links (https://nuellstudyguide.name.ng/course/12345) and custom schemes
 */
export function parseDeepLinkUrl(rawUrl: string): ParsedDeepLink {
  let clean = rawUrl;
  try {
    // Strip scheme
    const urlObj = new URL(rawUrl);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    if (segments.length === 0) {
      return { originalUrl: rawUrl, route: 'home', queryParams };
    }

    const first = segments[0]?.toLowerCase();
    const second = segments[1];

    if (first === 'course' || first === 'courses') {
      return { originalUrl: rawUrl, route: 'course', id: second, queryParams };
    }
    if (first === 'quiz' || first === 'quizzes') {
      return { originalUrl: rawUrl, route: 'quiz', id: second, queryParams };
    }
    if (first === 'tools' || first === 'tool') {
      return { originalUrl: rawUrl, route: 'tools', subTool: second || queryParams.tool, queryParams };
    }
    if (first === 'vault') {
      return { originalUrl: rawUrl, route: 'vault', id: second, queryParams };
    }
    if (first === 'community') {
      return { originalUrl: rawUrl, route: 'community', id: second, queryParams };
    }
    if (first === 'timetable' || first === 'exam') {
      return { originalUrl: rawUrl, route: 'timetable', id: second, queryParams };
    }

    return { originalUrl: rawUrl, route: first || 'home', id: second, queryParams };
  } catch (e) {
    // Fallback manual regex parser for custom schemes like nsg://course/123
    const match = clean.match(/^(?:https?:\/\/[^\/]+|nsg:\/\/|nsgscholar:\/\/)?\/?([^\/?#]+)(?:\/([^\/?#]+))?/i);
    const route = match?.[1]?.toLowerCase() || 'home';
    const id = match?.[2];
    return {
      originalUrl: rawUrl,
      route: route === 'courses' ? 'course' : route === 'quizzes' ? 'quiz' : route,
      id,
      queryParams: {}
    };
  }
}

/**
 * Register Android hardware back button handler
 * Prevents abrupt app closure by executing custom navigation back step or closing active modals
 */
export function useHardwareBackButton(
  onBackPress?: () => boolean | void
) {
  const onBackPressRef = useRef(onBackPress);
  useEffect(() => {
    onBackPressRef.current = onBackPress;
  });

  useEffect(() => {
    if (!isNativePlatform()) return;

    let lastHomeBackPressTime = 0;

    const backListenerPromise = App.addListener('backButton', () => {
      if (onBackPressRef.current) {
        const handled = onBackPressRef.current();
        if (handled === true) {
          lastHomeBackPressTime = 0;
          return;
        }
      }

      // If unhandled (i.e. user is on the root Home page with no open modals)
      const now = Date.now();
      if (now - lastHomeBackPressTime < 2000) {
        App.exitApp();
      } else {
        lastHomeBackPressTime = now;
        window.dispatchEvent(new CustomEvent('show_user_notification', {
          detail: { message: 'Press back again to exit NSG' }
        }));
      }
    });

    return () => {
      backListenerPromise.then(l => l.remove()).catch(() => {});
    };
  }, []);
}

export interface LongPressOptions {
  threshold?: number; // ms to trigger long press
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void;
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
}

/**
 * Custom hook to support native-style long-press gestures on cards and buttons
 */
export function useLongPress({ threshold = 500, onLongPress, onClick }: LongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      isLongPress.current = false;
      timeoutRef.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(e);
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const clear = useCallback(
    (e: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (shouldTriggerClick && !isLongPress.current && onClick) {
        onClick(e);
      }
    },
    [onClick]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
    }
  };
}

/**
 * Register deep link listener for native app URLs
 */
export function useAppUrlListener(onDeepLink?: (parsed: ParsedDeepLink) => void) {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const listenerPromise = App.addListener('appUrlOpen', (data: URLOpenListenerEvent) => {
      console.log('🔗 Deep link received in native app:', data?.url);
      if (onDeepLink && data?.url) {
        const parsed = parseDeepLinkUrl(data.url);
        onDeepLink(parsed);
      }
    });

    return () => {
      listenerPromise.then(l => l.remove()).catch(() => {});
    };
  }, [onDeepLink]);
}

/**
 * Direct initialization for deep link listening
 */
export function initNativeDeepLinks(onDeepLink: (parsed: ParsedDeepLink) => void) {
  if (!isNativePlatform()) return () => {};

  const listenerPromise = App.addListener('appUrlOpen', (data: URLOpenListenerEvent) => {
    console.log('🔗 Universal deep link received:', data?.url);
    if (data?.url) {
      const parsed = parseDeepLinkUrl(data.url);
      onDeepLink(parsed);
    }
  });

  return () => {
    listenerPromise.then(l => l.remove()).catch(() => {});
  };
}
