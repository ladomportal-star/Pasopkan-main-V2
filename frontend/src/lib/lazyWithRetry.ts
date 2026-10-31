import { ComponentType, lazy } from 'react';

/**
 * Resilient lazy loader for code-split routes.
 * If a chunk fails to fetch (e.g. following a deployment where Vite hashes updated),
 * it reloads the window once so the browser pulls the fresh asset hashes.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((error) => {
      const refreshed = sessionStorage.getItem('psk_chunk_refresh');
      if (!refreshed) {
        sessionStorage.setItem('psk_chunk_refresh', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      sessionStorage.removeItem('psk_chunk_refresh');
      throw error;
    })
  );
}

