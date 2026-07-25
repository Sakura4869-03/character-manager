/* ==========================================
   Character Archive
   Index Page
========================================== */

(function () {
  "use strict";

  const Storage = window.CharacterStorage;
  const Common = window.CharacterCommon;

  if (!Storage || !Common) {
    console.error(
      "CharacterStorage または CharacterCommon を読み込めませんでした。"
    );

    return;
  }

  const state = {
    characters: [],
    searchKeyword: "",
    selectedWork: "",
    selectedTag: "",
    sortType: "updated-desc"
  };

  const elements = {
    characterGrid: null,
    emptyState: null,
    resultCount: null,

    searchInput: null,
    workFilter: null,
    sortSelect: null,
    tagFilter: null,

    createButtons: [],
    backupButton: null,
    restoreButton: null,
    restoreInput: null
  };

  /* ==========================================
     Initialization
  ========================================== */

  function initialize() {
    cacheElements();
    bindEvents();
    loadCharacters();
    updateWorkFilter();
    updateTagFilter();
    renderCharacters();
  }

  function cacheElements() {
    elements.characterGrid =
      document.getElementById("characterGrid");

    elements.emptyState =
      document.getElementById("emptyState");

    elements.resultCount =
      document.getElementById("resultCount");

    elements.searchInput =
      document.getElementById("searchInput");

    elements.workFilter =
      document.getElementById("workFilter");

    elements.sortSelect =
      document.getElementById("sortSelect");

    elements.tagFilter =
      document.getElementById("tagFilter");

    elements.createButtons =
      Array.from(
        document.querySelectorAll(
          "[data-create-character]"
        )
      );

    elements.backupButton =
      document.getElementById("backupButton");

    elements.restoreButton =
      document.getElementById("restoreButton");

    elements.restoreInput =
      document.getElementById("restoreInput");
  }

  function bindEvents() {
    if (elements.searchInput) {
      elements.searchInput.addEventListener(
        "input",
        handleSearch
      );
    }

    if (elements.workFilter) {
      elements.workFilter.addEventListener(
        "change",
        handleWorkFilter
      );
    }

    if (elements.sortSelect) {
      elements.sortSelect.addEventListener(
        "change",
        handleSortChange
      );
    }

    if (elements.tagFilter) {
      elements.tagFilter.addEventListener(
        "click",
        handleTagFilter
      );
    }

    elements.createButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          goToCreatePage
        );
      }
    );

    if (elements.backupButton) {
      elements.backupButton.addEventListener(
        "click",
        handleBackup
      );
    }

    if (
      elements.restoreButton &&
      elements.restoreInput
    ) {
      elements.restoreButton.addEventListener(
        "click",
        () => {
          elements.restoreInput.click();
        }
      );

      elements.restoreInput.addEventListener(
        "change",
        handleRestore
      );
    }

    window.addEventListener(
      "storage",
      handleStorageChange
    );
  }

  /* ==========================================
     Data
  ========================================== */

  function loadCharacters() {
    state.characters =
      Storage.getCharacters();
  }

  function handleStorageChange(event) {
    if (
      event.key !==
      "characterArchive.characters"
    ) {
      return;
    }

    loadCharacters();
    updateWorkFilter();
    updateTagFilter();
    renderCharacters();

    Common.showToast(
      "別のタブで更新された内容を反映しました。"
    );
  }

  /* ==========================================
     Search / Filter / Sort
  ========================================== */

  function handleSearch(event) {
    state.searchKeyword =
      String(event.target.value || "")
        .trim()
        .toLowerCase();

    renderCharacters();
  }

  function handleWorkFilter(event) {
    state.selectedWork =
      event.target.value;

    renderCharacters();
  }

  function handleSortChange(event) {
    state.sortType =
      event.target.value;

    renderCharacters();
  }

  function handleTagFilter(event) {
    const button =
      event.target.closest(
        "[data-tag]"
      );

    if (!button) {
      return;
    }

    state.selectedTag =
      button.dataset.tag || "";

    updateActiveTagButton();
    renderCharacters();
  }

  function getFilteredCharacters() {
    let characters =
      [...state.characters];

    if (state.searchKeyword) {
      characters =
        characters.filter(
          matchesSearchKeyword
        );
    }

    if (state.selectedWork) {
      characters =
        characters.filter(
          (character) =>
            String(
              character.work || ""
            ) === state.selectedWork
        );
    }

    if (state.selectedTag) {
      characters =
        characters.filter(
          (character) => {
            const tags =
              Storage.normalizeTags(
                character.tags
              );

            return tags.includes(
              state.selectedTag
            );
          }
        );
    }

    sortCharacters(characters);

    return characters;
  }

  function matchesSearchKeyword(character) {
    const searchableValues = [
      character.name,
      character.reading,
      character.title,
      character.work,
      character.summary,
      character.appearance,
      character.personality,
      character.motif,
      character.affiliation,
      character.notes,
      ...Storage.normalizeTags(
        character.tags
      )
    ];

    const searchableText =
      searchableValues
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return searchableText.includes(
      state.searchKeyword
    );
  }

  function sortCharacters(characters) {
    const sortFunctions = {
      "updated-desc": (a, b) =>
        getDateValue(b.updatedAt) -
        getDateValue(a.updatedAt),

      "updated-asc": (a, b) =>
        getDateValue(a.updatedAt) -
        getDateValue(b.updatedAt),

      "created-desc": (a, b) =>
        getDateValue(b.createdAt) -
        getDateValue(a.createdAt),

      "created-asc": (a, b) =>
        getDateValue(a.createdAt) -
        getDateValue(b.createdAt),

      "name-asc": (a, b) =>
        compareJapaneseText(
          a.name,
          b.name
        ),

      "name-desc": (a, b) =>
        compareJapaneseText(
          b.name,
          a.name
        ),

      "work-asc": (a, b) =>
        compareJapaneseText(
          a.work,
          b.work
        )
    };

    const sortFunction =
      sortFunctions[state.sortType] ||
      sortFunctions["updated-desc"];

    characters.sort(sortFunction);
  }

  function getDateValue(dateString) {
    const date =
      new Date(dateString);

    const value =
      date.getTime();

    return Number.isNaN(value)
      ? 0
      : value;
  }

  function compareJapaneseText(
    valueA,
    valueB
  ) {
    return String(valueA || "")
      .localeCompare(
        String(valueB || ""),
        "ja",
        {
          numeric: true,
          sensitivity: "base"
        }
      );
  }

  /* ==========================================
     Work Filter
  ========================================== */

  function updateWorkFilter() {
    if (!elements.workFilter) {
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
                  character.work || ""
                ).trim()
            )
            .filter(Boolean)
        )
      ).sort(compareJapaneseText);

    elements.workFilter.innerHTML = "";

    const allOption =
      document.createElement("option");

    allOption.value = "";
    allOption.textContent =
      "すべての作品";

    elements.workFilter.appendChild(
      allOption
    );

    works.forEach(
      (work) => {
        const option =
          document.createElement(
            "option"
          );

        option.value = work;
        option.textContent = work;

        elements.workFilter.appendChild(
          option
        );
      }
    );

    if (works.includes(currentValue)) {
      elements.workFilter.value =
        currentValue;
    } else {
      state.selectedWork = "";
      elements.workFilter.value = "";
    }
  }

  /* ==========================================
     Tag Filter
  ========================================== */

  function updateTagFilter() {
    if (!elements.tagFilter) {
      return;
    }

    const tagCounts =
      new Map();

    state.characters.forEach(
      (character) => {
        const tags =
          Storage.normalizeTags(
            character.tags
          );

        tags.forEach(
          (tag) => {
            const currentCount =
              tagCounts.get(tag) || 0;

            tagCounts.set(
              tag,
              currentCount + 1
            );
          }
        );
      }
    );

    const sortedTags =
      Array.from(
        tagCounts.entries()
      ).sort(
        ([tagA, countA], [tagB, countB]) => {
          if (countA !== countB) {
            return countB - countA;
          }

          return compareJapaneseText(
            tagA,
            tagB
          );
        }
      );

    elements.tagFilter.innerHTML = "";

    const allButton =
      createTagButton(
        "",
        "すべて",
        state.characters.length
      );

    elements.tagFilter.appendChild(
      allButton
    );

    sortedTags.forEach(
      ([tag, count]) => {
        const button =
          createTagButton(
            tag,
            tag,
            count
          );

        elements.tagFilter.appendChild(
          button
        );
      }
    );

    const tagExists =
      sortedTags.some(
        ([tag]) =>
          tag === state.selectedTag
      );

    if (
      state.selectedTag &&
      !tagExists
    ) {
      state.selectedTag = "";
    }

    updateActiveTagButton();
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

    button.type = "button";
    button.className =
      "tag-chip";

    button.dataset.tag =
      value;

    button.textContent =
      `${label} ${count}`;

    return button;
  }

  function updateActiveTagButton() {
    if (!elements.tagFilter) {
      return;
    }

    const buttons =
      elements.tagFilter.querySelectorAll(
        "[data-tag]"
      );

    buttons.forEach(
      (button) => {
        const isActive =
          button.dataset.tag ===
          state.selectedTag;

        button.classList.toggle(
          "is-active",
          isActive
        );

        button.setAttribute(
          "aria-pressed",
          String(isActive)
        );
      }
    );
  }

  /* ==========================================
     Render
  ========================================== */

  function renderCharacters() {
    if (!elements.characterGrid) {
      return;
    }

    const filteredCharacters =
      getFilteredCharacters();

    updateResultCount(
      filteredCharacters.length
    );

    elements.characterGrid.innerHTML = "";

    if (
      state.characters.length === 0
    ) {
      showInitialEmptyState();

      return;
    }

    hideInitialEmptyState();

    if (
      filteredCharacters.length === 0
    ) {
      renderSearchEmpty();

      return;
    }

    const fragment =
      document.createDocumentFragment();

    filteredCharacters.forEach(
      (character, index) => {
        const card =
          createCharacterCard(
            character
          );

        card.style.animationDelay =
          `${Math.min(index * 35, 280)}ms`;

        fragment.appendChild(card);
      }
    );

    elements.characterGrid.appendChild(
      fragment
    );
  }

  function updateResultCount(count) {
    if (!elements.resultCount) {
      return;
    }

    elements.resultCount.textContent =
      String(count);
  }

  function showInitialEmptyState() {
    if (elements.emptyState) {
      elements.emptyState.hidden = false;
    }

    if (elements.characterGrid) {
      elements.characterGrid.hidden = true;
    }
  }

  function hideInitialEmptyState() {
    if (elements.emptyState) {
      elements.emptyState.hidden = true;
    }

    if (elements.characterGrid) {
      elements.characterGrid.hidden = false;
    }
  }

  function renderSearchEmpty() {
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
        data-clear-filter
        style="margin-top: 18px;"
      >
        絞り込みを解除
      </button>
    `;

    const clearButton =
      wrapper.querySelector(
        "[data-clear-filter]"
      );

    clearButton.addEventListener(
      "click",
      clearFilters
    );

    elements.characterGrid.appendChild(
      wrapper
    );
  }

  function createCharacterCard(character) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "character-card fade-up";

    const characterId =
      encodeURIComponent(
        String(character.id || "")
      );

    const name =
      Common.escapeHtml(
        character.name ||
        "名前未設定"
      );

    const work =
      Common.escapeHtml(
        character.work ||
        "作品未設定"
      );

    const title =
      Common.escapeHtml(
        character.title || ""
      );

    const summary =
      Common.escapeHtml(
        character.summary ||
        character.personality ||
        "キャラクターの説明はまだ登録されていません。"
      );

    const themeColor =
      Common.isValidHexColor(
        character.themeColor
      )
        ? character.themeColor
        : "#738cff";

    const imagePosition =
      getSafeImagePosition(
        character.imagePosition
      );

    const imageMarkup =
      createImageMarkup(
        character,
        name,
        imagePosition
      );

    const tags =
      Storage.normalizeTags(
        character.tags
      );

    const tagMarkup =
      createTagMarkup(tags);

    const updatedText =
      Common.formatRelativeDate(
        character.updatedAt
      ) || "更新日不明";

    article.innerHTML = `
      <a
        class="character-card__link"
        href="character.html?id=${characterId}"
        aria-label="${Common.escapeAttribute(
          `${character.name || "名前未設定"}の詳細を開く`
        )}"
      >
        <div class="character-card__image">
          ${imageMarkup}

          <span
            class="character-card__color"
            style="
              color: ${themeColor};
              background-color: ${themeColor};
            "
            aria-hidden="true"
          ></span>
        </div>

        <div class="character-card__body">
          <p class="character-card__work">
            ${work}
          </p>

          <h2>
            ${name}
          </h2>

          ${
            title
              ? `
                <p class="character-card__title">
                  ${title}
                </p>
              `
              : ""
          }

          <p class="character-card__summary">
            ${summary}
          </p>

          ${
            tagMarkup
              ? `
                <div class="character-card__tags">
                  ${tagMarkup}
                </div>
              `
              : ""
          }

          <div class="character-card__meta">
            <span>
              ${Common.escapeHtml(
                updatedText
              )}
            </span>

            <span class="character-card__edit">
              詳細・編集 →
            </span>
          </div>
        </div>
      </a>
    `;

    return article;
  }

  function createImageMarkup(
    character,
    name,
    imagePosition
  ) {
    const image =
      String(
        character.image || ""
      ).trim();

    if (image) {
      return `
        <img
          src="${Common.escapeAttribute(
            image
          )}"
          alt="${Common.escapeAttribute(
            name
          )}"
          loading="lazy"
          decoding="async"
          style="
            object-position:
              ${imagePosition};
          "
        >
      `;
    }

    const initial =
      getCharacterInitial(
        character.name
      );

    return `
      <div
        class="character-card__placeholder"
        aria-hidden="true"
        style="
          display: grid;
          width: 100%;
          height: 100%;
          place-items: center;
          background:
            radial-gradient(
              circle at 50% 35%,
              rgba(122, 143, 255, 0.22),
              transparent 42%
            ),
            #0b1020;
          color: rgba(255, 255, 255, 0.8);
          font-family:
            Georgia,
            serif;
          font-size: 48px;
        "
      >
        ${Common.escapeHtml(initial)}
      </div>
    `;
  }

  function getCharacterInitial(name) {
    const trimmedName =
      String(name || "").trim();

    if (!trimmedName) {
      return "✦";
    }

    return Array.from(trimmedName)[0];
  }

  function getSafeImagePosition(value) {
    const allowedPositions = [
      "center",
      "center top",
      "center bottom",
      "left center",
      "right center"
    ];

    return allowedPositions.includes(
      value
    )
      ? value
      : "center";
  }

  function createTagMarkup(tags) {
    if (!tags.length) {
      return "";
    }

    const visibleTags =
      tags.slice(0, 3);

    const tagMarkup =
      visibleTags
        .map(
          (tag) => `
            <span class="character-card__tag">
              ${Common.escapeHtml(tag)}
            </span>
          `
        )
        .join("");

    const remainingCount =
      tags.length -
      visibleTags.length;

    if (remainingCount <= 0) {
      return tagMarkup;
    }

    return `
      ${tagMarkup}

      <span class="character-card__tag">
        +${remainingCount}
      </span>
    `;
  }

  /* ==========================================
     Clear Filter
  ========================================== */

  function clearFilters() {
    state.searchKeyword = "";
    state.selectedWork = "";
    state.selectedTag = "";
    state.sortType =
      "updated-desc";

    if (elements.searchInput) {
      elements.searchInput.value = "";
    }

    if (elements.workFilter) {
      elements.workFilter.value = "";
    }

    if (elements.sortSelect) {
      elements.sortSelect.value =
        "updated-desc";
    }

    updateActiveTagButton();
    renderCharacters();
  }

  /* ==========================================
     Navigation
  ========================================== */

  function goToCreatePage() {
    window.location.href =
      "character.html?mode=create";
  }

  /* ==========================================
     Backup / Restore
  ========================================== */

  function handleBackup() {
    if (
      state.characters.length === 0
    ) {
      Common.showToast(
        "バックアップするキャラクターがありません。",
        "error"
      );

      return;
    }

    try {
      Storage.downloadBackup();

      Common.showToast(
        "バックアップを保存しました。"
      );
    } catch (error) {
      console.error(
        "バックアップに失敗しました。",
        error
      );

      Common.showToast(
        "バックアップに失敗しました。",
        "error"
      );
    }
  }

  async function handleRestore(event) {
    const input =
      event.target;

    const file =
      input.files &&
      input.files[0];

    if (!file) {
      return;
    }

    const shouldRestore =
      Common.confirmAction(
        "現在のキャラクターデータを、選択したバックアップ内容で置き換えます。\n\n続けてもよろしいですか？"
      );

    if (!shouldRestore) {
      input.value = "";

      return;
    }

    try {
      await Storage.restoreBackup(
        file,
        "replace"
      );

      loadCharacters();
      updateWorkFilter();
      updateTagFilter();
      renderCharacters();

      Common.showToast(
        "バックアップから復元しました。"
      );
    } catch (error) {
      console.error(
        "復元に失敗しました。",
        error
      );

      Common.showToast(
        error.message ||
        "バックアップの復元に失敗しました。",
        "error",
        5000
      );
    } finally {
      input.value = "";
    }
  }

  /* ==========================================
     Start
  ========================================== */

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );
})();