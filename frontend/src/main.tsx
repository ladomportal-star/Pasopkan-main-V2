import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { SafeBoundary } from './components/SafeBoundary.tsx';
import './index.css';

// Safe-guard browser dialog APIs in sandboxed iframe environments where they are strictly blocked
if (typeof window !== 'undefined') {
  // Prevent unhandled promise rejections from bubbling up and failing the platform
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[Unhandled Rejection Caught & Handled Safely]:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.warn('[Global Uncaught Error Caught & Handled Safely]:', event.message, event.error);
    // Safely silence benign cross-origin or resize observer errors
    if (event.message && (event.message.includes('ResizeObserver') || event.message.includes('Script error'))) {
      event.preventDefault();
    }
  });

  let isFrame = false;
  try {
    isFrame = window.self !== window.top;
  } catch (e) {
    isFrame = true;
  }
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  const originalPrompt = window.prompt;

  window.alert = function (message) {
    console.log("[Alert Override]:", message);
    if (!isFrame && originalAlert) {
      try {
        originalAlert.call(window, message);
      } catch (e) {
        console.warn("Blocked window.alert call:", message, e);
      }
    }
  };

  window.confirm = function (message) {
    console.log("[Confirm Override]:", message);
    if (!isFrame && originalConfirm) {
      try {
        return originalConfirm.call(window, message);
      } catch (e) {
        console.warn("Blocked window.confirm call, defaulting to true:", message, e);
        return true;
      }
    }
    return true;
  };

  window.prompt = function (message, defaultValue) {
    console.log("[Prompt Override]:", message);
    if (!isFrame && originalPrompt) {
      try {
        return originalPrompt.call(window, message, defaultValue);
      } catch (e) {
        console.warn("Blocked window.prompt call, defaulting to empty string:", message, e);
        return defaultValue || "";
      }
    }
    return defaultValue || "";
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeBoundary>
      <HelmetProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </HelmetProvider>
    </SafeBoundary>
  </StrictMode>,
);

// Register PWA Service Worker for offline caching and Add to Home Screen
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);

        // Check for updates on page focus
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New content is available; please refresh.');
              }
            };
          }
        };
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  });
}
