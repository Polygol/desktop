var minimizedEmbeds = {}; 
window.minimizeTimeouts = {};

// App definitions
var apps = {
    "kirbStore": {
        url: "/kirbstore/index.html",
        icon: "appstore.png"
	},
    "Files": {
        url: "/desktop/assets/gurapp/intl/forudaraisu/index.html",
        icon: "files.png"
	},
    "Feedback": {
        url: "https://docs.google.com/forms/d/e/1FAIpQLSeSYSJalaX0HCZe0helcK5NCuc0U47tQc6KaO1OAsBs5HxK1A/viewform?embedded=true",
        icon: "feedback.png"
	},
    "Settings": {
        url: "/desktop/assets/gurapp/intl/settings/index.html",
        icon: "settings.png"
	}
};

// Helper to calculate and send final volume (Master * App)
function syncAppVolume(iframe) {
    const appId = iframe.dataset.appId;
    if (!appId || appId === 'Donburi') return;

    const master = (parseInt(localStorage.getItem('master_volume') || 100)) / 100;
    const appLevel = (parseInt(localStorage.getItem(`vol_${appId}`) || 100)) / 100;
    
    const finalLevel = master * appLevel;

    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ 
            type: 'volumeUpdate', 
            level: finalLevel, 
            muted: (finalLevel === 0)
        }, '*');
    }
}

function updateVolumeMixerUI() {
    const list = document.getElementById('volume-mixer-list');
    list.innerHTML = '';
    
    // 1. Add System Channel (Internal sounds/alerts)
    const sysVol = localStorage.getItem('system_channel_volume') || 100;
    const sysItem = document.createElement('div');
    sysItem.style.cssText = 'display:flex; flex-direction:column; gap:4px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--glass-border);';
    sysItem.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:500;">
            <span>System</span>
            <span>${sysVol}%</span>
        </div>
        <input type="range" min="0" max="100" value="${sysVol}" class="thermostat-slider">
    `;
    sysItem.querySelector('input').oninput = (e) => {
        const val = e.target.value;
        sysItem.querySelector('span:last-child').textContent = `${val}%`;
        localStorage.setItem('system_channel_volume', val);
    };
    list.appendChild(sysItem);

    // 2. Add Active Apps (Exclude Donburi)
    const activeApps = Array.from(document.querySelectorAll('iframe[data-app-id]'))
                            .filter(f => f.dataset.appId !== 'Donburi');
    
    if (activeApps.length === 0) {
        const msg = document.createElement('p');
        msg.style.cssText = 'font-size:11px; opacity:0.5; text-align:center; margin: 10px 0;';
        msg.textContent = 'No running apps';
        list.appendChild(msg);
    }

    activeApps.forEach(iframe => {
        const appId = iframe.dataset.appId;
        const currentVol = localStorage.getItem(`vol_${appId}`) || 100;
        
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; flex-direction:column; gap:4px;';
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:500;">
                <span>${appId}</span>
                <span>${currentVol}%</span>
            </div>
            <input type="range" min="0" max="100" value="${currentVol}" class="thermostat-slider">
        `;
        
        item.querySelector('input').oninput = (e) => {
            const val = e.target.value;
            item.querySelector('span:last-child').textContent = `${val}%`;
            localStorage.setItem(`vol_${appId}`, val);
            syncAppVolume(iframe);
        };
        list.appendChild(item);
    });
}

let appUsage = {};
window.appHistoryStack = []; // Track app navigation history
let appLastOpened = {};

function loadSavedData() {
    // Load existing data if available
    const savedLastOpened = localStorage.getItem('appLastOpened');
    if (savedLastOpened) {
        appLastOpened = JSON.parse(savedLastOpened);
    }
    
    // Load other existing data as before
    const savedUsage = localStorage.getItem('appUsage');
    if (savedUsage) {
        appUsage = JSON.parse(savedUsage);
    }
}

function saveLastOpenedData() {
    localStorage.setItem('appLastOpened', JSON.stringify(appLastOpened));
}

Object.keys(apps).forEach(appName => {
    appUsage[appName] = 0;
});

// Load saved usage data from localStorage
const savedUsage = localStorage.getItem('appUsage');
if (savedUsage) {
    Object.assign(appUsage, JSON.parse(savedUsage));
}

// Save usage data whenever an app is opened
function saveUsageData(appName) {
    localStorage.setItem('appUsage', JSON.stringify(appUsage));
    
    // Track usage by hour for Predictive Preloading
    if (appName) {
        const hour = new Date().getHours();
        let hourlyUsage = JSON.parse(localStorage.getItem('appUsageHourly') || '{}');
        if (!hourlyUsage[hour]) hourlyUsage[hour] = {};
        hourlyUsage[hour][appName] = (hourlyUsage[hour][appName] || 0) + 1;
        localStorage.setItem('appUsageHourly', JSON.stringify(hourlyUsage));
    }
}

