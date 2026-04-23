// Global listener for keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        isTabKeyDown = true;
    }

    // Universal Keyboard Shortcuts
    if (e.code === 'Space') {
        // App Switcher: Tab + Space
        if (isTabKeyDown) {
            e.preventDefault();
            if (!appSwitcherVisible) {
                openAppSwitcher();
            } else {
                updateSwitcherSelection(appSwitcherIndex + 1);
            }
        } 
        // Home/Drawer & Controls Sequence: Shift + Space
        else if (e.shiftKey) {
            e.preventDefault();
            if (shiftSpaceSequenceTimer) {
                clearTimeout(shiftSpaceSequenceTimer);
            }
            // Set a timer to trigger Home/Drawer action if E is not pressed soon.
            shiftSpaceSequenceTimer = setTimeout(() => {
                openSpotlight();
                shiftSpaceSequenceTimer = null;
            }, 250);
        }
    }

    // Controls Sequence: E (after Shift+Space)
    if (e.key.toLowerCase() === 'e' && shiftSpaceSequenceTimer) {
        e.preventDefault();
        clearTimeout(shiftSpaceSequenceTimer);
        shiftSpaceSequenceTimer = null;

        const customizeModal = document.getElementById('customizeModal');
        if (customizeModal.classList.contains('show')) {
            closeControls();
        } else {
            document.getElementById('persistent-clock').click();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Tab') {
        if (appSwitcherVisible) {
            selectAndCloseAppSwitcher();
        }
        isTabKeyDown = false;
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
		closeControls();
    }
});