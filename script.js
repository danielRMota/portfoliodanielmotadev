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

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        activeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -20px 0px" });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const voidMascot = document.querySelector(".void-mascot");
const mascotStages = [...document.querySelectorAll("main > section[id]")];
if (voidMascot && "IntersectionObserver" in window) {
  const stageObserver = new IntersectionObserver((entries) => {
    const visibleStages = entries.filter((entry) => entry.isIntersecting);
    if (!visibleStages.length) return;
    const currentStage = visibleStages.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    voidMascot.dataset.mascot = currentStage.target.id;
    const stageNames = {
      inicio: "Começando por aqui", beneficios: "Olha esses benefícios", servicos: "Pensando no projeto",
      portfolio: "Veja os projetos", processo: "Etapa por etapa", sobre: "Prazer, Daniel!",
      duvidas: "Tire suas dúvidas", contato: "Vamos conversar!"
    };
    const bubble = voidMascot.querySelector(".mascot-bubble");
    if (bubble) bubble.textContent = stageNames[currentStage.target.id] || "Vamos nessa!";
  }, { threshold: [0.18, 0.4, 0.65], rootMargin: "-18% 0px -30% 0px" });
  mascotStages.forEach((stage) => stageObserver.observe(stage));
}

const carousel = document.querySelector("[data-carousel]");
if (carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const slides = [...carousel.querySelectorAll("[data-slide]")];
  const dots = [...carousel.querySelectorAll("[data-carousel-dot]")];
  const previous = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  const viewport = carousel.querySelector(".carousel-viewport");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let timer;
  let touchStartX = null;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    slides.forEach((slide, i) => slide.setAttribute("aria-hidden", String(i !== activeIndex)));
    dots.forEach((dot, i) => {
      const active = i === activeIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", String(active));
    });
  };

  const stopAutoplay = () => window.clearInterval(timer);
  const startAutoplay = () => {
    stopAutoplay();
    if (!reducedMotion.matches && !document.hidden) timer = window.setInterval(() => showSlide(activeIndex + 1), 7000);
  };

  previous?.addEventListener("click", () => { showSlide(activeIndex - 1); startAutoplay(); });
  next?.addEventListener("click", () => { showSlide(activeIndex + 1); startAutoplay(); });
  dots.forEach((dot, i) => dot.addEventListener("click", () => { showSlide(i); startAutoplay(); }));
  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) startAutoplay();
  });
  document.addEventListener("visibilitychange", startAutoplay);
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
