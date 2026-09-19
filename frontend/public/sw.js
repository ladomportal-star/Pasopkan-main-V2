/**
 * Pasopkan Progressive Web App Service Worker
 * Provides offline navigation caching, static assets precaching,
 * runtime image and font caching, and offline fallback responses.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `pasopkan-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `pasopkan-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `pasopkan-images-${CACHE_VERSION}`;

// Core assets required for offline shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/pasopkan_logo.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/pwa-maskable-512x512.png',
  '/payment_methods.png',
  '/Loca banner.png'
];

// Offline HTML fallback shell for navigation requests when offline
const OFFLINE_FALLBACK_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Offline - Pasopkan</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f8fafc;
      color: #0f172a;
      text-align: center;
      box-sizing: border-box;
    }
    .card {
      background: #ffffff;
      padding: 32px 24px;
      border-radius: 20px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
      max-width: 400px;
      width: 100%;
      border: 1px solid #f1f5f9;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      background-color: #fff7ed;
      color: #ea580c;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 10px 0;
      color: #0f172a;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #64748b;
      margin: 0 0 24px 0;
    }
    .btn {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      padding: 12px 20px;
      background-color: #ea580c;
      color: #ffffff;
      font-size: 14px;
      font-weight: 700;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #c2410c;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Offline Mode</div>
    <h1>You're Currently Offline</h1>
    <p>Pasopkan has cached your tickets and saved event views. Please check your internet connection or reload once online.</p>
    <button class="btn" onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`;

// Install Event: Precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      // Cache offline page
      await cache.put(
        new Request('/offline.html'),
        new Response(OFFLINE_FALLBACK_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      );
      // Attempt caching static assets gracefully without failing install on single missing asset
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[ServiceWorker] Could not precache asset:', asset, err);
        }
      }
    })
  );
  // Activate worker immediately
  self.skipWaiting();
});

// Activate Event: Clean old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            key !== STATIC_CACHE_NAME &&
            key !== RUNTIME_CACHE_NAME &&
            key !== IMAGE_CACHE_NAME
          ) {
            console.log('[ServiceWorker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for Navigation, Stale-While-Revalidate for Assets, Cache-First for Images
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST booking, auth)
  if (request.method !== 'GET') {
    return;
  }

  // Skip API, Supabase, and Firestore live data endpoints from strict caching
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  // 1. Navigation (HTML documents for SPA routes)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Attempt cached response
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Attempt root index.html
          const cachedRoot = await caches.match('/index.html');
          if (cachedRoot) {
            return cachedRoot;
          }
          // Fallback to offline template
          const offlineResp = await caches.match('/offline.html');
          if (offlineResp) {
            return offlineResp;
          }
          return new Response(OFFLINE_FALLBACK_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Images & Media: Cache-First with background revalidation
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                caches.open(IMAGE_CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {
              // Ignore background fetch failure
            });
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(IMAGE_CACHE_NAME).then((cache) => {
                cache.put(request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return fallback icon if available
            return caches.match('/icon.png');
          });
      })
    );
    return;
  }

  // 3. Static JS, CSS, Fonts, Manifest: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // Network failed
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background sync or push notifications if sent
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
