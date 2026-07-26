"use strict";

/* =========================================================
   Creative Archive
   dashboard.js
   画面切替・ナビゲーション・ヘッダー管理
   5種類完全対応版
========================================================= */

window.CreativeDashboard = (() => {
  /* =======================================================
     Constants
  ======================================================= */

  const AVAILABLE_VIEWS = [
    "dashboard",
    "character",
    "world",
    "organization",
    "glossary",
    "item",
  ];

  const VIEW_CONFIG = {
    dashboard: {
      eyebrow:
        "CREATIVE DASHBOARD",

      title:
        "創作資料ダッシュボード",

      description:
        "キャラクター・世界観・組織・用語・アイテムをまとめて管理できます。",

      actions: `
        <a
          class="button button--secondary"
          href="world.html"
        >
          ＋ 世界観
        </a>

        <a
          class="button button--primary"
          href="character.html"
        >
          ＋ キャラクター
        </a>
      `,
    },

    character: {
      eyebrow:
        "CHARACTER COLLECTION",

      title:
        "キャラクター一覧",

      description:
        "登録したキャラクターを検索・絞り込みできます。",

      actions: `
        <a
          class="button button--primary"
          href="character.html"
        >
          ＋ 新規キャラクター
        </a>
      `,
    },

    world: {
      eyebrow:
        "WORLD COLLECTION",

      title:
        "世界観一覧",

      description:
        "作品世界・舞台・文化・法則などの設定を管理できます。",

      actions: `
        <a
          class="button button--primary"
          href="world.html"
        >
          ＋ 新規世界観
        </a>
      `,
    },

    organization: {
      eyebrow:
        "ORGANIZATION COLLECTION",

      title:
        "組織・施設一覧",

      description:
        "組織・学校・企業・施設・勢力などの設定を管理できます。",

      actions: `
        <a
          class="button button--primary"
          href="organization.html"
        >
          ＋ 新規組織・施設
        </a>
      `,
    },

    glossary: {
      eyebrow:
        "GLOSSARY COLLECTION",

      title:
        "用語集",

      description:
        "作品固有の用語・概念・制度・名称などを管理できます。",

      actions: `
        <a
          class="button button--primary"
          href="glossary.html"
        >
          ＋ 新規用語
        </a>
      `,
    },

    item: {
      eyebrow:
        "ITEM COLLECTION",

      title:
        "アイテム一覧",

      description:
        "武器・道具・装備・遺物などの設定を管理できます。",

      actions: `
        <a
          class="button button--primary"
          href="item.html"
        >
          ＋ 新規アイテム
        </a>
      `,
    },
  };

  const MODULE_MAP = {
    character: {
      globalName:
        "CharacterList",

      type:
        "character",
    },

    world: {
      globalName:
        "WorldList",

      type:
        "world",
    },

    organization: {
      globalName:
        "OrganizationList",

      type:
        "organization",
    },

    glossary: {
      globalName:
        "GlossaryList",

      type:
        "glossary",
    },

    item: {
      globalName:
        "ItemList",

      type:
        "item",
    },
  };

  /* =======================================================
     State
  ======================================================= */

  const state = {
    activeView:
      "dashboard",

    initialized:
      false,
  };

  const elements = {};

  /* =======================================================
     Initialize
  ======================================================= */

  function initialize() {
    if (state.initialized) {
      return;
    }

    state.initialized =
      true;

    cacheElements();
    initializeModules();
    bindEvents();
    applyInitialView(false);
  }

  /* =======================================================
     DOM
  ======================================================= */

  function cacheElements() {
    elements.dashboardView =
      document.getElementById(
        "dashboardView"
      );

    elements.listView =
      document.getElementById(
        "listView"
      );

    elements.pageEyrow =
      document.getElementById(
        "pageEyebrow"
      );

    elements.pageEyebrow =
      document.getElementById(
        "pageEyebrow"
      );

    elements.pageTitle =
      document.getElementById(
        "pageTitle"
      );

    elements.pageDescription =
      document.getElementById(
        "pageDescription"
      );

    elements.topbarActions =
      document.getElementById(
        "topbarActions"
      );

    elements.viewButtons = [
      ...document.querySelectorAll(
        "[data-view]"
      ),
    ];

    elements.sidebarButtons = [
      ...document.querySelectorAll(
        ".sidebar__nav [data-view]"
      ),
    ];

    elements.contentTabs = [
      ...document.querySelectorAll(
        ".content-tab[data-view]"
      ),
    ];
  }

  /* =======================================================
     Events
  ======================================================= */

  function bindEvents() {
    elements.viewButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            const view =
              button.dataset.view;

            if (
              !AVAILABLE_VIEWS.includes(
                view
              )
            ) {
              return;
            }

            event.preventDefault();

            switchView(
              view
            );
          }
        );
      }
    );

    window.addEventListener(
      "popstate",
      () => {
        applyInitialView(
          false
        );
      }
    );

    window.addEventListener(
      "storage",
      () => {
        renderDashboard();

        if (
          state.activeView !==
          "dashboard"
        ) {
          renderActiveView();
        }
      }
    );
  }

  /* =======================================================
     Initial View
  ======================================================= */

  function applyInitialView(
    updateUrl = false
  ) {
    const parameters =
      new URLSearchParams(
        window.location.search
      );

    const requestedView =
      parameters.get(
        "type"
      );

    const nextView =
      AVAILABLE_VIEWS.includes(
        requestedView
      )
        ? requestedView
        : "dashboard";

    switchView(
      nextView,
      updateUrl
    );
  }

  /* =======================================================
     View Switching
  ======================================================= */

  function switchView(
    view,
    updateUrl = true
  ) {
    if (
      !AVAILABLE_VIEWS.includes(
        view
      )
    ) {
      console.warn(
        `未対応の画面です: ${view}`
      );

      return;
    }

    state.activeView =
      view;

    updateViewPanels();
    updateNavigation();
    updateHeader();
    renderActiveView();

    if (updateUrl) {
      updateBrowserUrl();
    }

    document.body.classList.remove(
      "is-menu-open"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateViewPanels() {
    const isDashboard =
      state.activeView ===
      "dashboard";

    if (
      elements.dashboardView
    ) {
      elements.dashboardView.hidden =
        !isDashboard;
    }

    if (
      elements.listView
    ) {
      elements.listView.hidden =
        isDashboard;
    }
  }

  /* =======================================================
     Navigation
  ======================================================= */

  function updateNavigation() {
    elements.sidebarButtons.forEach(
      (button) => {
        const isActive =
          button.dataset.view ===
          state.activeView;

        button.classList.toggle(
          "is-active",
          isActive
        );

        if (isActive) {
          button.setAttribute(
            "aria-current",
            "page"
          );
        } else {
          button.removeAttribute(
            "aria-current"
          );
        }
      }
    );

    elements.contentTabs.forEach(
      (tab) => {
        const isActive =
          tab.dataset.view ===
          state.activeView;

        tab.classList.toggle(
          "is-active",
          isActive
        );

        tab.setAttribute(
          "aria-selected",
          String(isActive)
        );

        tab.tabIndex =
          isActive
            ? 0
            : -1;
      }
    );

    elements.viewButtons.forEach(
      (button) => {
        const isActive =
          button.dataset.view ===
          state.activeView;

        button.classList.toggle(
          "is-active",
          isActive
        );
      }
    );
  }

  /* =======================================================
     Header
  ======================================================= */

  function updateHeader() {
    const configuration =
      VIEW_CONFIG[
        state.activeView
      ];

    if (!configuration) {
      return;
    }

    setText(
      elements.pageEyebrow,
      configuration.eyebrow
    );

    setText(
      elements.pageTitle,
      configuration.title
    );

    setText(
      elements.pageDescription,
      configuration.description
    );

    if (
      elements.topbarActions
    ) {
      elements.topbarActions.innerHTML =
        configuration.actions;
    }

    document.title =
      state.activeView ===
      "dashboard"
        ? "Creative Archive"
        : `${configuration.title} | Creative Archive`;
  }

  /* =======================================================
     Modules
  ======================================================= */

  function getModule(
    view
  ) {
    const moduleConfig =
      MODULE_MAP[view];

    if (!moduleConfig) {
      return null;
    }

    return (
      window[
        moduleConfig.globalName
      ] ||
      null
    );
  }

  function initializeModules() {
    Object.keys(
      MODULE_MAP
    ).forEach(
      (view) => {
        const module =
          getModule(view);

        if (
          module &&
          typeof module.initialize ===
            "function"
        ) {
          module.initialize();
        }
      }
    );
  }

  function renderActiveView() {
    if (
      state.activeView ===
      "dashboard"
    ) {
      renderDashboard();
      return;
    }

    const module =
      getModule(
        state.activeView
      );

    if (
      !module ||
      typeof module.render !==
        "function"
    ) {
      console.warn(
        `${state.activeView}の一覧モジュールが読み込まれていません。`
      );

      return;
    }

    module.render();
  }

  /* =======================================================
     Dashboard
  ======================================================= */

  function renderDashboard() {
    updateAllCounts();
    renderRecentItems();
  }

  function updateAllCounts() {
    Object.keys(
      MODULE_MAP
    ).forEach(
      (view) => {
        const module =
          getModule(view);

        if (
          module &&
          typeof module.updateCount ===
            "function"
        ) {
          module.updateCount();
        }
      }
    );
  }

  /* =======================================================
     Recent Items
  ======================================================= */

  function renderRecentItems() {
    const recentGrid =
      document.getElementById(
        "recentGrid"
      );

    const recentEmptyState =
      document.getElementById(
        "recentEmptyState"
      );

    if (
      !recentGrid ||
      !recentEmptyState
    ) {
      return;
    }

    const recentItems =
      getAllRecentItems()
        .sort(
          (
            itemA,
            itemB
          ) =>
            getDateValue(
              itemB.updatedAt ||
              itemB.createdAt
            ) -
            getDateValue(
              itemA.updatedAt ||
              itemA.createdAt
            )
        )
        .slice(
          0,
          6
        );

    recentGrid.innerHTML =
      "";

    if (
      recentItems.length ===
      0
    ) {
      recentGrid.hidden =
        true;

      recentEmptyState.hidden =
        false;

      return;
    }

    recentGrid.hidden =
      false;

    recentEmptyState.hidden =
      true;

    const fragment =
      document.createDocumentFragment();

    recentItems.forEach(
      (item) => {
        const card =
          createRecentCard(
            item
          );

        if (card) {
          fragment.appendChild(
            card
          );
        }
      }
    );

    recentGrid.appendChild(
      fragment
    );
  }

  function getAllRecentItems() {
    const items = [];

    Object.keys(
      MODULE_MAP
    ).forEach(
      (view) => {
        const module =
          getModule(view);

        if (
          !module ||
          typeof module.getRecentItems !==
            "function"
        ) {
          return;
        }

        const moduleItems =
          module.getRecentItems();

        if (
          Array.isArray(
            moduleItems
          )
        ) {
          items.push(
            ...moduleItems
          );
        }
      }
    );

    return items;
  }

  function createRecentCard(
    item
  ) {
    const view =
      getViewFromItemType(
        item.__type
      );

    if (!view) {
      return null;
    }

    const module =
      getModule(view);

    if (
      !module ||
      typeof module.createCard !==
        "function"
    ) {
      return null;
    }

    return module.createCard(
      item,
      true
    );
  }

  function getViewFromItemType(
    type
  ) {
    const matchedEntry =
      Object.entries(
        MODULE_MAP
      ).find(
        (
          [
            view,
            configuration,
          ]
        ) =>
          configuration.type ===
          type
      );

    return matchedEntry
      ? matchedEntry[0]
      : "";
  }

  /* =======================================================
     URL
  ======================================================= */

  function updateBrowserUrl() {
    const url =
      new URL(
        window.location.href
      );

    if (
      state.activeView ===
      "dashboard"
    ) {
      url.searchParams.delete(
        "type"
      );
    } else {
      url.searchParams.set(
        "type",
        state.activeView
      );
    }

    window.history.pushState(
      {},
      "",
      url.toString()
    );
  }

  /* =======================================================
     Helpers
  ======================================================= */

  function setText(
    element,
    value
  ) {
    if (!element) {
      return;
    }

    element.textContent =
      String(
        value ??
        ""
      );
  }

  function getDateValue(
    value
  ) {
    const date =
      new Date(
        value ||
        0
      );

    return Number.isNaN(
      date.getTime()
    )
      ? 0
      : date.getTime();
  }

  /* =======================================================
     Public API
  ======================================================= */

  function getActiveView() {
    return state.activeView;
  }

  return {
    initialize,
    switchView,
    renderDashboard,
    renderRecentItems,
    updateAllCounts,
    getActiveView,
  };
})();