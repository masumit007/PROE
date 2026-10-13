
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const themeToggle = document.getElementById("themeToggle");

// Mobile navigation
if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    });
  });
}

// Light and dark theme toggle
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");

    themeToggle.textContent = isDark ? "☀" : "◐";
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  });
}

// Search the sample research cards on this page
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("paperSearch");
const paperCards = [...document.querySelectorAll(".research-card")];
const searchMessage = document.getElementById("searchMessage");

function filterPapers(query) {
  const normalizedQuery = query.trim().toLowerCase();
  let visibleCount = 0;

  paperCards.forEach(card => {
    const searchableText =
      `${card.dataset.search || ""} ${card.textContent}`.toLowerCase();

    const matches =
      !normalizedQuery || searchableText.includes(normalizedQuery);

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
        `${visibleCount} sample paper(s) found.`;
    }
  }
}

if (searchForm && searchInput) {
  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    filterPapers(searchInput.value);

    document.getElementById("featured")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  searchInput.addEventListener("input", () => {
    if (!searchInput.value.trim()) {
      filterPapers("");
    }
  });
}

// Topic shortcuts
document.querySelectorAll(".topic-chip").forEach(button => {
  button.addEventListener("click", () => {
    if (!searchInput) return;

    searchInput.value =
      button.dataset.topic || button.textContent.trim();

    filterPapers(searchInput.value);

    document.getElementById("featured")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});
