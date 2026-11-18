const root = document.documentElement;
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menu");
      navigation.classList.remove("is-open");
    });
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const whatsapp = document.body.dataset.whatsapp;
const email = document.body.dataset.email;
const emailLink = document.querySelector(".contact-email");
if (whatsapp) {
  const message = "Olá, Daniel! Vi seu portfólio e gostaria de conversar sobre um site para o meu negócio.";
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    link.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  });
}
if (email && emailLink) emailLink.href = `mailto:${email}`;

/* ---------- Starfield: fixed background behind the whole site ---------- */
(() => {
  const canvas = document.querySelector(".starfield");
  const ctx = canvas?.getContext?.("2d");
  if (!ctx) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)").matches;
  // far → near: near stars are bigger, brighter and drift faster with the scroll (parallax)
  const layers = [
    { depth: 0.03, size: [0.5, 1.1], alpha: [0.25, 0.6], share: 1 },
    { depth: 0.08, size: [0.8, 1.5], alpha: [0.35, 0.8], share: 0.45 },
    { depth: 0.16, size: [1.2, 2.1], alpha: [0.55, 1], share: 0.14 }
  ];
  const tints = ["#ffffff", "#fff4e2", "#ffe2aa", "#ffc478", "#fff9f0"];
  const rand = (min, max) => min + Math.random() * (max - min);
  let stars = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let last = 0;
  let meteor = null;
  let nextMeteor = performance.now() + rand(3000, 7000);

  // soft warm halo drawn behind the brightest stars
  const halo = document.createElement("canvas");
  halo.width = halo.height = 32;
  const haloCtx = halo.getContext("2d");
  const haloGradient = haloCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  haloGradient.addColorStop(0, "rgba(255,240,215,.85)");
  haloGradient.addColorStop(0.25, "rgba(255,190,110,.3)");
  haloGradient.addColorStop(1, "rgba(255,145,40,0)");
  haloCtx.fillStyle = haloGradient;
  haloCtx.fillRect(0, 0, 32, 32);

  const build = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const base = (width * height) / (lite ? 4200 : 2600);
    stars = [];
    layers.forEach((layer, index) => {
      for (let i = 0; i < Math.round(base * layer.share); i += 1) {
        stars.push({
          x: Math.random() * width, y: Math.random() * height,
          r: rand(...layer.size), a: rand(...layer.alpha), depth: layer.depth,
          speed: rand(0.4, 1.7), phase: rand(0, Math.PI * 2),
          color: Math.random() < 0.75 ? tints[Math.random() < 0.5 ? 0 : 1] : tints[2 + Math.floor(Math.random() * 3)],
          halo: index === 2 && Math.random() < 0.4
        });
      }
    });
  };

  const drawMeteor = (time, delta) => {
    if (!meteor && time > nextMeteor) {
      const angle = rand(0.35, 0.65) * (Math.random() < 0.5 ? 1 : -1) + Math.PI / 2;
      meteor = { x: rand(width * 0.15, width * 0.85), y: rand(0, height * 0.35), vx: Math.cos(angle) * 900, vy: Math.sin(angle) * 900, life: 0, span: rand(0.7, 1.1) };
    }
    if (!meteor) return;
    meteor.life += delta;
    meteor.x += meteor.vx * delta;
    meteor.y += meteor.vy * delta;
    const progress = meteor.life / meteor.span;
    if (progress >= 1) { meteor = null; nextMeteor = time + rand(6000, 13000); return; }
    const fade = Math.sin(progress * Math.PI);
    const tailX = meteor.x - meteor.vx * 0.16;
    const tailY = meteor.y - meteor.vy * 0.16;
    const trail = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
    trail.addColorStop(0, `rgba(255,236,200,${0.9 * fade})`);
    trail.addColorStop(0.3, `rgba(255,160,70,${0.35 * fade})`);
    trail.addColorStop(1, "rgba(255,145,40,0)");
    ctx.globalAlpha = 1;
    ctx.strokeStyle = trail;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
  };

  const draw = (time, delta) => {
    ctx.clearRect(0, 0, width, height);
    const scroll = still ? 0 : window.scrollY;
    const seconds = time / 1000;
    for (const star of stars) {
      let y = (star.y - scroll * star.depth) % height;
      if (y < 0) y += height;
      const alpha = star.a * (still ? 1 : 0.6 + 0.4 * Math.sin(seconds * star.speed + star.phase));
      if (star.halo) {
        const size = star.r * 8;
        ctx.globalAlpha = alpha * 0.7;
        ctx.drawImage(halo, star.x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      if (star.r < 1.2) {
        ctx.fillRect(star.x - star.r / 2, y - star.r / 2, star.r, star.r);
      } else {
        ctx.beginPath();
        ctx.arc(star.x, y, star.r / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (!still && !lite) drawMeteor(time, delta);
    ctx.globalAlpha = 1;
  };

  // phones redraw at ~30 fps to save battery
  const minGap = lite ? 1000 / 30 : 0;
  const loop = (time) => {
    frame = requestAnimationFrame(loop);
    if (time - last < minGap) return;
    const delta = Math.min((time - last) / 1000, 0.1);
    last = time;
    draw(time, delta);
  };
  const start = () => { if (!frame && !still) { last = performance.now(); frame = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };

  build();
  draw(performance.now(), 0);
  start();

  let builtWidth = width;
  let builtHeight = height;
  window.addEventListener("resize", () => {
    // ignore the small height changes of mobile address bars
    if (canvas.clientWidth === builtWidth && Math.abs(canvas.clientHeight - builtHeight) < 150) return;
    build();
    builtWidth = width;
    builtHeight = height;
    draw(performance.now(), 0);
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
})();

/* ---------- Carousel ---------- */
const carousel = document.querySelector("[data-carousel]");
if (carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const slides = [...carousel.querySelectorAll("[data-slide]")];
  const dots = [...carousel.querySelectorAll("[data-carousel-dot]")];
  const previous = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  const viewport = carousel.querySelector(".carousel-viewport");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const video = carousel.querySelector("[data-demo-video]");
  const videoSlide = video ? slides.indexOf(video.closest("[data-slide]")) : -1;
  const videoToggle = carousel.querySelector("[data-video-toggle]");
  const videoProgress = carousel.querySelector("[data-video-progress]");
  let activeIndex = 0;
  let timer;
  let touchStartX = null;
  let carouselInView = false;
  let videoPausedByUser = false;

  /* Demo video: plays only while its slide is showing and the carousel is on screen */
  const syncVideo = () => {
    if (!video) return;
    const shouldPlay = activeIndex === videoSlide && carouselInView && !videoPausedByUser && !reducedMotion.matches && !document.hidden;
    if (shouldPlay && video.paused) video.play().catch(() => {});
    if (!shouldPlay && !video.paused) video.pause();
  };
  const paintProgress = () => {
    if (!video || !videoProgress) return;
    const ratio = video.duration ? video.currentTime / video.duration : 0;
    videoProgress.style.transform = `scaleX(${ratio})`;
    if (!video.paused) requestAnimationFrame(paintProgress);
  };

  const showSlide = (index) => {
    const previousIndex = activeIndex;
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    slides.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", String(i !== activeIndex));
      slide.inert = i !== activeIndex;
    });
    dots.forEach((dot, i) => {
      const active = i === activeIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", String(active));
    });
    if (video && activeIndex === videoSlide && previousIndex !== videoSlide) {
      video.currentTime = 0;
      videoPausedByUser = false;
    }
    syncVideo();
  };

  const stopAutoplay = () => window.clearInterval(timer);
  const startAutoplay = () => {
    stopAutoplay();
    // the video slide advances by itself when the recording ends
    if (activeIndex === videoSlide) return;
    if (!reducedMotion.matches && !document.hidden) timer = window.setInterval(() => showSlide(activeIndex + 1), 7000);
  };

  if (video) {
    video.addEventListener("play", () => {
      carousel.classList.add("is-video-playing");
      videoToggle?.setAttribute("aria-label", "Pausar vídeo");
      requestAnimationFrame(paintProgress);
    });
    video.addEventListener("pause", () => {
      carousel.classList.remove("is-video-playing");
      videoToggle?.setAttribute("aria-label", "Reproduzir vídeo");
      paintProgress();
    });
    video.addEventListener("ended", () => { showSlide(activeIndex + 1); startAutoplay(); });
    videoToggle?.addEventListener("click", () => {
      if (video.paused) {
        videoPausedByUser = false;
        if (video.ended) video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        videoPausedByUser = true;
        video.pause();
      }
    });
    const loadVideo = () => {
      if (video.getAttribute("src")) return;
      const small = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
      video.src = (small && video.dataset.srcMobile) || video.dataset.src;
      video.preload = "auto";
    };
    if ("IntersectionObserver" in window) {
      const nearObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { loadVideo(); nearObserver.disconnect(); }
      }, { rootMargin: "600px 0px" });
      nearObserver.observe(carousel);
      new IntersectionObserver(([entry]) => {
        carouselInView = entry.isIntersecting;
        if (carouselInView) loadVideo();
        syncVideo();
      }, { threshold: 0.35 }).observe(carousel);
    } else {
      loadVideo();
      carouselInView = true;
    }
  }

  previous?.addEventListener("click", () => { showSlide(activeIndex - 1); startAutoplay(); });
  next?.addEventListener("click", () => { showSlide(activeIndex + 1); startAutoplay(); });
  dots.forEach((dot, i) => dot.addEventListener("click", () => { showSlide(i); startAutoplay(); }));
  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) startAutoplay();
  });
  document.addEventListener("visibilitychange", () => { startAutoplay(); syncVideo(); });
  reducedMotion.addEventListener?.("change", startAutoplay);
  viewport?.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  viewport?.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) {
      showSlide(activeIndex + (distance < 0 ? 1 : -1));
      startAutoplay();
    }
    touchStartX = null;
  }, { passive: true });

  showSlide(0);
  startAutoplay();
}

