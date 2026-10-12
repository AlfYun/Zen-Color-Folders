// ==UserScript==
// @name           Tab URL Tooltip
// @description    Shows a tab's URL (port included) under its title in its tooltip.
// @include        main
// ==/UserScript==
// Zen/Firefox's own tab tooltip is a richer, dynamically-built popup keyed
// off a "tooltip" attribute pointing at a shared element; fighting its own
// popupshowing handler for content is racy. Simpler and reliable: take the
// tab out of that system (drop the "tooltip" attribute) and let the plain
// "tooltiptext" attribute drive the browser's ordinary two-line tooltip.
(() => {
  if (globalThis.__zenTabUrlTooltip) {
    return;
  }
  globalThis.__zenTabUrlTooltip = true;

  function tooltipTextFor(tab) {
    const title = (tab.label || "").trim();
    const uri = tab.linkedBrowser?.currentURI;
    const spec = uri && uri.spec !== "about:blank" ? uri.spec : "";
    if (!spec || spec === title) {
      return title;
    }
    return `${title}\n${spec}`;
  }

  function syncTabTooltip(tab) {
    if (!tab?.isConnected || !tab.classList?.contains("tabbrowser-tab")) {
      return;
    }
    if (tab.hasAttribute("tooltip")) {
      tab.removeAttribute("tooltip");
    }
    const text = tooltipTextFor(tab);
    if (text) {
      tab.setAttribute("tooltiptext", text);
    } else {
      tab.removeAttribute("tooltiptext");
    }
  }

  function syncAllTabs() {
    for (const tab of gBrowser.tabs) {
      syncTabTooltip(tab);
    }
  }

  function start() {
    const container = gBrowser.tabContainer;
    for (const type of ["TabAttrModified", "TabOpen", "TabSelect"]) {
      container.addEventListener(type, (event) => syncTabTooltip(event.target));
    }
    gBrowser.addTabsProgressListener({
      onLocationChange(browser) {
        syncTabTooltip(gBrowser.getTabForBrowser(browser));
      },
    });
    syncAllTabs();
    // New tabs restored lazily (session restore, a folder opening) can get
    // their label a beat after TabOpen fires.
    setTimeout(syncAllTabs, 1000);
  }

  if (window.gBrowserInit?.delayedStartupFinished) {
    start();
  } else {
    const observer = (subject) => {
      if (subject === window) {
        Services.obs.removeObserver(observer, "browser-delayed-startup-finished");
        start();
      }
    };
    Services.obs.addObserver(observer, "browser-delayed-startup-finished");
  }
})();