function loadUserInstalledApps() {
    try {
        const userApps = JSON.parse(localStorage.getItem('userInstalledApps')) || {};
        // Merge user-installed apps into the main apps object
        apps = { ...apps, ...userApps };
        console.log('Loaded and merged user-installed apps.');
    } catch (e) {
        console.error('Could not load user-installed apps:', e);
    }
}

async function installApp(appData) {
    // Prevent overwriting core system apps
    const reservedNames = ['settings', 'kirbstore', 'donburi', 'system', 'files', 'assistant', 'tips', 'feedback', 'apps'];
    const normalizedName = appData.name ? appData.name.trim().toLowerCase() : '';
    
    if (reservedNames.includes(normalizedName)) {
        console.error(`[Security] Blocked installation of protected system app: ${appData.name}`);
        showDialog({ type: 'alert', title: 'App installation blocked', message: `Cannot install or overwrite protected system app ${appData.name}`, icon: 'do_not_touch'});
        return;
    }
	
    const userInstalledAppsInfo = JSON.parse(localStorage.getItem('userInstalledAppsInfo') || '{}');
    const isUpdate = userInstalledAppsInfo[appData.name];

    if (isUpdate) {
        console.log(`Updating app: ${appData.name}`);
        const oldFiles = userInstalledAppsInfo[appData.name].filesToCache;
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                action: 'uncache-app',
                filesToDelete: oldFiles
            });
        }
    } else {
        console.log(`Installing new app: ${appData.name}`);
    }

    const iconPath = appData.iconUrl;

    apps[appData.name] = { url: appData.url, icon: iconPath };
    const userApps = JSON.parse(localStorage.getItem('userInstalledApps')) || {};
    userApps[appData.name] = { url: appData.url, icon: iconPath };
    localStorage.setItem('userInstalledApps', JSON.stringify(userApps));

    userInstalledAppsInfo[appData.name] = {
        filesToCache: appData.filesToCache
    };
    localStorage.setItem('userInstalledAppsInfo', JSON.stringify(userInstalledAppsInfo));

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            registration.active.postMessage({
                action: 'cache-app',
                files: appData.filesToCache
            });
            const message = isUpdate ? `${appData.name} updated` : currentLanguage.GURAPP_INSTALLING.replace('{appName}', appData.name);
            showPopup(message);
        } catch (error) {
            console.error('Service Worker not ready:', error);
			showDialog({ 
			    type: 'alert', 
			    title: currentLanguage.GURAPP_INSTALL_FAILED.replace('{appName}', appData.name),
                icon: 'file_download_off'
			});
        }
    } else {
        showPopup(currentLanguage.GURAPP_OFFLINE_NOT_SUPPORTED);
    }

	await cacheAppIconColors(); // Re-analyze icon colors
}

async function deleteApp(appName) {
    // --- Protection Clause ---
    const appToDelete = apps[appName];
    if (
        appToDelete && 
        (appToDelete.url.includes('/kirbstore/index.html') ||
         appToDelete.url.includes('/desktop/assets/gurapp/intl/settings/'))
    ) {
        showDialog({ 
            type: 'alert', 
            title: currentLanguage.GURAPP_DELETE_STORE_DENIED,
            icon: 'do_not_touch'
        });
        return; // Stop the function immediately
    }

    // Confirmation dialog
    const confirmed = await showCustomConfirm(
        currentLanguage.GURAPP_DELETE_ASK.replace('{appName}', appName),
        '', 
        'cancel'
    );
    if (!confirmed) {
        return;
    }

    if (apps[appName]) {
        // 1. Remove widget definitions from the available list
        if (availableWidgets[appName]) {
            delete availableWidgets[appName];
            saveAvailableWidgets(); // Save the updated definitions
        }
        // 2. Filter out active instances of widgets from the deleted app
        activeWidgets = activeWidgets.filter(widget => widget.appName !== appName);
        saveWidgets(); // Save the cleaned active widgets list
        renderWidgets(); // Re-render the grid immediately
        
        // Unregister custom OSK if the app provided one
        if (typeof window.unregisterCustomOSK === 'function') {
            window.unregisterCustomOSK(appName);
        }

        // Remove from the in-memory `apps` object
        delete apps[appName];

        // Remove from the 'userInstalledApps' in localStorage
        const userApps = JSON.parse(localStorage.getItem('userInstalledApps')) || {};
        delete userApps[appName];
        localStorage.setItem('userInstalledApps', JSON.stringify(userApps));
        
        // Un-cache the files from the Service Worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
             // We need to know which files to delete. This assumes appToDelete has a filesToCache property.
             // This property should be saved to localStorage when the app is installed.
             const userAppInfo = JSON.parse(localStorage.getItem('userInstalledAppsInfo') || '{}');
             if (userAppInfo[appName] && userAppInfo[appName].filesToCache) {
                 navigator.serviceWorker.controller.postMessage({
                    action: 'uncache-app',
                    filesToDelete: userAppInfo[appName].filesToCache
                });
                // Clean up the stored info
                delete userAppInfo[appName];
                localStorage.setItem('userInstalledAppsInfo', JSON.stringify(userAppInfo));
             }
        }

		// Remove the app's color from the cache
        delete appIconColors[appName];
        localStorage.setItem('appIconColors', JSON.stringify(appIconColors));

        // Clean up orphaned tracking data to prevent localStorage bloat
        delete appUsage[appName];
        delete appLastOpened[appName];
        saveUsageData();
        saveLastOpenedData();

        // Refresh the app drawer and dock
        showPopup(currentLanguage.GURAPP_DELETED.replace('{appName}', appName));
    } else {
		showDialog({ 
		    type: 'alert', 
		    title: currentLanguage.GURAPP_DELETE_FAILED.replace('{appName}', appName),
            icon: 'cancel'
		});
    }
}

