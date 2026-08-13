import { useEffect, useRef, useCallback } from 'react';
import { App } from '@capacitor/app';
import { isNativePlatform } from './platform';

/**
 * Register Android hardware back button handler
 * Prevents abrupt app closure by executing custom navigation back step or closing active modals
 */
export function useHardwareBackButton(
  onBackPress?: () => boolean | void
) {
  useEffect(() => {
    if (!isNativePlatform()) return;

    let backListenerPromise = App.addListener('backButton', (data) => {
      if (onBackPress) {
        const handled = onBackPress();
        if (handled === true) return;
      }

      // Default stack navigation back
      if (window.history.length > 1) {
        window.history.back();
      } else {
        App.minimizeApp();
      }
    });

    return () => {
      backListenerPromise.then(l => l.remove()).catch(() => {});
    };
  }, [onBackPress]);
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
      // Prevent default web context menu when native long press fires
      e.preventDefault();
    }
  };
}

/**
 * Register deep link listener for native app URLs
 */
export function useAppUrlListener(onDeepLink?: (url: string) => void) {
  useEffect(() => {
    if (!isNativePlatform()) return;

    let listenerPromise = App.addListener('appUrlOpen', (data) => {
      console.log('🔗 Deep link received in native app:', data?.url);
      if (onDeepLink && data?.url) {
        onDeepLink(data.url);
      }
    });

    return () => {
      listenerPromise.then(l => l.remove()).catch(() => {});
    };
  }, [onDeepLink]);
}
