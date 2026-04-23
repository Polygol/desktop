const closeModal = document.getElementById('closeModal');
const blurOverlay = document.getElementById('blurOverlay');

const __clockElement = document.getElementById('clock');
if (__clockElement) {
    __clockElement.addEventListener('click', (e) => {
        if (document.body.classList.contains('edit-mode-active')) {
            e.stopPropagation();
            if (typeof openEditSheet === 'function') openEditSheet('clock');
            return;
        }
        if (typeof window.gurappsEnabled !== 'undefined' && !window.gurappsEnabled) return;
        if (typeof gurappsEnabled !== 'undefined' && !gurappsEnabled) return;
        createWindowEmbed('https://polygol.github.io/chronos/index.html');
    });
}

const __weatherWidget = document.getElementById('weather');
if (__weatherWidget) {
    __weatherWidget.addEventListener('click', (e) => {
        if (document.body.classList.contains('edit-mode-active')) {
            e.stopPropagation();
            if (typeof openEditSheet === 'function') openEditSheet('background');
            return;
        }
        if (typeof window.gurappsEnabled !== 'undefined' && !window.gurappsEnabled) return;
        if (typeof gurappsEnabled !== 'undefined' && !gurappsEnabled) return;
        createWindowEmbed('https://polygol.github.io/weather/index.html');
    });
}

const __dateElement = document.getElementById('date');
if (__dateElement) {
    __dateElement.addEventListener('click', (e) => {
        if (document.body.classList.contains('edit-mode-active')) {
            e.stopPropagation();
            if (typeof openEditSheet === 'function') openEditSheet('date');
            return;
        }
        if (typeof window.gurappsEnabled !== 'undefined' && !window.gurappsEnabled) return;
        if (typeof gurappsEnabled !== 'undefined' && !gurappsEnabled) return;
        createWindowEmbed('https://polygol.github.io/fantaskical/index.html');
    });
}

// Catch background clicks in edit mode to open Background Settings
document.addEventListener('click', (e) => {
    if (document.body.classList.contains('edit-mode-active')) {
        const isClickInsideSheet = e.target.closest('#edit-mode-ui');
        const isClickInsideClock = e.target.closest('#clock');
        const isClickInsideDate = e.target.closest('.info');
        const isClickInsideWidget = e.target.closest('.widget-instance');
        const isControlPopup = e.target.closest('.control-popup');

        if (!isClickInsideSheet && !isClickInsideClock && !isClickInsideDate && !isClickInsideWidget && !isControlPopup) {
            if (typeof openEditSheet === 'function') openEditSheet('background');
        }
    }
});

// --- Double Click to Sleep ---
let lastBgTap = 0;
let bgDragStartX = 0;
let bgDragStartY = 0;

document.addEventListener('mousedown', (e) => {
    // Record starting position for any click that hits the background
    bgDragStartX = e.clientX;
    bgDragStartY = e.clientY;
});

document.addEventListener('click', (e) => {
    const isBg = e.target === document.body || 
                 e.target.id === 'background-video' || 
                 e.target.id === 'depth-layer' || 
                 e.target.id === 'time-of-day-overlay' ||
                 e.target.classList.contains('container') ||
                 e.target.id === 'widget-grid';
                 
    if (isBg) {
        // Calculate distance moved between mousedown and click
        const moveDist = Math.sqrt(
            Math.pow(e.clientX - bgDragStartX, 2) + 
            Math.pow(e.clientY - bgDragStartY, 2)
        );

        // DRAG GUARD: If the mouse moved more than 5 pixels, 
        // ignore the click (user was likely dragging or swiping)
        if (moveDist > 5) return;

        const now = Date.now();
        
        // Handle Single Click (Show Desktop / Clear Focus)
        if (e.target.id === 'widget-grid' || e.target.tagName === 'BODY' || e.target.id === 'time-of-day-overlay') {
             if (typeof toggleShowDesktop === 'function') {
                toggleShowDesktop();
             }
        }

        // Handle Double Click (Sleep Mode)
        if (now - lastBgTap < 300) {
            if (localStorage.getItem('doubleTapToSleep') !== 'false') {
                if (typeof blackoutScreen === 'function') blackoutScreen();
            }
        }
        lastBgTap = now;
    }
});

const customizeModal = document.getElementById('customizeModal');
const customizeModalContent = document.getElementById('customizeModalContent');
const themeSwitch = document.getElementById('theme-switch');
const wallpaperInput = document.getElementById('wallpaperInput');
const uploadButton = document.getElementById('uploadButton');
const gurappsSwitch = document.getElementById("gurapps-switch");
const contrastSwitch = document.getElementById('contrast-switch');
const animationSwitch = document.getElementById('animation-switch');
let gurappsEnabled = localStorage.getItem("gurappsEnabled") !== "false";
let slideshowInterval = null;
let currentWallpaperIndex = 0;
let minimalMode = localStorage.getItem('minimalMode') === 'true';
let nightMode = localStorage.getItem('nightMode') === 'true';
let glassEffectsEnabled = localStorage.getItem('glassEffectsEnabled') !== 'false'; // Default to true
let minimizeCleanupTimeout = null; 
const minimizeTimeouts = {}; // Track timeouts per app URL

// Close customizeModal when clicking outside
const __blurOverlayControls = document.getElementById('blurOverlayControls');
if (__blurOverlayControls) {
    __blurOverlayControls.addEventListener('click', () => {
        closeControls();
    });
}

function closeControls() {
	const dynArea = document.getElementById('dynamic-area');
	if (dynArea) dynArea.style.opacity = '1';
	const custModal = document.getElementById('customizeModal');
    if (custModal) custModal.classList.remove('show'); // Start animation
    const blurCtrl = document.getElementById('blurOverlayControls');
    if (blurCtrl) blurCtrl.classList.remove('show');

    // Collapse all settings sections when closing
    const homeSettings = document.querySelector('.settings-grid.home-settings');
    if (homeSettings) {
        homeSettings.querySelectorAll('h4').forEach(heading => {
            const icon = heading.querySelector('.material-symbols-rounded');
            const content = heading.nextElementSibling;
            
            if (content) content.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
        });
    }

    setTimeout(() => {
        if (custModal) custModal.style.display = 'none'; // Hide after animation
        if (blurCtrl) blurCtrl.style.display = 'none';
    }, 300);
}

// Touch-first control gestures removed for desktop UX.
// Controls are now opened and closed through explicit desktop menu actions.