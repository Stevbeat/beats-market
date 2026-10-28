const contactEmail = "atasco9@gmail.com";

function initializeContactForm() {
  const inquiryForm = document.querySelector("#inquiry-form");
  if (!inquiryForm) return;

  const search = new URLSearchParams(window.location.search);
  const requestedBeat = search.get("beat");
  const beatSelect = document.querySelector("#inquiry-beat");
  const formStatus = document.querySelector("#form-status");

  if (requestedBeat && [...beatSelect.options].some((option) => option.value === requestedBeat)) {
    beatSelect.value = requestedBeat;
  }

  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!inquiryForm.reportValidity()) return;

    const formData = new FormData(inquiryForm);
    const topic = String(formData.get("topic"));
    const beat = String(formData.get("beat"));
    const subject = `${topic}${beat ? ` — ${beat}` : ""}`;
    const body = [
      "Hi StevBeatz,",
      "",
      String(formData.get("message")).trim(),
      "",
      `Name: ${String(formData.get("name")).trim()}`,
      `Email: ${String(formData.get("email")).trim()}`,
      `Topic: ${topic}`,
      `Beat: ${beat || "Not sure yet"}`,
    ].join("\n");
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    formStatus.textContent = `Your email app is opening a draft addressed to ${contactEmail}. Review it and send when you're ready.`;
    window.location.href = mailto;
  });
}

initializeContactForm();
document.addEventListener("site:pagechange", initializeContactForm);
