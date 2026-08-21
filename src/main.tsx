import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { DevicePlatformProvider, isNativePlatform } from './lib/capacitor';
import './index.css';

const configureEdgeToEdge = async () => {
  if (!isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setBackgroundColor({ color: '#00000000' });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (e) {
    // Non-native / Web environment fallback
  }
  try {
    const { NavigationBar } = await import('@hugotomazi/capacitor-navigation-bar');
    await NavigationBar.setTransparency({ isTransparent: true });
    await NavigationBar.setColor({ color: '#00000000' });
  } catch (e) {
    // Non-native / Web environment fallback
  }
};

configureEdgeToEdge().catch(() => {});

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <DevicePlatformProvider>
            <MotionConfig reducedMotion="always" transition={{ duration: 0, delay: 0 }}>
              <App />
            </MotionConfig>
          </DevicePlatformProvider>
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err: any) {
    console.error("Critical mounting error:", err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background-color: #0B0813; color: #F0F4FF; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, sans-serif; text-align: center; padding: 24px;">
        <div style="max-width: 420px; background: #13111C; border: 1px solid rgba(220,38,38,0.3); border-radius: 24px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <h2 style="font-size: 18px; font-weight: 800; color: #EF4444; margin-bottom: 8px;">Initial Load Notice</h2>
          <p style="font-size: 13px; color: rgba(240,244,255,0.7); margin-bottom: 20px;">We encountered a hiccup initializing the workspace session.</p>
          <button onclick="localStorage.clear(); window.location.reload();" style="background: #DC2626; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 12px; text-transform: uppercase; cursor: pointer;">Reset Cache & Reload</button>
        </div>
      </div>
    `;
  }
} else {
  console.error("Root element #root not found in document");
}




