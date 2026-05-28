// spotlight.js - Global Spotlight Search Implementation

let spotlightOverlay = null;
let spotlightContainer = null;
let spotlightInput = null;
let spotlightResultsContainer = null;

let currentSpotlightResults = [];
let spotlightSelectedIndex = -1;

function initSpotlightUI() {
    if (document.getElementById('spotlight-overlay')) return;

    // Create Overlay
    spotlightOverlay = document.createElement('div');
    spotlightOverlay.id = 'spotlight-overlay';
    
    // Create Container
    spotlightContainer = document.createElement('div');
    spotlightContainer.id = 'spotlight-container';
    
    // Create Input
    spotlightInput = document.createElement('input');
    spotlightInput.id = 'spotlight-input';
    spotlightInput.type = 'text';
    spotlightInput.placeholder = 'Search';
    spotlightInput.autocomplete = 'off';
    spotlightInput.spellcheck = false;
    
    // Create Results Container
    spotlightResultsContainer = document.createElement('div');
    spotlightResultsContainer.id = 'spotlight-results';
    
    // Assemble
    spotlightContainer.appendChild(spotlightInput);
    spotlightContainer.appendChild(spotlightResultsContainer);
    spotlightOverlay.appendChild(spotlightContainer);
    document.body.appendChild(spotlightOverlay);

    // Event Listeners
    spotlightOverlay.addEventListener('click', (e) => {
        if (e.target === spotlightOverlay) closeSpotlight();
    });

    spotlightInput.addEventListener('input', handleSpotlightInput);
    spotlightInput.addEventListener('keydown', handleSpotlightKeydown);

    // Keyboard Shortcut (Ctrl+K or Cmd+K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (spotlightOverlay.style.display === 'flex') {
                closeSpotlight();
            } else {
                openSpotlight();
            }
        }
    });
}

function openSpotlight() {
    if (!spotlightOverlay) initSpotlightUI();
    
    spotlightInput.value = '';
    spotlightResultsContainer.innerHTML = '';
    currentSpotlightResults = [];
    spotlightSelectedIndex = -1;

    spotlightOverlay.style.display = 'flex';
    // Small delay to allow display:flex to apply before animating opacity/transform
    requestAnimationFrame(() => {
        spotlightOverlay.classList.add('visible');
        spotlightInput.focus();
    });
}

function closeSpotlight() {
    if (!spotlightOverlay) return;
    
    spotlightOverlay.classList.remove('visible');
    setTimeout(() => {
        if (!spotlightOverlay.classList.contains('visible')) {
            spotlightOverlay.style.display = 'none';
        }
    }, 200);
}

function safeMathEval(str) {
    str = str.replace(/\s+/g, '');
    // Only allow numbers, basic operators, and parentheses
    if (/^[\d\.\+\-\*\/\(\)\^]+$/.test(str)) {
        try {
            const result = new Function(`'use strict'; return (${str})`)();
            if (isFinite(result)) return result;
        } catch(e) {
            return null;
        }
    }
    return null;
}

function getSpotlightIcon(iconStr) {
    if (!iconStr) return './desktop/assets/appicon/default.png';
    if (iconStr.startsWith('http') || iconStr.startsWith('data:')) return iconStr;
    return `./desktop/assets/appicon/${iconStr}`;
}

function executeActionFromSpotlight(actionId, appName) {
    const iframe = document.querySelector(`iframe[data-app-id="${appName}"]`);
    if (iframe && iframe.contentWindow) {
        const targetOrigin = window.location.origin; // Or getOriginFromUrl(iframe.src)
        iframe.contentWindow.postMessage({
            type: 'desktop-action-run',
            actionId: actionId,
            payload: { source: 'spotlight' }
        }, '*');
    } else {
        // App is not open, open it first then execute
        if (apps[appName]) {
            createWindowEmbed(apps[appName].url);
            setTimeout(() => {
                const newIframe = document.querySelector(`iframe[data-app-id="${appName}"]`);
                if (newIframe && newIframe.contentWindow) {
                    newIframe.contentWindow.postMessage({
                        type: 'desktop-action-run',
                        actionId: actionId,
                        payload: { source: 'spotlight' }
                    }, '*');
                }
            }, 1500); // Wait for load
        }
    }
}

