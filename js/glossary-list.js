"use strict";

/* =========================================================
   Creative Archive
   glossary-list.js
   用語集一覧／検索／絞り込み
========================================================= */

window.GlossaryList = (() => {
  const DEFAULT_COLOR =
    "#D08A45";

  const state = {
    glossaryItems: [],

    searchKeyword: "",

    selectedCategory: "",

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
    loadGlossaryItems();
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
        "dashboardGlossaryCount"
      );

    elements.sidebarCount =
      document.getElementById(
        "sidebarGlossaryCount"
      );

    elements.tabCount =
      document.getElementById(
        "glossaryTabCount"
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

          state.selectedCategory =
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

  function handleStorageChange() {
    loadGlossaryItems();
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

  function getStorageApi() {
    const storage =
      window.CreativeStorage;

    if (!storage) {
      throw new Error(
        "CreativeStorageが読み込まれていません。"
      );
    }

    return storage;
  }

  function loadGlossaryItems() {
    try {
      const glossaryItems =
        getStorageApi()
          .getGlossaryItems();

      state.glossaryItems =
        Array.isArray(
          glossaryItems
        )
          ? glossaryItems
          : [];
    } catch (error) {
      console.error(
        "用語集データを読み込めませんでした。",
        error
      );

      state.glossaryItems = [];
    }
  }

  /* =======================================================
     Render
  ======================================================= */
  function render() {
    loadGlossaryItems();
    updateCount();
    prepareControls();

    const filteredItems =
      getFilteredGlossaryItems();

    setText(
      elements.resultCount,
      filteredItems.length
    );

    setText(
      elements.resultUnit,
      "terms"
    );

    if (
      !elements.archiveGrid
    ) {
      return;
    }

    elements.archiveGrid.innerHTML =
      "";

    if (
      state.glossaryItems.length ===
      0
    ) {
      showInitialEmptyState();
      return;
    }

    hideInitialEmptyState();

    if (
      filteredItems.length ===
      0
    ) {
      renderSearchEmpty();
      return;
    }

    const fragment =
      document.createDocumentFragment();

    filteredItems.forEach(
      (
        glossaryItem,
        index
      ) => {
        const card =
          createCard(
            glossaryItem
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
        "用語名・読み・意味・作品・タグから検索";

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
          "分類";
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
    updateCategoryFilter();
    updateTagFilter();
  }

  function updateCategoryFilter() {
    if (
      !elements.workFilter
    ) {
      return;
    }

    const currentValue =
      state.selectedCategory;

    const categories =
      Array.from(
        new Set(
          state.glossaryItems
            .map(
              (item) =>
                String(
                  item.category ||
                  item.type ||
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
        "すべての分類"
      )
    );

    categories.forEach(
      (category) => {
        elements.workFilter
          .appendChild(
            createOption(
              category,
              category
            )
          );
      }
    );

    if (
      categories.includes(
        currentValue
      )
    ) {
      elements.workFilter.value =
        currentValue;
    } else {
      state.selectedCategory = "";

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

    state.glossaryItems.forEach(
      (item) => {
        normalizeTags(
          item.tags
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
        state.glossaryItems.length
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

  function getFilteredGlossaryItems() {
    let glossaryItems = [
      ...state.glossaryItems,
    ];

    if (
      state.searchKeyword
    ) {
      glossaryItems =
        glossaryItems.filter(
          matchesSearchKeyword
        );
    }

    if (
      state.selectedCategory
    ) {
      glossaryItems =
        glossaryItems.filter(
          (item) =>
            String(
              item.category ||
              item.type ||
              ""
            ) ===
            state.selectedCategory
        );
    }

    if (
      state.selectedTag
    ) {
      glossaryItems =
        glossaryItems.filter(
          (item) =>
            normalizeTags(
              item.tags
            ).includes(
              state.selectedTag
            )
        );
    }

    sortGlossaryItems(
      glossaryItems
    );

    return glossaryItems;
  }

  function matchesSearchKeyword(
    item
  ) {
    const searchableValues = [
      item.name,
      item.reading,
      item.term,
      item.word,
      item.work,
      item.series,
      item.category,
      item.type,
      item.summary,
      item.definition,
      item.meaning,
      item.description,
      item.origin,
      item.etymology,
      item.usage,
      item.example,
      item.relatedTerms,
      item.relatedCharacters,
      item.relatedOrganizations,
      item.notes,
      ...normalizeTags(
        item.tags
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

  function sortGlossaryItems(
    glossaryItems
  ) {
    const sortFunctions = {
      "updated-desc":
        (
          itemA,
          itemB
        ) =>
          getDateValue(
            itemB.updatedAt
          ) -
          getDateValue(
            itemA.updatedAt
          ),

      "updated-asc":
        (
          itemA,
          itemB
        ) =>
          getDateValue(
            itemA.updatedAt
          ) -
          getDateValue(
            itemB.updatedAt
          ),

      "created-desc":
        (
          itemA,
          itemB
        ) =>
          getDateValue(
            itemB.createdAt
          ) -
          getDateValue(
            itemA.createdAt
          ),

      "created-asc":
        (
          itemA,
          itemB
        ) =>
          getDateValue(
            itemA.createdAt
          ) -
          getDateValue(
            itemB.createdAt
          ),

      "name-asc":
        (
          itemA,
          itemB
        ) =>
          compareJapaneseText(
            getDisplayName(
              itemA
            ),
            getDisplayName(
              itemB
            )
          ),

      "name-desc":
        (
          itemA,
          itemB
        ) =>
          compareJapaneseText(
            getDisplayName(
              itemB
            ),
            getDisplayName(
              itemA
            )
          ),
    };

    const sortFunction =
      sortFunctions[
        state.sortType
      ] ||
      sortFunctions[
        "updated-desc"
      ];

    glossaryItems.sort(
      sortFunction
    );
  }

  /* =======================================================
     Card
  ======================================================= */

  function createCard(
    glossaryItem,
    showType = false
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "archive-card archive-card--glossary fade-up";

    const id =
      encodeURIComponent(
        String(
          glossaryItem.id ||
          ""
        )
      );

    const rawName =
      getDisplayName(
        glossaryItem
      );

    const name =
      escapeHtml(
        rawName ||
        "用語名未設定"
      );

    const reading =
      escapeHtml(
        glossaryItem.reading ||
        ""
      );

    const work =
      escapeHtml(
        glossaryItem.work ||
        glossaryItem.series ||
        "作品未設定"
      );

    const category =
      escapeHtml(
        glossaryItem.category ||
        glossaryItem.type ||
        ""
      );

    const summary =
      escapeHtml(
        glossaryItem.summary ||
        glossaryItem.definition ||
        glossaryItem.meaning ||
        glossaryItem.description ||
        "用語の説明はまだ登録されていません。"
      );

    const color =
      isValidColor(
        glossaryItem.themeColor
      )
        ? glossaryItem.themeColor
        : DEFAULT_COLOR;

    const tagMarkup =
      createTagMarkup(
        normalizeTags(
          glossaryItem.tags
        )
      );

    const updatedText =
      formatRelativeDate(
        glossaryItem.updatedAt
      ) ||
      "更新日不明";

    article.innerHTML = `
      <a
        class="archive-card__link"
        href="glossary.html?id=${id}"
        aria-label="${escapeAttribute(
          `${
            rawName ||
            "用語名未設定"
          }の詳細を開く`
        )}"
      >
        <div class="archive-card__media archive-card__media--text">
          <div
            class="archive-card__placeholder archive-card__placeholder--term"
            aria-hidden="true"
          >
            <span>
              Aa
            </span>
          </div>

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
                  GLOSSARY
                </span>
              `
              : ""
          }
        </div>

        <div class="archive-card__body">
          <p class="archive-card__work">
            ${work}
          </p>

          <h2>
            ${name}
          </h2>

          ${
            reading
              ? `
                <p class="archive-card__reading">
                  ${reading}
                </p>
              `
              : ""
          }

          ${
            category
              ? `
                <p class="archive-card__title">
                  ${category}
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
      "まだ用語が登録されていません"
    );

    setText(
      elements.emptyDescription,
      "最初の用語設定を作成してみましょう。"
    );

    if (
      elements.emptyCreateLink
    ) {
      elements.emptyCreateLink.href =
        "glossary.html";

      elements.emptyCreateLink.textContent =
        "＋ 用語を作成";
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
        Aa
      </div>

      <h2>
        該当する用語が見つかりません
      </h2>

      <p>
        検索ワードや絞り込み条件を変更してください。
      </p>

      <button
        class="button button--secondary"
        type="button"
        data-clear-glossary-filter
        style="margin-top:18px;"
      >
        絞り込みを解除
      </button>
    `;

    wrapper
      .querySelector(
        "[data-clear-glossary-filter]"
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

    state.selectedCategory =
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
     Count / Recent
  ======================================================= */

  function updateCount() {
    loadGlossaryItems();

    const count =
      state.glossaryItems.length;

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
    loadGlossaryItems();

    return state.glossaryItems.map(
      (item) => ({
        ...item,

        __type:
          "glossary",
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
      "glossary"
    );
  }

  function getDisplayName(
    item
  ) {
    return String(
      item.name ||
      item.term ||
      item.word ||
      ""
    ).trim();
  }

  function normalizeTags(
    tags
  ) {
    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage.normalizeTags ===
        "function"
    ) {
      return storage.normalizeTags(
        tags
      );
    }

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