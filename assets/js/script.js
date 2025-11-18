// Open modal
function openModal() {
  document.getElementById("modal").style.display = "flex";

  // Close mobile menu if it's open
  const mobileMenu = document.getElementById("mobileMenu");
  gsap.to(mobileMenu, {
    left: "-100%",
    duration: 0.6,
    ease: "power3.in",
  });
}

// Close modal
function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// Close modal when clicking outside of it
window.addEventListener("click", function (event) {
  let modal = document.getElementById("modal");
  if (event.target === modal) {
    closeModal();
  }
});

let player;
let isVideoStarted = false; // Prevent multiple triggers
let isPlaying = false; // Track video state

function onYouTubeIframeAPIReady() {
  player = new YT.Player("youtubeFrame", {
    events: {
      onReady: function (event) {
        player = event.target;
      }
    }
  });
}

function toggleVideo() {
  if (!isVideoStarted) {
    isVideoStarted = true;
    document.getElementById("thumbnail").style.display = "none";
    document.getElementById("youtubeFrame").style.display = "block";
    document.querySelector(".youtubeplaybtn").style.display = "none";
  }

  if (isPlaying) {
    player.pauseVideo();
    document.getElementById("playButton").style.display = "inline-block";
    document.getElementById("pauseButton").style.display = "none";
  } else {
    player.playVideo();
    document.getElementById("playButton").style.display = "none";
    document.getElementById("pauseButton").style.display = "inline-block";
  }

  isPlaying = !isPlaying; // Toggle play/pause state
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".video-controls").addEventListener("click", toggleVideo);
  document.getElementById("thumbnail").addEventListener("click", toggleVideo);
  document.querySelector(".youtubeplaybtn").addEventListener("click", toggleVideo);
});

// Load YouTube API
(function loadYouTubeAPI() {
  let tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  let firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
})();



// GSAP Mobile Menu Animation
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeMenu = document.getElementById("closeMenu");
  const modalButton = document.getElementById("modalButton"); 

  function openMenu() {
    gsap.to(mobileMenu, {
      left: "0%",
      duration: 0.5,
      ease: "power3.out",
      opacity: 1,
    });
  }

  function closeMenuFunc() {
    gsap.to(mobileMenu, {
      left: "-100%",
      duration: 0.5,
      opacity: 0,
      ease: "power3.in",
    });
  }

  hamburger?.addEventListener("click", openMenu);
  closeMenu?.addEventListener("click", closeMenuFunc);

  // Ensure the menu closes when opening the modal
  modalButton?.addEventListener("click", openModal);

  // Smooth scrolling + Auto-close menu when clicking mobile links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        closeMenuFunc(); // Close menu first
        setTimeout(() => {
          window.scrollTo({
            top: target.offsetTop - 50, // Adjust for any fixed headers
            behavior: "smooth",
          });
        }, 500); // Wait 0.5s for the menu to close
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const track = document.querySelector(".slides-track");
  if (!track) return;
  let originalSlides = Array.from(track.children);
  const dots = Array.from(document.querySelectorAll(".slider-dots .dot"));
  let selected = 1; // Start with center slide (index 1) active
  let timer;
  let isTransitioning = false;

  // Clone slides for infinite loop (only on desktop)
  const getSlidesPerView = () => {
    if (window.matchMedia("(max-width: 767px)").matches) return 1; // mobile
    if (window.matchMedia("(max-width: 1024px)").matches) return 2; // tablet
    return 3; // desktop
  };

  const setupInfiniteLoop = () => {
    const spv = getSlidesPerView();
    if (spv === 3 && originalSlides.length === 3) {
      // Clone last slide to beginning and first slide to end for seamless loop
      const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
      const firstClone = originalSlides[0].cloneNode(true);
      lastClone.classList.add('clone', 'clone-start');
      firstClone.classList.add('clone', 'clone-end');
      track.insertBefore(lastClone, originalSlides[0]);
      track.appendChild(firstClone);
    }
  };

  setupInfiniteLoop();
  const slides = Array.from(track.children);
  const realSlides = slides.filter(s => !s.classList.contains('clone'));

  const getGap = () => {
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.gap || styles.columnGap || 0);
    return isNaN(gap) ? 0 : gap;
  };

  const activateDot = (i) => {
    dots.forEach((d) => d.classList.toggle("active", Number(d.dataset.index) === i));
  };

  const activateSlideClass = (i) => {
    realSlides.forEach((s, idx) => s.classList.toggle("active", idx === i));
  };

  const computeFrameIndex = (targetSlideIdx) => {
    const spv = getSlidesPerView();
    if (slides.length <= spv) return 0; // nothing to scroll
    
    // For desktop (3 slides visible), center the target slide
    if (spv === 3) {
      // Center slide: show target-1, target, target+1
      // For slide 0: show 0,1,2 (frame 0)
      if (targetSlideIdx === 0) return 0;
      // For slide 1: show 0,1,2 (frame 0) - center is at index 1
      if (targetSlideIdx === 1) return 0;
      // For slide 2: show 0,1,2 (frame 0) - but we want to center slide 2
      // Actually, with 3 slides total, we can only show one frame: 0,1,2
      // So we need to center by adjusting the offset within the frame
      return 0; // Always show frame 0 for 3 slides
    }
    
    // For mobile/tablet, go directly to that slide
    const maxFrame = slides.length - spv;
    return Math.min(targetSlideIdx, maxFrame);
  };

  const goToSlide = (i, smooth = true) => {
    if (isTransitioning) return;
    
    // Normalize index for real slides
    if (i < 0) i = realSlides.length - 1;
    if (i >= realSlides.length) i = 0;
    
    selected = i;
    const spv = getSlidesPerView();
    
    if (spv === 3 && realSlides.length === 3) {
      // For desktop with 3 slides - always show all 3 real slides
      // Structure: [clone-last (index 0), real-0 (index 1), real-1 (index 2), real-2 (index 3), clone-first (index 4)]
      const gap = getGap();
      
      // Get the first clone (index 0) - this is the clone of the last slide
      const firstClone = slides[0];
      const firstCloneWidth = firstClone.getBoundingClientRect().width;
      
      // Calculate offset: move track left by clone width + gap
      // This positions the first real slide (index 1) at the left edge of container
      const offsetNeeded = firstCloneWidth + gap;
      
      // Apply transition
      if (smooth) {
        track.style.transition = 'transform 0.6s ease-in-out';
      } else {
        track.style.transition = 'none';
      }
      
      // Position track to show all 3 real slides
      track.style.transform = `translateX(-${offsetNeeded}px)`;
      isTransitioning = false;
    } else {
      // For mobile/tablet or other cases
    const frameIndex = computeFrameIndex(selected);
    const slideWidth = slides[0].getBoundingClientRect().width;
      const gap = getGap();
      const offset = frameIndex * (slideWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
      isTransitioning = false;
    }
    
    activateDot(selected);
    activateSlideClass(selected);
  };

  const next = () => {
    const nextIndex = (selected + 1) % realSlides.length;
    goToSlide(nextIndex);
  };
  
  const start = () => (timer = setInterval(next, 4000));
  const stop = () => clearInterval(timer);

  const restart = () => {
    stop();
    start();
  };

  dots.forEach((btn) => {
    btn.addEventListener("click", () => {
      goToSlide(Number(btn.dataset.index));
      restart();
    });
  });

  window.addEventListener("resize", () => {
    setTimeout(() => goToSlide(selected, false), 100);
  });

  // Initialize with center slide (index 1) - no smooth transition on load
  setTimeout(() => {
    goToSlide(1, false);
  start();
  }, 100);
});

