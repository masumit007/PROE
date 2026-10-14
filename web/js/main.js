
"use strict";

// ==========================================
// PROE - Main Frontend JavaScript
// ==========================================

// Get common navigation and theme elements
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const themeToggle = document.getElementById("themeToggle");

// ==========================================
// 1. MOBILE NAVIGATION
// ==========================================

if (menuToggle && navLinks) {
  function closeMobileMenu() {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.textContent = "☰";
  }

  menuToggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  // Close the menu after selecting a navigation link
  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMobileMenu);
  });

  // Close the menu when returning to a wider screen
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) {
      closeMobileMenu();
    }
  });
}

// ==========================================
// 2. LIGHT AND DARK MODE
// ==========================================

const THEME_KEY = "proe-theme";

function updateThemeButton() {
  if (!themeToggle) return;

  const isDark = document.body.classList.contains("dark");

  themeToggle.textContent = isDark ? "☀" : "◐";
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );
}

// Restore the saved theme
try {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
} catch (error) {
  console.warn("Could not restore the saved theme.");
}

updateThemeButton();

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const isDark = document.body.classList.toggle("dark");

    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch (error) {
      console.warn("Could not save the selected theme.");
    }

    updateThemeButton();
  });
}

// ==========================================
// 3. HOMEPAGE RESEARCH SEARCH
// ==========================================

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("paperSearch");
const paperCards = Array.from(
  document.querySelectorAll(".research-card")
);
const searchMessage = document.getElementById("searchMessage");

function filterPapers(query) {
  const normalizedQuery = query.trim().toLowerCase();
  let visibleCount = 0;

  paperCards.forEach(function (card) {
    const searchableText = (
      (card.dataset.search || "") + " " + card.textContent
    ).toLowerCase();

    const matches =
      normalizedQuery === "" ||
      searchableText.includes(normalizedQuery);

    card.hidden = !matches;

    if (matches) {
      visibleCount++;
    }
  });

  if (searchMessage) {
    if (!normalizedQuery) {
      searchMessage.textContent = "";
    } else if (visibleCount === 0) {
      searchMessage.textContent =
        "No matching sample papers. Try a different topic.";
    } else {
      searchMessage.textContent =
        visibleCount + " sample paper(s) found.";
    }
  }
}

if (searchForm && searchInput) {
  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    filterPapers(searchInput.value);

    const featuredSection = document.getElementById("featured");

    if (featuredSection) {
      featuredSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });

  // Clear the filter when the search box becomes empty
  searchInput.addEventListener("input", function () {
    if (!searchInput.value.trim()) {
      filterPapers("");
    }
  });
}

// ==========================================
// 4. POPULAR TOPIC SHORTCUTS
// ==========================================

document.querySelectorAll(".topic-chip").forEach(function (button) {
  button.addEventListener("click", function () {
    if (!searchInput) return;

    searchInput.value =
      button.dataset.topic || button.textContent.trim();

    filterPapers(searchInput.value);

    const featuredSection = document.getElementById("featured");

    if (featuredSection) {
      featuredSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});

// ==========================================
// 5. FRONTEND INITIALIZATION
// ==========================================

console.log("PROE frontend JavaScript loaded successfully.");
