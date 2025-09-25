const CACHE_NAME = 'expense-tracker-cache-v7'; // Bumped version to force update
const urlsToCache = [
  // Core app files
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx', 
  '/manifest.json',
  '/_redirects',

  // In-browser transpiler
  'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js',

  // React libraries from the importmap
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  
  // Font files
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2'
];

// Clean up old caches on activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching new files');
        const promises = urlsToCache.map(url => {
            const request = new Request(url, { cache: 'reload' });
            return fetch(request).then(response => {
                if (!response.ok) {
                    console.error(`Failed to fetch and cache ${url}. Status: ${response.status}`);
                    return Promise.resolve(); 
                }
                return cache.put(url, response);
            }).catch(err => {
                console.error(`Fetch error for ${url}:`, err);
            });
        });
        return Promise.all(promises);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
