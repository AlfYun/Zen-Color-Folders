// ==UserScript==
// @name           Translate Context Menu
// @description    Adds "번역하기" to the page's right-click menu, opening the same
//                  full-page translation panel Firefox shows automatically on load.
// @include        main
// ==/UserScript==
// Calls the same FullPageTranslationsPanel.open() the native #translations-button
// uses (browser/base/content/navigator-toolbox.js). It only reads event.type,
// event.target and event.stopPropagation(); passing a plain non-click/keypress
// event skips the button-only filter, and when event.target isn't inside the
// (possibly hidden) toolbar button, Firefox's own code already falls back to
// anchoring the panel on the app-menu button instead — no need to find or show
// the real button ourselves.
(() => {
  if (globalThis.__zenTranslateContextMenu) {
    return;
  }
  globalThis.__zenTranslateContextMenu = true;

  const MENU_ITEM_ID = "zen-translate-page-item";
  const MENU_SEP_ID = "zen-translate-page-sep";

  function openTranslationsPanel() {
    try {
      globalThis.FullPageTranslationsPanel?.open({
        type: "command",
        target: null,
        stopPropagation() {},
      });
    } catch (err) {
      console.error("[TranslateContextMenu] Could not open the translations panel:", err);
    }
  }

  function addMenuItem() {
    const menu = document.getElementById("contentAreaContextMenu");
    const anchor = document.getElementById("context-selectall");
    if (!menu || document.getElementById(MENU_ITEM_ID)) {
      return;
    }

    const sep = document.createXULElement("menuseparator");
    sep.id = MENU_SEP_ID;
    const item = document.createXULElement("menuitem");
    item.id = MENU_ITEM_ID;
    item.setAttribute("label", "번역하기");
    item.addEventListener("command", openTranslationsPanel);

    if (anchor?.parentElement === menu) {
      anchor.after(sep, item);
    } else {
      menu.append(sep, item);
    }
  }

  function start() {
    addMenuItem();
    // The context menu is built lazily on first open in some windows.
    document.addEventListener(
      "popupshowing",
      (event) => {
        if (event.target?.id === "contentAreaContextMenu") {
          addMenuItem();
        }
      },
      true
    );
  }

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
})();
