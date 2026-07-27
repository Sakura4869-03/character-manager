"use strict";

/* =========================================================
   Creative Archive
   organization-list.js
   組織・施設一覧／検索／絞り込み
========================================================= */

window.OrganizationList = (() => {
  const DEFAULT_COLOR =
    "#8B6FC2";

  const state = {
    organizations: [],

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
    loadOrganizations();
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
        "dashboardOrganizationCount"
      );

    elements.sidebarCount =
      document.getElementById(
        "sidebarOrganizationCount"
      );

    elements.tabCount =
      document.getElementById(
        "organizationTabCount"
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
    loadOrganizations();
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

  function loadOrganizations() {
    try {
      const organizations =
        getStorageApi()
          .getOrganizations();

      state.organizations =
        Array.isArray(
          organizations
        )
          ? organizations
          : [];
    } catch (error) {
      console.error(
        "組織・施設データを読み込めませんでした。",
        error
      );

      state.organizations = [];
    }
  }

  /* =======================================================
     Render
  ======================================================= */
  
  function render() {
    loadOrganizations();
    updateCount();
    prepareControls();

    const filteredOrganizations =
      getFilteredOrganizations();

    setText(
      elements.resultCount,
      filteredOrganizations.length
    );

    setText(
      elements.resultUnit,
      "organizations"
    );

    if (
      !elements.archiveGrid
    ) {
      return;
    }

    elements.archiveGrid.innerHTML =
      "";

    if (
      state.organizations.length ===
      0
    ) {
      showInitialEmptyState();
      return;
    }

    hideInitialEmptyState();

    if (
      filteredOrganizations.length ===
      0
    ) {
      renderSearchEmpty();
      return;
    }

    const fragment =
      document.createDocumentFragment();

    filteredOrganizations.forEach(
      (
        organization,
        index
      ) => {
        const card =
          createCard(
            organization
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
        "組織名・作品・種類・タグ・設定から検索";

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
          "作品";
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
          state.organizations
            .map(
              (organization) =>
                String(
                  organization.work ||
                  organization.series ||
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

    state.organizations.forEach(
      (organization) => {
        normalizeTags(
          organization.tags
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
        state.organizations.length
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

  function getFilteredOrganizations() {
    let organizations = [
      ...state.organizations,
    ];

    if (
      state.searchKeyword
    ) {
      organizations =
        organizations.filter(
          matchesSearchKeyword
        );
    }

    if (
      state.selectedWork
    ) {
      organizations =
        organizations.filter(
          (organization) =>
            String(
              organization.work ||
              organization.series ||
              ""
            ) ===
            state.selectedWork
        );
    }

    if (
      state.selectedTag
    ) {
      organizations =
        organizations.filter(
          (organization) =>
            normalizeTags(
              organization.tags
            ).includes(
              state.selectedTag
            )
        );
    }

    sortOrganizations(
      organizations
    );

    return organizations;
  }

  function matchesSearchKeyword(
    organization
  ) {
    const searchableValues = [
      organization.name,
      organization.reading,
      organization.work,
      organization.series,
      organization.type,
      organization.category,
      organization.role,
      organization.summary,
      organization.purpose,
      organization.history,
      organization.location,
      organization.base,
      organization.leader,
      organization.members,
      organization.structure,
      organization.department,
      organization.affiliation,
      organization.relationships,
      organization.rules,
      organization.symbol,
      organization.uniform,
      organization.facilities,
      organization.notes,
      ...normalizeTags(
        organization.tags
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

  function sortOrganizations(
    organizations
  ) {
    const sortFunctions = {
      "updated-desc":
        (
          organizationA,
          organizationB
        ) =>
          getDateValue(
            organizationB.updatedAt
          ) -
          getDateValue(
            organizationA.updatedAt
          ),

      "updated-asc":
        (
          organizationA,
          organizationB
        ) =>
          getDateValue(
            organizationA.updatedAt
          ) -
          getDateValue(
            organizationB.updatedAt
          ),

      "created-desc":
        (
          organizationA,
          organizationB
        ) =>
          getDateValue(
            organizationB.createdAt
          ) -
          getDateValue(
            organizationA.createdAt
          ),

      "created-asc":
        (
          organizationA,
          organizationB
        ) =>
          getDateValue(
            organizationA.createdAt
          ) -
          getDateValue(
            organizationB.createdAt
          ),

      "name-asc":
        (
          organizationA,
          organizationB
        ) =>
          compareJapaneseText(
            organizationA.name,
            organizationB.name
          ),

      "name-desc":
        (
          organizationA,
          organizationB
        ) =>
          compareJapaneseText(
            organizationB.name,
            organizationA.name
          ),
    };

    const sortFunction =
      sortFunctions[
        state.sortType
      ] ||
      sortFunctions[
        "updated-desc"
      ];

    organizations.sort(
      sortFunction
    );
  }

  /* =======================================================
     Card
  ======================================================= */

  function createCard(
    organization,
    showType = false
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "archive-card archive-card--organization fade-up";

    const id =
      encodeURIComponent(
        String(
          organization.id ||
          ""
        )
      );

    const rawName =
      String(
        organization.name ||
        ""
      ).trim();

    const name =
      escapeHtml(
        rawName ||
        "組織名未設定"
      );

    const work =
      escapeHtml(
        organization.work ||
        organization.series ||
        "作品未設定"
      );

    const type =
      escapeHtml(
        organization.type ||
        organization.category ||
        ""
      );

    const summary =
      escapeHtml(
        organization.summary ||
        organization.purpose ||
        "組織・施設の説明はまだ登録されていません。"
      );

    const color =
      isValidColor(
        organization.themeColor
      )
        ? organization.themeColor
        : DEFAULT_COLOR;

    const imagePosition =
      getSafeImagePosition(
        organization.imagePosition
      );

    const imageMarkup =
      createImageMarkup(
        organization.image,
        rawName,
        imagePosition
      );

    const tagMarkup =
      createTagMarkup(
        normalizeTags(
          organization.tags
        )
      );

    const updatedText =
      formatRelativeDate(
        organization.updatedAt
      ) ||
      "更新日不明";

    article.innerHTML = `
      <a
        class="archive-card__link"
        href="organization.html?id=${id}"
        aria-label="${escapeAttribute(
          `${
            rawName ||
            "組織名未設定"
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
                  ORGANIZATION
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
            type
              ? `
                <p class="archive-card__title">
                  ${type}
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
            "組織・施設イメージ"
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
        : "▦";

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
      "まだ組織・施設が登録されていません"
    );

    setText(
      elements.emptyDescription,
      "最初の組織・施設設定を作成してみましょう。"
    );

    if (
      elements.emptyCreateLink
    ) {
      elements.emptyCreateLink.href =
        "organization.html";

      elements.emptyCreateLink.textContent =
        "＋ 組織・施設を作成";
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
        ▦
      </div>

      <h2>
        該当する組織・施設が見つかりません
      </h2>

      <p>
        検索ワードや絞り込み条件を変更してください。
      </p>

      <button
        class="button button--secondary"
        type="button"
        data-clear-organization-filter
        style="margin-top:18px;"
      >
        絞り込みを解除
      </button>
    `;

    wrapper
      .querySelector(
        "[data-clear-organization-filter]"
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
     Count / Recent
  ======================================================= */

  function updateCount() {
    loadOrganizations();

    const count =
      state.organizations.length;

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
    loadOrganizations();

    return state.organizations.map(
      (organization) => ({
        ...organization,

        __type:
          "organization",
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
      "organization"
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