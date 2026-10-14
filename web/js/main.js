
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Current year
  const year = $("#currentYear");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile navigation
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");

  function closeMenu() {
    if (!menuToggle || !navLinks) return;
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    document.body.classList.remove("menu-open");
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeMenu();
      } else {
        navLinks.classList.add("open");
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close navigation");
        document.body.classList.add("menu-open");
      }
    });

    $$("a", navLinks).forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", event => {
      if (
        menuToggle.getAttribute("aria-expanded") === "true" &&
        !navLinks.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 780) closeMenu();
    });
  }

  // Dark / light theme
  const themeToggle = $("#themeToggle");
  const themeMeta = $('meta[name="theme-color"]');

  function getSavedTheme() {
    try {
      return localStorage.getItem("proe-theme");
    } catch (_) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem("proe-theme", theme);
    } catch (_) {
      // Theme still works for the current page if storage is unavailable.
    }
  }

  function applyTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("light-theme", isLight);

    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        isLight ? "Switch to dark theme" : "Switch to light theme"
      );
      themeToggle.title = isLight ? "Switch to dark theme" : "Switch to light theme";
    }

    if (themeMeta) {
      themeMeta.content = isLight ? "#f4f6fc" : "#080d1b";
    }
  }

  applyTheme(getSavedTheme() === "light" ? "light" : "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("light-theme")
        ? "dark"
        : "light";

      applyTheme(nextTheme);
      saveTheme(nextTheme);
    });
  }

  // Hero slideshow
  const gallery = $("#heroGallery");

  if (gallery) {
    const slides = $$(".gallery-slide", gallery);
    const dots = $$(".gallery-dot", gallery);
    const previous = $(".gallery-prev", gallery);
    const next = $(".gallery-next", gallery);
    const counter = $("#galleryCounter");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let currentIndex = Math.max(
      0,
      slides.findIndex(slide => slide.classList.contains("is-active"))
    );

    let timer = null;

    function showSlide(index) {
      if (!slides.length) return;

      currentIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        const active = i === currentIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, i) => {
        const active = i === currentIndex;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });

      if (counter) {
        counter.textContent =
          `${String(currentIndex + 1).padStart(2, "0")} / ` +
          `${String(slides.length).padStart(2, "0")}`;
      }
    }

    function stopSlideshow() {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    }

    function startSlideshow() {
      stopSlideshow();

      if (slides.length < 2 || reducedMotion.matches || document.hidden) {
        return;
      }

      timer = window.setInterval(() => {
        showSlide(currentIndex + 1);
      }, 5000);
    }

    function navigate(index) {
      showSlide(index);
      startSlideshow();
    }

    if (previous) {
      previous.addEventListener("click", () => navigate(currentIndex - 1));
    }

    if (next) {
      next.addEventListener("click", () => navigate(currentIndex + 1));
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => navigate(index));
    });

    gallery.addEventListener("mouseenter", stopSlideshow);
    gallery.addEventListener("mouseleave", startSlideshow);
    gallery.addEventListener("focusin", stopSlideshow);

    gallery.addEventListener("focusout", event => {
      if (!gallery.contains(event.relatedTarget)) startSlideshow();
    });

    gallery.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(currentIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(currentIndex + 1);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopSlideshow();
      else startSlideshow();
    });

    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", startSlideshow);
    }

    showSlide(currentIndex);
    startSlideshow();
  }

  // Homepage research filtering
  const searchForm = $("#searchForm");
  const searchInput = $("#paperSearch");
  const paperGrid = $("#paperGrid");
  const searchMessage = $("#searchMessage");
  const emptySearch = $("#emptySearch");
  const topicButtons = $$(".topic-chip");

  if (searchForm && searchInput && paperGrid) {
    const cards = $$(".research-card", paperGrid);

    const normalize = value =>
      String(value || "").toLowerCase().trim().replace(/\s+/g, " ");

    function filterCards(query) {
      const terms = normalize(query).split(" ").filter(Boolean);
      let visibleCount = 0;

      cards.forEach(card => {
        const searchableText = normalize(
          `${card.dataset.search || ""} ${card.dataset.category || ""} ${card.textContent}`
        );

        const matches = terms.every(term => searchableText.includes(term));
        card.hidden = !matches;

        if (matches) visibleCount++;
      });

      if (emptySearch) {
        emptySearch.hidden = visibleCount !== 0;
      }

      if (searchMessage) {
        searchMessage.textContent = terms.length
          ? `${visibleCount} matching topic${visibleCount === 1 ? "" : "s"} found.`
          : "";
      }

      return visibleCount;
    }

    function clearTopicSelection() {
      topicButtons.forEach(button => {
        button.classList.remove("active");
        button.setAttribute("aria-pressed", "false");
      });
    }

    searchInput.addEventListener("input", () => {
      clearTopicSelection();
      filterCards(searchInput.value);
    });

    searchForm.addEventListener("submit", event => {
      event.preventDefault();
      filterCards(searchInput.value);

      $("#featured")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start"
      });
    });

    topicButtons.forEach(button => {
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", () => {
        const wasActive = button.classList.contains("active");
        clearTopicSelection();

        if (wasActive) {
          searchInput.value = "";
        } else {
          searchInput.value = button.dataset.topic || button.textContent.trim();
          button.classList.add("active");
          button.setAttribute("aria-pressed", "true");
        }

        filterCards(searchInput.value);
      });
    });
  }

  // Back to top
  const backToTop = $("#backToTop");

  if (backToTop) {
    const updateButton = () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 500);
    };

    window.addEventListener("scroll", updateButton, { passive: true });

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth"
      });
    });

    updateButton();
  }
});
