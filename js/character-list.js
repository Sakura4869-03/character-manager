"use strict";

/* =========================================================
   Creative Archive
   character-list.js
   キャラクター一覧・検索・絞り込み
========================================================= */

window.CharacterList = (() => {
  
  const DEFAULT_COLOR =
    "#738CFF";

  const state = {
    characters: [],

    searchKeyword: "",

    selectedWork: "",

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
    loadCharacters();
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
        "dashboardCharacterCount"
      );

    elements.sidebarCount =
      document.getElementById(
        "sidebarCharacterCount"
      );

    elements.tabCount =
      document.getElementById(
        "characterTabCount"
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

          state.selectedWork =
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
    loadCharacters();
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

  function loadCharacters() {
    try {
      const characters =
        getStorageApi()
          .getCharacters();

      state.characters =
        Array.isArray(
          characters
        )
          ? characters
          : [];
    } catch (error) {
      console.error(
        "キャラクターデータを読み込めませんでした。",
        error
      );

      state.characters = [];
    }
  }

  /* =======================================================
     Public Render
  ======================================================= */

  function render() {
    loadCharacters();
    updateCount();
    prepareControls();

    const filteredCharacters =
      getFilteredCharacters();

    setText(
      elements.resultCount,
      filteredCharacters.length
    );

    setText(
      elements.resultUnit,
      "characters"
    );

    if (
      !elements.archiveGrid
    ) {
      return;
    }

    elements.archiveGrid.innerHTML =
      "";

    if (
      state.characters.length ===
      0
    ) {
      showInitialEmptyState();
      return;
    }

    hideInitialEmptyState();

    if (
      filteredCharacters.length ===
      0
    ) {
      renderSearchEmpty();
      return;
    }

    const fragment =
      document.createDocumentFragment();

    filteredCharacters.forEach(
      (
        character,
        index
      ) => {
        const card =
          createCard(
            character
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
        "名前・作品・タグ・設定から検索";

      elements.searchInput.value =
        state.searchKeyword;
    }

    if (
      elements.workFilterWrap
    ) {
      elements.workFilterWrap.hidden =
        false;
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
    updateWorkFilter();
    updateTagFilter();
  }

  function updateWorkFilter() {
    if (
      !elements.workFilter
    ) {
      return;
    }

    const currentValue =
      state.selectedWork;

    const works =
      Array.from(
        new Set(
          state.characters
            .map(
              (character) =>
                String(
                  character.work ||
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
        "すべての作品"
      )
    );

    works.forEach(
      (work) => {
        elements.workFilter
          .appendChild(
            createOption(
              work,
              work
            )
          );
      }
    );

    if (
      works.includes(
        currentValue
      )
    ) {
      elements.workFilter.value =
        currentValue;
    } else {
      state.selectedWork = "";

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

    state.characters.forEach(
      (character) => {
        normalizeTags(
          character.tags
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
        state.characters.length
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

  function getFilteredCharacters() {
    let characters = [
      ...state.characters,
    ];

    if (
      state.searchKeyword
    ) {
      characters =
        characters.filter(
          matchesSearchKeyword
        );
    }

    if (
      state.selectedWork
    ) {
      characters =
        characters.filter(
          (character) =>
            String(
              character.work ||
              ""
            ) ===
            state.selectedWork
        );
    }

    if (
      state.selectedTag
    ) {
      characters =
        characters.filter(
          (character) =>
            normalizeTags(
              character.tags
            ).includes(
              state.selectedTag
            )
        );
    }

    sortCharacters(
      characters
    );

    return characters;
  }

  function matchesSearchKeyword(
    character
  ) {
    const searchableValues = [
      character.name,
      character.reading,
      character.title,
      character.work,
      character.age,
      character.gender,
      character.schoolYear,
      character.className,
      character.affiliation,
      character.motif,
      character.summary,
      character.appearance,
      character.personality,
      character.speech,
      character.likes,
      character.dislikes,
      character.abilities,
      character.background,
      character.relationships,
      character.costume,
      character.notes,
      ...normalizeTags(
        character.tags
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

  function sortCharacters(
    characters
  ) {
    const sortFunctions = {
      "updated-desc":
        (
          characterA,
          characterB
        ) =>
          getDateValue(
            characterB.updatedAt
          ) -
          getDateValue(
            characterA.updatedAt
          ),

      "updated-asc":
        (
          characterA,
          characterB
        ) =>
          getDateValue(
            characterA.updatedAt
          ) -
          getDateValue(
            characterB.updatedAt
          ),

      "created-desc":
        (
          characterA,
          characterB
        ) =>
          getDateValue(
            characterB.createdAt
          ) -
          getDateValue(
            characterA.createdAt
          ),

      "created-asc":
        (
          characterA,
          characterB
        ) =>
          getDateValue(
            characterA.createdAt
          ) -
          getDateValue(
            characterB.createdAt
          ),

      "name-asc":
        (
          characterA,
          characterB
        ) =>
          compareJapaneseText(
            characterA.name,
            characterB.name
          ),

      "name-desc":
        (
          characterA,
          characterB
        ) =>
          compareJapaneseText(
            characterB.name,
            characterA.name
          ),
    };

    const sortFunction =
      sortFunctions[
        state.sortType
      ] ||
      sortFunctions[
        "updated-desc"
      ];

    characters.sort(
      sortFunction
    );
  }

  /* =======================================================
     Card
  ======================================================= */

  function createCard(
    character,
    showType = false
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "archive-card archive-card--character fade-up";

    const id =
      encodeURIComponent(
        String(
          character.id ||
          ""
        )
      );

    const rawName =
      String(
        character.name ||
        ""
      ).trim();

    const name =
      escapeHtml(
        rawName ||
        "名前未設定"
      );

    const work =
      escapeHtml(
        character.work ||
        "作品未設定"
      );

    const title =
      escapeHtml(
        character.title ||
        ""
      );

    const summary =
      escapeHtml(
        character.summary ||
        character.personality ||
        "キャラクターの説明はまだ登録されていません。"
      );

    const color =
      isValidColor(
        character.themeColor
      )
        ? character.themeColor
        : DEFAULT_COLOR;

    const imagePosition =
      getSafeImagePosition(
        character.imagePosition
      );

    const imageMarkup =
      createImageMarkup(
        character.image,
        rawName,
        imagePosition
      );

    const tagMarkup =
      createTagMarkup(
        normalizeTags(
          character.tags
        )
      );

    const updatedText =
      formatRelativeDate(
        character.updatedAt
      ) ||
      "更新日不明";

    article.innerHTML = `
      <a
        class="archive-card__link"
        href="character.html?id=${id}"
        aria-label="${escapeAttribute(
          `${
            rawName ||
            "名前未設定"
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
                  CHARACTER
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
            title
              ? `
                <p class="archive-card__title">
                  ${title}
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
            "キャラクター画像"
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
        : "✦";

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
      "まだキャラクターが登録されていません"
    );

    setText(
      elements.emptyDescription,
      "最初のキャラクター設定を作成してみましょう。"
    );

    if (
      elements.emptyCreateLink
    ) {
      elements.emptyCreateLink.href =
        "character.html";

      elements.emptyCreateLink.textContent =
        "＋ キャラクターを作成";
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
        ✦
      </div>

      <h2>
        該当するキャラクターが見つかりません
      </h2>

      <p>
        検索ワードや絞り込み条件を変更してください。
      </p>

      <button
        class="button button--secondary"
        type="button"
        data-clear-character-filter
        style="margin-top:18px;"
      >
        絞り込みを解除
      </button>
    `;

    wrapper
      .querySelector(
        "[data-clear-character-filter]"
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

    state.selectedWork =
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
    loadCharacters();

    const count =
      state.characters.length;

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
    loadCharacters();

    return state.characters.map(
      (character) => ({
        ...character,

        __type:
          "character",
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
      "character"
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