// Animate Healthcode banner when in view
document.addEventListener("DOMContentLoaded", function () {
  const card = document.querySelector(".hc-card");
  if (!card || typeof gsap === 'undefined') return;

  // Initial states
  gsap.set(card, {opacity: 0, y: 40});
  const parts = Array.from(card.querySelectorAll('.hc-logo, .hc-kicker, .hc-title, .hc-desc, .hc-callout, .last-img'));
  if (parts.length) gsap.set(parts, {opacity: 0, y: 20});

  const reveal = () => {
    const tl = gsap.timeline();
    tl.to(card, {opacity: 1, y: 0, duration: 0.8, ease: 'power2.out'});
    const logo = card.querySelector('.hc-logo');
    if (logo) tl.to(logo, {opacity: 1, y: 0, duration: 0.4, ease: 'power2.out'}, '-=0.2');
    const titles = card.querySelectorAll('.hc-kicker, .hc-title');
    if (titles.length) tl.to(titles, {opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out'});
    const desc = card.querySelector('.hc-desc');
    if (desc) tl.to(desc, {opacity: 1, y: 0, duration: 0.5, ease: 'power2.out'}, '-=0.1');
    const lastImg = card.querySelector('.last-img');
    if (lastImg) tl.to(lastImg, {opacity: 1, y: 0, duration: 0.5, ease: 'power2.out'}, '-=0.2');
  };

  // Intersection observer trigger
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reveal();
        io.disconnect();
      }
    });
  }, {threshold: 0.25});

  io.observe(card);
});