/* ---------- Motion (GSAP + ScrollTrigger + Lenis) ---------- */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const motionLibsReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

if (prefersReducedMotion || !motionLibsReady) {
  root.classList.remove("motion");
} else {
  initMotion();
}

/* Wrap every word of an element in spans, keeping nested elements (e.g. the gradient accent). */
function splitWords(element, wordClass, innerClass) {
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(" ")); return; }
          const word = document.createElement("span");
          word.className = wordClass;
          if (innerClass) {
            const inner = document.createElement("span");
            inner.className = innerClass;
            inner.textContent = part;
            word.appendChild(inner);
            words.push(inner);
          } else {
            word.textContent = part;
            words.push(word);
          }
          fragment.appendChild(word);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(element);
  return words;
}

function initMotion() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // Phones / touch devices (incl. Instagram's in-app browser) get the same story with cheaper effects:
  // native scroll, no clip-path repaints, CSS-driven marquee.
  const lite = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)").matches;
  const header = document.querySelector(".site-header");
  // Android shows/hides the address bar while scrolling; don't recalculate everything on each of those resizes.
  ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });

  /* Smooth scroll (desktop only — touch keeps the phone's own native scroll) */
  let lenis = null;
  if (!lite && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* Header: hide on scroll down, show on scroll up */
  let headerLocked = false;
  let lastScroll = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const goingDown = y > lastScroll;
    if (header && !headerLocked && !navigation?.classList.contains("is-open")) {
      header.classList.toggle("is-hidden", goingDown && y > 420);
    }
    lastScroll = y;
  };
  if (lenis) lenis.on("scroll", onScroll); else window.addEventListener("scroll", onScroll, { passive: true });

  // Bring every scroll-driven state (hero, header, reveals) in line with where the page really is.
  // Runs whenever a scroll settles, so a jump that skipped the usual events can't leave things half-animated.
  let unlockTimer = 0;
  const settle = () => {
    clearTimeout(unlockTimer);
    headerLocked = false;
    lastScroll = window.scrollY;
    if (lastScroll <= 420) header?.classList.remove("is-hidden");
    ScrollTrigger.update();
    // if any scroll animation still disagrees with the real position (a missed scroll event), rebuild them all
    const y = window.scrollY;
    const stale = ScrollTrigger.getAll().some((trigger) => {
      if (trigger.end <= trigger.start) return false;
      const expected = Math.min(1, Math.max(0, (y - trigger.start) / (trigger.end - trigger.start)));
      return Math.abs(expected - trigger.progress) > 0.02;
    });
    if (stale) ScrollTrigger.refresh();
  };
  if ("onscrollend" in window) {
    window.addEventListener("scrollend", () => { if (!lenis || !lenis.isScrolling) settle(); });
  }

  /* In-page anchors glide with Lenis */
  if (lenis) {
    document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((link) => {
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        const target = hash.length > 1 ? document.querySelector(hash) : null;
        if (!target) return;
        event.preventDefault();
        headerLocked = true;
        header?.classList.remove("is-hidden");
        // the hero is the top of the page: go to exactly 0 instead of an element offset
        const toTop = target.id === "inicio";
        lenis.scrollTo(toTop ? 0 : target, { offset: toTop ? 0 : -84, duration: 1.5, force: true, onComplete: settle });
        // if the glide gets interrupted (wheel, key), never leave the header locked
        clearTimeout(unlockTimer);
        unlockTimer = setTimeout(settle, 2200);
      });
    });
  }

  /* Scroll progress */
  gsap.to(".scroll-progress", {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
  });

  /* Hero intro: masked word reveal + logo iris */
  const heroTitle = document.querySelector("[data-split]");
  const heroWords = heroTitle ? splitWords(heroTitle, "word", "word-inner") : [];
  gsap.set(heroWords, { yPercent: 118 });
  // the supporting paragraph is optional: only animate the hero pieces that are on the page
  const heroFollow = gsap.utils.toArray(".hero-lead, .hero-actions");
  gsap.set(heroFollow, { autoAlpha: 0, y: 26 });
  gsap.set(".blackhole", { autoAlpha: 0, scale: 0.15, rotate: -120 });
  root.classList.add("motion-ready");

  gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1 })
    .to(heroWords, { yPercent: 0, duration: 1.3, stagger: 0.06, clearProps: "transform" })
    .to(".blackhole", { autoAlpha: 1, scale: 1, rotate: 0, duration: lite ? 1.6 : 2, ease: "expo.out" }, 0.1)
    .to(heroFollow, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.15, clearProps: "transform" }, 0.6);

  /* Hero leaves: copy lifts and fades, the black hole drifts off into space */
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".hero-copy", { yPercent: -22, opacity: 0.15, ease: "none" }, 0)
    .to(".hero-art", { yPercent: 22, xPercent: 8, scale: 0.78, rotate: 14, ease: "none" }, 0);

  /* Hero black hole drifts toward the cursor and tilts in 3D */
  const heroArt = document.querySelector(".hero-art");
  const blackhole = document.querySelector(".blackhole");
  if (finePointer && heroArt && blackhole) {
    const tiltX = gsap.quickTo(blackhole, "rotationX", { duration: 1.1, ease: "power3" });
    const tiltY = gsap.quickTo(blackhole, "rotationY", { duration: 1.1, ease: "power3" });
    const driftX = gsap.quickTo(blackhole, "x", { duration: 1.6, ease: "power3" });
    const driftY = gsap.quickTo(blackhole, "y", { duration: 1.6, ease: "power3" });
    document.querySelector(".hero")?.addEventListener("pointermove", (event) => {
      const box = heroArt.getBoundingClientRect();
      const x = gsap.utils.clamp(-1, 1, (event.clientX - (box.left + box.width / 2)) / box.width);
      const y = gsap.utils.clamp(-1, 1, (event.clientY - (box.top + box.height / 2)) / box.height);
      tiltY(x * 20);
      tiltX(-y * 20);
      driftX(x * 36);
      driftY(y * 26);
    });
    document.querySelector(".hero")?.addEventListener("pointerleave", () => { tiltX(0); tiltY(0); driftX(0); driftY(0); });
  }

  /* Scroll-velocity marquee: speed and direction follow the scroll */
  const velocityRows = [...document.querySelectorAll("[data-velocity]")].map((row) => {
    const track = row.querySelector(".velocity-track");
    const copies = Math.max(2, Math.ceil((window.innerWidth * 2) / Math.max(track.offsetWidth, 1)));
    for (let i = 0; i < copies; i += 1) row.appendChild(track.cloneNode(true));
    return { row, track, x: 0, base: Number(row.dataset.velocity) || 1, width: track.offsetWidth };
  });
  if (velocityRows.length && lite) {
    // CSS animation runs on the compositor: smooth even on modest phones
    const velocity = document.querySelector(".velocity");
    const setShift = () => velocityRows.forEach((item) => {
      const width = item.track.offsetWidth;
      item.row.style.setProperty("--marquee-shift", `${-width}px`);
      item.row.style.setProperty("--marquee-duration", `${Math.max(14, width / 45)}s`);
    });
    setShift();
    velocity.classList.add("is-css");
    ScrollTrigger.create({ trigger: velocity, start: "top bottom", end: "bottom top", onToggle: (self) => velocity.classList.toggle("is-paused", !self.isActive) });
    window.addEventListener("resize", setShift);
  } else if (velocityRows.length) {
    let marqueeActive = true;
    let scrollDirection = 1;
    let boost = 0;
    ScrollTrigger.create({ trigger: ".velocity", start: "top bottom", end: "bottom top", onToggle: (self) => { marqueeActive = self.isActive; } });
    const skewTo = gsap.quickTo(".velocity-row", "skewX", { duration: 0.5, ease: "power3" });
    const readVelocity = (velocity) => {
      if (velocity) scrollDirection = velocity > 0 ? 1 : -1;
      boost = gsap.utils.clamp(0, 14, Math.abs(velocity));
    };
    if (lenis) lenis.on("scroll", (instance) => readVelocity(instance.velocity));
    else ScrollTrigger.create({ onUpdate: (self) => readVelocity(self.getVelocity() / 120) });
    gsap.ticker.add((time, deltaTime) => {
      if (!marqueeActive) return;
      const frame = deltaTime / 16.67;
      velocityRows.forEach((item) => {
        item.x -= (0.55 + boost * 0.9) * item.base * scrollDirection * frame;
        item.x = gsap.utils.wrap(-item.width, 0, item.x);
        gsap.set(item.row, { x: item.x });
      });
      skewTo(-boost * 0.45 * scrollDirection);
      boost *= 0.92;
    });
    window.addEventListener("resize", () => velocityRows.forEach((item) => { item.width = item.track.offsetWidth; }));
  }

  /* Headings: word-by-word reveal tied to scroll (Text Reveal) + paragraph wipe */
  document.querySelectorAll(".section-heading, .project-intro, .about-copy, .contact-content, .plans-head").forEach((block) => {
    const title = block.querySelector("h2, h3");
    if (!title) return;
    const words = splitWords(title, "tr-word");
    const supporting = block.querySelectorAll(":scope > p, :scope > div > p, :scope > .text-link, :scope > .button, :scope > .contact-actions, :scope > .contact-hint");
    const timeline = gsap.timeline({ scrollTrigger: { trigger: title, start: "top 88%", end: "top 42%", scrub: 0.6 } });
    timeline.fromTo(words, { opacity: 0.12 }, { opacity: 1, ease: "none", stagger: 0.12 });
    supporting.forEach((element, index) => {
      // Buttons only get the wipe: their x/y belongs to the magnetic effect.
      const lift = element.classList.contains("button") ? {} : { y: 24 };
      const position = index === 0 ? ">-0.35" : "<0.15";
      if (lite) {
        timeline.fromTo(element, { opacity: 0, ...lift }, { opacity: 1, ...(lift.y ? { y: 0 } : {}), ease: "power2.out", duration: 0.8 }, position);
      } else {
        timeline.fromTo(element,
          { clipPath: "inset(0% 0% 100% 0%)", ...lift },
          { clipPath: "inset(-40% -25% -60% -25%)", ...(lift.y ? { y: 0 } : {}), ease: "power2.out", duration: 0.8 }, position);
      }
    });
  });

  /* Benefits: the constellation is drawn star by star as it scrolls in */
  const constellation = document.querySelector(".constellation");
  if (constellation) {
    const drawLines = getComputedStyle(constellation.querySelector(".constellation-lines") || constellation).display !== "none";
    const sky = gsap.timeline({ scrollTrigger: { trigger: constellation, start: "top 88%", end: "top 40%", scrub: 0.7 } });
    if (drawLines) {
      sky.fromTo(".constellation-lines", { clipPath: "inset(-20% 100% -20% 0%)" }, { clipPath: "inset(-20% 0% -20% 0%)", ease: "none", duration: 1 }, 0)
        .fromTo(".constellation-end", { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.6, duration: 0.2 }, 0.85);
    }
    constellation.querySelectorAll(".benefit").forEach((benefit, index) => {
      const at = drawLines ? index * 0.25 : index * 0.2;
      sky.fromTo(benefit.querySelector(".benefit-star"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, ease: "back.out(3)", duration: 0.2 }, at)
        .fromTo(benefit.querySelectorAll("h3, p"), { y: 28, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out", duration: 0.3, stagger: 0.05 }, at + 0.05);
    });
  }

  /* Services: divider draws across, content slides up — all scrubbed */
  gsap.utils.toArray(".service-row").forEach((row) => {
    gsap.timeline({ scrollTrigger: { trigger: row, start: "top 94%", end: "top 62%", scrub: 0.6 } })
      .fromTo(row, { "--line-progress": 0 }, { "--line-progress": 1, ease: "none" }, 0)
      .fromTo(row.querySelectorAll(":scope > h3, :scope > p, .service-tag"),
        { y: 46, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out", stagger: 0.08 }, 0);
  });
  gsap.fromTo(".service-footnote", { opacity: 0, x: -20 }, {
    opacity: 1, x: 0, ease: "none",
    scrollTrigger: { trigger: ".service-footnote", start: "top 96%", end: "top 80%", scrub: 0.6 }
  });

  /* Plans: cards tilt up into place, checklist ticks in, spotlight follows the cursor */
  gsap.utils.toArray(".plan-card").forEach((card, index) => {
    gsap.timeline({ scrollTrigger: { trigger: card, start: "top 95%", end: "top 50%", scrub: 0.7 } })
      .fromTo(card, { y: 110 + index * 40, rotateX: 14, opacity: 0, transformOrigin: "50% 100%" },
        { y: 0, rotateX: 0, opacity: 1, ease: "power2.out" }, 0)
      .fromTo(card.querySelectorAll(".plan-list li"), { x: -24, opacity: 0 },
        { x: 0, opacity: 1, ease: "power2.out", stagger: 0.08 }, 0.35);
    card.addEventListener("pointermove", (event) => {
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - box.left}px`);
      card.style.setProperty("--my", `${event.clientY - box.top}px`);
    });
  });
  gsap.fromTo(".plans-note", { opacity: 0, y: 16 }, {
    opacity: 1, y: 0, ease: "none",
    scrollTrigger: { trigger: ".plans-note", start: "top 98%", end: "top 85%", scrub: 0.6 }
  });

  /* Portfolio: the showcase opens like a window as you scroll */
  gsap.timeline({ scrollTrigger: { trigger: ".project-carousel", start: "top 96%", end: "top 25%", scrub: 0.8 } })
    .fromTo(".project-carousel",
      lite ? { scale: 0.88, y: 50, opacity: 0.4 } : { clipPath: "inset(12% 9% 12% 9% round 28px)" },
      lite ? { scale: 1, y: 0, opacity: 1, ease: "power1.out" } : { clipPath: "inset(0% 0% 0% 0% round 10px)", ease: "power1.out" }, 0)
    .fromTo(".project-shot img, .project-shot video", { scale: 1.28 }, { scale: 1, ease: "power1.out" }, 0)
    .fromTo(".slide-caption", { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: "power1.out" }, 0.35);

  /* Process: the launch trajectory is traced left to right and lights each step it reaches */
  const stepsList = document.querySelector(".steps");
  if (stepsList) {
    stepsList.classList.add("is-tracking");
    const steps = gsap.utils.toArray(".step");
    const glow = document.querySelector(".trajectory-glow");
    const horizontal = glow && getComputedStyle(glow).display !== "none";
    if (horizontal) {
      // light a step once the traced line passes its x position (0, 25, 50, 75%)
      gsap.fromTo(glow, { clipPath: "inset(-30% 100% -30% 0%)" }, {
        clipPath: "inset(-30% 0% -30% 0%)", ease: "none",
        // the tween's own progress follows the drawn line (scrub lag included), not the raw scroll
        onUpdate() {
          const drawn = this.progress();
          steps.forEach((step, i) => step.classList.toggle("is-active", drawn >= i * 0.25 + 0.01));
        },
        scrollTrigger: { trigger: ".trajectory", start: "top 75%", end: "top 20%", scrub: 0.5 }
      });
    } else {
      steps.forEach((step) => {
        ScrollTrigger.create({
          trigger: step, start: "top 70%",
          onEnter: () => step.classList.add("is-active"),
          onLeaveBack: () => step.classList.remove("is-active")
        });
      });
    }
  }

  /* About: the portrait unveils from the bottom while its orbit swings into place */
  gsap.timeline({ scrollTrigger: { trigger: ".about-photo", start: "top 88%", end: "top 35%", scrub: 0.7 } })
    .fromTo(".about-frame",
      lite ? { y: 70, opacity: 0 } : { clipPath: "inset(100% 0% 0% 0% round 28px)" },
      { ...(lite ? { y: 0, opacity: 1 } : { clipPath: "inset(0% 0% 0% 0% round 28px)" }), ease: "power2.out" }, 0)
    .fromTo(".about-orbit", { opacity: 0, scale: 0.7, rotate: -40 }, { opacity: 1, scale: 1, rotate: -14, ease: "power2.out" }, 0.15);
  gsap.fromTo(".about-frame img", { scale: 1.18, yPercent: -4 }, {
    scale: 1.04, yPercent: 3, ease: "none",
    scrollTrigger: { trigger: ".about-photo", start: "top bottom", end: "bottom top", scrub: true }
  });

  /* FAQ: questions slide in, answers open with real height animation */
  gsap.fromTo(".faq-list details", { x: 40, opacity: 0 }, {
    x: 0, opacity: 1, ease: "power2.out", stagger: 0.12,
    scrollTrigger: { trigger: ".faq-list", start: "top 90%", end: "top 55%", scrub: 0.6 }
  });
  document.querySelectorAll(".faq-list details").forEach((item) => {
    const summary = item.querySelector("summary");
    const answer = item.querySelector("p");
    if (!summary || !answer) return;
    const wrapper = document.createElement("div");
    wrapper.className = "faq-answer";
    answer.replaceWith(wrapper);
    wrapper.appendChild(answer);
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (item.open && !item.classList.contains("is-closing")) {
        item.classList.add("is-closing");
        gsap.to(wrapper, {
          height: 0, opacity: 0, duration: 0.45, ease: "power3.inOut",
          onComplete: () => {
            item.open = false;
            item.classList.remove("is-closing");
            gsap.set(wrapper, { clearProps: "height,opacity" });
            ScrollTrigger.refresh();
          }
        });
      } else if (!item.open) {
        item.open = true;
        gsap.fromTo(wrapper, { height: 0, opacity: 0 }, {
          height: "auto", opacity: 1, duration: 0.55, ease: "power3.out", clearProps: "height",
          onComplete: () => ScrollTrigger.refresh()
        });
      }
    });
  });

  /* Contact: the logo sets behind the name as you reach the end of the page */
  gsap.timeline({ scrollTrigger: { trigger: ".sunset", start: "top bottom", endTrigger: document.body, end: "bottom bottom", scrub: 0.6 } })
    .fromTo(".sunset-sun", { yPercent: -18 }, { yPercent: 0, ease: "none", force3D: true }, 0)
    .fromTo(".sunset-horizon", { scaleX: 0.3, opacity: 0.3 }, { scaleX: 1, opacity: 1, ease: "power2.out" }, 0);

  /* Magnetic buttons */
  if (finePointer) {
    document.querySelectorAll(".button, .nav-cta, .project-live-link, .carousel-arrow").forEach((element) => {
      const moveX = gsap.quickTo(element, "x", { duration: 0.5, ease: "power3" });
      const moveY = gsap.quickTo(element, "y", { duration: 0.5, ease: "power3" });
      element.addEventListener("pointermove", (event) => {
        const box = element.getBoundingClientRect();
        moveX((event.clientX - (box.left + box.width / 2)) * 0.35);
        moveY((event.clientY - (box.top + box.height / 2)) * 0.45);
      });
      element.addEventListener("pointerleave", () => { moveX(0); moveY(0); });
    });
  }

  /* Recalculate once fonts and images settle */
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
