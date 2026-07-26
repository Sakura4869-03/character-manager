"use strict";

/* =========================================================
   Creative Archive
   world-list.js
   世界観一覧・検索・絞り込み
========================================================= */

window.WorldList = (() => {
  const STORAGE_KEY =
    "characterArchiveWorlds";

  const DEFAULT_COLOR =
    "#5B67B7";

  const state = {
    worlds: [],

    searchKeyword: "",

    selectedSeries: "",

    selectedTag: "",

    sortType:
      "updated-desc",

    initialized: false,
  };

  const elements = {};

  /* =======================================================
     Initialize
  ======================================================= */

  function initialize() {
    if (state.initialized) {
      return;
    }

    state.initialized = true;

    cacheElements();
    bindEvents();
    loadWorlds();
    updateCount();
  }

  /* =======================================================
     DOM
  ======================================================= */

  function cacheElements() {
    elements.searchInput =
      document.getElementById(
        "searchInput"
      );

    elements.workFilter =
      document.getElementById(
        "workFilter"
      );

    elements.workFilterWrap =
      document.getElementById(
        "workFilterWrap"
      );

    elements.sortSelect =
      document.getElementById(
        "sortSelect"
      );

    elements.tagFilter =
      document.getElementById(
        "tagFilter"
      );

    elements.resultCount =
      document.getElementById(
        "resultCount"
      );

    elements.resultUnit =
      document.getElementById(
        "resultUnit"
      );

    elements.archiveGrid =
      document.getElementById(
        "archiveGrid"
      );

    elements.emptyState =
      document.getElementById(
        "emptyState"
      );

    elements.emptyTitle =
      document.getElementById(
        "emptyTitle"
      );

    elements.emptyDescription =
      document.getElementById(
        "emptyDescription"
      );

    elements.emptyCreateLink =
      document.getElementById(
        "emptyCreateLink"
      );

    elements.dashboardCount =
      document.getElementById(
        "dashboardWorldCount"
      );

    elements.sidebarCount =
      document.getElementById(
        "sidebarWorldCount"
      );

    elements.tabCount =
      document.getElementById(
        "worldTabCount"
      );
  }

  /* =======================================================
     Events
  ======================================================= */

  function bindEvents() {
    elements.searchInput
      ?.addEventListener(
        "input",
        (event) => {
          if (!isActiveView()) {
            return;
          }

          state.searchKeyword =
            String(
              event.target.value ||
              ""
            )
              .trim()
              .toLowerCase();

          render();
        }
      );

    elements.workFilter
      ?.addEventListener(
        "change",
        (event) => {
          if (!isActiveView()) {
            return;
          }

          state.selectedSeries =
            String(
              event.target.value ||
              ""
            );

          render();
        }
      );

    elements.sortSelect
      ?.addEventListener(
        "change",
        (event) => {
          if (!isActiveView()) {
            return;
          }

          state.sortType =
            String(
              event.target.value ||
              "updated-desc"
            );

          render();
        }
      );

    elements.tagFilter
      ?.addEventListener(
        "click",
        (event) => {
          if (!isActiveView()) {
            return;
          }

          const button =
            event.target.closest(
              "[data-tag]"
            );

          if (!button) {
            return;
          }

          state.selectedTag =
            button.dataset.tag ||
            "";

          updateActiveTagButton();
          render();
        }
      );

    window.addEventListener(
      "storage",
      handleStorageChange
    );
  }

  function handleStorageChange(
    event
  ) {
    if (
      event.key !==
      STORAGE_KEY
    ) {
      return;
    }

    loadWorlds();
    updateCount();

    if (isActiveView()) {
      updateFilters();
      render();
    }

    window.CreativeDashboard
      ?.renderRecentItems?.();
  }

  /* =======================================================
     Storage
  ======================================================= */

  function loadWorlds() {
    try {
      const parsed =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY
          ) || "[]"
        );

      state.worlds =
        Array.isArray(parsed)
          ? parsed
          : [];
    } catch (error) {
      console.error(
        "世界観データを読み込めませんでした。",
        error
      );

      state.worlds = [];
    }
  }

  /* =======================================================
     Public Render
  ======================================================= */

  function render() {
    loadWorlds();
    updateCount();
    prepareControls();

    const filteredWorlds =
      getFilteredWorlds();

    setText(
      elements.resultCount,
      filteredWorlds.length
    );

    setText(
      elements.resultUnit,
      "worlds"
    );

    if (
      !elements.archiveGrid
    ) {
      return;
    }

    elements.archiveGrid.innerHTML =
      "";

    if (
      state.worlds.length ===
      0
    ) {
      showInitialEmptyState();
      return;
    }

    hideInitialEmptyState();

    if (
      filteredWorlds.length ===
      0
    ) {
      renderSearchEmpty();
      return;
    }

    const fragment =
      document.createDocumentFragment();

    filteredWorlds.forEach(
      (
        world,
        index
      ) => {
        const card =
          createCard(
            world
          );

        card.style.animationDelay =
          `${Math.min(
            index * 35,
            280
          )}ms`;

        fragment.appendChild(
          card
        );
      }
    );

    elements.archiveGrid.appendChild(
      fragment
    );
  }

  /* =======================================================
     Controls
  ======================================================= */

  function prepareControls() {
    if (
      elements.searchInput
    ) {
      elements.searchInput.placeholder =
        "世界観名・作品・タグ・設定から検索";

      elements.searchInput.value =
        state.searchKeyword;
    }

    if (
      elements.workFilterWrap
    ) {
      elements.workFilterWrap.hidden =
        false;

      const label =
        elements.workFilterWrap
          .querySelector(
            ".select-box__label"
          );

      if (label) {
        label.textContent =
          "シリーズ";
      }
    }

    if (
      elements.sortSelect
    ) {
      elements.sortSelect.value =
        state.sortType;
    }

    updateFilters();
  }

  function updateFilters() {
    updateSeriesFilter();
    updateTagFilter();
  }

  function updateSeriesFilter() {
    if (
      !elements.workFilter
    ) {
      return;
    }

    const currentValue =
      state.selectedSeries;

    const seriesList =
      Array.from(
        new Set(
          state.worlds
            .map(
              (world) =>
                String(
                  world.series ||
                  ""
                ).trim()
            )
            .filter(Boolean)
        )
      ).sort(
        compareJapaneseText
      );

    elements.workFilter.innerHTML =
      "";

    elements.workFilter.appendChild(
      createOption(
        "",
        "すべてのシリーズ"
      )
    );

    seriesList.forEach(
      (series) => {
        elements.workFilter
          .appendChild(
            createOption(
              series,
              series
            )
          );
      }
    );

    if (
      seriesList.includes(
        currentValue
      )
    ) {
      elements.workFilter.value =
        currentValue;
    } else {
      state.selectedSeries = "";

      elements.workFilter.value =
        "";
    }
  }

  function updateTagFilter() {
    if (
      !elements.tagFilter
    ) {
      return;
    }

    const tagCounts =
      new Map();

    state.worlds.forEach(
      (world) => {
        normalizeTags(
          world.tags
        ).forEach(
          (tag) => {
            tagCounts.set(
              tag,
              (
                tagCounts.get(
                  tag
                ) || 0
              ) + 1
            );
          }
        );
      }
    );

    const sortedTags =
      Array.from(
        tagCounts.entries()
      ).sort(
        (
          [tagA, countA],
          [tagB, countB]
        ) => {
          if (
            countA !== countB
          ) {
            return (
              countB -
              countA
            );
          }

          return compareJapaneseText(
            tagA,
            tagB
          );
        }
      );

    elements.tagFilter.innerHTML =
      "";

    elements.tagFilter.appendChild(
      createTagButton(
        "",
        "すべて",
        state.worlds.length
      )
    );

    sortedTags.forEach(
      ([tag, count]) => {
        elements.tagFilter
          .appendChild(
            createTagButton(
              tag,
              tag,
              count
            )
          );
      }
    );

    const selectedTagExists =
      sortedTags.some(
        ([tag]) =>
          tag ===
          state.selectedTag
      );

    if (
      state.selectedTag &&
      !selectedTagExists
    ) {
      state.selectedTag =
        "";
    }

    updateActiveTagButton();
  }

  function createOption(
    value,
    label
  ) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      value;

    option.textContent =
      label;

    return option;
  }

  function createTagButton(
    value,
    label,
    count
  ) {
    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "tag-chip";

    button.dataset.tag =
      value;

    button.textContent =
      `${label} ${count}`;

    return button;
  }

  function updateActiveTagButton() {
    elements.tagFilter
      ?.querySelectorAll(
        "[data-tag]"
      )
      .forEach(
        (button) => {
          const active =
            button.dataset.tag ===
            state.selectedTag;

          button.classList.toggle(
            "is-active",
            active
          );

          button.setAttribute(
            "aria-pressed",
            String(active)
          );
        }
      );
  }

  /* =======================================================
     Filter / Sort
  ======================================================= */

  function getFilteredWorlds() {
    let worlds = [
      ...state.worlds,
    ];

    if (
      state.searchKeyword
    ) {
      worlds =
        worlds.filter(
          matchesSearchKeyword
        );
    }

    if (
      state.selectedSeries
    ) {
      worlds =
        worlds.filter(
          (world) =>
            String(
              world.series ||
              ""
            ) ===
            state.selectedSeries
        );
    }

    if (
      state.selectedTag
    ) {
      worlds =
        worlds.filter(
          (world) =>
            normalizeTags(
              world.tags
            ).includes(
              state.selectedTag
            )
        );
    }

    sortWorlds(
      worlds
    );

    return worlds;
  }

  function matchesSearchKeyword(
    world
  ) {
    const searchableValues = [
      world.name,
      world.reading,
      world.series,
      world.genre,
      world.era,
      world.summary,
      world.origin,
      world.geography,
      world.history,
      world.society,
      world.organizations,
      world.species,
      world.culture,
      world.powerSystem,
      world.rules,
      world.terminology,
      world.storyPremise,
      world.characterRelations,
      world.notes,
      world.promptJa,
      world.promptEn,
      ...normalizeTags(
        world.tags
      ),
    ];

    return searchableValues
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(
        state.searchKeyword
      );
  }

  function sortWorlds(
    worlds
  ) {
    const sortFunctions = {
      "updated-desc":
        (
          worldA,
          worldB
        ) =>
          getDateValue(
            worldB.updatedAt
          ) -
          getDateValue(
            worldA.updatedAt
          ),

      "updated-asc":
        (
          worldA,
          worldB
        ) =>
          getDateValue(
            worldA.updatedAt
          ) -
          getDateValue(
            worldB.updatedAt
          ),

      "created-desc":
        (
          worldA,
          worldB
        ) =>
          getDateValue(
            worldB.createdAt
          ) -
          getDateValue(
            worldA.createdAt
          ),

      "created-asc":
        (
          worldA,
          worldB
        ) =>
          getDateValue(
            worldA.createdAt
          ) -
          getDateValue(
            worldB.createdAt
          ),

      "name-asc":
        (
          worldA,
          worldB
        ) =>
          compareJapaneseText(
            worldA.name,
            worldB.name
          ),

      "name-desc":
        (
          worldA,
          worldB
        ) =>
          compareJapaneseText(
            worldB.name,
            worldA.name
          ),
    };

    const sortFunction =
      sortFunctions[
        state.sortType
      ] ||
      sortFunctions[
        "updated-desc"
      ];

    worlds.sort(
      sortFunction
    );
  }

  /* =======================================================
     Card
  ======================================================= */

  function createCard(
    world,
    showType = false
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "archive-card archive-card--world fade-up";

    const id =
      encodeURIComponent(
        String(
          world.id ||
          ""
        )
      );

    const rawName =
      String(
        world.name ||
        ""
      ).trim();

    const name =
      escapeHtml(
        rawName ||
        "世界観名未設定"
      );

    const series =
      escapeHtml(
        world.series ||
        "作品未設定"
      );

    const genre =
      escapeHtml(
        world.genre ||
        ""
      );

    const summary =
      escapeHtml(
        world.summary ||
        world.storyPremise ||
        "世界観の説明はまだ登録されていません。"
      );

    const color =
      isValidColor(
        world.themeColor
      )
        ? world.themeColor
        : DEFAULT_COLOR;

    const imagePosition =
      getSafeImagePosition(
        world.imagePosition
      );

    const imageMarkup =
      createImageMarkup(
        world.image,
        rawName,
        imagePosition
      );

    const tagMarkup =
      createTagMarkup(
        normalizeTags(
          world.tags
        )
      );

    const updatedText =
      formatRelativeDate(
        world.updatedAt
      ) ||
      "更新日不明";

    article.innerHTML = `
      <a
        class="archive-card__link"
        href="world.html?id=${id}"
        aria-label="${escapeAttribute(
          `${
            rawName ||
            "世界観名未設定"
          }の詳細を開く`
        )}"
      >
        <div class="archive-card__media">
          ${imageMarkup}

          <span
            class="archive-card__color"
            style="
              color: ${escapeAttribute(
                color
              )};
              background-color: ${escapeAttribute(
                color
              )};
            "
            aria-hidden="true"
          ></span>

          ${
            showType
              ? `
                <span class="archive-card__badge">
                  WORLD
                </span>
              `
              : ""
          }
        </div>

        <div class="archive-card__body">
          <p class="archive-card__work">
            ${series}
          </p>

          <h2>
            ${name}
          </h2>

          ${
            genre
              ? `
                <p class="archive-card__title">
                  ${genre}
                </p>
              `
              : ""
          }

          <p class="archive-card__summary">
            ${summary}
          </p>

          ${
            tagMarkup
              ? `
                <div class="archive-card__tags">
                  ${tagMarkup}
                </div>
              `
              : ""
          }

          <div class="archive-card__meta">
            <span>
              ${escapeHtml(
                updatedText
              )}
            </span>

            <span class="archive-card__edit">
              詳細・編集 →
            </span>
          </div>
        </div>
      </a>
    `;

    return article;
  }

  function createImageMarkup(
    imageValue,
    nameValue,
    imagePosition
  ) {
    const image =
      String(
        imageValue ||
        ""
      ).trim();

    const name =
      String(
        nameValue ||
        ""
      ).trim();

    if (image) {
      return `
        <img
          src="${escapeAttribute(
            image
          )}"
          alt="${escapeAttribute(
            name ||
            "世界観イメージ"
          )}"
          loading="lazy"
          decoding="async"
          style="object-position:${escapeAttribute(
            imagePosition
          )};"
        >
      `;
    }

    const initial =
      name
        ? Array.from(
            name
          )[0]
        : "◎";

    return `
      <div
        class="archive-card__placeholder"
        aria-hidden="true"
      >
        ${escapeHtml(
          initial
        )}
      </div>
    `;
  }

  function createTagMarkup(
    tags
  ) {
    if (!tags.length) {
      return "";
    }

    const visibleTags =
      tags.slice(
        0,
        3
      );

    const markup =
      visibleTags
        .map(
          (tag) => `
            <span class="archive-card__tag">
              ${escapeHtml(
                tag
              )}
            </span>
          `
        )
        .join("");

    const remainingCount =
      tags.length -
      visibleTags.length;

    if (
      remainingCount <= 0
    ) {
      return markup;
    }

    return `
      ${markup}

      <span class="archive-card__tag">
        +${remainingCount}
      </span>
    `;
  }

  /* =======================================================
     Empty State
  ======================================================= */

  function showInitialEmptyState() {
    if (
      elements.emptyState
    ) {
      elements.emptyState.hidden =
        false;
    }

    if (
      elements.archiveGrid
    ) {
      elements.archiveGrid.hidden =
        true;
    }

    setText(
      elements.emptyTitle,
      "まだ世界観が登録されていません"
    );

    setText(
      elements.emptyDescription,
      "最初の世界観設定を作成してみましょう。"
    );

    if (
      elements.emptyCreateLink
    ) {
      elements.emptyCreateLink.href =
        "world.html";

      elements.emptyCreateLink.textContent =
        "＋ 世界観を作成";
    }
  }

  function hideInitialEmptyState() {
    if (
      elements.emptyState
    ) {
      elements.emptyState.hidden =
        true;
    }

    if (
      elements.archiveGrid
    ) {
      elements.archiveGrid.hidden =
        false;
    }
  }

  function renderSearchEmpty() {
    if (
      !elements.archiveGrid
    ) {
      return;
    }

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "search-empty fade-up";

    wrapper.innerHTML = `
      <div
        class="search-empty__icon"
        aria-hidden="true"
      >
        ◎
      </div>

      <h2>
        該当する世界観が見つかりません
      </h2>

      <p>
        検索ワードや絞り込み条件を変更してください。
      </p>

      <button
        class="button button--secondary"
        type="button"
        data-clear-world-filter
        style="margin-top:18px;"
      >
        絞り込みを解除
      </button>
    `;

    wrapper
      .querySelector(
        "[data-clear-world-filter]"
      )
      ?.addEventListener(
        "click",
        clearFilters
      );

    elements.archiveGrid.appendChild(
      wrapper
    );
  }

  function clearFilters() {
    state.searchKeyword =
      "";

    state.selectedSeries =
      "";

    state.selectedTag =
      "";

    state.sortType =
      "updated-desc";

    if (
      elements.searchInput
    ) {
      elements.searchInput.value =
        "";
    }

    if (
      elements.workFilter
    ) {
      elements.workFilter.value =
        "";
    }

    if (
      elements.sortSelect
    ) {
      elements.sortSelect.value =
        "updated-desc";
    }

    updateFilters();
    render();
  }

  /* =======================================================
     Counts / Recent
  ======================================================= */

  function updateCount() {
    loadWorlds();

    const count =
      state.worlds.length;

    [
      elements.dashboardCount,
      elements.sidebarCount,
      elements.tabCount,
    ].forEach(
      (element) => {
        setText(
          element,
          count
        );
      }
    );
  }

  function getRecentItems() {
    loadWorlds();

    return state.worlds.map(
      (world) => ({
        ...world,

        __type:
          "world",
      })
    );
  }

  /* =======================================================
     Helpers
  ======================================================= */

  function isActiveView() {
    return (
      window.CreativeDashboard
        ?.getActiveView?.() ===
      "world"
    );
  }

  function normalizeTags(
    tags
  ) {
    if (
      Array.isArray(tags)
    ) {
      return [
        ...new Set(
          tags
            .map(
              (tag) =>
                String(
                  tag
                ).trim()
            )
            .filter(Boolean)
        ),
      ];
    }

    if (
      typeof tags ===
      "string"
    ) {
      return [
        ...new Set(
          tags
            .split(
              /[,、，\n]/
            )
            .map(
              (tag) =>
                tag.trim()
            )
            .filter(Boolean)
        ),
      ];
    }

    return [];
  }

  function getSafeImagePosition(
    value
  ) {
    const validPositions = [
      "center",
      "center top",
      "center bottom",
      "left center",
      "right center",
    ];

    return validPositions.includes(
      value
    )
      ? value
      : "center";
  }

  function isValidColor(
    value
  ) {
    return /^#[0-9A-Fa-f]{6}$/.test(
      String(
        value ||
        ""
      ).trim()
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

  function compareJapaneseText(
    valueA,
    valueB
  ) {
    return String(
      valueA ||
      ""
    ).localeCompare(
      String(
        valueB ||
        ""
      ),
      "ja",
      {
        numeric: true,
        sensitivity:
          "base",
      }
    );
  }

  function formatRelativeDate(
    value
  ) {
    const common =
      window.CharacterCommon;

    if (
      common &&
      typeof common.formatRelativeDate ===
        "function"
    ) {
      return common.formatRelativeDate(
        value
      );
    }

    if (!value) {
      return "";
    }

    const targetDate =
      new Date(value);

    if (
      Number.isNaN(
        targetDate.getTime()
      )
    ) {
      return "";
    }

    const diffMilliseconds =
      Date.now() -
      targetDate.getTime();

    const diffMinutes =
      Math.floor(
        diffMilliseconds /
        1000 /
        60
      );

    if (
      diffMinutes < 1
    ) {
      return "たった今";
    }

    if (
      diffMinutes < 60
    ) {
      return `${diffMinutes}分前`;
    }

    const diffHours =
      Math.floor(
        diffMinutes /
        60
      );

    if (
      diffHours < 24
    ) {
      return `${diffHours}時間前`;
    }

    const diffDays =
      Math.floor(
        diffHours /
        24
      );

    if (
      diffDays < 7
    ) {
      return `${diffDays}日前`;
    }

    return new Intl.DateTimeFormat(
      "ja-JP",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(
      targetDate
    );
  }

  function escapeHtml(
    value
  ) {
    const common =
      window.CharacterCommon;

    if (
      common &&
      typeof common.escapeHtml ===
        "function"
    ) {
      return common.escapeHtml(
        value
      );
    }

    return String(
      value ??
      ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  function escapeAttribute(
    value
  ) {
    const common =
      window.CharacterCommon;

    if (
      common &&
      typeof common.escapeAttribute ===
        "function"
    ) {
      return common.escapeAttribute(
        value
      );
    }

    return escapeHtml(
      value
    ).replace(
      /`/g,
      "&#096;"
    );
  }

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

  /* =======================================================
     Public API
  ======================================================= */

  return {
    initialize,
    render,
    updateCount,
    getRecentItems,
    createCard,
    clearFilters,
  };
})();