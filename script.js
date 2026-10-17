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
const contactLink = document.querySelector("#contact-cta");
const emailLink = document.querySelector(".contact-email");
if (whatsapp && contactLink) {
  const message = "Olá, Daniel! Vi seu portfólio e gostaria de conversar sobre um site para o meu negócio.";
  contactLink.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}
if (email && emailLink) emailLink.href = `mailto:${email}`;

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
        lenis.scrollTo(target, { offset: -84, duration: 1.5, onComplete: () => { headerLocked = false; } });
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
  gsap.set(".hero-lead", { autoAlpha: 0, y: 26 });
  if (lite) gsap.set(".logo-frame", { opacity: 0, rotate: -40, scale: 0.6 });
  else gsap.set(".logo-frame", { clipPath: "circle(0% at 50% 50%)", rotate: -40, scale: 1.1 });
  root.classList.add("motion-ready");

  gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1 })
    .to(heroWords, { yPercent: 0, duration: 1.3, stagger: 0.06, clearProps: "transform" })
    .to(".logo-frame", lite
      ? { opacity: 1, rotate: 0, scale: 1, duration: 1.4, ease: "expo.out" }
      : { clipPath: "circle(71% at 50% 50%)", rotate: 0, scale: 1, duration: 1.7, ease: "expo.inOut", clearProps: "clipPath" }, 0)
    .to(".hero-lead", { autoAlpha: 1, y: 0, duration: 1.1 }, 0.6);

  /* Hero leaves: copy lifts and fades, logo recedes and turns */
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".hero-copy", { yPercent: -22, opacity: 0.15, ease: "none" }, 0)
    .to(".hero-art", { yPercent: 16, scale: 0.84, rotate: 10, ease: "none" }, 0);

  /* Hero logo follows the cursor in 3D */
  const heroArt = document.querySelector(".hero-art");
  const logoFrame = document.querySelector(".logo-frame");
  if (finePointer && heroArt && logoFrame) {
    const tiltX = gsap.quickTo(logoFrame, "rotationX", { duration: 0.9, ease: "power3" });
    const tiltY = gsap.quickTo(logoFrame, "rotationY", { duration: 0.9, ease: "power3" });
    document.querySelector(".hero")?.addEventListener("pointermove", (event) => {
      const box = heroArt.getBoundingClientRect();
      const x = (event.clientX - (box.left + box.width / 2)) / box.width;
      const y = (event.clientY - (box.top + box.height / 2)) / box.height;
      tiltY(gsap.utils.clamp(-18, 18, x * 22));
      tiltX(gsap.utils.clamp(-18, 18, -y * 22));
    });
    document.querySelector(".hero")?.addEventListener("pointerleave", () => { tiltX(0); tiltY(0); });
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

  /* Benefits: cards rise in sequence with the scroll, icons draw themselves, spotlight follows the cursor */
  const benefitCards = gsap.utils.toArray(".benefit-card");
  if (benefitCards.length) {
    gsap.fromTo(benefitCards,
      { y: (i) => 90 + i * 35, opacity: 0 },
      { y: 0, opacity: 1, ease: "power2.out", stagger: 0.14,
        scrollTrigger: { trigger: ".benefit-grid", start: "top 100%", end: "top 58%", scrub: 0.7 } });
    const strokes = gsap.utils.toArray(".benefit-card .icon-box svg > *");
    strokes.forEach((shape) => {
      const length = typeof shape.getTotalLength === "function" ? shape.getTotalLength() : 60;
      gsap.set(shape, { strokeDasharray: length, strokeDashoffset: length });
    });
    gsap.to(strokes, {
      strokeDashoffset: 0, ease: "none", stagger: 0.05,
      scrollTrigger: { trigger: ".benefit-grid", start: "top 85%", end: "top 50%", scrub: 0.7 }
    });
    benefitCards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - box.left}px`);
        card.style.setProperty("--my", `${event.clientY - box.top}px`);
      });
    });
  }

  /* Services: divider draws across, content slides up — all scrubbed */
  gsap.utils.toArray(".service-row").forEach((row) => {
    gsap.timeline({ scrollTrigger: { trigger: row, start: "top 94%", end: "top 62%", scrub: 0.6 } })
      .fromTo(row, { "--line-progress": 0 }, { "--line-progress": 1, ease: "none" }, 0)
      .fromTo(row.querySelectorAll(".service-index, :scope > div, .service-tag, .service-arrow"),
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

  /* Process: timeline beam fills and lights up each step */
  const stepsList = document.querySelector(".steps");
  if (stepsList) {
    stepsList.classList.add("is-tracking");
    gsap.fromTo(".steps-beam", { scaleY: 0 }, {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: stepsList, start: "top 62%", end: "bottom 62%", scrub: true }
    });
    gsap.utils.toArray(".step").forEach((step) => {
      ScrollTrigger.create({
        trigger: step, start: "top+=30 62%",
        onEnter: () => step.classList.add("is-active"),
        onLeaveBack: () => step.classList.remove("is-active")
      });
    });
  }

  /* About: portrait unveils from the bottom with depth */
  gsap.fromTo(".about-symbol",
    lite ? { y: 70, opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)" }, {
    ...(lite ? { y: 0, opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }), ease: "power2.out",
    scrollTrigger: { trigger: ".about-symbol", start: "top 88%", end: "top 35%", scrub: 0.7 }
  });
  gsap.fromTo(".about-symbol img", { scale: 1.35, yPercent: -6 }, {
    scale: 1.08, yPercent: 6, ease: "none",
    scrollTrigger: { trigger: ".about-symbol", start: "top bottom", end: "bottom top", scrub: true }
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

  /* Contact: panel grows into place, rings turn with the scroll, art follows the cursor */
  gsap.fromTo(".contact-panel", lite ? { scale: 0.92 } : { scale: 0.9, borderRadius: 40 }, {
    ...(lite ? { scale: 1 } : { scale: 1, borderRadius: 9 }), ease: "none",
    scrollTrigger: { trigger: ".contact", start: "top bottom", end: "top 25%", scrub: 0.6 }
  });
  gsap.timeline({ scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true } })
    .fromTo(".contact-orbit", { rotate: -40 }, { rotate: 80, ease: "none" }, 0)
    .fromTo(".ring-a", { rotate: -95 }, { rotate: 25, ease: "none" }, 0)
    .fromTo(".ring-b", { rotate: 40 }, { rotate: -70, ease: "none" }, 0);
  if (lite) gsap.set(".contact-ring", { force3D: true });

  const contactPanel = document.querySelector(".contact-panel");
  if (finePointer && contactPanel) {
    gsap.set(".contact-core", { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    const layers = [
      [".contact-core", 14], [".contact-ring", 7], [".dot-a", 28], [".dot-b", -22]
    ].map(([selector, depth]) => ({
      depth,
      x: gsap.quickTo(selector, "x", { duration: 0.8, ease: "power3" }),
      y: gsap.quickTo(selector, "y", { duration: 0.8, ease: "power3" })
    }));
    contactPanel.addEventListener("pointermove", (event) => {
      const box = contactPanel.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      layers.forEach((layer) => { layer.x(x * layer.depth * 2); layer.y(y * layer.depth * 2); });
    });
    contactPanel.addEventListener("pointerleave", () => layers.forEach((layer) => { layer.x(0); layer.y(0); }));
  }

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
