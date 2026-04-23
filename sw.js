const CORE_CACHE_VERSION = 'Desktop 1.1 Bismuth';
const CORE_CACHE_NAME = `polygoldesktop-core-${CORE_CACHE_VERSION}`;
const APPS_CACHE_NAME = 'polygoldesktop-apps';

// --- IndexedDB Vault Configuration ---
const VAULT_DB = 'PolygolSystemVaultDB';
const VAULT_STORE = 'core_assets';

const ASSETS_TO_CACHE = [
  '/desktop/',
  '/desktop/assets/img/icon.svg',
  '/desktop/recovery/index.html',
  '/desktop/index.html',
  '/desktop/css/styles.css',
  '/desktop/js/core/storage.js',
  '/desktop/js/core/audio.js',
  '/desktop/js/core/a11y.js',
  '/desktop/js/core/performance.js',
  '/desktop/js/core/system.js',
  '/desktop/js/core/dialogs.js',
  '/desktop/js/core/files.js',
  '/desktop/js/core/power.js',
  '/desktop/js/core/first-setup.js',
  '/desktop/js/core/sys-connect-waves.js',
  '/desktop/js/ui/theme.js',
  '/desktop/js/ui/modes.js',
  '/desktop/js/ui/notifications.js',
  '/desktop/js/ui/clock-weather.js',
  '/desktop/js/ui/environment.js',
  '/desktop/js/ui/wallpaper.js',
  '/desktop/js/ui/widgets.js',
  '/desktop/js/ui/spotlight.js',
  '/desktop/js/ui/settings.js',
  '/desktop/js/ui/physical-keyboard.js',
  '/desktop/js/ui/osk.js',
  '/desktop/js/ui/browser-chrome.js',
  '/desktop/js/ui/donburi.js',
  '/desktop/js/ui/main-ui.js',
  '/desktop/js/apps/app-switcher.js',
  '/desktop/js/apps/window-manager.js',
  '/desktop/js/apps/media-session.js',
  '/desktop/js/apps/live-activities.js',
  '/desktop/js/apps/api.js',
  '/desktop/js/core/boot.js',
  '/desktop/js/index.js',
  '/desktop/js/lang.js',
  '/desktop/js/kirbservices.js',
  '/desktop/js/waves.js',
  '/desktop/assets/gurapp/api/gurasuraisu-api.js',
  '/desktop/https://polygol.github.io//assets/gurapp/api/gurasuraisu-api.js',
  '/desktop/https://raw.githubusercontent.com/Polygol/polygol.github.io/refs/heads/main//assets/gurapp/api/gurasuraisu-api.js',
  '/desktop/assets/ui/svg/load.svg',
  '/desktop/manifest.json',
  '/desktop/about/external.md',
  '/desktop/assets/text/greet/home.json',
  '/desktop/assets/img/favi/regular.png',
  '/desktop/assets/img/pwaicon/coloricon.png',
  '/desktop/assets/img/pwaicon/regular.png',
  '/desktop/https://github.com/kirbIndustries/assets/blob/main/brand/img/colorlogotxt/text-owner-transparent.png?raw=true',
  '/desktop/assets/img/ver/16.png',
  '/desktop/transfer/index.html',
  '/desktop/appstore/index.html',
  '/desktop/assets/gurapp/intl/settings/index.html',
  '/desktop/assets/gurapp/intl/settings/settings.css',
  '/desktop/assets/gurapp/intl/settings/settings.js',
  '/desktop/assets/gurapp/intl/forudaraisu/index.html',
  '/desktop/assets/gurapp/intl/donburi/index.html',
  '/desktop/assets/gurapp/intl/overlay/osk/osk.html',
  '/desktop/assets/gurapp/intl/liveactivity/weather-alert.html',
  '/desktop/assets/gurapp/intl/liveactivity/slideshow-control.html',
  '/desktop/assets/gurapp/intl/system-widgets/media-widget.html',
  '/desktop/assets/gurapp/intl/waves/announce.html',
  '/desktop/assets/gurapp/intl/waves/cast.html',
  '/desktop/waves/index.html',
  '/desktop/waves/manifest.json',
  '/desktop/waves/favicon.png',
  '/desktop/waves/home.png',
  '/desktop/assets/appicon/appstore.png',
  '/desktop/assets/appicon/assistant.png',
  '/desktop/assets/appicon/default.png',
  '/desktop/assets/appicon/feedback.png',
  '/desktop/assets/appicon/files.png',
  '/desktop/assets/appicon/home.png',
  '/desktop/assets/appicon/settings.png',
  '/desktop/assets/appicon/system.png',
  '/desktop/assets/appicon/tips.png',
  '/desktop/assets/appicon/transfer.png',
  '/desktop/assets/sound/ui/check.mp3',
  '/desktop/assets/sound/ui/in.mp3',
  '/desktop/assets/sound/ui/mecha.mp3',
  '/desktop/assets/sound/ui/out.mp3',
  '/desktop/assets/sound/ui/popup.mp3',
  '/desktop/assets/sound/ui/seldelay.mp3',
  '/desktop/assets/sound/ui/select.mp3',
  '/desktop/assets/sound/ui/seltoggle.mp3',
  '/desktop/assets/sound/ui/tone1.mp3',
  '/desktop/assets/sound/ui/tone2.mp3',
  '/desktop/assets/sound/ui/tridown.mp3',
  '/desktop/assets/sound/ui/tripuck.mp3',
  '/desktop/https://cdn.jsdelivr.net/npm/modern-screenshot@4.6.8/dist/index.min.js',
  '/desktop/https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js',
  '/desktop/https://cdn.jsdelivr.net/npm/suncalc@1.9.0/suncalc.min.js',
  '/desktop/https://esm.sh/trystero@0.15.1/torrent',
  '/desktop/https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  '/desktop/https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js',
  '/desktop/https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/',
  '/desktop/https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
  '/desktop/https://cdn.jsdelivr.net/gh/lauridskern/open-runde@main/src/web/OpenRunde-Regular.woff2',
  '/desktop/https://cdn.jsdelivr.net/gh/lauridskern/open-runde@main/src/web/OpenRunde-Medium.woff2',
  '/desktop/https://cdn.jsdelivr.net/gh/lauridskern/open-runde@main/src/web/OpenRunde-Semibold.woff2',
  '/desktop/https://cdn.jsdelivr.net/gh/lauridskern/open-runde@main/src/web/OpenRunde-Bold.woff2',
  '/desktop/assets/fonts/InterNumeric.ttf',
  '/desktop/https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js',
  '/desktop/https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0',
  '/desktop/https://fonts.googleapis.com/css2?family=Roboto:wght@100..900&display=swap',
  '/desktop/https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap',
  '/desktop/https://fonts.googleapis.com/css2?family=DynaPuff:wght@400..700&display=swap',
  '/desktop/https://fonts.googleapis.com/css2?family=Domine:wght@400..700&display=swap',
  '/desktop/https://fonts.googleapis.com/css2?family=Climate+Crisis&display=swap',
  '/desktop/https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap',
  '/desktop/https://fonts.googleapis.com/css2?family=DotGothic16&display=swap',  
  '/desktop/https://fonts.googleapis.com/css2?family=Playpen+Sans:wght@100..800&display=swap',
  '/desktop/https://fonts.googleapis.com/css2?family=Jaro:opsz@6..72&display=swap',    
  '/desktop/https://fonts.googleapis.com/css2?family=Doto:wght@400;700&display=swap', 
  '/desktop/https://fonts.googleapis.com/css2?family=Nunito:wght@200..900&display=swap',
  '/desktop/https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt'
];

