import { useState, useEffect } from 'react';

/**
 * Android Safe Area & Native Edge-to-Edge Utility
 * Provides standardized top, bottom, and header spacing across native Capacitor Android,
 * Android Chrome webviews, and edge-to-edge devices with camera cutouts or display notches.
 */

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
  isNative: boolean;
  isAndroid: boolean;
}

export function isNativeAndroidPlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const isCapacitor = Boolean(
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android'
  );
  const isAndroidUA = /android/i.test(navigator?.userAgent || '');
  return isCapacitor || (isAndroidUA && Boolean((window as any)?.Capacitor));
}

export function getSafeHeaderPaddingTop(extraPaddingPx = 16): string {
  const isNative = isNativeAndroidPlatform();
  const minTop = isNative ? 34 : 28;
  return `max(${minTop}px, calc(env(safe-area-inset-top, 0px) + ${extraPaddingPx}px))`;
}

export function getSafeBottomPadding(extraPaddingPx = 14): string {
  const isNative = isNativeAndroidPlatform();
  const minBottom = isNative ? 20 : 16;
  return `max(${minBottom}px, calc(env(safe-area-inset-bottom, 0px) + ${extraPaddingPx}px))`;
}

export function getSafeHeaderStyle(extraPaddingPx = 16): React.CSSProperties {
  return {
    paddingTop: getSafeHeaderPaddingTop(extraPaddingPx)
  };
}

export function getSafeStickyTopStyle(extraOffsetPx = 16): React.CSSProperties {
  const isNative = isNativeAndroidPlatform();
  const minTop = isNative ? 34 : 28;
  return {
    top: `max(${minTop}px, calc(env(safe-area-inset-top, 0px) + ${extraOffsetPx}px))`
  };
}

/**
 * Reusable React hook for dynamic safe area insets
 */
export function useSafeArea() {
  const [insets, setInsets] = useState<SafeAreaInsets>(() => {
    const isNative = isNativeAndroidPlatform();
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    return {
      top: isNative ? 34 : 28,
      bottom: isNative ? 20 : 16,
      left: 0,
      right: 0,
      isNative,
      isAndroid
    };
  });

  useEffect(() => {
    // Add is-native-android class to root document element if on native Android
    if (typeof document !== 'undefined' && isNativeAndroidPlatform()) {
      document.documentElement.classList.add('is-native-android');
    }
  }, []);

  return {
    ...insets,
    headerPaddingTop: getSafeHeaderPaddingTop(),
    bottomPadding: getSafeBottomPadding(),
    headerStyle: getSafeHeaderStyle(),
    stickyTopStyle: getSafeStickyTopStyle()
  };
}
