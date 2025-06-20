// Centralized video data array
const videoFeedData = [
  {
    videoSrc: "video5.mp4",
    title: "June 14, 2025",
    description: "Here are four summer books our editors are looking forward to.",
    isAd: false
  },
  {
    videoSrc: "video4.mp4",
    title: "June 15, 2025",
    description: "In Little Tokyo, business owners and locals feel conflicted, frustrated by protest cleanup but in solidarity with the anti-immigration raid cause.",
    isAd: false
  },
  {
    videoSrc: "video10.mp4",
    title: "June 13, 2025",
    description: "How does the NBA draft lottery actually work?",
    isAd: false
  },
  {
    videoSrc: "video3.mp4",
    title: "June 15, 2025",
    description: "McCormick Place, a convention center in Chicago, went from being a killer of migratory birds to a success story. Our reporter explains how.",
    isAd: false
  },
  {
    videoSrc: "video8.mp4",
    title: "June 15, 2025",
    description: "Smart leak detectors could save you thousands of dollars worth of damage by sensing a leak before it becomes a disaster.",
    isAd: false
  },
  {
    videoSrc: "ad.mp4",
    adMessage: "That's his name: Stitch! 💙 Lilo And Stitch is now playing in theaters!",
    adLogo: "disney-logo.png",
    adLabel: "AD",
    isAd: true
  },
  {
    videoSrc: "video7.mp4",
    title: "June 12, 2025",
    description: "Restaurant-worthy chicken at home?",
    isAd: false
  },
  {
    videoSrc: "video2.mp4",
    title: "June 16, 2025",
    description: "President Trump appointed Amy Coney Barrett to the Supreme Court to clinch a conservative legal revolution.",
    isAd: false
  },
  {
    videoSrc: "video6.mp4",
    title: "June 15, 2025",
    description: "For decades, research showed that happiness tended to be high when they were young, then dipped in midlife, only to rise again as they grew old.",
    isAd: false
  },
  {
    videoSrc: "video9.mp4",
    title: "June 10, 2025",
    description: "Jeff Goldblum's new album features his \"Wicked\" co-stars Ariana Grande and Cynthia Erivo.",
    isAd: false
  },
  {
    videoSrc: "video1.mp4",
    title: "June 17, 2025",
    description: "President Trump has lumped together violent and peaceful protesters when speaking about the demonstrations in Los Angeles.",
    isAd: false
  }
];

