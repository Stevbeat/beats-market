function initializePageChrome() {
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector("#primary-nav");
  const currentYear = document.querySelector("#current-year");

  if (currentYear) currentYear.textContent = new Date().getFullYear();

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(expanded));
      menuToggle.setAttribute("aria-label", expanded ? "Close navigation" : "Open navigation");
      primaryNav.classList.toggle("is-open", expanded);
    });

    primaryNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
        primaryNav.classList.remove("is-open");
      });
    });

  }
}

initializePageChrome();
document.addEventListener("site:pagechange", initializePageChrome);
document.addEventListener("keydown", (event) => {
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector("#primary-nav");
  if (event.key === "Escape" && menuToggle && primaryNav?.classList.contains("is-open")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    primaryNav.classList.remove("is-open");
    menuToggle.focus();
  }
});
