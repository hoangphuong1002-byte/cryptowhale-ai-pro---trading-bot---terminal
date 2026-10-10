import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RootErrorBoundary } from './components/RootErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Register service worker immediately for offline cache and instant 0ms launch on mobile
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onRegisterError(error) {
        console.warn('PWA service worker registration warning:', error);
      },
    });
  } catch (err) {
    console.warn('Silent fallback for service worker registration:', err);
  }
}

// Global safety guard to prevent unexpected mobile webview unhandled halts
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Suppressed unhandled promise rejection to keep app alive:', event.reason);
  });
  window.addEventListener('error', (event) => {
    console.warn('Caught global window error:', event.message);
  });
}

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    );
  }
} catch (mountErr) {
  console.error('Fatal mount error:', mountErr);
}
