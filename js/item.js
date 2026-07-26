"use strict";

/* =========================================================
   Creative Archive
   item.js
   item.html 完全対応版
========================================================= */

(() => {
  /* =======================================================
     Constants
  ======================================================= */

  const DEFAULT_COLOR =
    "#8A6AB8";

  const STORAGE_KEY =
    "characterArchiveItems";

  /* =======================================================
     DOM Helpers
  ======================================================= */

  const form =
    document.getElementById(
      "itemForm"
    );

  if (!form) {
    console.warn(
      "itemFormが見つかりません。"
    );

    return;
  }

  const $ = (
    selector,
    root = document
  ) => root.querySelector(
    selector
  );

  const $$ = (
    selector,
    root = document
  ) => [
    ...root.querySelectorAll(
      selector
    ),
  ];

  const byId = (
    id
  ) =>
    document.getElementById(
      id
    );

  /* =======================================================
     DOM Elements
  ======================================================= */

  const elements = {
    itemId:
      byId("itemId"),

    name:
      byId("name"),

    reading:
      byId("reading"),

    category:
      byId("category"),

    rarity:
      byId("rarity"),

    status:
      byId("status"),

    series:
      byId("series"),

    tags:
      byId("tags"),

    summary:
      byId("summary"),

    themeColor:
      byId("themeColor"),

    themeColorPicker:
      byId(
        "themeColorPicker"
      ),

    nameError:
      byId("nameError"),

    themeColorError:
      byId(
        "themeColorError"
      ),

    workPreview:
      byId("workPreview"),

    namePreview:
      byId("namePreview"),

    categoryPreview:
      byId(
        "categoryPreview"
      ),

    summaryPreview:
      byId(
        "summaryPreview"
      ),

    tagPreview:
      byId("tagPreview"),

    previewInitial:
      byId(
        "previewInitial"
      ),

    themeColorPreview:
      byId(
        "themeColorPreview"
      ),

    pageTitle:
      byId("pageTitle"),

    saveStatus:
      byId("saveStatus"),

    updatedAt:
      byId("updatedAt"),

    exportItemButton:
      byId(
        "exportItemButton"
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
      byId(
        "deleteDialogClose"
      ),

    deleteCancelButton:
      byId(
        "deleteCancelButton"
      ),

    deleteConfirmButton:
      byId(
        "deleteConfirmButton"
      ),

    deleteTargetName:
      byId(
        "deleteTargetName"
      ),

    unsavedDialog:
      byId("unsavedDialog"),

    unsavedDialogClose:
      byId(
        "unsavedDialogClose"
      ),

    unsavedStayButton:
      byId(
        "unsavedStayButton"
      ),

    unsavedLeaveButton:
      byId(
        "unsavedLeaveButton"
      ),

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
    $$(".js-save-item");

  const duplicateButtons =
    $$(".js-duplicate-item");

  const newItemButtons =
    $$("[data-new-item]");

  const copyButtons =
    $$("[data-copy-target]");

  const navigationLinks =
    $$("a[href]");

  /* =======================================================
     State
  ======================================================= */

  const state = {
    mode:
      "create",

    id:
      "",

    loadedData:
      null,

    originalComparable:
      "",

    dirty:
      false,

    saving:
      false,

    pendingUrl:
      "",

    toastTimer:
      0,
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
      typeof storage
        ?.createId ===
      "function"
    ) {
      return storage.createId(
        "item"
      );
    }

    if (
      window.crypto &&
      typeof window.crypto
        .randomUUID ===
        "function"
    ) {
      return `item_${window.crypto.randomUUID()}`;
    }

    return `item_${Date.now()}_${Math.random()
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
      normalized ||
      fallback;
  }

  function normalizeColor(
    value
  ) {
    const color =
      String(
        value || ""
      )
        .trim()
        .toUpperCase();

    const normalized =
      color.startsWith(
        "#"
      )
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
        String(
          value || ""
        )
          .split(
            /[,\n、，]+/
          )
          .map(
            (tag) =>
              tag.trim()
          )
          .filter(
            Boolean
          )
      ),
    ].slice(
      0,
      30
    );
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return "未保存";
    }

    const date =
      new Date(
        value
      );

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
        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    ).format(
      date
    );
  }

  function sanitizeFileName(
    value
  ) {
    return (
      String(
        value || ""
      )
        .trim()
        .replace(
          /[\\/:*?"<>|]/g,
          "_"
        )
        .replace(
          /\s+/g,
          "_"
        ) ||
      "item"
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
          field.type === "checkbox"
        ) {
          result[field.name] =
            field.checked;

          return;
        }

        if (
          field.type === "radio"
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

  function getItemData() {
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

      name:
        getValue(
          elements.name
        ),

      reading:
        getValue(
          elements.reading
        ),

      category:
        getValue(
          elements.category
        ),

      rarity:
        getValue(
          elements.rarity
        ),

      status:
        getValue(
          elements.status
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
    data = getItemData()
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
        state.mode === "edit"
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

    elements.toast.classList.remove(
      "is-success",
      "is-error"
    );

    elements.toast.classList.add(
      type === "error"
        ? "is-error"
        : "is-success"
    );

    elements.toastMessage.textContent =
      String(message || "");

    elements.toast.hidden = false;

    state.toastTimer =
      window.setTimeout(() => {
        elements.toast.hidden = true;
      }, 3200);
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
          state.mode !==
            "edit";
      }
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton.disabled =
        isBusy ||
        state.mode !==
          "edit";
    }
  }

  /* =======================================================
     Storage
  ======================================================= */

  function getAllItems() {
    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage.getItems ===
        "function"
    ) {
      const items =
        storage.getItems();

      return Array.isArray(
        items
      )
        ? items
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
    } catch (
      error
    ) {
      console.error(
        "アイテムデータを読み込めませんでした。",
        error
      );

      return [];
    }
  }

  function findItemById(
    id
  ) {
    if (!id) {
      return null;
    }

    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage.getItemById ===
        "function"
    ) {
      return (
        storage.getItemById(
          id
        ) || null
      );
    }

    return (
      getAllItems().find(
        (item) =>
          String(item.id) ===
          String(id)
      ) || null
    );
  }

  function persistItem(
    data
  ) {
    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage.saveItem ===
        "function"
    ) {
      return storage.saveItem(
        data
      );
    }

    const items =
      getAllItems();

    const index =
      items.findIndex(
        (item) =>
          String(item.id) ===
          String(data.id)
      );

    if (
      index >= 0
    ) {
      items[index] =
        data;
    } else {
      items.unshift(
        data
      );
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        items
      )
    );

    return data;
  }

  function removeItem(
    id
  ) {
    if (!id) {
      return false;
    }

    const storage =
      getStorageApi();

    if (
      storage &&
      typeof storage.deleteItem ===
        "function"
    ) {
      return storage.deleteItem(
        id
      );
    }

    const items =
      getAllItems();

    const filtered =
      items.filter(
        (item) =>
          String(item.id) !==
          String(id)
      );

    if (
      filtered.length ===
      items.length
    ) {
      return false;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        filtered
      )
    );

    return true;
  }
    /* =======================================================
     Validation
  ======================================================= */

  function clearValidation() {
    if (elements.nameError) {
      elements.nameError.hidden =
        true;
    }

    if (
      elements.themeColorError
    ) {
      elements.themeColorError.hidden =
        true;
    }

    elements.name?.removeAttribute(
      "aria-invalid"
    );

    elements.themeColor?.removeAttribute(
      "aria-invalid"
    );
  }

  function validateForm() {
    clearValidation();

    let isValid =
      true;

    const name =
      getValue(
        elements.name
      );

    const rawColor =
      getValue(
        elements.themeColor
      );

    if (!name) {
      isValid =
        false;

      if (
        elements.nameError
      ) {
        elements.nameError.hidden =
          false;
      }

      elements.name?.setAttribute(
        "aria-invalid",
        "true"
      );
    }

    if (
      rawColor &&
      !normalizeColor(
        rawColor
      )
    ) {
      isValid =
        false;

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

    if (
      !isValid
    ) {
      const firstInvalid =
        form.querySelector(
          '[aria-invalid="true"]'
        );

      firstInvalid?.focus();

      showToast(
        "入力内容を確認してください。",
        "error"
      );
    }

    return isValid;
  }

  /* =======================================================
     Save
  ======================================================= */

  function saveItem(
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

    setBusy(
      true
    );

    try {
      const data =
        getItemData();

      const saved =
        persistItem(
          data
        ) || data;

      state.id =
        saved.id ||
        data.id;

      state.mode =
        "edit";

      state.loadedData = {
        ...data,
        ...saved,
        id:
          saved.id ||
          data.id,
      };

      setValue(
        elements.itemId,
        state.id
      );

      const currentUrl =
        new URL(
          window.location.href
        );

      currentUrl.searchParams.set(
        "id",
        state.id
      );

      window.history.replaceState(
        {},
        "",
        currentUrl
      );

      updateEditorMode();

      markClean(
        state.loadedData
      );

      updatePreview();

      showToast(
        "アイテムを保存しました。"
      );
    } catch (
      error
    ) {
      console.error(
        "アイテムを保存できませんでした。",
        error
      );

      showToast(
        "保存に失敗しました。",
        "error"
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  /* =======================================================
     Load Data
  ======================================================= */

  function fillForm(
    data
  ) {
    if (!data) {
      return;
    }

    $$("[name]", form).forEach(
      (field) => {
        if (
          !field.name ||
          field.type ===
            "file"
        ) {
          return;
        }

        if (
          field.type ===
          "checkbox"
        ) {
          field.checked =
            Boolean(
              data[
                field.name
              ]
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
              data[
                field.name
              ] ?? ""
            );

          return;
        }

        const value =
          data[
            field.name
          ];

        if (
          field.name ===
          "tags"
        ) {
          field.value =
            Array.isArray(
              value
            )
              ? value.join(
                  ", "
                )
              : value || "";

          return;
        }

        field.value =
          value ?? "";
      }
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

    setValue(
      elements.themeColorPicker,
      color
    );
  }

  function loadItem(
    id
  ) {
    const data =
      findItemById(
        id
      );

    if (!data) {
      showToast(
        "指定されたアイテムが見つかりませんでした。",
        "error"
      );

      startNewItem();

      return;
    }

    state.mode =
      "edit";

    state.id =
      String(
        data.id
      );

    state.loadedData = {
      ...data,
    };

    fillForm(
      data
    );

    setValue(
      elements.itemId,
      state.id
    );

    updateEditorMode();

    updatePreview();

    markClean(
      state.loadedData
    );

    setBusy(
      false
    );
  }

  /* =======================================================
     New Item
  ======================================================= */

  function getEmptyItem() {
    return {
      id:
        "",

      name:
        "",

      reading:
        "",

      category:
        "",

      rarity:
        "",

      status:
        "",

      series:
        "",

      tags:
        [],

      summary:
        "",

      themeColor:
        DEFAULT_COLOR,

      appearance:
        "",

      material:
        "",

      size:
        "",

      structure:
        "",

      ability:
        "",

      activation:
        "",

      cost:
        "",

      strengths:
        "",

      weaknesses:
        "",

      origin:
        "",

      history:
        "",

      acquisition:
        "",

      location:
        "",

      owner:
        "",

      previousOwners:
        "",

      compatibility:
        "",

      relatedCharacters:
        "",

      relatedOrganizations:
        "",

      relatedWorlds:
        "",

      relatedItems:
        "",

      relatedTerms:
        "",

      storyRole:
        "",

      scenes:
        "",

      promptJa:
        "",

      promptEn:
        "",

      negativePrompt:
        "",

      notes:
        "",

      createdAt:
        "",

      updatedAt:
        "",
    };
  }

  function startNewItem() {
    state.mode =
      "create";

    state.id =
      "";

    state.loadedData =
      null;

    state.dirty =
      false;

    form.reset();

    fillForm(
      getEmptyItem()
    );

    setValue(
      elements.itemId,
      ""
    );

    const currentUrl =
      new URL(
        window.location.href
      );

    currentUrl.searchParams.delete(
      "id"
    );

    window.history.replaceState(
      {},
      "",
      currentUrl
    );

    updateEditorMode();

    updatePreview();

    state.originalComparable =
      getComparableData();

    updateStatus();

    setBusy(
      false
    );

    elements.name?.focus();
  }
    /* =======================================================
     Editor Mode
  ======================================================= */

  function updateEditorMode() {
    const isEdit =
      state.mode ===
      "edit";

    if (
      elements.pageTitle
    ) {
      elements.pageTitle.textContent =
        isEdit
          ? getValue(
              elements.name
            ) ||
            "アイテム編集"
          : "新規アイテム";
    }

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          !isEdit;
      }
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton.disabled =
        !isEdit;
    }

    updateStatus(
      state.loadedData
        ?.updatedAt
    );
  }

  /* =======================================================
     Preview
  ======================================================= */

  function updatePreview() {
    const name =
      getValue(
        elements.name
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

    const tags =
      splitTags(
        getValue(
          elements.tags
        )
      );

    const color =
      normalizeColor(
        getValue(
          elements.themeColor
        )
      ) ||
      DEFAULT_COLOR;

    setText(
      elements.workPreview,
      series,
      "作品未設定"
    );

    setText(
      elements.namePreview,
      name,
      "アイテム名未設定"
    );

    setText(
      elements.categoryPreview,
      category,
      "分類未設定"
    );

    setText(
      elements.summaryPreview,
      summary,
      "アイテムの概要を入力すると、ここに表示されます。"
    );

    if (
      elements.previewInitial
    ) {
      elements.previewInitial.textContent =
        name
          ? name
              .trim()
              .charAt(0)
          : "◇";
    }

    if (
      elements.themeColorPreview
    ) {
      elements.themeColorPreview.style.backgroundColor =
        color;
    }

    if (
      elements.tagPreview
    ) {
      elements.tagPreview.innerHTML =
        "";

      tags.forEach(
        (tag) => {
          const chip =
            document.createElement(
              "span"
            );

          chip.className =
            "preview-tag";

          chip.textContent =
            tag;

          elements.tagPreview.appendChild(
            chip
          );
        }
      );
    }

    updateEditorMode();
  }

  /* =======================================================
     Theme Color
  ======================================================= */

  function syncThemeColorFromPicker() {
    const color =
      normalizeColor(
        elements
          .themeColorPicker
          ?.value
      ) ||
      DEFAULT_COLOR;

    setValue(
      elements.themeColor,
      color
    );

    updatePreview();

    markDirty();
  }

  function syncThemeColorFromInput() {
    const color =
      normalizeColor(
        getValue(
          elements.themeColor
        )
      );

    if (
      color
    ) {
      setValue(
        elements.themeColor,
        color
      );

      setValue(
        elements.themeColorPicker,
        color
      );
    }

    updatePreview();

    markDirty();
  }

  /* =======================================================
     Live Preview
  ======================================================= */

  function handleLiveInput() {
    updatePreview();

    markDirty();
  }

  function bindLivePreview() {
    form.addEventListener(
      "input",
      handleLiveInput
    );

    elements.themeColorPicker?.addEventListener(
      "input",
      syncThemeColorFromPicker
    );

    elements.themeColor?.addEventListener(
      "change",
      syncThemeColorFromInput
    );
  }
    /* =======================================================
     Copy
  ======================================================= */

  async function copyText(
    text
  ) {
    const value =
      String(
        text || ""
      );

    if (!value) {
      showToast(
        "コピーする内容がありません。",
        "error"
      );

      return false;
    }

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          value
        );

        return true;
      }

      const temporary =
        document.createElement(
          "textarea"
        );

      temporary.value =
        value;

      temporary.setAttribute(
        "readonly",
        ""
      );

      temporary.style.position =
        "fixed";

      temporary.style.opacity =
        "0";

      temporary.style.pointerEvents =
        "none";

      document.body.appendChild(
        temporary
      );

      temporary.select();

      const copied =
        document.execCommand(
          "copy"
        );

      temporary.remove();

      return copied;
    } catch (
      error
    ) {
      console.error(
        "コピーに失敗しました。",
        error
      );

      return false;
    }
  }

  async function handleCopyButton(
    event
  ) {
    const button =
      event.currentTarget;

    const targetId =
      button.dataset.copyTarget;

    const target =
      byId(
        targetId
      );

    if (!target) {
      showToast(
        "コピー対象が見つかりません。",
        "error"
      );

      return;
    }

    const copied =
      await copyText(
        target.value
      );

    if (copied) {
      showToast(
        "コピーしました。"
      );
    } else {
      showToast(
        "コピーに失敗しました。",
        "error"
      );
    }
  }

  /* =======================================================
     Export JSON
  ======================================================= */

  function downloadJson(
    data,
    fileName
  ) {
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
            "application/json;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      fileName;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );
  }

  function exportItem() {
    try {
      const data =
        getItemData();

      const name =
        sanitizeFileName(
          data.name ||
          "item"
        );

      downloadJson(
        data,
        `${name}.json`
      );

      showToast(
        "JSONを書き出しました。"
      );
    } catch (
      error
    ) {
      console.error(
        "JSONを書き出せませんでした。",
        error
      );

      showToast(
        "JSONの書き出しに失敗しました。",
        "error"
      );
    }
  }

  /* =======================================================
     Print
  ======================================================= */

  function printItem() {
    window.print();
  }

  /* =======================================================
     Duplicate
  ======================================================= */

  function duplicateItem() {
    if (
      state.mode !==
        "edit" ||
      !state.id
    ) {
      showToast(
        "先にアイテムを保存してください。",
        "error"
      );

      return;
    }

    try {
      const source =
        getItemData();

      const now =
        new Date().toISOString();

      const duplicated = {
        ...source,

        id:
          createId(),

        name:
          source.name
            ? `${source.name}のコピー`
            : "アイテムのコピー",

        createdAt:
          now,

        updatedAt:
          now,
      };

      const saved =
        persistItem(
          duplicated
        ) ||
        duplicated;

      const nextId =
        saved.id ||
        duplicated.id;

      window.location.href =
        `item.html?id=${encodeURIComponent(
          nextId
        )}`;
    } catch (
      error
    ) {
      console.error(
        "アイテムを複製できませんでした。",
        error
      );

      showToast(
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
      state.mode !==
        "edit" ||
      !state.id
    ) {
      showToast(
        "削除するアイテムがありません。",
        "error"
      );

      return;
    }

    setText(
      elements.deleteTargetName,
      getValue(
        elements.name
      ),
      "このアイテム"
    );

    openDialog(
      elements.deleteDialog
    );
  }

  function closeDeleteDialog() {
    closeDialog(
      elements.deleteDialog
    );
  }

  function confirmDeleteItem() {
    if (!state.id) {
      closeDeleteDialog();

      return;
    }

    try {
      const deleted =
        removeItem(
          state.id
        );

      if (!deleted) {
        throw new Error(
          "削除対象が見つかりませんでした。"
        );
      }

      state.dirty =
        false;

      closeDeleteDialog();

      showToast(
        "アイテムを削除しました。"
      );

      window.setTimeout(
        () => {
          window.location.href =
            "index.html?view=item";
        },
        400
      );
    } catch (
      error
    ) {
      console.error(
        "アイテムを削除できませんでした。",
        error
      );

      showToast(
        "削除に失敗しました。",
        "error"
      );
    }
  }
    /* =======================================================
     Unsaved Changes
  ======================================================= */

  function requestNavigation(
    url
  ) {
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

  function stayOnPage() {
    state.pendingUrl =
      "";

    closeDialog(
      elements.unsavedDialog
    );
  }

  function leavePage() {
    const url =
      state.pendingUrl;

    state.pendingUrl =
      "";

    state.dirty =
      false;

    closeDialog(
      elements.unsavedDialog
    );

    if (
      url
    ) {
      window.location.href =
        url;
    }
  }

  function beforeUnloadHandler(
    event
  ) {
    if (
      !state.dirty
    ) {
      return;
    }

    event.preventDefault();

    event.returnValue =
      "";
  }

  /* =======================================================
     Sidebar
  ======================================================= */

  function openSidebar() {
    elements.sidebar?.classList.add(
      "is-open"
    );

    elements.sidebarOverlay?.classList.add(
      "is-visible"
    );

    document.body.classList.add(
      "sidebar-open"
    );
  }

  function closeSidebar() {
    elements.sidebar?.classList.remove(
      "is-open"
    );

    elements.sidebarOverlay?.classList.remove(
      "is-visible"
    );

    document.body.classList.remove(
      "sidebar-open"
    );
  }

  /* =======================================================
     Navigation Events
  ======================================================= */

  function bindNavigation() {
    navigationLinks.forEach(
      (link) => {
        const href =
          link.getAttribute(
            "href"
          );

        if (
          !href ||
          href.startsWith(
            "#"
          ) ||
          href.startsWith(
            "javascript:"
          )
        ) {
          return;
        }

        link.addEventListener(
          "click",
          (
            event
          ) => {
            if (
              !state.dirty
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

    window.addEventListener(
      "beforeunload",
      beforeUnloadHandler
    );
  }

  /* =======================================================
     Sidebar Events
  ======================================================= */

  function bindSidebar() {
    elements.sidebarOpen?.addEventListener(
      "click",
      openSidebar
    );

    elements.sidebarClose?.addEventListener(
      "click",
      closeSidebar
    );

    elements.sidebarOverlay?.addEventListener(
      "click",
      closeSidebar
    );

    newItemButtons.forEach(
      (
        button
      ) => {
        button.addEventListener(
          "click",
          () => {
            if (
              state.dirty
            ) {
              requestNavigation(
                "item.html"
              );

              return;
            }

            window.location.href =
              "item.html";
          }
        );
      }
    );
  }

  /* =======================================================
     Unsaved Dialog Events
  ======================================================= */

  function bindUnsavedDialog() {
    if (
      elements.unsavedDialog
    ) {
      elements.unsavedDialog.addEventListener(
        "click",
        handleDialogBackdropClick
      );
    }

    elements.unsavedDialogClose?.addEventListener(
      "click",
      stayOnPage
    );

    elements.unsavedStayButton?.addEventListener(
      "click",
      stayOnPage
    );

    elements.unsavedLeaveButton?.addEventListener(
      "click",
      leavePage
    );
  }
    /* =======================================================
     Scroll
  ======================================================= */

  function scrollToPrompt() {
    elements.promptSection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /* =======================================================
     Delete Dialog Events
  ======================================================= */

  function bindDeleteDialog() {
    elements.deleteButton?.addEventListener(
      "click",
      openDeleteDialog
    );

    elements.deleteDialogClose?.addEventListener(
      "click",
      closeDeleteDialog
    );

    elements.deleteCancelButton?.addEventListener(
      "click",
      closeDeleteDialog
    );

    elements.deleteConfirmButton?.addEventListener(
      "click",
      confirmDeleteItem
    );

    elements.deleteDialog?.addEventListener(
      "click",
      handleDialogBackdropClick
    );
  }

  /* =======================================================
     Main Events
  ======================================================= */

  function bindEvents() {
    form.addEventListener(
      "submit",
      saveItem
    );

    duplicateButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          duplicateItem
        );
      }
    );

    copyButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          handleCopyButton
        );
      }
    );

    elements.exportItemButton?.addEventListener(
      "click",
      exportItem
    );

    elements.printButton?.addEventListener(
      "click",
      printItem
    );

    elements.scrollToPromptButton?.addEventListener(
      "click",
      scrollToPrompt
    );

    bindLivePreview();
    bindDeleteDialog();
    bindUnsavedDialog();
    bindNavigation();
    bindSidebar();
  }

  /* =======================================================
     Keyboard Events
  ======================================================= */

  function bindKeyboardEvents() {
    document.addEventListener(
      "keydown",
      (event) => {
        const isSaveShortcut =
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "s";

        if (isSaveShortcut) {
          event.preventDefault();

          form.requestSubmit();
        }

        if (
          event.key === "Escape"
        ) {
          closeSidebar();
        }
      }
    );
  }

  /* =======================================================
     Initialize
  ======================================================= */

  function init() {
    bindEvents();
    bindKeyboardEvents();

    const params =
      new URLSearchParams(
        window.location.search
      );

    const itemId =
      params.get("id");

    if (itemId) {
      loadItem(
        itemId
      );

      return;
    }

    startNewItem();
  }

  /* =======================================================
     Start
  ======================================================= */

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