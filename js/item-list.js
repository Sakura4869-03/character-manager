"use strict";

/* =========================================================
   Creative Archive
   item-list.js
   アイテム一覧／検索／絞り込み
========================================================= */

window.ItemList = (() => {
  const STORAGE_KEY =
    "characterArchiveItems";

  const DEFAULT_COLOR =
    "#4F9D8B";

  const state = {
    items: [],

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
    loadItems();
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
        "dashboardItemCount"
      );

    elements.sidebarCount =
      document.getElementById(
        "sidebarItemCount"
      );

    elements.tabCount =
      document.getElementById(
        "itemTabCount"
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

  function handleStorageChange(
    event
  ) {
    if (
      event.key !==
      STORAGE_KEY
    ) {
      return;
    }

    loadItems();
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

  function loadItems() {
    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage.getItems ===
        "function"
    ) {
      const items =
        storage.getItems();

      state.items =
        Array.isArray(items)
          ? items
          : [];

      return;
    }

    try {
      const parsed =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY
          ) || "[]"
        );

      state.items =
        Array.isArray(parsed)
          ? parsed
          : [];
    } catch (error) {
      console.error(
        "アイテムデータを読み込めませんでした。",
        error
      );

      state.items = [];
    }
  }

  function getStorageApi() {
    return (
      window.CharacterStorage ||
      window.CreativeStorage ||
      null
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  function render() {
    loadItems();
    updateCount();
    prepareControls();

    const filteredItems =
      getFilteredItems();

    setText(
      elements.resultCount,
      filteredItems.length
    );

    setText(
      elements.resultUnit,
      "items"
    );

    if (
      !elements.archiveGrid
    ) {
      return;
    }

    elements.archiveGrid.innerHTML =
      "";

    if (
      state.items.length ===
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
        item,
        index
      ) => {
        const card =
          createCard(
            item
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
        "アイテム名・作品・種類・能力・タグから検索";

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
          state.items
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

    state.items.forEach(
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
        state.items.length
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

  function getFilteredItems() {
    let items = [
      ...state.items,
    ];

    if (
      state.searchKeyword
    ) {
      items =
        items.filter(
          matchesSearchKeyword
        );
    }

    if (
      state.selectedCategory
    ) {
      items =
        items.filter(
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
      items =
        items.filter(
          (item) =>
            normalizeTags(
              item.tags
            ).includes(
              state.selectedTag
            )
        );
    }

    sortItems(items);

    return items;
  }

  function matchesSearchKeyword(
    item
  ) {
    const searchableValues = [
      item.name,
      item.reading,
      item.work,
      item.series,
      item.category,
      item.type,
      item.rarity,
      item.owner,
      item.creator,
      item.origin,
      item.location,
      item.summary,
      item.description,
      item.appearance,
      item.material,
      item.abilities,
      item.effect,
      item.power,
      item.usage,
      item.conditions,
      item.limitations,
      item.history,
      item.relatedCharacters,
      item.relatedOrganizations,
      item.relatedItems,
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

  function sortItems(
    items
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
            itemA.name,
            itemB.name
          ),

      "name-desc":
        (
          itemA,
          itemB
        ) =>
          compareJapaneseText(
            itemB.name,
            itemA.name
          ),
    };

    const sortFunction =
      sortFunctions[
        state.sortType
      ] ||
      sortFunctions[
        "updated-desc"
      ];

    items.sort(
      sortFunction
    );
  }

  /* =======================================================
     Card
  ======================================================= */

  function createCard(
    item,
    showType = false
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "archive-card archive-card--item fade-up";

    const id =
      encodeURIComponent(
        String(
          item.id ||
          ""
        )
      );

    const rawName =
      String(
        item.name ||
        ""
      ).trim();

    const name =
      escapeHtml(
        rawName ||
        "アイテム名未設定"
      );

    const work =
      escapeHtml(
        item.work ||
        item.series ||
        "作品未設定"
      );

    const category =
      escapeHtml(
        item.category ||
        item.type ||
        ""
      );

    const summary =
      escapeHtml(
        item.summary ||
        item.description ||
        item.abilities ||
        item.effect ||
        "アイテムの説明はまだ登録されていません。"
      );

    const color =
      isValidColor(
        item.themeColor
      )
        ? item.themeColor
        : DEFAULT_COLOR;

    const imagePosition =
      getSafeImagePosition(
        item.imagePosition
      );

    const imageMarkup =
      createImageMarkup(
        item.image,
        rawName,
        imagePosition
      );

    const tagMarkup =
      createTagMarkup(
        normalizeTags(
          item.tags
        )
      );

    const updatedText =
      formatRelativeDate(
        item.updatedAt
      ) ||
      "更新日不明";

    article.innerHTML = `
      <a
        class="archive-card__link"
        href="item.html?id=${id}"
        aria-label="${escapeAttribute(
          `${
            rawName ||
            "アイテム名未設定"
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
                  ITEM
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
            "アイテム画像"
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
        : "◇";

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
      "まだアイテムが登録されていません"
    );

    setText(
      elements.emptyDescription,
      "最初のアイテム設定を作成してみましょう。"
    );

    if (
      elements.emptyCreateLink
    ) {
      elements.emptyCreateLink.href =
        "item.html";

      elements.emptyCreateLink.textContent =
        "＋ アイテムを作成";
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
        ◇
      </div>

      <h2>
        該当するアイテムが見つかりません
      </h2>

      <p>
        検索ワードや絞り込み条件を変更してください。
      </p>

      <button
        class="button button--secondary"
        type="button"
        data-clear-item-filter
        style="margin-top:18px;"
      >
        絞り込みを解除
      </button>
    `;

    wrapper
      .querySelector(
        "[data-clear-item-filter]"
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
    loadItems();

    const count =
      state.items.length;

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
    loadItems();

    return state.items.map(
      (item) => ({
        ...item,

        __type:
          "item",
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
      "item"
    );
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