import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { DevicePlatformProvider } from './lib/capacitor';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';
import './index.css';

const configureEdgeToEdge = async () => {
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setBackgroundColor({ color: '#00000000' });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (e) {
    // Non-native / Web environment fallback
  }
  try {
    await NavigationBar.setTransparency({ isTransparent: true });
    await NavigationBar.setColor({ color: '#00000000' });
  } catch (e) {
    // Non-native / Web environment fallback
  }
};

configureEdgeToEdge();

const rootElement = document.getElementById('root');
if (rootElement) {
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
} else {
  console.error("Root element #root not found in document");
}



