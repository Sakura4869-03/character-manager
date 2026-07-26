"use strict";

/* =========================================================
   Creative Archive
   glossary.js
   glossary.html 完全対応版
========================================================= */

(() => {
  /* =======================================================
     Constants
  ======================================================= */

  const DEFAULT_COLOR = "#D08A45";

  const STORAGE_KEY =
    "characterArchiveGlossary";

  /* =======================================================
     DOM Helpers
  ======================================================= */

  const form =
    document.getElementById(
      "glossaryForm"
    );

  if (!form) {
    console.warn(
      "glossaryFormが見つかりません。"
    );

    return;
  }

  const $ = (
    selector,
    root = document
  ) => root.querySelector(selector);

  const $$ = (
    selector,
    root = document
  ) => [
    ...root.querySelectorAll(selector),
  ];

  const byId = (id) =>
    document.getElementById(id);

  /* =======================================================
     DOM Elements
  ======================================================= */

  const elements = {
    glossaryId:
      byId("glossaryId"),

    term:
      byId("term"),

    reading:
      byId("reading"),

    category:
      byId("category"),

    series:
      byId("series"),

    tags:
      byId("tags"),

    summary:
      byId("summary"),

    themeColor:
      byId("themeColor"),

    themeColorPicker:
      byId("themeColorPicker"),

    themeColorError:
      byId("themeColorError"),

    termError:
      byId("termError"),

    workPreview:
      byId("workPreview"),

    namePreview:
      byId("namePreview"),

    categoryPreview:
      byId("categoryPreview"),

    summaryPreview:
      byId("summaryPreview"),

    tagPreview:
      byId("tagPreview"),

    previewInitial:
      byId("previewInitial"),

    themeColorPreview:
      byId("themeColorPreview"),

    pageTitle:
      byId("pageTitle"),

    saveStatus:
      byId("saveStatus"),

    updatedAt:
      byId("updatedAt"),

    exportGlossaryButton:
      byId(
        "exportGlossaryButton"
      ),

    printButton:
      byId("printButton"),

    scrollToPromptButton:
      byId(
        "scrollToPromptButton"
      ),

    promptSection:
      byId("promptSection"),

    deleteButton:
      byId("deleteButton"),

    deleteDialog:
      byId("deleteDialog"),

    deleteDialogClose:
      byId("deleteDialogClose"),

    deleteCancelButton:
      byId("deleteCancelButton"),

    deleteConfirmButton:
      byId("deleteConfirmButton"),

    deleteTargetName:
      byId("deleteTargetName"),

    unsavedDialog:
      byId("unsavedDialog"),

    unsavedDialogClose:
      byId("unsavedDialogClose"),

    unsavedStayButton:
      byId("unsavedStayButton"),

    unsavedLeaveButton:
      byId("unsavedLeaveButton"),

    toast:
      byId("toast"),

    toastMessage:
      byId("toastMessage"),

    sidebar:
      byId("sidebar"),

    sidebarOpen:
      byId("sidebarOpen"),

    sidebarClose:
      byId("sidebarClose"),

    sidebarOverlay:
      byId("sidebarOverlay"),
  };

  const saveButtons =
    $$(".js-save-glossary");

  const duplicateButtons =
    $$(".js-duplicate-glossary");

  const newGlossaryButtons =
    $$("[data-new-glossary]");

  const copyButtons =
    $$("[data-copy-target]");

  const navigationLinks =
    $$("a[href]");

  /* =======================================================
     State
  ======================================================= */

  const state = {
    mode: "create",

    id: "",

    loadedData: null,

    originalComparable: "",

    dirty: false,

    saving: false,

    pendingUrl: "",

    toastTimer: 0,
  };

  /* =======================================================
     Basic Helpers
  ======================================================= */

  function getStorageApi() {
    return (
      window.CharacterStorage ||
      window.CreativeStorage ||
      null
    );
  }

  function createId() {
    const storage =
      getStorageApi();

    if (
      typeof storage?.createId ===
      "function"
    ) {
      return storage.createId(
        "glossary"
      );
    }

    if (
      window.crypto &&
      typeof window.crypto
        .randomUUID ===
        "function"
    ) {
      return `glossary_${window.crypto.randomUUID()}`;
    }

    return `glossary_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function getValue(
    element
  ) {
    if (!element) {
      return "";
    }

    return String(
      element.value ?? ""
    ).trim();
  }

  function setValue(
    element,
    nextValue
  ) {
    if (!element) {
      return;
    }

    element.value =
      nextValue ?? "";
  }

  function setText(
    element,
    nextValue,
    fallback = ""
  ) {
    if (!element) {
      return;
    }

    const normalized =
      String(
        nextValue ?? ""
      ).trim();

    element.textContent =
      normalized || fallback;
  }

  function normalizeColor(
    value
  ) {
    const color =
      String(value || "")
        .trim()
        .toUpperCase();

    const normalized =
      color.startsWith("#")
        ? color
        : `#${color}`;

    return /^#[0-9A-F]{6}$/.test(
      normalized
    )
      ? normalized
      : "";
  }

  function splitTags(
    value
  ) {
    return [
      ...new Set(
        String(value || "")
          .split(/[,\n、，]+/)
          .map((tag) =>
            tag.trim()
          )
          .filter(Boolean)
      ),
    ].slice(0, 30);
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return "未保存";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "未保存";
    }

    return new Intl.DateTimeFormat(
      "ja-JP",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  }

  function sanitizeFileName(
    value
  ) {
    return (
      String(value || "")
        .trim()
        .replace(
          /[\\/:*?"<>|]/g,
          "_"
        )
        .replace(
          /\s+/g,
          "_"
        ) || "glossary"
    );
  }
    /* =======================================================
     Form Data
  ======================================================= */

  function getCurrentFormObject() {
    const result = {};

    $$("[name]", form).forEach(
      (field) => {
        if (
          !field.name ||
          field.type === "file"
        ) {
          return;
        }

        if (
          field.type ===
          "checkbox"
        ) {
          result[field.name] =
            field.checked;

          return;
        }

        if (
          field.type ===
          "radio"
        ) {
          if (
            field.checked
          ) {
            result[field.name] =
              field.value;
          }

          return;
        }

        result[field.name] =
          field.value;
      }
    );

    return result;
  }

  function getGlossaryData() {
    const current =
      getCurrentFormObject();

    const now =
      new Date().toISOString();

    const existingCreatedAt =
      state.loadedData
        ?.createdAt || now;

    return {
      ...current,

      id:
        state.id ||
        current.id ||
        createId(),

      term:
        getValue(
          elements.term
        ),

      reading:
        getValue(
          elements.reading
        ),

      category:
        getValue(
          elements.category
        ),

      series:
        getValue(
          elements.series
        ),

      tags:
        splitTags(
          getValue(
            elements.tags
          )
        ),

      summary:
        getValue(
          elements.summary
        ),

      themeColor:
        normalizeColor(
          getValue(
            elements.themeColor
          )
        ) || DEFAULT_COLOR,

      createdAt:
        existingCreatedAt,

      updatedAt:
        now,
    };
  }

  function getComparableData(
    data = getGlossaryData()
  ) {
    const comparable = {
      ...data,
    };

    delete comparable.updatedAt;

    return JSON.stringify(
      comparable
    );
  }

  /* =======================================================
     Dirty State
  ======================================================= */

  function updateStatus(
    updatedAt =
      state.loadedData
        ?.updatedAt
  ) {
    if (
      elements.saveStatus
    ) {
      elements.saveStatus
        .classList
        .toggle(
          "is-dirty",
          state.dirty
        );

      elements.saveStatus
        .classList
        .toggle(
          "is-saved",
          !state.dirty &&
            state.mode === "edit"
        );

      if (
        state.dirty
      ) {
        elements.saveStatus
          .textContent =
          "未保存の変更あり";
      } else if (
        state.mode ===
        "edit"
      ) {
        elements.saveStatus
          .textContent =
          "保存済み";
      } else {
        elements.saveStatus
          .textContent =
          "未保存";
      }
    }

    if (
      elements.updatedAt
    ) {
      elements.updatedAt
        .textContent =
        formatDate(
          updatedAt
        );
    }
  }

  function markDirty() {
    if (
      state.saving
    ) {
      return;
    }

    state.dirty =
      getComparableData() !==
      state.originalComparable;

    updateStatus();
  }

  function markClean(
    data
  ) {
    state.originalComparable =
      getComparableData(
        data
      );

    state.dirty =
      false;

    updateStatus(
      data?.updatedAt
    );
  }
    /* =======================================================
     Toast
  ======================================================= */

  function showToast(
    message,
    type = "success"
  ) {
    if (
      !elements.toast ||
      !elements.toastMessage
    ) {
      return;
    }

    window.clearTimeout(
      state.toastTimer
    );

    elements.toast
      .classList
      .remove(
        "is-success",
        "is-error"
      );

    elements.toast
      .classList
      .add(
        type === "error"
          ? "is-error"
          : "is-success"
      );

    elements.toastMessage
      .textContent =
      String(message || "");

    elements.toast.hidden =
      false;

    state.toastTimer =
      window.setTimeout(
        () => {
          elements.toast.hidden =
            true;
        },
        3200
      );
  }

  /* =======================================================
     Dialog Helpers
  ======================================================= */

  function openDialog(
    dialog
  ) {
    if (!dialog) {
      return;
    }

    if (
      typeof dialog.showModal ===
      "function"
    ) {
      if (!dialog.open) {
        dialog.showModal();
      }

      return;
    }

    dialog.setAttribute(
      "open",
      ""
    );
  }

  function closeDialog(
    dialog
  ) {
    if (!dialog) {
      return;
    }

    if (
      typeof dialog.close ===
        "function" &&
      dialog.open
    ) {
      dialog.close();

      return;
    }

    dialog.removeAttribute(
      "open"
    );
  }

  function handleDialogBackdropClick(
    event
  ) {
    if (
      event.target ===
      event.currentTarget
    ) {
      closeDialog(
        event.currentTarget
      );
    }
  }

  /* =======================================================
     Busy State
  ======================================================= */

  function setBusy(
    isBusy
  ) {
    state.saving =
      isBusy;

    saveButtons.forEach(
      (button) => {
        button.disabled =
          isBusy;
      }
    );

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          isBusy ||
          state.mode !== "edit";
      }
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton
        .disabled =
        isBusy ||
        state.mode !== "edit";
    }
  }

  /* =======================================================
     Storage
  ======================================================= */

  function getAllGlossaryItems() {
    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage
        .getGlossaryItems ===
        "function"
    ) {
      const glossaryItems =
        storage.getGlossaryItems();

      return Array.isArray(
        glossaryItems
      )
        ? glossaryItems
        : [];
    }

    try {
      const parsed =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY
          ) || "[]"
        );

      return Array.isArray(
        parsed
      )
        ? parsed
        : [];
    } catch (error) {
      console.error(
        "用語データを読み込めませんでした。",
        error
      );

      return [];
    }
  }

  function findGlossaryItemById(
    id
  ) {
    if (!id) {
      return null;
    }

    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage
        .getGlossaryItemById ===
        "function"
    ) {
      return (
        storage
          .getGlossaryItemById(
            id
          ) || null
      );
    }

    return (
      getAllGlossaryItems()
        .find(
          (item) =>
            String(item.id) ===
            String(id)
        ) || null
    );
  }

  function persistGlossaryItem(
    data
  ) {
    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage
        .saveGlossaryItem ===
        "function"
    ) {
      return storage
        .saveGlossaryItem(
          data
        );
    }

    const glossaryItems =
      getAllGlossaryItems();

    const index =
      glossaryItems
        .findIndex(
          (item) =>
            String(item.id) ===
            String(data.id)
        );

    if (
      index >= 0
    ) {
      glossaryItems[index] =
        data;
    } else {
      glossaryItems.unshift(
        data
      );
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        glossaryItems
      )
    );

    return data;
  }

  function removeGlossaryItem(
    id
  ) {
    if (!id) {
      return false;
    }

    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage
        .deleteGlossaryItem ===
        "function"
    ) {
      return storage
        .deleteGlossaryItem(
          id
        );
    }

    const glossaryItems =
      getAllGlossaryItems();

    const filteredItems =
      glossaryItems.filter(
        (item) =>
          String(item.id) !==
          String(id)
      );

    if (
      glossaryItems.length ===
      filteredItems.length
    ) {
      return false;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        filteredItems
      )
    );

    return true;
  }
    /* =======================================================
     Validation
  ======================================================= */

  function clearErrors() {
    if (elements.termError) {
      elements.termError.hidden = true;
    }

    if (elements.themeColorError) {
      elements.themeColorError.hidden = true;
    }

    elements.term?.removeAttribute(
      "aria-invalid"
    );

    elements.themeColor?.removeAttribute(
      "aria-invalid"
    );
  }

  function validateForm() {
    clearErrors();

    let valid = true;

    if (
      !getValue(
        elements.term
      )
    ) {
      valid = false;

      if (
        elements.termError
      ) {
        elements.termError.hidden =
          false;
      }

      elements.term?.setAttribute(
        "aria-invalid",
        "true"
      );
    }

    if (
      !normalizeColor(
        getValue(
          elements.themeColor
        )
      )
    ) {
      valid = false;

      if (
        elements.themeColorError
      ) {
        elements.themeColorError.hidden =
          false;
      }

      elements.themeColor?.setAttribute(
        "aria-invalid",
        "true"
      );
    }

    if (!valid) {
      form
        .querySelector(
          '[aria-invalid="true"]'
        )
        ?.focus();
    }

    return valid;
  }

  /* =======================================================
     Save
  ======================================================= */

  function saveGlossary(
    event
  ) {
    event?.preventDefault();

    if (
      state.saving
    ) {
      return;
    }

    if (
      !validateForm()
    ) {
      return;
    }

    setBusy(true);

    try {
      const data =
        getGlossaryData();

      const saved =
        persistGlossaryItem(
          data
        ) || data;

      state.mode =
        "edit";

      state.id =
        saved.id ||
        data.id;

      state.loadedData =
        {
          ...data,
          ...saved,
          id:
            state.id,
        };

      setValue(
        elements.glossaryId,
        state.id
      );

      updateUrlId(
        state.id
      );

      updateEditorMode();

      markClean(
        state.loadedData
      );

      renderPreview();

      showToast(
        "用語を保存しました。"
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      showToast(
        error?.message ||
          "保存に失敗しました。",
        "error"
      );
    } finally {
      setBusy(
        false
      );

      updateEditorMode();
    }
  }

  /* =======================================================
     Load
  ======================================================= */

  function loadGlossary() {
    const id =
      new URLSearchParams(
        window.location.search
      ).get("id") ||
      "";

    if (!id) {
      initializeNewGlossary();
      return;
    }

    const glossary =
      findGlossaryItemById(
        id
      );

    if (!glossary) {
      showToast(
        "指定された用語が見つかりません。",
        "error"
      );

      initializeNewGlossary();

      return;
    }

    state.mode =
      "edit";

    state.id =
      String(
        glossary.id
      );

    state.loadedData =
      {
        ...glossary,
      };

    fillForm(
      glossary
    );

    updateEditorMode();

    renderPreview();

    markClean(
      glossary
    );
  }

  /* =======================================================
     New Glossary
  ======================================================= */

  function initializeNewGlossary() {
    const storage =
      getStorageApi();

    const empty =
      typeof storage
        ?.createEmptyGlossaryItem ===
      "function"
        ? storage.createEmptyGlossaryItem()
        : {
            id:
              createId(),

            term: "",

            reading:
              "",

            category:
              "",

            series:
              "",

            tags: [],

            summary:
              "",

            definition:
              "",

            origin:
              "",

            usage:
              "",

            relatedTerms:
              "",

            relatedCharacters:
              "",

            relatedOrganizations:
              "",

            relatedWorlds:
              "",

            promptJa:
              "",

            promptEn:
              "",

            negativePrompt:
              "",

            notes:
              "",

            themeColor:
              DEFAULT_COLOR,
          };

    state.mode =
      "create";

    state.id =
      "";

    state.loadedData =
      null;

    fillForm({
      ...empty,
      id: "",
      themeColor:
        empty.themeColor ||
        DEFAULT_COLOR,
    });

    updateEditorMode();

    renderPreview();

    state.originalComparable =
      getComparableData();

    state.dirty =
      false;

    updateStatus(
      ""
    );
  }
    /* =======================================================
     Fill Form
  ======================================================= */

  function fillForm(
    data
  ) {
    $$(
      "[name]",
      form
    ).forEach(
      (field) => {
        if (
          field.type ===
          "file"
        ) {
          return;
        }

        let value =
          data[
            field.name
          ];

        if (
          field.name ===
            "tags" &&
          Array.isArray(
            value
          )
        ) {
          value =
            value.join(
              ", "
            );
        }

        if (
          field.type ===
          "checkbox"
        ) {
          field.checked =
            Boolean(
              value
            );

          return;
        }

        if (
          field.type ===
          "radio"
        ) {
          field.checked =
            String(
              field.value
            ) ===
            String(
              value ?? ""
            );

          return;
        }

        field.value =
          value ?? "";
      }
    );

    setValue(
      elements.glossaryId,
      data.id ||
        state.id
    );

    const color =
      normalizeColor(
        data.themeColor
      ) ||
      DEFAULT_COLOR;

    setValue(
      elements.themeColor,
      color
    );

    if (
      elements.themeColorPicker
    ) {
      elements.themeColorPicker
        .value =
        color.toLowerCase();
    }
  }

  /* =======================================================
     Editor Mode
  ======================================================= */

  function updateEditorMode() {
    const isEdit =
      state.mode ===
      "edit";

    setText(
      elements.pageTitle,
      isEdit
        ? "用語を編集"
        : "新規用語"
    );

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          state.saving ||
          !isEdit;
      }
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton
        .hidden =
        !isEdit;

      elements.deleteButton
        .disabled =
        state.saving ||
        !isEdit;
    }
  }

  /* =======================================================
     URL
  ======================================================= */

  function updateUrlId(
    id
  ) {
    if (!id) {
      return;
    }

    const url =
      new URL(
        window.location.href
      );

    url.searchParams.set(
      "id",
      id
    );

    window.history
      .replaceState(
        {},
        "",
        url.toString()
      );
  }

  /* =======================================================
     Preview
  ======================================================= */

  function renderPreview() {
    const term =
      getValue(
        elements.term
      );

    const reading =
      getValue(
        elements.reading
      );

    const series =
      getValue(
        elements.series
      );

    const category =
      getValue(
        elements.category
      );

    const summary =
      getValue(
        elements.summary
      );

    const color =
      normalizeColor(
        getValue(
          elements.themeColor
        )
      ) ||
      DEFAULT_COLOR;

    const tags =
      splitTags(
        getValue(
          elements.tags
        )
      );

    setText(
      elements.namePreview,
      term,
      "用語名未設定"
    );

    setText(
      elements.workPreview,
      series,
      "作品未設定"
    );

    setText(
      elements.categoryPreview,
      category,
      "分類未設定"
    );

    setText(
      elements.summaryPreview,
      summary,
      "用語の概要を入力すると、ここに表示されます。"
    );

    setText(
      elements.previewInitial,
      term
        ? term.charAt(0)
        : "Aa",
      "Aa"
    );

    if (
      elements.previewInitial
    ) {
      elements.previewInitial
        .title =
        reading ||
        term ||
        "用語";
    }

    if (
      elements.themeColorPreview
    ) {
      elements.themeColorPreview
        .style
        .backgroundColor =
        color;
    }

    renderPreviewTags(
      tags
    );
  }

  function renderPreviewTags(
    tags
  ) {
    if (
      !elements.tagPreview
    ) {
      return;
    }

    elements.tagPreview
      .innerHTML =
      "";

    tags
      .slice(
        0,
        6
      )
      .forEach(
        (tag) => {
          const span =
            document
              .createElement(
                "span"
              );

          span.className =
            "tag";

          span.textContent =
            tag;

          elements.tagPreview
            .appendChild(
              span
            );
        }
      );
  }
    /* =======================================================
     Duplicate
  ======================================================= */

  function duplicateGlossary() {
    if (
      state.mode !== "edit" ||
      state.saving
    ) {
      return;
    }

    const data =
      getGlossaryData();

    const now =
      new Date().toISOString();

    const duplicated = {
      ...data,

      id:
        createId(),

      term:
        data.term
          ? `${data.term}（コピー）`
          : "名称未設定（コピー）",

      createdAt:
        now,

      updatedAt:
        now,
    };

    try {
      const saved =
        persistGlossaryItem(
          duplicated
        ) || duplicated;

      state.dirty =
        false;

      window.location.href =
        `glossary.html?id=${encodeURIComponent(
          saved.id ||
          duplicated.id
        )}`;
    } catch (
      error
    ) {
      console.error(
        error
      );

      showToast(
        error?.message ||
          "複製に失敗しました。",
        "error"
      );
    }
  }

  /* =======================================================
     Delete
  ======================================================= */

  function openDeleteDialog() {
    if (
      state.mode !== "edit" ||
      state.saving
    ) {
      return;
    }

    setText(
      elements.deleteTargetName,
      getValue(
        elements.term
      ),
      "この用語"
    );

    openDialog(
      elements.deleteDialog
    );
  }

  function confirmDelete() {
    if (
      state.mode !== "edit" ||
      !state.id ||
      state.saving
    ) {
      return;
    }

    setBusy(
      true
    );

    try {
      const deleted =
        removeGlossaryItem(
          state.id
        );

      if (!deleted) {
        throw new Error(
          "削除に失敗しました。"
        );
      }

      state.dirty =
        false;

      closeDialog(
        elements.deleteDialog
      );

      window.location.href =
        "index.html?view=glossary";
    } catch (
      error
    ) {
      console.error(
        error
      );

      showToast(
        error?.message ||
          "削除に失敗しました。",
        "error"
      );

      setBusy(
        false
      );
    }
  }

  /* =======================================================
     Export JSON
  ======================================================= */

  function exportGlossary() {
    const data =
      getGlossaryData();

    const json =
      JSON.stringify(
        data,
        null,
        2
      );

    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document
        .createElement(
          "a"
        );

    link.href =
      url;

    link.download =
      `${sanitizeFileName(
        data.term
      )}.json`;

    document.body
      .appendChild(
        link
      );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );

    showToast(
      "JSONを書き出しました。"
    );
  }

  /* =======================================================
     Copy
  ======================================================= */

  async function copyFieldValue(
    fieldId
  ) {
    const field =
      byId(
        fieldId
      );

    if (!field) {
      return;
    }

    const value =
      String(
        field.value ?? ""
      );

    if (!value) {
      showToast(
        "コピーする内容がありません。",
        "error"
      );

      return;
    }

    try {
      if (
        navigator.clipboard &&
        typeof navigator
          .clipboard
          .writeText ===
          "function"
      ) {
        await navigator
          .clipboard
          .writeText(
            value
          );
      } else {
        field.focus();

        field.select();

        document.execCommand(
          "copy"
        );
      }

      showToast(
        "コピーしました。"
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      showToast(
        "コピーに失敗しました。",
        "error"
      );
    }
  }
    /* =======================================================
     Unsaved Navigation
  ======================================================= */

  function requestNavigation(
    url
  ) {
    if (!url) {
      return;
    }

    if (
      !state.dirty
    ) {
      window.location.href =
        url;

      return;
    }

    state.pendingUrl =
      url;

    openDialog(
      elements.unsavedDialog
    );
  }

  function leaveWithoutSaving() {
    state.dirty =
      false;

    const url =
      state.pendingUrl ||
      "index.html?view=glossary";

    state.pendingUrl =
      "";

    closeDialog(
      elements.unsavedDialog
    );

    window.location.href =
      url;
  }

  function stayOnPage() {
    state.pendingUrl =
      "";

    closeDialog(
      elements.unsavedDialog
    );
  }

  /* =======================================================
     Sidebar
  ======================================================= */

  function openSidebar() {
    document.body
      .classList
      .add(
        "is-menu-open"
      );

    elements.sidebar
      ?.classList
      .add(
        "is-open"
      );

    elements.sidebarOverlay
      ?.classList
      .add(
        "is-visible"
      );
  }

  function closeSidebar() {
    document.body
      .classList
      .remove(
        "is-menu-open"
      );

    elements.sidebar
      ?.classList
      .remove(
        "is-open"
      );

    elements.sidebarOverlay
      ?.classList
      .remove(
        "is-visible"
      );
  }

  /* =======================================================
     Events
  ======================================================= */

  function bindEvents() {
    form.addEventListener(
      "submit",
      saveGlossary
    );

    form.addEventListener(
      "input",
      () => {
        clearErrors();

        renderPreview();

        markDirty();
      }
    );

    form.addEventListener(
      "change",
      () => {
        renderPreview();

        markDirty();
      }
    );

    saveButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          saveGlossary
        );
      }
    );

    duplicateButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          duplicateGlossary
        );
      }
    );

    newGlossaryButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            requestNavigation(
              "glossary.html"
            );
          }
        );
      }
    );

    elements.themeColorPicker
      ?.addEventListener(
        "input",
        (event) => {
          const color =
            String(
              event.target
                .value ||
                DEFAULT_COLOR
            ).toUpperCase();

          setValue(
            elements.themeColor,
            color
          );

          renderPreview();

          markDirty();
        }
      );

    elements.themeColor
      ?.addEventListener(
        "input",
        () => {
          const color =
            normalizeColor(
              getValue(
                elements.themeColor
              )
            );

          if (
            color &&
            elements.themeColorPicker
          ) {
            elements.themeColorPicker
              .value =
              color.toLowerCase();
          }
        }
      );

    elements.exportGlossaryButton
      ?.addEventListener(
        "click",
        exportGlossary
      );

    elements.printButton
      ?.addEventListener(
        "click",
        () => {
          window.print();
        }
      );

    elements.scrollToPromptButton
      ?.addEventListener(
        "click",
        () => {
          elements.promptSection
            ?.scrollIntoView(
              {
                behavior:
                  "smooth",

                block:
                  "start",
              }
            );
        }
      );

    copyButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const targetId =
              button.dataset
                .copyTarget;

            if (
              targetId
            ) {
              copyFieldValue(
                targetId
              );
            }
          }
        );
      }
    );

    elements.deleteButton
      ?.addEventListener(
        "click",
        openDeleteDialog
      );

    elements.deleteConfirmButton
      ?.addEventListener(
        "click",
        confirmDelete
      );

    elements.deleteCancelButton
      ?.addEventListener(
        "click",
        () => {
          closeDialog(
            elements.deleteDialog
          );
        }
      );

    elements.deleteDialogClose
      ?.addEventListener(
        "click",
        () => {
          closeDialog(
            elements.deleteDialog
          );
        }
      );

    navigationLinks.forEach(
      (link) => {
        link.addEventListener(
          "click",
          (event) => {
            const href =
              link.getAttribute(
                "href"
              );

            if (
              !href ||
              href.startsWith(
                "#"
              ) ||
              link.target ===
                "_blank" ||
              href.startsWith(
                "javascript:"
              ) ||
              href.startsWith(
                "mailto:"
              ) ||
              href.startsWith(
                "tel:"
              )
            ) {
              return;
            }

            event.preventDefault();

            requestNavigation(
              href
            );
          }
        );
      }
    );

    elements.unsavedLeaveButton
      ?.addEventListener(
        "click",
        leaveWithoutSaving
      );

    elements.unsavedStayButton
      ?.addEventListener(
        "click",
        stayOnPage
      );

    elements.unsavedDialogClose
      ?.addEventListener(
        "click",
        stayOnPage
      );

    elements.sidebarOpen
      ?.addEventListener(
        "click",
        openSidebar
      );

    elements.sidebarClose
      ?.addEventListener(
        "click",
        closeSidebar
      );

    elements.sidebarOverlay
      ?.addEventListener(
        "click",
        closeSidebar
      );

    [
      elements.deleteDialog,
      elements.unsavedDialog,
    ]
      .filter(
        Boolean
      )
      .forEach(
        (dialog) => {
          dialog.addEventListener(
            "click",
            handleDialogBackdropClick
          );
        }
      );

    window.addEventListener(
      "beforeunload",
      (event) => {
        if (
          !state.dirty
        ) {
          return;
        }

        event.preventDefault();

        event.returnValue =
          "";
      }
    );

    window.addEventListener(
      "keydown",
      (event) => {
        const saveShortcut =
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key
            .toLowerCase() ===
            "s";

        if (
          saveShortcut
        ) {
          event.preventDefault();

          saveGlossary(
            event
          );
        }

        if (
          event.key ===
          "Escape"
        ) {
          closeSidebar();
        }
      }
    );
  }
    /* =======================================================
     Init
  ======================================================= */

  function init() {
    bindEvents();

    loadGlossary();

    renderPreview();

    updateEditorMode();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true,
      }
    );
  } else {
    init();
  }
})();