function getEmbedContainer(url) {
    return document.querySelector(`.app-window[data-embed-url="${url}"]`) || minimizedEmbeds[url];
}

let isAppOpen = false;
window.currentActiveAppUrl = null; 
let drawerWasOpen = false;
let drawerInactivityTimeout = null;
const DRAWER_AUTO_CLOSE_MS = 30000; // 30 second inactivity
let windowsHiddenForDesktop = [];

function focusWindow(embedContainer) {
    if (!embedContainer) {
        // Clear focus
        document.querySelectorAll('.app-window').forEach(el => el.classList.remove('active-window'));
        window.currentActiveAppUrl = null;
        window.dispatchEvent(new CustomEvent('app-focused'));
        return;
    }
    
    document.querySelectorAll('.app-window').forEach(el => el.classList.remove('active-window'));

    const maxZ = Array.from(document.querySelectorAll('.app-window'))
        .reduce((acc, el) => Math.max(acc, parseInt(el.style.zIndex || '1000')), 1000);
    
    embedContainer.style.zIndex = maxZ + 1;
    embedContainer.classList.add('active-window');
    
    window.currentActiveAppUrl = embedContainer.dataset.embedUrl;
    window.dispatchEvent(new CustomEvent('app-focused'));
}

function autoFocusNextWindow() {
    const visibleWindows = Array.from(document.querySelectorAll('.app-window'))
        .filter(win => win.style.display !== 'none' && win.dataset.closing !== 'true')
        .sort((a, b) => (parseInt(b.style.zIndex) || 0) - (parseInt(a.style.zIndex) || 0));

    if (visibleWindows.length > 0) {
        focusWindow(visibleWindows[0]);
    } else {
        // Explicitly clear focus if no windows are left
        focusWindow(null);
    }
}

function toggleShowDesktop() {
    const visibleWindows = Array.from(document.querySelectorAll('.app-window'))
        .filter(win => win.style.display !== 'none');

    if (visibleWindows.length > 0) {
        // MINIMIZE ALL
        windowsHiddenForDesktop = visibleWindows.map(win => win.dataset.embedUrl);
        visibleWindows.forEach(win => {
            // Minimize without sound or full cleanup
            win.style.display = 'none';
        });
        focusWindow(null); // Set label to Desktop
        showPopup('Desktop');
    } else if (windowsHiddenForDesktop.length > 0) {
        // RESTORE PREVIOUS
        windowsHiddenForDesktop.forEach(url => {
            const win = document.querySelector(`.app-window[data-embed-url="${url}"]`);
            if (win) win.style.display = 'flex';
        });
        const lastUrl = windowsHiddenForDesktop[windowsHiddenForDesktop.length - 1];
        focusWindow(document.querySelector(`.app-window[data-embed-url="${lastUrl}"]`));
        windowsHiddenForDesktop = [];
    }
    updateControlStripApps();
}

function syncWindowStateFlags() {
    const visibleWindows = Array.from(document.querySelectorAll('.app-window'))
        .filter(embed => embed.style.display !== 'none' && embed.dataset.closing !== 'true');
    isAppOpen = visibleWindows.length > 0;
    if (!isAppOpen) {
        window.currentActiveAppUrl = null;
        document.body.classList.remove('app-active');
        return;
    }
    document.body.classList.add('app-active');
    if (!window.currentActiveAppUrl || !visibleWindows.some(w => w.dataset.embedUrl === window.currentActiveAppUrl)) {
        const top = visibleWindows.reduce((best, el) => {
            const z = parseInt(el.style.zIndex || '0', 10) || 0;
            const bestZ = parseInt(best.style.zIndex || '0', 10) || 0;
            return z >= bestZ ? el : best;
        }, visibleWindows[0]);
        window.currentActiveAppUrl = top?.dataset?.embedUrl || null;
    }
}

function resetDrawerInactivityTimer() {
    clearTimeout(drawerInactivityTimeout);
    if (appDrawer.classList.contains('open')) {
        drawerInactivityTimeout = setTimeout(() => {
            if (appDrawer.classList.contains('open')) {
                const navHandle = document.getElementById('one-button-nav-handle');
                navHandle ? navHandle.click() : document.querySelector('.container').click();
            }
        }, DRAWER_AUTO_CLOSE_MS);
    }
}

