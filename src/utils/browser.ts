import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Open external URLs safely using @capacitor/browser on mobile
 * and window.open on web, preventing webview crashes and state loss.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url || typeof url !== 'string') return;
  const cleanUrl = url.trim();
  if (!cleanUrl) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({
        url: cleanUrl,
        windowName: '_blank',
        presentationStyle: 'popover'
      });
      return;
    }
  } catch (nativeErr) {
    console.warn('[openExternalUrl] Capacitor Browser error, using fallback:', nativeErr);
  }

  // Web fallback
  try {
    const newWindow = window.open(cleanUrl, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  } catch (webErr) {
    console.error('[openExternalUrl] Failed to open URL:', webErr);
  }
}
