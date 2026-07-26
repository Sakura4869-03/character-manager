"use strict";

/* =========================================================
   Creative Archive
   index.js
   アプリ全体のエントリーポイント
========================================================= */

(() => {
  function initialize() {
    if (
      !window.CreativeDashboard ||
      typeof window.CreativeDashboard.initialize !== "function"
    ) {
      console.error(
        "dashboard.jsが正しく読み込まれていません。"
      );

      return;
    }

    window.CreativeDashboard.initialize();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();