async function createWindowEmbed(url, options = {}) {
    // Wake up and log activity for Resource Manager
    if (typeof ResourceManager !== 'undefined') {
        ResourceManager.markAppActive(url);
    }

    // Close Donburi dynamically when an app is opened
    if (typeof window.closeDonburi === 'function') {
        window.closeDonburi();
    }

    let { allowMultipleWindows = true } = options;

    // Close UI controls that may interfere
    closeControls();

    // Save currently active window to history if multiple windows are not allowed
    if (!allowMultipleWindows) {
        const currentActive = document.querySelector('.app-window[style*="display: flex"]');
        if (currentActive && currentActive.dataset.embedUrl !== url) {
            window.appHistoryStack.push(currentActive.dataset.embedUrl);
            if (window.appHistoryStack.length > 15) window.appHistoryStack.shift();
            console.log(`[System] Pushed to history: ${currentActive.dataset.embedUrl}`);
        }
        document.querySelectorAll(".app-window").forEach(embed => {
            if (embed.dataset.embedUrl !== url) {
                if ("true" === embed.dataset.closing) return;
                minimizedEmbeds[embed.dataset.embedUrl] = embed;
                embed.style.display = "none";
                embed.style.contentVisibility = "hidden";
                embed.style.opacity = "0";
                embed.style.zIndex = "0";
            }
        });
    }

    // --- REUSE LOGIC ---
    let embedContainer = minimizedEmbeds[url];
    if (embedContainer && embedContainer.dataset.closing === 'true') {
        delete minimizedEmbeds[url];
        embedContainer = null;
    }

    if (!embedContainer) {
        const inDom = document.querySelector(`.app-window[data-embed-url="${url}"]`);
        if (inDom && inDom.dataset.closing !== 'true') {
            if (inDom.style.display === 'none') {
                minimizedEmbeds[url] = inDom;
                embedContainer = inDom;
            } else {
                focusWindow(inDom);
                return;
            }
        }
    }

    // Determine app info
    const normalizeUrlPath = (u) => {
        try { return new URL(u, window.location.origin).pathname; } 
        catch(e) { return u; }
    };

    let appName = Object.keys(apps).find(name => apps[name].url === url);
    if (!appName) {
        appName = Object.keys(apps).find(name => normalizeUrlPath(apps[name].url) === normalizeUrlPath(url));
    }

    const isInternalTool = ["recovery/index.html", "transfer/index.html"].some(t => url.includes(t));
    const isSystemApp = url.includes("assets/gurapp/intl");

    // Fuzzy Match
    let isFuzzyMatch = false;
    if (!appName && !isInternalTool && !isSystemApp) {
        try {
            const targetUrl = new URL(url, window.location.origin);
            const targetDomain = targetUrl.hostname;
            isFuzzyMatch = Object.values(apps).some(app => {
                try {
                    const appUrl = new URL(app.url, window.location.origin);
                    return appUrl.hostname === targetDomain;
                } catch(e) { return false; }
            });
        } catch(e) {}
    }

    if (!appName && !isInternalTool && !isSystemApp && !isFuzzyMatch) {
        console.warn(`Attempted to open unknown app: ${url}`);
        return showDialog({ type: "alert", title: currentLanguage.GURAPP_NOT_INSTALLED, message: url, icon: "cancel" });
    }

    let appDetails = appName ? apps[appName] : { name: "System Tool", icon: "/desktop/assets/appicon/system.png", url };
    appName = appName || "System Tool";

    // Track usage
    appUsage[appName] = (appUsage[appName] || 0) + 1;
    saveUsageData(appName);
    appLastOpened[appName] = Date.now();
    saveLastOpenedData();
    window.Analytics?.trackAppOpen(url);

    const dynArea = document.getElementById('dynamic-area');
    if (dynArea) dynArea.style.opacity = '1';

    if (embedContainer) {
        // --- RESTORE MINIMIZED WINDOW ---
        delete minimizedEmbeds[url];
        if (window.minimizeTimeouts[url]) {
            clearTimeout(window.minimizeTimeouts[url]);
            delete window.minimizeTimeouts[url];
        }

        embedContainer.style.display = "flex";
        embedContainer.style.removeProperty('content-visibility');
        embedContainer.style.pointerEvents = 'auto';
        focusWindow(embedContainer);
        
        await pauseAllAnimations();

        requestAnimationFrame(() => {
            const frame = embedContainer.querySelector('iframe');
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage({ type: 'visibilityUpdate', visible: true }, '*');
                frame.contentWindow.postMessage({ type: 'sunUpdate', shadow: currentSunShadow }, '*');
            }
            embedContainer.style.transition = "transform 0.3s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.3s ease";
            embedContainer.style.transform = "scale(1)";
            embedContainer.style.opacity = "1";
        });
    } else {
        // Create container
        embedContainer = document.createElement("div");
        embedContainer.className = "desktop-window app-window";
        embedContainer.style.cssText = `width:800px; height:500px; top:120px; left:120px; display:flex; opacity:0;`;
        embedContainer.dataset.embedUrl = url;

        // Interaction Overlay (Fixes iframe hover bug)
        const overlay = document.createElement("div");
        overlay.className = "window-overlay";
        embedContainer.appendChild(overlay);

        // Resize Handles
        ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].forEach(dir => {
            const r = document.createElement('div');
            r.className = `resizer ${dir}`;
            r.dataset.dir = dir;
            embedContainer.appendChild(r);
            setupResizer(r, embedContainer);
        });

        const header = document.createElement("div");
        header.className = "window-header";
        header.innerHTML = `
            <div class="window-controls">
                <button class="win-btn win-close"></button>
                <button class="win-btn win-min"></button>
                <button class="win-btn win-max"></button>
            </div>
        `;
        
        header.querySelector(".win-close").onclick = () => forceCloseApp(url);
        header.querySelector(".win-min").onclick = () => minimizeWindowEmbed(true, url);
        header.querySelector(".win-max").onclick = () => embedContainer.classList.toggle("maximized");

        // Dragging (From header OR overlay)
        let isWinDragging = false;
        let winStartX, winStartY, winInitialX, winInitialY;

        const startDrag = (e) => {
            if (e.target.closest('.window-controls') || e.target.closest('.resizer')) return;
            // Ensure background click listeners ignore this interaction
            bgDragStartX = -999;
            isWinDragging = true;
            winStartX = e.clientX; winStartY = e.clientY;
            winInitialX = embedContainer.offsetLeft; winInitialY = embedContainer.offsetTop;
            focusWindow(embedContainer);
            iframe.style.pointerEvents = 'none';
        };

        header.addEventListener("mousedown", startDrag);
        overlay.addEventListener("mousedown", startDrag);

        window.addEventListener("mousemove", e => {
            if (!isWinDragging) return;
            embedContainer.classList.add('window-moving'); // Apply pointer-block
            embedContainer.style.left = `${winInitialX + (e.clientX - winStartX)}px`;
            embedContainer.style.top = `${winInitialY + (e.clientY - winStartY)}px`;
        });

        window.addEventListener("mouseup", () => { 
            isWinDragging = false; 
            embedContainer.classList.remove('window-moving'); // Restore pointer-events
            iframe.style.pointerEvents = 'auto';
        });

        const spinner = document.createElement('div');
        spinner.className = 'app-loading-indicator';
        spinner.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1002; transition: opacity 0.3s ease; pointer-events: none;';
        spinner.innerHTML = `<svg class="loading-spinner" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="currentColor" class="loading-spinner-ind" /></svg>`;
        embedContainer.appendChild(spinner);

        const iframeWrapper = document.createElement('div');
        iframeWrapper.className = 'window-content';
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.setAttribute('data-gurasuraisu-iframe', 'true');
        iframe.dataset.appId = appName;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        iframeWrapper.appendChild(iframe);

        embedContainer.appendChild(header);
        embedContainer.appendChild(iframeWrapper);
        document.body.appendChild(embedContainer);
        focusWindow(embedContainer);

        iframe.addEventListener("load", () => {
            iframe.style.opacity = '1';
            spinner.style.opacity = '0';
            setTimeout(() => spinner.remove(), 300);
            
            const currentLang = localStorage.getItem('selectedLanguage') || 'EN';
            iframe.contentWindow.postMessage({ type: 'languageUpdate', languageCode: currentLang }, '*');

            setTimeout(() => {
                if (document.body.contains(embedContainer) && !embedContainer.dataset.hasApi) {
                    embedContainer.classList.add('legacy');
                }
            }, 1000);
        });

        await pauseAllAnimations();

        requestAnimationFrame(() => {
            embedContainer.style.transition = "transform 0.3s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.3s ease";
            embedContainer.style.transform = "scale(1)";
            embedContainer.style.opacity = "1";
        });
    }

    const appMgmt = document.getElementById('app-management-info');
    if (appMgmt) {
        appMgmt.classList.remove('force-hide');
        appMgmt.style.display = '';
        requestAnimationFrame(() => appMgmt.style.opacity = '1');
    }

    restoreCorrectFavicon();
    updateTitle();
    updateControlStripApps();
}

