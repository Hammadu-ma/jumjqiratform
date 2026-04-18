const APP_VERSION = '5.5.3'; // 🔁 Change this when deploying updates
const STATIC_CACHE = `static-cache-v${APP_VERSION}`;
const RUNTIME_CACHE = `runtime-cache-v${APP_VERSION}`;
const NETWORK_TIMEOUT = 4000; // 4 seconds timeout

// Core files that MUST be cached (only essential files)
const CORE_FILES = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/login.html',
  '/register.html',
  '/profile.html',
  '/upgrade.html',
  '/payment.html',
  '/offline.html',
  '/manifest.json',
  '/icon-152x152.png',
  '/icon-192x192.png'
];

// CSS files (only essential)
const CSS_FILES = [
  '/css/user.css'
];

// JS files (only essential)
const JS_FILES = [
  '/js/dashboard.js',
  '/js/login.js',
  '/js/register.js',
  '/offline-sync.js'
];

// Combine all static assets
const STATIC_ASSETS = [...CORE_FILES, ...CSS_FILES, ...JS_FILES];

// File extensions to cache (whitelist)
const CACHE_EXTENSIONS = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];

// Helper: Check if URL should be cached
function shouldCache(url) {
  const urlObj = new URL(url, self.location.origin);
  
  // Only cache same-origin requests
  if (urlObj.origin !== self.location.origin) return false;
  
  // Don't cache Firebase endpoints
  if (urlObj.pathname.includes('firestore') || 
      urlObj.pathname.includes('firebase') ||
      urlObj.pathname.includes('auth')) {
    return false;
  }
  
  // Don't cache API calls
  if (urlObj.pathname.includes('/api/')) return false;
  
  // Check file extension
  const ext = urlObj.pathname.split('.').pop().toLowerCase();
  if (CACHE_EXTENSIONS.includes(`.${ext}`)) return true;
  
  // Cache HTML pages without extension
  if (urlObj.pathname === '/' || urlObj.pathname.endsWith('.html')) return true;
  
  return false;
}

// ================= INSTALL =================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', APP_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Precaching static assets...');
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          cache.add(url).catch(err => console.warn(`[SW] Failed to cache: ${url}`, err))
        )
      );
    }).then(() => {
      // Force waiting worker to become active
      return self.skipWaiting();
    })
  );
});

// ================= ACTIVATE =================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', APP_VERSION);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients...');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// ================= UPDATE BUTTON SUPPORT =================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting triggered');
    self.skipWaiting();
  }
});

// ================= FETCH WITH TIMEOUT =================
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), timeout);
    })
  ]);
}

// ================= FETCH EVENT =================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Firebase/Firestore requests
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || 
      url.includes('firebase') ||
      url.includes('auth')) {
    return;
  }
  
  // Skip analytics
  if (url.includes('analytics') || url.includes('telegram')) {
    return;
  }
  
  event.respondWith((async () => {
    const cachedResponse = await caches.match(event.request);
    
    // For HTML documents: Network-first with cache fallback (for updates)
    if (event.request.destination === 'document' || 
        event.request.url.endsWith('.html') ||
        event.request.url === self.location.origin + '/') {
      
      try {
        console.log('[SW] Fetching HTML:', event.request.url);
        const response = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
        const responseClone = response.clone();
        
        if (shouldCache(event.request.url)) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(event.request, responseClone);
        }
        return response;
      } catch (err) {
        console.log('[SW] Network failed, using cached HTML:', event.request.url);
        if (cachedResponse) return cachedResponse;
        return caches.match('/offline.html');
      }
    }
    
    // For static assets (CSS, JS, Images): Cache-first with network update
    if (shouldCache(event.request.url)) {
      // Network request to update cache in background
      fetchWithTimeout(event.request, NETWORK_TIMEOUT)
        .then(response => {
          if (response && response.ok) {
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(event.request, response);
            });
          }
        })
        .catch(err => console.log('[SW] Background update failed:', err));
      
      // Return cached version immediately
      if (cachedResponse) {
        console.log('[SW] Static from cache:', event.request.url.split('/').pop());
        return cachedResponse;
      }
      
      try {
        console.log('[SW] Fetching static (not cached):', event.request.url.split('/').pop());
        const response = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
        const responseClone = response.clone();
        
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(event.request, responseClone);
        return response;
      } catch (err) {
        console.log('[SW] Network failed for static:', event.request.url);
        return new Response('Resource not available offline', { status: 503 });
      }
    }
    
    // For everything else: Network-first with timeout
    try {
      const response = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
      
      // Cache successful responses
      if (response.ok && shouldCache(event.request.url)) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (err) {
      console.log('[SW] Network failed, falling back to cache:', event.request.url);
      if (cachedResponse) return cachedResponse;
      
      if (event.request.destination === 'image') {
        return new Response('Image not available offline', { status: 503 });
      }
      
      return new Response('You are offline', { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});

// ================= BACKGROUND SYNC =================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-writes') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncPendingWrites());
  }
});

async function syncPendingWrites() {
  console.log('[SW] Syncing pending writes...');
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_TRIGGERED' });
  });
}
