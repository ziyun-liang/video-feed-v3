document.addEventListener('DOMContentLoaded', () => {
    // Prevent browser from restoring scroll position
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);

    const containers = Array.from(document.querySelectorAll('.video-container'));
    const adContainer = document.querySelector('.ad-video');
    const adIndex = containers.indexOf(adContainer);
    let currentIndex = 0;
    let isAnimating = false;
    let adLock = false;
    let adCountdownTimer = null;
    let adLockShown = false;
    let adHoldTriggered = false;
    let globalMuted = true;
    const allVideos = containers.map(c => c.querySelector('video'));
    const allIcons = Array.from(document.querySelectorAll('.sound-toggle span'));
    let adHasBeenShown = false;

    // Always start on the first video
    function setToFirstVideo() {
        currentIndex = 0;
        containers.forEach((c, i) => {
            c.style.transform = `translateY(${(i - currentIndex) * 100}%)`;
        });
        if (currentIndex === adIndex) {
            lockAdSwipe();
        } else {
            unlockAdSwipe();
        }
    }
    function forceFirstVideo() {
        window.scrollTo(0, 0);
        setToFirstVideo();
    }
    // On DOMContentLoaded and pageshow, repeatedly reset for 500ms
    function robustFirstVideoReset() {
        let tries = 0;
        const maxTries = 10;
        function tryReset() {
            forceFirstVideo();
            tries++;
            if (tries < maxTries) {
                setTimeout(tryReset, 50);
            } else {
                // Reveal all videos after reset
                containers.forEach(c => c.classList.remove('hidden-on-load'));
                // Immediately check if ad is in view after reveal
                const adRect = adContainer.getBoundingClientRect();
                const vh = window.innerHeight || document.documentElement.clientHeight;
                if (
                    adRect.top < vh * 0.3 && // at least 30% of ad is visible
                    adRect.bottom > vh * 0.3 &&
                    !adHoldTriggered
                ) {
                    lockAdSwipe();
                    adHoldTriggered = true;
                }
                // After reveal, if ad is the current video, trigger ad-hold
                if (currentIndex === adIndex && !adHoldTriggered) {
                    lockAdSwipe();
                    adHoldTriggered = true;
                }
            }
        }
        tryReset();
    }
    document.addEventListener('DOMContentLoaded', robustFirstVideoReset);
    window.addEventListener('pageshow', robustFirstVideoReset);

    // Set up absolute positioning for all containers
    containers.forEach((c, i) => {
        c.style.position = 'absolute';
        c.style.top = '0';
        c.style.left = '0';
        c.style.width = '100%';
        c.style.height = '100%';
        c.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        c.style.transform = `translateY(${i * 100}%)`;
        c.style.zIndex = containers.length - i;
    });

    // Paging swipe logic
    let touchStartY = 0;
    let touchMoved = false;
    let gestureHandled = false;

    document.body.addEventListener('touchstart', (e) => {
        if (isAnimating) return;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
        gestureHandled = false;
    }, { passive: true });

    document.body.addEventListener('touchmove', (e) => {
        if (isAnimating) return;
        touchMoved = true;
    }, { passive: true });

    document.body.addEventListener('touchend', (e) => {
        if (isAnimating || !touchMoved || gestureHandled) return;
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        // If on ad video and adLock is true, block all swipes
        if (currentIndex === adIndex && adLock) {
            isAnimating = false;
            touchMoved = false;
            gestureHandled = true;
            return;
        }
        isAnimating = true;
        if (Math.abs(diff) > 40) {
            if (diff > 0 && currentIndex < containers.length - 1) {
                goToIndex(currentIndex + 1);
            } else if (diff < 0 && currentIndex > 0) {
                goToIndex(currentIndex - 1);
            } else {
                isAnimating = false;
            }
        } else {
            isAnimating = false;
        }
        touchMoved = false;
        gestureHandled = true;
    });

    // Mouse wheel support for desktop testing
    let wheelTimeout = null;
    document.body.addEventListener('wheel', (e) => {
        if (isAnimating) return;
        if (adLock && currentIndex === adIndex) return;
        clearTimeout(wheelTimeout);
        isAnimating = true;
        if (e.deltaY > 30 && currentIndex < containers.length - 1) {
            goToIndex(currentIndex + 1);
        } else if (e.deltaY < -30 && currentIndex > 0) {
            goToIndex(currentIndex - 1);
        } else {
            isAnimating = false;
        }
        wheelTimeout = setTimeout(() => {
            isAnimating = false;
        }, 400);
    });

    function goToIndex(index) {
        // If on ad and adLock is true, block all transitions
        if (currentIndex === adIndex && adLock) {
            isAnimating = false;
            return;
        }
        // Only allow one video per gesture
        if (Math.abs(index - currentIndex) > 1) {
            index = currentIndex + (index > currentIndex ? 1 : -1);
        }
        // Always allow scrolling back to previous videos
        if (index < currentIndex) {
            currentIndex = index;
            containers.forEach((c, i) => {
                c.style.transform = `translateY(${(i - currentIndex) * 100}%)`;
            });
            setTimeout(() => {
                isAnimating = false;
            }, 400);
            // If landing on ad video, trigger ad-hold if not already triggered (force for desktop)
            if (currentIndex === adIndex && !adHoldTriggered) {
                lockAdSwipe();
                adHoldTriggered = true;
            } else if (currentIndex === adIndex) {
                unlockAdSwipe();
            } else {
                unlockAdSwipe();
            }
            return;
        }
        // Forwards navigation
        currentIndex = index;
        containers.forEach((c, i) => {
            c.style.transform = `translateY(${(i - currentIndex) * 100}%)`;
        });
        setTimeout(() => {
            isAnimating = false;
        }, 400);
        // If landing on ad video, trigger ad-hold if not already triggered (force for desktop)
        if (currentIndex === adIndex && !adHoldTriggered) {
            lockAdSwipe();
            adHoldTriggered = true;
        } else if (currentIndex === adIndex) {
            unlockAdSwipe();
        } else {
            unlockAdSwipe();
        }
    }

    // Ad lock logic
    function lockAdSwipe() {
        adLock = true;
        // If ad has been shown before, hide divider and modal, skip 5s logic
        if (adHasBeenShown) {
            // Hide divider and modal every time
            const divider = adContainer.querySelector('.ad-divider');
            if (divider) divider.style.display = 'none';
            const skipModal = adContainer.querySelector('.ad-skip-modal');
            if (skipModal) skipModal.style.display = 'none';
            // Also hide old ad-countdown pill
            const countdownDiv = adContainer.querySelector('.ad-countdown');
            if (countdownDiv) countdownDiv.style.display = 'none';
            adLock = false;
            return;
        }
        adHasBeenShown = true;
        // Hide old ad-countdown pill
        const countdownDiv = adContainer.querySelector('.ad-countdown');
        countdownDiv.style.display = 'none';
        // Show divider and modal
        const divider = adContainer.querySelector('.ad-divider');
        if (divider) divider.style.display = 'block';
        const skipModal = adContainer.querySelector('.ad-skip-modal');
        const skipCountdown = skipModal.querySelector('.ad-skip-countdown');
        skipModal.classList.remove('active');
        skipModal.style.display = 'flex';
        let seconds = 5;
        skipCountdown.textContent = `Skip in ${seconds}`;
        if (adCountdownTimer) clearInterval(adCountdownTimer);
        adCountdownTimer = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                skipCountdown.textContent = `Skip in ${seconds}`;
                skipModal.classList.remove('active');
            } else {
                skipCountdown.textContent = 'Skip ↑';
                skipModal.classList.add('active');
                adLock = false;
                clearInterval(adCountdownTimer);
            }
        }, 1000);
        // Click handler for skip modal
        skipModal.onclick = function() {
            if (skipModal.classList.contains('active')) {
                goToIndex(adIndex + 1);
            }
        };
    }
    function unlockAdSwipe() {
        adLock = false;
        // Hide both countdown and modal
        const countdownDiv = adContainer.querySelector('.ad-countdown');
        countdownDiv.style.display = 'none';
        const skipModal = adContainer.querySelector('.ad-skip-modal');
        skipModal.style.display = 'none';
        // Always hide divider if adHasBeenShown
        const divider = adContainer.querySelector('.ad-divider');
        if (adHasBeenShown && divider) divider.style.display = 'none';
        if (adCountdownTimer) clearInterval(adCountdownTimer);
    }

    // Sound toggle logic
    function updateAllIconsAndVideos() {
        allVideos.forEach(video => {
            video.muted = globalMuted;
        });
        allIcons.forEach(icon => {
            icon.classList.remove('icon-muted', 'icon-sound');
            if (globalMuted) {
                icon.classList.add('icon-muted');
            } else {
                icon.classList.add('icon-sound');
            }
        });
    }

    document.querySelectorAll('.sound-toggle').forEach((btn, idx) => {
        // Set initial icon state globally
        updateAllIconsAndVideos();
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            globalMuted = !globalMuted;
            updateAllIconsAndVideos();
        });
    });

    // Intersection Observer for video playback
    const observer = new window.IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play();
            } else {
                video.pause();
            }
        });
    }, {
        threshold: 0.7
    });
    containers.forEach(container => {
        const video = container.querySelector('video');
        observer.observe(video);
    });

    // Intersection Observer for ad-hold (first time ad is in view)
    const adObserver = new window.IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !adHoldTriggered) {
                lockAdSwipe();
                adHoldTriggered = true;
            }
        });
    }, {
        threshold: 0.7
    });
    adObserver.observe(adContainer);

    // If starting on ad video, lock swipe
    if (currentIndex === adIndex) {
        lockAdSwipe();
    }
}); 