// Wrapper to intercept app open calls
const originalCreateWindowEmbed = createWindowEmbed;
createWindowEmbed = async function(url, options = {}) {
    // Wake up and log activity for Resource Manager
    if (typeof ResourceManager !== 'undefined') {
        ResourceManager.markAppActive(url);
    }

    // Close Donburi dynamically when an app is opened
    if (typeof window.closeDonburi === 'function') {
        window.closeDonburi();
    }

    // Call original logic which handles DOM creation
    const result = await originalCreateWindowEmbed(url, options);

    // Force immediate favicon update with the URL we just opened.
    // This bypasses the DOM query delay.
    restoreCorrectFavicon(url);
    updateTitle();

    return result;
};

async function createBackgroundEmbed(url) {
    // 1. Check if already running (Active or Minimized)
    const existing = document.querySelector(`.app-window[data-embed-url="${url}"]`);
    if (existing || minimizedEmbeds[url]) {
        const target = existing || minimizedEmbeds[url];
        const frame = target.querySelector('iframe');
        if (frame && frame.contentWindow) {
            const origin = typeof getOriginFromUrl === 'function' ? getOriginFromUrl(url) : '*';
            frame.contentWindow.postMessage({ type: 'requestRemoteUI' }, origin);
        }
        return; 
    }

    // 2. Resolve App Info
    let appName = Object.keys(apps).find(name => apps[name].url === url);
    let appDetails = appName ? apps[appName] : { name: "System Tool", icon: "assets/appicon/system.png" };
    appName = appName || "System Tool";

    // 3. Create Container (Hidden by default)
    const embedContainer = document.createElement("div");
    embedContainer.className = "desktop-window app-window";
    // Set to display:none immediately so it doesn't interfere with the desktop
    embedContainer.style.cssText = `width:800px; height:500px; top:120px; left:120px; display:none; opacity:0; z-index:1000;`;
    embedContainer.dataset.embedUrl = url;

    // 4. Interaction Overlay
    const overlay = document.createElement("div");
    overlay.className = "window-overlay";
    embedContainer.appendChild(overlay);

    // 5. Setup Resize Handles
    ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].forEach(dir => {
        const r = document.createElement('div');
        r.className = `resizer ${dir}`;
        r.dataset.dir = dir;
        embedContainer.appendChild(r);
        if (typeof setupResizer === 'function') setupResizer(r, embedContainer);
    });

    // 6. Header & Controls
    const header = document.createElement("div");
    header.className = "window-header";
    header.innerHTML = `
        <div class="window-controls">
            <button class="win-btn win-close"></button>
            <button class="win-btn win-min"></button>
            <button class="win-btn win-max"></button>
        </div>
    `;
    
    header.querySelector(".win-close").onclick = (e) => { e.stopPropagation(); forceCloseApp(url); };
    header.querySelector(".win-min").onclick = (e) => { e.stopPropagation(); minimizeWindowEmbed(true, url); };
    header.querySelector(".win-max").onclick = (e) => { e.stopPropagation(); embedContainer.classList.toggle("maximized"); };

    // 7. Dragging logic (Simplified for background state)
    let isWinDragging = false;
    let winStartX, winStartY, winInitialX, winInitialY;

    const startDrag = (e) => {
        if (e.target.closest('.window-controls') || e.target.closest('.resizer')) return;
        bgDragStartX = -999; // Movement guard for desktop
        isWinDragging = true;
        winStartX = e.clientX; winStartY = e.clientY;
        winInitialX = embedContainer.offsetLeft; winInitialY = embedContainer.offsetTop;
        
        // Only focus if the user actually clicks to drag
        if (typeof focusWindow === 'function') focusWindow(embedContainer);
    };

    header.addEventListener("mousedown", startDrag);
    overlay.addEventListener("mousedown", startDrag);

    window.addEventListener("mousemove", e => {
        if (!isWinDragging) return;
        embedContainer.classList.add('window-moving');
        embedContainer.style.left = `${winInitialX + (e.clientX - winStartX)}px`;
        embedContainer.style.top = `${winInitialY + (e.clientY - winStartY)}px`;
    });

    window.addEventListener("mouseup", () => { 
        isWinDragging = false; 
        embedContainer.classList.remove('window-moving');
    });

    // 8. Iframe Setup
    const iframeWrapper = document.createElement('div');
    iframeWrapper.className = 'window-content';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.setAttribute('data-gurasuraisu-iframe', 'true');
    iframe.dataset.appId = appName;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframeWrapper.appendChild(iframe);

    embedContainer.appendChild(header);
    embedContainer.appendChild(iframeWrapper);

    iframe.addEventListener("load", () => {
        const currentLang = localStorage.getItem('selectedLanguage') || 'EN';
        iframe.contentWindow.postMessage({ type: 'languageUpdate', languageCode: currentLang }, '*');
        
        // Sync Initial Volume
        if (typeof syncAppVolume === 'function') syncAppVolume(iframe);

        setTimeout(() => {
            if (document.body.contains(embedContainer) && !embedContainer.dataset.hasApi) {
                embedContainer.classList.add('legacy');
            }
        }, 1000);
    });

    // 9. Add to DOM and Cache
    document.body.appendChild(embedContainer);
    minimizedEmbeds[url] = embedContainer;
    
    // Update Control Strip to show the new background app
    if (typeof updateControlStripApps === 'function') updateControlStripApps();
    
    console.log(`[System] Launched ${appName} in background.`);
}