// --- IndexedDB Helper Functions ---
function openVault() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(VAULT_DB, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(VAULT_STORE);
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e);
    });
}

async function stashInVault(requestUrl, response) {
    try {
        const db = await openVault();
        const blob = await response.clone().blob();
        const headers = {};
        response.headers.forEach((val, key) => headers[key] = val);
        
        return new Promise((resolve) => {
            const tx = db.transaction(VAULT_STORE, 'readwrite');
            tx.objectStore(VAULT_STORE).put({
                blob: blob,
                headers: headers,
                status: response.status,
                statusText: response.statusText
            }, requestUrl);
            tx.oncomplete = resolve;
        });
    } catch (e) { console.warn('[SW] Failed to stash in Vault:', e); }
}

async function getFromVault(requestUrl) {
    try {
        const db = await openVault();
        return new Promise((resolve) => {
            const tx = db.transaction(VAULT_STORE, 'readonly');
            const req = tx.objectStore(VAULT_STORE).get(requestUrl);
            req.onsuccess = () => {
                const data = req.result;
                if (data) {
                    resolve(new Response(data.blob, {
                        status: data.status,
                        statusText: data.statusText,
                        headers: data.headers
                    }));
                } else {
                    resolve(null);
                }
            };
            req.onerror = () => resolve(null);
        });
    } catch (e) { return null; }
}

