const favoritesKey = "stevbeatz-favorites";

function initializeBeatFilters() {
  const beatCards = [...document.querySelectorAll(".beat-card")];
  const searchInput = document.querySelector("#beat-search");
  const emptyState = document.querySelector("#empty-state");
  const filterButtons = [...document.querySelectorAll(".filter-button")];
  const favoriteCount = document.querySelector(".favorite-count");

  if (!beatCards.length || !searchInput || !emptyState || !filterButtons.length || !favoriteCount) return;

  const favoriteButtons = beatCards.map((card) => card.querySelector(".favorite-button"));
  let activeFilter = "all";
  let favorites = [];

  try {
    const savedFavorites = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    if (Array.isArray(savedFavorites)) favorites = savedFavorites.filter((title) => beatCards.some((card) => card.dataset.title === title));
  } catch (error) {
    console.error("Could not load saved beat favorites:", error);
  }

  function updateFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;
    beatCards.forEach((card) => {
      const matchesSearch = card.dataset.title.toLowerCase().includes(query);
      const isFavorite = favorites.includes(card.dataset.title);
      const visible = matchesSearch && (activeFilter === "all" || isFavorite);
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    emptyState.hidden = visibleCount > 0;
  }

  favoriteButtons.forEach((button, index) => {
    const card = beatCards[index];
    const title = card.dataset.title;
    const isFavorite = favorites.includes(title);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${title} ${isFavorite ? "from" : "to"} favorites`);
    button.addEventListener("click", () => {
      if (favorites.includes(title)) {
        favorites = favorites.filter((favorite) => favorite !== title);
      } else {
        favorites.push(title);
      }
      const selected = favorites.includes(title);
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("aria-label", `${selected ? "Remove" : "Add"} ${title} ${selected ? "from" : "to"} favorites`);
      favoriteCount.textContent = favorites.length.toString().padStart(2, "0");
      try {
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
      } catch (error) {
        console.error("Could not save beat favorites:", error);
      }
      updateFilters();
    });
  });

  favoriteCount.textContent = favorites.length.toString().padStart(2, "0");
  searchInput.addEventListener("input", updateFilters);
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      filterButtons.forEach((filterButton) => {
        const selected = filterButton === button;
        filterButton.classList.toggle("is-active", selected);
        filterButton.setAttribute("aria-pressed", String(selected));
      });
      updateFilters();
    });
  });

  updateFilters();
}

initializeBeatFilters();
document.addEventListener("site:pagechange", initializeBeatFilters);
document.addEventListener("keydown", (event) => {
  const searchInput = document.querySelector("#beat-search");
  if (event.key === "/" && searchInput && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});