window.launchAppSilently = createBackgroundEmbed;

function closeWindowEmbed() {
    // Find the topmost window (focused)
    const activeWindow = document.querySelector('.app-window[style*="display: flex"]');
    if (activeWindow && activeWindow.dataset.embedUrl) {
        forceCloseApp(activeWindow.dataset.embedUrl);
    }
}

function forceCloseApp(url) {
    const embedContainer = document.querySelector(`.app-window[data-embed-url="${url}"]`);
    if (!embedContainer) return;

    window.Analytics?.trackAppClose(url);
    const appName = Object.keys(apps).find(name => apps[name].url === url);

    // CLEANUP
    if (minimizedEmbeds && minimizedEmbeds[url]) {
        delete minimizedEmbeds[url];
    }
    
    if (window.minimizeTimeouts && window.minimizeTimeouts[url]) {
        clearTimeout(window.minimizeTimeouts[url]);
        delete window.minimizeTimeouts[url];
    }
    
    if (appName) {
        if (typeof clearMediaSession === 'function') clearMediaSession(appName);
        Object.keys(activeLiveActivities).forEach(id => {
            if (activeLiveActivities[id].appName === appName) stopLiveActivity(id);
        });
    }

    // ANIMATE OUT
    embedContainer.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in';
    embedContainer.style.transform = 'scale(0.95)';
    embedContainer.style.opacity = '0';
    embedContainer.dataset.closing = 'true';

    setTimeout(() => {
        const iframe = embedContainer.querySelector('iframe');
        if (iframe) {
            iframe.src = 'about:blank';
            iframe.remove();
        }
        embedContainer.remove();
        
        // Re-calculate focus for the top bar
        autoFocusNextWindow();
        
        // Update System UI state based on remaining windows
        restoreCorrectFavicon();
        updateTitle();
        updateControlStripApps();
    }, 200);
}