// INSTALL: Cache system assets into both Cache API AND IndexedDB Vault
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CORE_CACHE_NAME).then(async cache => {
            console.log(`[SW] Caching core assets for ${CORE_CACHE_VERSION}`);
            for (const url of ASSETS_TO_CACHE) {
                try {
                    const req = new Request(url, {cache: 'reload'});
                    const res = await fetch(req);
                    
                    // 1. Store in Cache API (For Speed)
                    // FIX: Create isolated clones immediately to prevent locking conflicts
                    const resForCache = res.clone();
                    const resForVault = res.clone();
                    
                    await cache.put(req, resForCache);
                    
                    // 2. Store in IndexedDB Vault (For Permanence)
                    const absoluteUrl = new URL(url, self.location.origin).href;
                    await stashInVault(absoluteUrl, resForVault);
                } catch(e) {
                    console.error('[SW] Asset caching failed for:', url, e); 
                }
            }
        })
    );
});

// ACTIVATE: Clean up OLD core caches, but KEEP the apps cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old core caches (e.g. polygol-core-v1.0)
          if (cacheName.startsWith('polygol-core-') && cacheName !== CORE_CACHE_NAME) {
            console.log(`[SW] Deleting old system cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
          // Do NOT delete 'polygol-apps' or other unrelated caches
        })
      );
    }).then(() => self.clients.claim())
  );
});

// MESSAGE: Handle App Caching and Updates
self.addEventListener('message', event => {
    if (!event.data) return;

    if (event.data.action === 'skipWaiting') {
        console.log('[SW] Activating new version...');
        self.skipWaiting();
    }

    // Cache user-installed apps into the persistent APPS_CACHE
    if (event.data.action === 'cache-app') {
        const filesToCache = event.data.files;
        if (filesToCache && filesToCache.length > 0) {
            console.log(`[SW] Caching app files into ${APPS_CACHE_NAME}`);
            event.waitUntil(
                caches.open(APPS_CACHE_NAME).then(cache => {
                    return cache.addAll(filesToCache)
                        .then(() => console.log('[SW] App caching complete.'))
                        .catch(err => console.warn(`[SW] App caching failed`, err));
                })
            );
        }
    }

    if (event.data.action === 'uncache-app') {
        const filesToDelete = event.data.filesToDelete;
        if (filesToDelete && filesToDelete.length > 0) {
            event.waitUntil(
                caches.open(APPS_CACHE_NAME).then(cache => {
                    const deletePromises = filesToDelete.map(url => cache.delete(url));
                    return Promise.allSettled(deletePromises);
                })
            );
        }
    }
});

// FETCH: Check Core -> Apps -> Network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
  
    // Ensure API requests for live data never serve stale cached versions
    const apiHosts = [
        'polygol.github.io/kirbstore/inventories',
        'kirbstore/inventories',
        'raw.githubusercontent.com/kirbIndustries/assets/refs/heads/main/kirbindustries-ads-service/octagon/small.json',
        'kirbindust.goatcounter.com',
        'api.open-meteo.com',
        'dummyjson.com',
        'api.rss2json.com'
    ];

    if (apiHosts.includes(url.hostname)) {
        event.respondWith(fetch(request));
        return;
    }

    event.respondWith(
        // 1. Try Cache API (Fastest)
        caches.match(request).then(async cacheRes => {
            if (cacheRes) return cacheRes;

            // 2. Cache API Miss/Eviction! Try IndexedDB Vault (Safety Net)
            const vaultRes = await getFromVault(request.url);
            if (vaultRes) {
                console.warn(`[SW] Cache API evicted ${request.url}. Recovered from IDB Vault.`);
                // Heal the Cache API for next time
                const resToCache = vaultRes.clone();
                caches.open(CORE_CACHE_NAME).then(c => c.put(request, resToCache));
                return vaultRes;
            }

            // 3. Fallback to Network
            return fetch(request).then(netRes => {
                 return netRes;
            }).catch(async () => {
                 // Offline Fallback for Navigation
                 if (request.mode === 'navigate') {
                     // Try to rescue the root index from Cache, then Vault
                     const indexUrl = new URL('index.html', self.location.origin).href;
                     return (await caches.match('index.html')) || (await getFromVault(indexUrl));
                 }
            });
        })
    );
});