// Products carousel: auto-loop scroll snapping with featured centered on load
document.addEventListener("DOMContentLoaded", function () {
  const track = document.getElementById('productsTrack');
  if (!track) return;

  // Helper to get full card width including gap
  const cardEls = Array.from(track.children);
  if (!cardEls.length) return;

  const getGap = () => parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 0;
  const cardWidth = () => cardEls[0].getBoundingClientRect().width + getGap();

  // Duplicate a few cards at end for seamless scroll
  const clonesCount = Math.min(5, cardEls.length);
  for (let i = 0; i < clonesCount; i++) {
    track.appendChild(cardEls[i].cloneNode(true));
  }

  // Active slide helper: mark card nearest container center
  const updateActive = () => {
    const cards = Array.from(track.children);
    if (!cards.length) return;
    const rect = track.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    let best = null;
    let bestDist = Infinity;
    cards.forEach(card => {
      const r = card.getBoundingClientRect();
      const cardCenter = r.left + r.width / 2;
      const dist = Math.abs(cardCenter - centerX);
      if (dist < bestDist) { bestDist = dist; best = card; }
    });
    cards.forEach(c => c.classList.remove('active'));
    if (best) best.classList.add('active');
  };

  // Center featured card on load
  const featured = track.querySelector('.prod-card.featured');
  const centerFeatured = () => {
    if (!featured) return;
    const containerWidth = track.parentElement.getBoundingClientRect().width;
    const offsetLeft = featured.offsetLeft;
    const desired = Math.max(0, offsetLeft - (containerWidth - featured.getBoundingClientRect().width) / 2);
    track.scrollTo({ left: desired, behavior: 'instant' in window ? 'instant' : 'auto' });
  };
  // initial center after paint
  setTimeout(centerFeatured, 100);
  window.addEventListener('resize', () => setTimeout(centerFeatured, 150));

  // Auto loop
  let autoTimer;
  const step = () => {
    const w = cardWidth();
    const max = track.scrollWidth - track.clientWidth;
    let next = track.scrollLeft + w;
    if (next >= max - w) {
      // Jump back smoothly: go to start after small delay
      track.scrollTo({ left: 0, behavior: 'auto' });
      next = 0;
    } else {
      track.scrollTo({ left: next, behavior: 'smooth' });
    }
    // After moving, update active (scroll event will also fire)
    updateActive();
  };
  const startLoop = () => (autoTimer = setInterval(step, 2500));
  const stopLoop = () => clearInterval(autoTimer);
  startLoop();

  // Pause on hover/touch
  track.addEventListener('mouseenter', stopLoop);
  track.addEventListener('mouseleave', startLoop);
  track.addEventListener('touchstart', stopLoop, { passive: true });
  track.addEventListener('touchend', startLoop, { passive: true });

  // Update active on scroll (throttled via rAF)
  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateActive(); ticking = false; });
  }, { passive: true });

  // Initial active after paint
  setTimeout(updateActive, 120);
});

// Flip card toggle for products
document.addEventListener("DOMContentLoaded", function () {
  const productsTrack = document.getElementById('productsTrack');
  if (!productsTrack) return;

  productsTrack.addEventListener('click', function (e) {
    const flip = e.target.closest('.flip');
    if (!flip || !productsTrack.contains(flip)) return;
    const card = flip.closest('.prod-card');
    if (!card) return;
    card.classList.toggle('is-flipped');
  });
});

// slick slider js

