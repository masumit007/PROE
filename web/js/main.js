
const THEME_KEY = "proe-theme";

// Restore the saved theme when the page loads
const savedTheme = localStorage.getItem(THEME_KEY);

if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

if (themeToggle) {
  const updateThemeButton = () => {
    const isDark = document.body.classList.contains("dark");

    themeToggle.textContent = isDark ? "☀" : "◐";
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  };

  updateThemeButton();

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");

    localStorage.setItem(
      THEME_KEY,
      isDark ? "dark" : "light"
    );

    updateThemeButton();
  });
}