function renderVideoFeed() {
  const feed = document.getElementById('videoFeed');
  const playOverlay = `
    <div class="video-play-overlay hidden">
      <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="36" cy="36" r="36" fill="#000" fill-opacity="0.18"/>
        <g transform="translate(26, 20)">
          <path d="M27 14.2679C28.3333 15.0377 28.3333 16.9623 27 17.7321L3 31.5885C1.66667 32.3583 -1.54721e-06 31.396 -1.47991e-06 29.8564L-2.68545e-07 2.14359C-2.01247e-07 0.603992 1.66667 -0.35826 3 0.411541L27 14.2679Z" fill="#fff" fill-opacity="0.5"/>
        </g>
      </svg>
    </div>
  `;
  feed.innerHTML = videoFeedData.map((item, idx) => {
    if (item.isAd) {
      return `
        <div class="video-container ad-video hidden-on-load">
          <div class="ad-video-inner">
            <video data-src="${item.videoSrc}" loop muted playsinline preload="metadata"></video>
            ${playOverlay}
            <div class="ad-overlay-gradient">
              <div class="ad-info">
                <div class="ad-label">AD</div>
                <img class="ad-logo" src="disney-logo.png" alt="Disney Logo" />
                <p>${item.adMessage}</p>
                <button class="sound-toggle" aria-label="Toggle sound">
                  <span class="icon-muted"></span>
                </button>
              </div>
            </div>
          </div>
          <div class="ad-black-bar">
            <div class="ad-next-title-bar">
              <span class="ad-coming-next"><span class="ad-coming-next-label">Coming Next:</span> <span class="ad-coming-next-title">Make restaurant-worthy chicken</span></span>
              <span class="ad-countdown-circle"></span>
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="video-container">
        <video data-src="${item.videoSrc}" loop muted playsinline preload="metadata"></video>
        ${playOverlay}
        <button class="sound-toggle" aria-label="Toggle sound">
          <span class="icon-muted"></span>
        </button>
        <div class="video-info">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Lazy load videos using Intersection Observer
function setupVideoLazyLoading() {
  const videos = document.querySelectorAll('video[data-src]');
  const config = {
    root: null,
    rootMargin: '200px', // start loading a bit before in view
    threshold: 0.01
  };
  const onIntersection = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        if (!video.src) {
          video.src = video.getAttribute('data-src');
        }
        observer.unobserve(video);
      }
    });
  };
  const observer = new IntersectionObserver(onIntersection, config);
  videos.forEach(video => observer.observe(video));
}

document.addEventListener('DOMContentLoaded', () => {
  renderVideoFeed();
  setupVideoLazyLoading();
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

  // --- Global Tap-to-Pause Logic ---
  const manualPauseMap = new WeakMap(); // Track manual pause per video
  let pausedCountdownSeconds = null;
  let pausedCountdownActive = false;

  function getCurrentVideo() {
    return containers[currentIndex].querySelector('video');
  }

  function isAdCountdownActive() {
    // Only active if on ad, adLock is true, and skip modal is visible
    if (currentIndex !== adIndex) return false;
    const skipModal = adContainer.querySelector('.ad-skip-modal');
    return adLock && skipModal && skipModal.style.display === 'flex';
  }

  function pauseAdCountdown() {
    if (adCountdownTimer) {
      adCountdownPaused = true;
      cancelAnimationFrame(adCountdownTimer);
      adCountdownTimer = null;
      // Save elapsed time
      if (adCountdownStart) {
        adCountdownElapsed += (performance.now() - adCountdownStart) / 1000;
      }
    }
  }
  function resumeAdCountdown() {
    if (adCountdownPaused) {
      adCountdownPaused = false;
      adCountdownStart = performance.now();
      adCountdownTimer = requestAnimationFrame(function animateCountdown(ts) {
        if (adCountdownPaused) {
          adCountdownTimer = null;
          return;
        }
        const elapsed = adCountdownElapsed + (ts - adCountdownStart) / 1000;
        const current = Math.max(0, adCountdownTotal - elapsed);
        const progress = 1 - (current / adCountdownTotal);
        const secondsInt = Math.ceil(current);
        renderAdCountdown(secondsInt, adCountdownTotal, progress);
        if (current > 0.1) {
          adCountdownTimer = requestAnimationFrame(animateCountdown);
        } else {
          renderAdArrow();
          adLock = false;
        }
      });
    }
  }

  function handleTapPause(e) {
    // Prevent double event firing: ignore click on touch devices
    if (e.type === 'click' && 'ontouchstart' in window) {
      return;
    }
    // Only handle left click/tap
    if (e.type === 'click' && e.button !== undefined && e.button !== 0) return;
    // Get the container and video
    const container = e.currentTarget;
    const video = container.querySelector('video');
    // Find the overlay: for ads, it's inside .ad-video-inner; for regular, in .video-container
    let playOverlay = null;
    if (container.classList.contains('ad-video')) {
      const adInner = container.querySelector('.ad-video-inner');
      if (adInner) playOverlay = adInner.querySelector('.video-play-overlay');
    } else {
      playOverlay = container.querySelector('.video-play-overlay');
    }
    // Prevent if clicking on a button or control
    if (e.target.closest('.sound-toggle') || e.target.closest('.ad-skip-modal')) {
      return;
    }
    // Remove middle-third check: allow tap anywhere on container
    const isPausedByTap = manualPauseMap.get(video) || false;
    if (!isPausedByTap) {
      manualPauseMap.set(video, true);
      video.pause();
      if (playOverlay) playOverlay.classList.remove('hidden');
      // Directly check for ad and adLock for countdown sync
      if (currentIndex === adIndex && adLock) {
        pauseAdCountdown();
      }
      if (e.type === 'touchend') e.preventDefault();
    } else {
      manualPauseMap.set(video, false);
      video.play().catch(() => {});
      if (playOverlay) playOverlay.classList.add('hidden');
      // Directly check for ad and adLock for countdown sync
      if (currentIndex === adIndex && adLock) {
        resumeAdCountdown();
      }
      if (e.type === 'touchend') e.preventDefault();
    }
  }

  // Intersection Observer for video playback
  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      const isPausedByTap = manualPauseMap.get(video) || false;
      // Find the overlay: for ads, it's inside .ad-video-inner; for regular, in .video-container
      let playOverlay = null;
      const container = video.closest('.video-container');
      if (container && container.classList.contains('ad-video')) {
        const adInner = container.querySelector('.ad-video-inner');
        if (adInner) playOverlay = adInner.querySelector('.video-play-overlay');
      } else if (container) {
        playOverlay = container.querySelector('.video-play-overlay');
      }
      if (entry.isIntersecting) {
        if (!isPausedByTap) {
          video.play().catch(() => {});
          if (playOverlay) playOverlay.classList.add('hidden');
        } else {
          // Do not auto-play if manually paused
        }
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

  // Reset manual pause state when switching videos
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
      // Reset manual pause for all videos
      allVideos.forEach(v => manualPauseMap.set(v, false));
      // If landing on ad video, trigger ad-hold if not already triggered (force for desktop)
      if (currentIndex === adIndex && !adHoldTriggered) {
        lockAdSwipe();
        adHoldTriggered = true;
      } else if (currentIndex === adIndex) {
        // Ensure black bar is hidden and ad fills screen on revisit
        const blackBar = adContainer.querySelector('.ad-black-bar');
        if (blackBar) blackBar.style.display = 'none';
        const adInner = adContainer.querySelector('.ad-video-inner');
        if (adInner) adInner.style.height = '100dvh';
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
    // Reset manual pause for all videos
    allVideos.forEach(v => manualPauseMap.set(v, false));
    // If landing on ad video, trigger ad-hold if not already triggered (force for desktop)
    if (currentIndex === adIndex && !adHoldTriggered) {
      lockAdSwipe();
      adHoldTriggered = true;
    } else if (currentIndex === adIndex) {
      // Ensure black bar is hidden and ad fills screen on revisit
      const blackBar = adContainer.querySelector('.ad-black-bar');
      if (blackBar) blackBar.style.display = 'none';
      const adInner = adContainer.querySelector('.ad-video-inner');
      if (adInner) adInner.style.height = '100dvh';
      unlockAdSwipe();
    } else {
      unlockAdSwipe();
    }
  }

  // --- SVG Countdown and Arrow for Ad Black Bar ---
  function renderAdCountdown(secondsLeft, totalSeconds, progress) {
    const circle = adContainer.querySelector('.ad-countdown-circle');
    if (!circle) return;
    circle.innerHTML = '';
    const size = 26;
    const stroke = 2;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', size/2);
    bg.setAttribute('cy', size/2);
    bg.setAttribute('r', radius);
    bg.setAttribute('stroke', '#222');
    bg.setAttribute('stroke-width', stroke);
    bg.setAttribute('fill', 'none');
    svg.appendChild(bg);
    const fg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fg.setAttribute('cx', size/2);
    fg.setAttribute('cy', size/2);
    fg.setAttribute('r', radius);
    fg.setAttribute('stroke', '#DCDCDC');
    fg.setAttribute('stroke-width', stroke);
    fg.setAttribute('fill', 'none');
    fg.setAttribute('stroke-linecap', 'round');
    fg.setAttribute('transform', `rotate(-90 ${size/2} ${size/2})`);
    fg.setAttribute('stroke-dasharray', circumference);
    fg.setAttribute('stroke-dashoffset', progress * circumference);
    svg.appendChild(fg);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', size/2);
    text.setAttribute('y', size/2 + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', '#DCDCDC');
    text.setAttribute('font-family', 'inherit');
    text.textContent = secondsLeft;
    svg.appendChild(text);
    circle.appendChild(svg);
  }
  function renderAdArrow() {
    const circle = adContainer.querySelector('.ad-countdown-circle');
    if (!circle) return;
    circle.innerHTML = '';
    const size = 26;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M8 17 L13 11 L18 17');
    arrow.setAttribute('stroke', '#DCDCDC');
    arrow.setAttribute('stroke-width', '2');
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke-linecap', 'round');
    arrow.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(arrow);
    circle.appendChild(svg);
    circle.classList.add('ad-arrow-animate');
    setTimeout(() => {
      circle.classList.remove('ad-arrow-animate');
    }, 1200);
  }

  // Ad lock logic
  function lockAdSwipe() {
    adLock = true;
    // If ad has been shown before, hide black bar and use full height
    if (adHasBeenShown) {
      const blackBar = adContainer.querySelector('.ad-black-bar');
      if (blackBar) {
        blackBar.style.display = 'none';
        blackBar.style.cursor = 'default';
      }
      const adInner = adContainer.querySelector('.ad-video-inner');
      if (adInner) {
        // Use pixel height for better simulator compatibility
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        adInner.style.height = `${viewportHeight}px`;
      }
      return;
    }
    adHasBeenShown = true;
    // Show black bar and set ad container to short height
    const blackBar = adContainer.querySelector('.ad-black-bar');
    if (blackBar) {
      blackBar.style.display = 'flex';
      blackBar.style.cursor = 'default';
    }
    const adInner = adContainer.querySelector('.ad-video-inner');
    if (adInner) {
      // Use pixel calculation for better simulator compatibility
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const blackBarHeight = window.innerWidth <= 500 ? 48 : 80;
      adInner.style.height = `${viewportHeight - blackBarHeight}px`;
    }
    // Start SVG countdown (sync with video)
    adCountdownPaused = false;
    adCountdownElapsed = 0;
    adCountdownTotal = 5;
    adCountdownStart = performance.now();
    let lastRenderedSecond = null;
    function animateCountdown(ts) {
      if (adCountdownPaused) {
        adCountdownTimer = null;
        return;
      }
      const elapsed = adCountdownElapsed + (ts - adCountdownStart) / 1000;
      const current = Math.max(0, adCountdownTotal - elapsed);
      const progress = 1 - (current / adCountdownTotal);
      const secondsInt = Math.ceil(current);
      // Only update the number if it changed, but always update the circle
      renderAdCountdown(secondsInt, adCountdownTotal, progress);
      if (current > 0.1) {
        adCountdownTimer = requestAnimationFrame(animateCountdown);
      } else {
        renderAdArrow();
        adLock = false;
        // Make black bar clickable after countdown ends
        const blackBar = adContainer.querySelector('.ad-black-bar');
        if (blackBar) {
          blackBar.style.cursor = 'pointer';
        }
      }
    }
    if (adCountdownTimer) cancelAnimationFrame(adCountdownTimer);
    adCountdownTimer = requestAnimationFrame(animateCountdown);
  }
  function unlockAdSwipe() {
    adLock = false;
    // Hide both countdown and modal (legacy, safe to keep for now)
    const countdownDiv = adContainer.querySelector('.ad-countdown');
    if (countdownDiv) countdownDiv.style.display = 'none';
    const skipModal = adContainer.querySelector('.ad-skip-modal');
    if (skipModal) skipModal.style.display = 'none';
    if (adCountdownTimer) cancelAnimationFrame(adCountdownTimer);
  }

  // Attach to each .video-container instead of <video>
  containers.forEach(container => {
    container.addEventListener('click', handleTapPause);
    container.addEventListener('touchend', handleTapPause);
  });

  // --- Ad Countdown Sync State ---
  let adCountdownPaused = false;
  let adCountdownElapsed = 0;
  let adCountdownStart = null;
  let adCountdownTotal = 5;
}); 