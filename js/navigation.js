let navigationRequestId = 0;

async function navigateWithoutReload(url, addHistoryEntry = true) {
  const requestId = ++navigationRequestId;
  try {
    const response = await fetch(url.href);
    if (!response.ok) throw new Error(`Page request failed with status ${response.status}: ${url.href}`);
    const html = await response.text();
    if (requestId !== navigationRequestId) return;

    const nextPage = new DOMParser().parseFromString(html, "text/html");
    const nextPlayer = nextPage.querySelector("#audio-player");
    const nextDialog = nextPage.querySelector("#now-playing");
    if (!nextPage.querySelector("main") || !nextPlayer || !nextDialog) {
      throw new Error(`The requested page is missing required site layout elements: ${url.href}`);
    }

    const retainedPlayer = document.querySelector("#audio-player");
    const retainedDialog = document.querySelector("#now-playing");
    if (!retainedPlayer || !retainedDialog) {
      throw new Error("The persistent audio player is missing from the current page.");
    }

    const incomingNodes = [...nextPage.body.childNodes]
      .filter((node) => !(node.nodeType === Node.ELEMENT_NODE && ["audio-player", "now-playing"].includes(node.id)))
      .map((node) => document.importNode(node, true));

    [...document.body.childNodes].forEach((node) => {
      if (node !== retainedPlayer && node !== retainedDialog) node.remove();
    });
    incomingNodes.forEach((node) => document.body.insertBefore(node, retainedPlayer));

    const description = nextPage.querySelector('meta[name="description"]');
    const currentDescription = document.querySelector('meta[name="description"]');
    if (description && currentDescription) currentDescription.content = description.content;
    document.title = nextPage.title;
    for (const selector of [
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
    ]) {
      const nextMeta = nextPage.querySelector(selector);
      const currentMeta = document.querySelector(selector);
      if (nextMeta && currentMeta) currentMeta.content = nextMeta.content;
    }

    if (addHistoryEntry) history.pushState({}, "", url.href);
    document.dispatchEvent(new CustomEvent("site:pagechange", { detail: { url: url.href } }));

    if (url.hash) {
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  } catch (error) {
    console.error("Could not navigate without interrupting playback:", error);
    window.location.assign(url.href);
  }
}

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest("a[href]");
  if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || !url.pathname.toLowerCase().endsWith(".html")) return;

  const currentUrl = new URL(window.location.href);
  if (url.pathname === currentUrl.pathname && url.search === currentUrl.search && url.hash) return;

  event.preventDefault();
  navigateWithoutReload(url);
});

window.addEventListener("popstate", () => {
  navigateWithoutReload(new URL(window.location.href), false);
});