(function(){
  // Settings
  const VISIBLE = 3;           // number of slides visible at once (desktop)
  const AUTOPLAY_MS = 3000;
  const TRANSITION_MS = 500;
  const GAP_PX = 18;           // must match CSS .sk-track gap

  // Elements
  const track = document.getElementById('skTrack');
  const dotsWrap = document.getElementById('skDots');

  // Grab original slides (3)
  const origSlides = Array.from(track.querySelectorAll('.sk-slide'));
  const UNIQUE_COUNT = origSlides.length; // should be 3

  // Build clones: prepend last VISIBLE slides, append first VISIBLE slides
  const prependClones = [];
  const appendClones = [];

  // if UNIQUE_COUNT < VISIBLE, we still clone in circular manner
  function getIndexWrapped(i){
    return ((i % UNIQUE_COUNT) + UNIQUE_COUNT) % UNIQUE_COUNT;
  }

  for (let i = VISIBLE - 1; i >= 0; i--){
    const idx = getIndexWrapped(i - (VISIBLE - 1));
    const clone = origSlides[idx].cloneNode(true);
    clone.classList.add('sk-clone');
    prependClones.push(clone);
  }
  for (let i = 0; i < VISIBLE; i++){
    const idx = getIndexWrapped(i);
    const clone = origSlides[idx].cloneNode(true);
    clone.classList.add('sk-clone');
    appendClones.push(clone);
  }

  // Prepend and append clones into track
  prependClones.forEach(c => track.insertBefore(c, track.firstChild));
  appendClones.forEach(c => track.appendChild(c));

  // Now compute full slide list
  let allSlides = Array.from(track.querySelectorAll('.sk-slide')); // includes clones

  // Build dots (one per unique slide)
  for (let i = 0; i < UNIQUE_COUNT; i++){
    const d = document.createElement('div');
    d.className = 'sk-dot' + (i === 0 ? ' active' : '');
    d.dataset.index = i;
    dotsWrap.appendChild(d);
  }
  const dots = Array.from(dotsWrap.querySelectorAll('.sk-dot'));

  // State
  // start at the first original slide -> its index in allSlides is prependClones.length
  let currentIndex = prependClones.length; // integer index into allSlides
  let isAnimating = false;
  let autoplayTimer = null;

  // Helpers to get slide width including gap in px
  function getSlideWidthPx(){
    // each slide flex-basis computed; measure first visible slide width
    const slideEl = allSlides[currentIndex];
    if (!slideEl) return 0;
    const style = window.getComputedStyle(slideEl);
    const w = slideEl.getBoundingClientRect().width;
    // gap in track: use GAP_PX
    return w + GAP_PX;
  }

  // Apply transform to move to currentIndex
  function moveToIndex(index, withTransition = true){
    if (withTransition){
      track.style.transition = `transform ${TRANSITION_MS}ms ease`;
    } else {
      track.style.transition = 'none';
    }

    const slideW = getSlideWidthPx();
    const offset = index * slideW;
    track.style.transform = `translateX(-${offset}px)`;
    currentIndex = index;
    updateDots();
  }

  // Dots update: active dot corresponds to current original slide
  function updateDots(){
    // map currentIndex -> active unique index
    const realIndex = (currentIndex - prependClones.length) % UNIQUE_COUNT;
    const idx = (realIndex + UNIQUE_COUNT) % UNIQUE_COUNT;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  // After move, if we are on clones boundary, jump without transition
  function handleTransitionEnd(){
    const total = allSlides.length;
    // if we've moved past appended clones (to the right boundary)
    if (currentIndex >= total - VISIBLE){
      // jump to the same visual slide in the original area
      const newIndex = currentIndex - UNIQUE_COUNT;
      moveToIndex(newIndex, false);
    }
    // if we've moved to before the prepend clones (to the left)
    else if (currentIndex < prependClones.length){
      const newIndex = currentIndex + UNIQUE_COUNT;
      moveToIndex(newIndex, false);
    }
    isAnimating = false;
  }

  track.addEventListener('transitionend', handleTransitionEnd);

  // Auto-play move by one slide
  function nextSlide(){
    if (isAnimating) return;
    isAnimating = true;
    moveToIndex(currentIndex + 1, true);
  }

  function prevSlide(){
    if (isAnimating) return;
    isAnimating = true;
    moveToIndex(currentIndex - 1, true);
  }

  // Start autoplay
  function startAutoplay(){
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS);
  }
  function stopAutoplay(){
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  // Dots click
  dots.forEach(d => {
    d.addEventListener('click', () => {
      const targetUnique = Number(d.dataset.index);
      // compute index in allSlides that corresponds to that unique slide in the original block
      const targetIndex = prependClones.length + targetUnique;
      isAnimating = true;
      moveToIndex(targetIndex, true);
      startAutoplay();
    });
  });

  // Resize handler: recalc slide widths and reposition without transition
  window.addEventListener('resize', () => {
    // recompute allSlides in case of style changes
    allSlides = Array.from(track.querySelectorAll('.sk-slide'));
    moveToIndex(currentIndex, false);
  });

  // Init: ensure track has proper transform and start autoplay
  // Wait a tick so layout is stable
  setTimeout(() => {
    allSlides = Array.from(track.querySelectorAll('.sk-slide'));
    // position to first real slides
    moveToIndex(currentIndex, false);
    startAutoplay();
  }, 50);

  // Pause on hover
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);

  // Optional: touch support (basic swipe)
  (function addTouch(){
    let startX = 0, dx = 0, touching = false;
    track.addEventListener('touchstart', (e) => {
      stopAutoplay();
      touching = true;
      startX = e.touches[0].clientX;
      track.style.transition = 'none';
    }, {passive:true});
    track.addEventListener('touchmove', (e) => {
      if(!touching) return;
      dx = e.touches[0].clientX - startX;
      const slideW = getSlideWidthPx();
      const baseOffset = currentIndex * slideW;
      track.style.transform = `translateX(${ -baseOffset + dx }px)`;
    }, {passive:true});
    track.addEventListener('touchend', (e) => {
      touching = false;
      const threshold = getSlideWidthPx() * 0.15;
      if (dx < -threshold) {
        nextSlide();
      } else if (dx > threshold) {
        prevSlide();
      } else {
        moveToIndex(currentIndex, true);
      }
      dx = 0;
      startAutoplay();
    });
  })();

})();