function handleSpotlightInput() {
    const query = spotlightInput.value.trim();
    currentSpotlightResults = [];
    spotlightSelectedIndex = -1;

    if (!query) {
        renderSpotlightResults();
        return;
    }

    const qLower = query.toLowerCase();

    // 1. Math Calculation
    const mathRes = safeMathEval(query);
    if (mathRes !== null) {
        currentSpotlightResults.push({
            id: 'math',
            title: `= ${mathRes}`,
            subtitle: 'Calculation (Press Enter to copy)',
            isMaterialIcon: true,
            icon: 'calculate',
            action: () => {
                navigator.clipboard.writeText(mathRes.toString());
                if (typeof showPopup === 'function') showPopup("Copied to clipboard");
                closeSpotlight();
            }
        });
    }

    // 2. Applications
    if (typeof apps !== 'undefined') {
        Object.keys(apps).forEach(appName => {
            if (appName.toLowerCase().includes(qLower) && appName !== "Apps") {
                currentSpotlightResults.push({
                    id: `app_${appName}`,
                    title: appName,
                    subtitle: 'Application',
                    isMaterialIcon: false,
                    icon: getSpotlightIcon(apps[appName].icon),
                    action: () => {
                        createWindowEmbed(apps[appName].url);
                        closeSpotlight();
                    }
                });
            }
        });
    }

    // 3. Desktop Actions
    if (window.DesktopActionsRegistry) {
        const actions = DesktopActionsRegistry.list();
        actions.forEach(act => {
            if (act.label.toLowerCase().includes(qLower) || act.appName.toLowerCase().includes(qLower)) {
                currentSpotlightResults.push({
                    id: `action_${act.id}`,
                    title: act.label,
                    subtitle: `${act.appName} Action`,
                    isMaterialIcon: true,
                    icon: act.icon || 'bolt',
                    action: () => {
                        executeActionFromSpotlight(act.id, act.appName);
                        closeSpotlight();
                    }
                });
            }
        });
    }

    // 4. Web Search Fallback
    currentSpotlightResults.push({
        id: 'web_search',
        title: `Google Search for "${query}"`,
        subtitle: 'Open in a new tab',
        isMaterialIcon: true,
        icon: 'travel_explore',
        action: () => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');
            closeSpotlight();
        }
    });

    if (currentSpotlightResults.length > 0) {
        spotlightSelectedIndex = 0;
    }

    renderSpotlightResults();
}

function renderSpotlightResults() {
    spotlightResultsContainer.innerHTML = '';
    
    if (currentSpotlightResults.length === 0) {
        spotlightResultsContainer.style.display = 'none';
        return;
    }

    spotlightResultsContainer.style.display = 'block';

    currentSpotlightResults.forEach((res, index) => {
        const item = document.createElement('div');
        item.className = `spotlight-item ${index === spotlightSelectedIndex ? 'selected' : ''}`;
        
        // Icon rendering
        let iconHtml = '';
        if (res.isMaterialIcon) {
            iconHtml = `<span class="material-symbols-rounded spotlight-icon-material">${res.icon}</span>`;
        } else {
            iconHtml = `<div class="app-icon-img"><img src="${res.icon}" alt="${res.title}"></div>`;
        }

        item.innerHTML = `
            <div class="spotlight-icon-wrapper">${iconHtml}</div>
            <div class="spotlight-details">
                <div class="spotlight-title">${res.title}</div>
                <div class="spotlight-subtitle">${res.subtitle}</div>
            </div>
        `;

        // Handle Mouse Events
        item.addEventListener('mouseenter', () => {
            spotlightSelectedIndex = index;
            updateSpotlightSelectionUI();
        });

        item.addEventListener('click', () => {
            res.action();
        });

        spotlightResultsContainer.appendChild(item);
    });
}

function updateSpotlightSelectionUI() {
    const items = spotlightResultsContainer.querySelectorAll('.spotlight-item');
    items.forEach((item, index) => {
        if (index === spotlightSelectedIndex) {
            item.classList.add('selected');
            // Ensure visibility when using keyboard
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('selected');
        }
    });
}

function handleSpotlightKeydown(e) {
    if (currentSpotlightResults.length === 0) {
        if (e.key === 'Escape') closeSpotlight();
        return;
    }

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            spotlightSelectedIndex = (spotlightSelectedIndex + 1) % currentSpotlightResults.length;
            updateSpotlightSelectionUI();
            break;
        case 'ArrowUp':
            e.preventDefault();
            spotlightSelectedIndex = (spotlightSelectedIndex - 1 + currentSpotlightResults.length) % currentSpotlightResults.length;
            updateSpotlightSelectionUI();
            break;
        case 'Enter':
            e.preventDefault();
            if (spotlightSelectedIndex >= 0 && currentSpotlightResults[spotlightSelectedIndex]) {
                currentSpotlightResults[spotlightSelectedIndex].action();
            }
            break;
        case 'Escape':
            e.preventDefault();
            closeSpotlight();
            break;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initSpotlightUI);