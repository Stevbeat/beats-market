function initializeListeningSlideshow() {
  const slideshow = document.querySelector(".listening-art");
  if (!slideshow || slideshow.dataset.initialized === "true") return;
  slideshow.dataset.initialized = "true";

  const slides = [...slideshow.querySelectorAll(".listening-slide")];
  const indicators = [...slideshow.querySelectorAll(".listening-dot")];
  let activeIndex = 0;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== activeIndex;
      slide.setAttribute("aria-label", `${slideIndex + 1} of ${slides.length}`);
    });
    indicators.forEach((indicator, indicatorIndex) => {
      const active = indicatorIndex === activeIndex;
      indicator.classList.toggle("is-active", active);
      indicator.setAttribute("aria-pressed", String(active));
    });
  }

  slideshow.querySelectorAll("[data-slide-step]").forEach((button) => {
    button.addEventListener("click", () => {
      showSlide(activeIndex + Number(button.dataset.slideStep));
    });
  });

  indicators.forEach((indicator) => {
    indicator.addEventListener("click", () => {
      showSlide(Number(indicator.dataset.slideTo));
    });
  });

  showSlide(activeIndex);
}

initializeListeningSlideshow();
document.addEventListener("site:pagechange", initializeListeningSlideshow);
