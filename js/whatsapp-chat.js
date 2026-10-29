document.addEventListener("DOMContentLoaded", () => {
  const whatsappButton = document.querySelector("#whatsapp-chat");
  const popup = document.querySelector("#wa-popup");
  const statusText = document.querySelector("#wa-status-text");
  const statusDot = document.querySelector(".wa-status-dot");
  const options = document.querySelectorAll(".wa-quick-message");

  if (!whatsappButton || !popup || !statusText || !statusDot) {
    console.error("WhatsApp chat widget markup is incomplete.");
    return;
  }

  const whatsappNumber = "233501483350";
  const timezone = "Africa/Accra";

  function trackWhatsAppEvent(eventName, details = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, details);
    } else {
      console.info("WhatsApp event:", eventName, details);
    }
  }

  function updateBusinessStatus() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const getPart = (type) => parts.find((part) => part.type === type)?.value;
    const minutesNow = Number(getPart("hour")) * 60 + Number(getPart("minute"));
    const isWithinHours = minutesNow >= 480 && minutesNow < 1080;

    statusText.textContent = isWithinHours
      ? "Within our usual business hours"
      : "Typically replies during business hours";
    statusDot.classList.toggle("is-open", isWithinHours);
    statusDot.classList.toggle("is-closed", !isWithinHours);
  }

  function setPopupOpen(isOpen, restoreFocus = false) {
    popup.hidden = !isOpen;
    whatsappButton.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      trackWhatsAppEvent("whatsapp_widget_open");
      popup.querySelector(".wa-quick-message")?.focus();
    } else if (restoreFocus) {
      whatsappButton.focus();
    }
  }

  updateBusinessStatus();
  window.setInterval(updateBusinessStatus, 60_000);

  whatsappButton.addEventListener("click", (event) => {
    event.preventDefault();
    setPopupOpen(popup.hidden);
  });

  popup.querySelector(".wa-popup-close")?.addEventListener("click", () => {
    setPopupOpen(false, true);
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const messageType = option.dataset.messageType;
      const selectedMessage = option.dataset.message;
      const pageName = document.querySelector("h1")?.textContent.trim() || document.title;
      const pageUrl = new URL(window.location.href);
      pageUrl.search = "";
      const message = `Hello StevBeatz! ${selectedMessage}\n\nPage: ${pageName}\nWebsite: ${pageUrl.href}`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      trackWhatsAppEvent("whatsapp_quick_message", { message_type: messageType });
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setPopupOpen(false, true);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popup.hidden) {
      setPopupOpen(false, true);
    }
  });

  document.addEventListener("click", (event) => {
    if (!popup.hidden && !popup.contains(event.target) && !whatsappButton.contains(event.target)) {
      setPopupOpen(false);
    }
  });
});