function minimizeWindowEmbed(animate = true, urlToMinimize = null) {
    // 1. Identify which window to minimize
    const embedContainer = urlToMinimize 
        ? document.querySelector(`.app-window[data-embed-url="${urlToMinimize}"]`)
        : document.querySelector('.app-window[style*="display: flex"]'); // Topmost visible

    if (!embedContainer) return;
    
    const url = embedContainer.dataset.embedUrl;
    minimizedEmbeds[url] = embedContainer;
    SoundManager.play('close'); 

    if (animate) {
        embedContainer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
        embedContainer.style.transform = 'scale(0.95)';
        embedContainer.style.opacity = '0';
    }

    const cleanupDelay = animate ? 300 : 0;

    window.minimizeTimeouts[url] = setTimeout(() => {
        if (minimizedEmbeds[url] === embedContainer) {
            const frame = embedContainer.querySelector('iframe');
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage({ type: 'visibilityUpdate', visible: false }, '*');
            }
            embedContainer.style.display = 'none';
            embedContainer.style.contentVisibility = 'hidden';
            embedContainer.style.pointerEvents = 'none';
            autoFocusNextWindow();
        }
        delete window.minimizeTimeouts[url];
        restoreCorrectFavicon();
        updateTitle();
        updateControlStripApps();
    }, cleanupDelay);
}

