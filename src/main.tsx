import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { DevicePlatformProvider } from './lib/capacitor';
import './index.css';

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



