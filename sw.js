// ============================================
// SERVICE WORKER - BIRTHDAYS PWA v4
// ============================================

const CACHE_NAME = 'birthday-v4';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon.png'
];

// Instalación
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando v4...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando recursos estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activación
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando v4...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Eliminando cache antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Estrategia Cache First, luego Network
self.addEventListener('fetch', (event) => {
    // Ignorar requests no GET
    if (event.request.method !== 'GET') return;

    // Ignorar URLs de analytics o externos no esenciales
    const url = new URL(event.request.url);
    if (url.hostname !== self.location.hostname && 
        !url.hostname.includes('cdn.tailwindcss.com') &&
        !url.hostname.includes('cdn.jsdelivr.net') &&
        !url.hostname.includes('cdnjs.cloudflare.com') &&
        !url.hostname.includes('fonts.googleapis.com') &&
        !url.hostname.includes('fonts.gstatic.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request).then((fetchResponse) => {
                // Permitir respuestas básicas (locales), cors y opaque (de los CDNs de confianza)
                const isAcceptableType = fetchResponse.type === 'basic' || fetchResponse.type === 'cors' || fetchResponse.type === 'opaque';
                const status = fetchResponse.status;
                if (!fetchResponse || (status !== 200 && status !== 0) || !isAcceptableType) {
                    return fetchResponse;
                }

                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return fetchResponse;
            }).catch(() => {
                // Offline fallback
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// Mensajes desde la app
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Manejar mensajes para notificaciones
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification(event.data.title, {
            body: event.data.body,
            icon: event.data.icon,
            badge: event.data.icon,
            tag: 'birthday-notification',
            requireInteraction: false,
            silent: false
        });
    }
});

console.log('[SW] Service Worker v4 cargado');