import { Clipboard } from '@capacitor/clipboard';
import { isNativePlatform } from './platform';

export interface ClipboardContentResult {
  type: 'text' | 'image' | 'unknown';
  value: string; // text or base64 data URL
}

/**
 * Reads text or image data cleanly from system clipboard
 */
export async function readFromClipboard(): Promise<ClipboardContentResult> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      const result = await Clipboard.read();
      if (result.type === 'image' && result.value) {
        return {
          type: 'image',
          value: result.value.startsWith('data:') ? result.value : `data:image/png;base64,${result.value}`
        };
      }
      if (result.value) {
        return { type: 'text', value: result.value };
      }
    } catch (e) {
      console.warn('Capacitor Clipboard read failed:', e);
    }
  }

  // Web fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve({
                    type: 'image',
                    value: reader.result as string
                  });
                };
                reader.readAsDataURL(blob);
              });
            }
          }
        }
      }

      const text = await navigator.clipboard.readText();
      return { type: 'text', value: text };
    } catch (webErr) {
      console.warn('Web clipboard API read failed:', webErr);
    }
  }

  return { type: 'unknown', value: '' };
}

/**
 * Writes text to system clipboard
 */
export async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (isNativePlatform()) {
      await Clipboard.write({ string: text });
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.error('Failed to write to clipboard:', err);
  }
  return false;
}