function setupResizer(resizer, win) {
    resizer.addEventListener('mousedown', (e) => {
        // Ensure background click listeners ignore this interaction
        bgDragStartX = -999; 
        e.stopPropagation();
        e.preventDefault();
        const dir = resizer.dataset.dir;
        let startX = e.clientX, startY = e.clientY;
        let startW = win.offsetWidth, startH = win.offsetHeight;
        let startL = win.offsetLeft, startT = win.offsetTop;

        const onMouseMove = (e) => {
            win.classList.add('window-resizing'); // Apply pointer-block
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (dir.includes('e')) win.style.width = `${startW + dx}px`;
            if (dir.includes('s')) win.style.height = `${startH + dy}px`;
            if (dir.includes('w')) {
                win.style.width = `${startW - dx}px`;
                win.style.left = `${startL + dx}px`;
            }
            if (dir.includes('n')) {
                win.style.height = `${startH - dy}px`;
                win.style.top = `${startT + dy}px`;
            }
        };

        const onMouseUp = () => {
            win.classList.remove('window-resizing'); // Restore pointer-events
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}

/**
 * Creates a composite screenshot of the main body and an active iframe.
 * This works by asking the iframe (via gurasuraisu-api.js) to provide its own screenshot.
 * @returns {Promise<string>} A promise that resolves with the dataURL of the composite image.
 */
function createCompositeScreenshot() {
    return new Promise(async (resolve, reject) => {
        if (window.isLowEndDevice) { resolve(null); return; }

        const activeEmbed = document.querySelector('.app-window[style*="display: block"]');
        const iframe = activeEmbed ? activeEmbed.querySelector('iframe') : null;
        const isMobile = isMobileDevice();

        if (!iframe) {
            let dataUrl;
            if (isMobile) {
                const canvas = await html2canvas(document.body, { useCORS: true, logging: false });
                dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            } else {
                dataUrl = await modernScreenshot.domToJpeg(document.body, { 
                    quality: 0.5,
                    filter: (node) => {
                        if (node.nodeType === 1 && (node.tagName === 'IMG' || node.tagName === 'VIDEO') && node.src && !node.src.startsWith('data:') && !node.src.startsWith('blob:')) {
                            try {
                                const url = new URL(node.src, window.location.href);
                                if (url.origin !== window.location.origin && !node.crossOrigin) return false;
                            } catch(e) {}
                        }
                        return true;
                    }
                });
            }
            resolve(dataUrl);
            return;
        }

        const parentDataUrl = await modernScreenshot.domToJpeg(document.body, {
            filter: (node) => {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IFRAME') return false;
                    if ((node.tagName === 'IMG' || node.tagName === 'VIDEO') && node.src && !node.src.startsWith('data:') && !node.src.startsWith('blob:')) {
                        try {
                            const url = new URL(node.src, window.location.href);
                            if (url.origin !== window.location.origin && !node.crossOrigin) return false;
                        } catch(e) {}
                    }
                }
                return true;
            },
            quality: 1.0 // Keep high quality for the base composition step
        });

        const iframeListener = (event) => {
            if (event.source === iframe.contentWindow && event.data.type === 'screenshot-response') {
                window.removeEventListener('message', iframeListener);

                const childDataUrl = event.data.screenshotDataUrl;

                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = window.innerWidth;
                finalCanvas.height = window.innerHeight;
                const ctx = finalCanvas.getContext('2d');

                const parentImg = new Image();
                parentImg.onload = () => {
                    ctx.drawImage(parentImg, 0, 0);

                    const childImg = new Image();
                    childImg.onload = () => {
                        const rect = iframe.getBoundingClientRect();
                        ctx.drawImage(childImg, rect.left, rect.top, rect.width, rect.height);
                        resolve(finalCanvas.toDataURL('image/jpeg', 0.5));
                    };
                    childImg.src = childDataUrl;
                };
                parentImg.src = parentDataUrl;
            }
        };

        window.addEventListener('message', iframeListener);
        const targetOrigin = getOriginFromUrl(iframe.src);
        iframe.contentWindow.postMessage({ type: 'request-screenshot' }, targetOrigin);
        
        setTimeout(() => {
            window.removeEventListener('message', iframeListener);
            reject(new Error("Screenshot request to iframe timed out. The active app may not support this feature."));
        }, 3000);
    });
}

// --- Predictive App Preloading ---
function initPredictivePreload() {
    if (localStorage.getItem('predictivePreload') === 'false') return;

    // Wait 5 seconds after boot to ensure system stability before heavy operations
    setTimeout(() => {
        const hour = new Date().getHours();
        const hourlyUsage = JSON.parse(localStorage.getItem('appUsageHourly') || '{}');
        
        if (hourlyUsage[hour]) {
            // Sort apps used in this hour by frequency
            const sorted = Object.entries(hourlyUsage[hour]).sort((a, b) => b[1] - a[1]);
            
            // If the user has opened this app at least 3 times during this hour historically
            if (sorted.length > 0 && sorted[0][1] >= 3) {
                const predictedAppName = sorted[0][0];
                const appDef = apps[predictedAppName];
                
                if (appDef && appDef.url) {
                    console.log(`[System] Predictive AI Preloading: ${predictedAppName}`);
                    createBackgroundEmbed(appDef.url);
                }
            }
        }
    }, 50000);
}

function updateControlStripApps() {
    const container = document.getElementById('cs-apps-list');
    if (!container) return;
    container.innerHTML = '';

    // Find all app windows in the DOM
    const windows = document.querySelectorAll('.app-window');
    
    windows.forEach(win => {
        const url = win.dataset.embedUrl;
        const appName = Object.keys(apps).find(name => apps[name].url === url);
        const appDetails = apps[appName];
        const isMinimized = win.style.display === 'none';
        const isActive = win.style.zIndex > 1000 && !isMinimized;

        const btn = document.createElement('button');
        btn.className = `cs-btn cs-app-btn ${isMinimized ? 'minimized' : ''}`;
        btn.title = appName || "Application";

        // Icon Logic
        let iconUrl = appDetails?.icon || 'system.png';
        if (!iconUrl.startsWith('http') && !iconUrl.startsWith('data:')) {
            iconUrl = `/desktop/assets/appicon/${iconUrl}`;
        }

        const img = document.createElement('img');
        img.src = iconUrl;
        btn.appendChild(img);

        btn.onclick = (e) => {
            e.stopPropagation();
            if (isMinimized) {
                createWindowEmbed(url); // Restore
            } else {
                focusWindow(win); // Bring to front
            }
        };

        container.appendChild(btn);
    });
    
    // Hide the entire apps section if empty to save space
    container.style.display = windows.length > 0 ? 'flex' : 'none';
}