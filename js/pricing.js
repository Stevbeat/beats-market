const currencyStorageKey = "stevbeatz-price-currency";
const exchangeRateUrl = "https://open.er-api.com/v6/latest/USD";
const supportedCurrencies = new Set(["GHS", "USD", "GBP", "NGN", "CAD", "ZAR", "EUR"]);
const licensePrices = {
  basic: { amount: 30, label: "Basic license - MP3" },
  premium: { amount: 80, label: "Premium license - WAV + MP3" },
  exclusive: { minimum: 150, maximum: 300, label: "Exclusive license" },
};

const currencySelectors = [...document.querySelectorAll(".price-country")];
const priceStatus = document.querySelector(".price-region-status");
let selectedCurrency = "USD";
let exchangeRatesPromise;

if (currencySelectors.length && priceStatus) {
  function formatPrice(amount, currency) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function displayPrice(amount, currency, rate) {
    return formatPrice(amount * rate, currency);
  }

  function updatePrices(rate) {
    document.querySelectorAll("[data-license-price]").forEach((element) => {
      const license = element.dataset.licensePrice;
      if (license === "exclusive") {
        element.textContent = `${displayPrice(150, selectedCurrency, rate)} to ${displayPrice(300, selectedCurrency, rate)}`;
      } else if (license in licensePrices) {
        element.textContent = displayPrice(licensePrices[license].amount, selectedCurrency, rate);
      }
    });

    document.querySelectorAll(".beat-card").forEach((card) => {
      const selector = card.querySelector("[data-license-choice]");
      const summary = card.querySelector("[data-license-summary]");
      const whatsappLink = card.querySelector('[data-purchase="whatsapp"]');
      if (!selector) return;

      [...selector.options].forEach((option) => {
        const license = licensePrices[option.value];
        if (!license) return;
        const price = license.minimum
          ? `${displayPrice(license.minimum, selectedCurrency, rate)} to ${displayPrice(license.maximum, selectedCurrency, rate)}`
          : displayPrice(license.amount, selectedCurrency, rate);
        option.textContent = `${license.label} - ${price}`;
      });

      const updatePurchaseDetails = () => {
        const license = licensePrices[selector.value];
        const price = license.minimum
          ? `${displayPrice(license.minimum, selectedCurrency, rate)} to ${displayPrice(license.maximum, selectedCurrency, rate)}`
          : displayPrice(license.amount, selectedCurrency, rate);
        const title = card.dataset.title || "this beat";

        if (summary) summary.textContent = `${license.label} - ${price}`;
        if (whatsappLink) {
          const message = `Hi StevBeatz, I'm interested in licensing "${title}". ${license.label}; displayed estimate: ${price}. Please confirm the final price and usage terms.`;
          whatsappLink.href = `https://wa.me/233501483350?text=${encodeURIComponent(message)}`;
        }
      };

      if (!selector.dataset.pricingBound) {
        selector.addEventListener("change", updatePurchaseDetails);
        selector.dataset.pricingBound = "true";
      }
      updatePurchaseDetails();
    });
  }

  function saveCurrency(currency) {
    try {
      localStorage.setItem(currencyStorageKey, currency);
    } catch (error) {
      console.warn("Could not save the selected price currency:", error);
    }
  }

  function getExchangeRates() {
    if (!exchangeRatesPromise) {
      exchangeRatesPromise = fetch(exchangeRateUrl, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(`Exchange-rate service returned ${response.status}.`);
          return response.json();
        })
        .then((data) => {
          if (data.result !== "success" || !data.rates || typeof data.rates !== "object") {
            throw new Error("Exchange-rate service returned an invalid response.");
          }
          return data;
        })
        .catch((error) => {
          exchangeRatesPromise = undefined;
          throw error;
        });
    }
    return exchangeRatesPromise;
  }

  async function setCurrency(currency) {
    selectedCurrency = supportedCurrencies.has(currency) ? currency : "USD";

    if (selectedCurrency === "USD") {
      currencySelectors.forEach((selector) => {
        selector.value = "USD";
      });
      updatePrices(1);
      priceStatus.textContent = "Prices shown in USD. Converted amounts are estimates; checkout confirms the final price.";
      saveCurrency("USD");
      return;
    }

    priceStatus.textContent = "Loading live reference exchange rates...";

    try {
      const data = await getExchangeRates();
      const rate = data.rates[selectedCurrency];
      if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
        throw new Error(`No valid exchange rate was returned for ${selectedCurrency}.`);
      }
      if (selectedCurrency !== currency) return;

      updatePrices(rate);
      const updated = data.time_last_update_utc ? ` Last updated: ${data.time_last_update_utc}.` : "";
      priceStatus.textContent = `Approximate ${selectedCurrency} prices use live reference rates.${updated} Final prices may vary at checkout.`;
      saveCurrency(selectedCurrency);
    } catch (error) {
      if (selectedCurrency !== currency) return;
      console.error("Could not convert beat prices:", error);
      selectedCurrency = "USD";
      currencySelectors.forEach((selector) => {
        selector.value = "USD";
      });
      updatePrices(1);
      priceStatus.textContent = "Live exchange rates are unavailable; prices are shown in USD.";
      saveCurrency("USD");
    }
  }

  let savedCurrency = "USD";
  try {
    const savedValue = localStorage.getItem(currencyStorageKey);
    if (savedValue && supportedCurrencies.has(savedValue)) savedCurrency = savedValue;
  } catch (error) {
    console.warn("Could not load the saved price currency:", error);
  }

  currencySelectors.forEach((selector) => {
    selector.value = savedCurrency;
    selector.addEventListener("change", () => setCurrency(selector.value));
  });
  setCurrency(savedCurrency);
}
