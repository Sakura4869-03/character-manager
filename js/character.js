"use strict";

/* =========================================================
   Character Archive
   character.js
   character.html 完全対応版
========================================================= */

(() => {
  /* =======================================================
     Constants
  ======================================================= */

  const DEFAULT_COLOR = "#738CFF";
  const MAX_SOURCE_SIZE = 10 * 1024 * 1024;
  const IMAGE_MAX_EDGE = 1400;
  const IMAGE_QUALITY = 0.86;

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  /* =======================================================
     DOM Helpers
  ======================================================= */

  const form = document.getElementById("characterForm");

  if (!form) {
    console.warn(
      "characterFormが見つかりません。"
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
    form,

    characterId:
      byId("characterId"),

    name:
      byId("name"),

    reading:
      byId("reading"),

    title:
      byId("title"),

    work:
      byId("work"),

    age:
      byId("age"),

    gender:
      byId("gender"),

    birthday:
      byId("birthday"),

    height:
      byId("height"),

    schoolYear:
      byId("schoolYear"),

    className:
      byId("className"),

    affiliation:
      byId("affiliation"),

    motif:
      byId("motif"),

    tags:
      byId("tags"),

    summary:
      byId("summary"),

    imageInput:
      byId("imageInput"),

    image:
      byId("image"),

    imageDropzone:
      byId("imageDropzone"),

    changeImageButton:
      byId("changeImageButton"),

    removeImageButton:
      byId("removeImageButton"),

    imagePosition:
      byId("imagePosition"),

    themeColor:
      byId("themeColor"),

    themeColorPicker:
      byId("themeColorPicker"),

    themeColorError:
      byId("themeColorError"),

    imagePreview:
      byId("imagePreview"),

    imagePlaceholder:
      byId("imagePlaceholder"),

    previewInitial:
      byId("previewInitial"),

    themeColorPreview:
      byId("themeColorPreview"),

    workPreview:
      byId("workPreview"),

    namePreview:
      byId("namePreview"),

    titlePreview:
      byId("titlePreview"),

    summaryPreview:
      byId("summaryPreview"),

    tagPreview:
      byId("tagPreview"),

    pageTitle:
      byId("pageTitle"),

    saveStatus:
      byId("saveStatus"),

    updatedAt:
      byId("updatedAt"),

    exportCharacterButton:
      byId("exportCharacterButton"),

    printButton:
      byId("printButton"),

    scrollToPromptButton:
      byId("scrollToPromptButton"),

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
  };

  /*
   * character.html内に
   * saveButton / duplicateButtonが複数あるため、
   * querySelectorAllでまとめて取得する
   */

  const saveButtons =
    $$("#saveButton");

  const duplicateButtons =
    $$("#duplicateButton");

  const newCharacterButtons =
    $$("[data-new-character]");

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

  function getValue(element) {
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

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {
      return window.crypto.randomUUID();
    }

    return [
      "character",
      Date.now(),
      Math.random()
        .toString(36)
        .slice(2, 9),
    ].join("-");
  }

  function normalizeColor(
    input
  ) {
    const text = String(
      input || ""
    )
      .trim()
      .toUpperCase();

    if (!text) {
      return "";
    }

    const withHash =
      text.startsWith("#")
        ? text
        : `#${text}`;

    return /^#[0-9A-F]{6}$/.test(
      withHash
    )
      ? withHash
      : "";
  }

  function formatDate(
    valueToFormat
  ) {
    if (!valueToFormat) {
      return "未保存";
    }

    const date =
      new Date(valueToFormat);

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

  function splitTags(raw) {
    return String(raw || "")
      .split(/[,、，\n]/)
      .map((tag) =>
        tag.trim()
      )
      .filter(Boolean)
      .slice(0, 20);
  }

  function sanitizeFileName(
    name
  ) {
    const safeName =
      String(name || "")
        .replace(
          /[\\/:*?"<>|]/g,
          "_"
        )
        .trim();

    return safeName ||
      "character";
  }

  /* =======================================================
     Form Data
  ======================================================= */

  function getCurrentFormObject() {
    const data = {};

    $$("[name]", form).forEach(
      (field) => {
        if (
          field.type === "file"
        ) {
          return;
        }

        data[field.name] =
          field.value;
      }
    );

    return data;
  }

  function getCharacterData() {
    const now =
      new Date().toISOString();

    const raw =
      getCurrentFormObject();

    const characterId =
      state.id ||
      getValue(
        elements.characterId
      ) ||
      createId();

    const themeColor =
      normalizeColor(
        getValue(
          elements.themeColor
        )
      ) ||
      DEFAULT_COLOR;

    return {
      ...raw,

      id: characterId,

      image:
        getValue(
          elements.image
        ),

      themeColor,

      createdAt:
        state.mode === "edit" &&
        state.loadedData?.createdAt
          ? state.loadedData.createdAt
          : now,

      updatedAt: now,
    };
  }

  function getComparableData(
    data = getCharacterData()
  ) {
    const copy = {
      ...data,
    };

    delete copy.updatedAt;

    return JSON.stringify(copy);
  }

  /* =======================================================
     Dirty State
  ======================================================= */

  function updateStatus(
    updatedAt =
      state.loadedData?.updatedAt
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

      if (state.dirty) {
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

    if (elements.updatedAt) {
      elements.updatedAt
        .textContent =
        formatDate(updatedAt);
    }
  }

  function markDirty() {
    if (state.saving) {
      return;
    }

    state.dirty =
      getComparableData() !==
      state.originalComparable;

    updateStatus();
  }

  function markClean(data) {
    state.originalComparable =
      getComparableData(data);

    state.dirty = false;

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
      window.setTimeout(() => {
        elements.toast.hidden =
          true;
      }, 3200);
  }

  /* =======================================================
     Dialog Helpers
  ======================================================= */

  function openDialog(dialog) {
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

  function closeDialog(dialog) {
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
    const dialog =
      event.currentTarget;

    if (
      !(dialog instanceof
        HTMLDialogElement)
    ) {
      return;
    }

    const rect =
      dialog.getBoundingClientRect();

    const clickedInside =
      event.clientX >=
        rect.left &&
      event.clientX <=
        rect.right &&
      event.clientY >=
        rect.top &&
      event.clientY <=
        rect.bottom;

    if (!clickedInside) {
      closeDialog(dialog);
    }
  }

  /* =======================================================
     Saving State
  ======================================================= */

  function setBusy(busy) {
    state.saving =
      Boolean(busy);

    form.classList.toggle(
      "is-loading",
      state.saving
    );

    saveButtons.forEach(
      (button) => {
        button.disabled =
          state.saving;
      }
    );

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          state.saving ||
          state.mode !== "edit";
      }
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton
        .disabled =
        state.saving;
    }
  }

/* =======================================================
   Storage Adapter
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

function getAllCharacters() {
  const characters =
    getStorageApi()
      .getCharacters();

  return Array.isArray(
    characters
  )
    ? characters
    : [];
}

function findCharacter(
  characterId
) {
  if (!characterId) {
    return null;
  }

  return (
    getStorageApi()
      .getCharacterById(
        characterId
      ) || null
  );
}

/* =======================================================
   Save / Delete Storage
======================================================= */

function saveCharacter(
  characterData
) {
  return getStorageApi()
    .saveCharacter(
      characterData
    );
}

function deleteCharacter(
  characterId
) {
  if (!characterId) {
    return false;
  }

  return getStorageApi()
    .deleteCharacter(
      characterId
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

    const work =
      getValue(
        elements.work
      );

    const title =
      getValue(
        elements.title
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

    const themeColor =
      normalizeColor(
        getValue(
          elements.themeColor
        )
      ) ||
      DEFAULT_COLOR;

    const image =
      getValue(
        elements.image
      );

    const imagePosition =
      getValue(
        elements.imagePosition
      ) ||
      "center";

    /*
     * プレビューとボタン等の
     * アクセントカラーを更新
     */

    document.documentElement
      .style
      .setProperty(
        "--preview-color",
        themeColor
      );

    document.documentElement
      .style
      .setProperty(
        "--accent-color",
        themeColor
      );

    setText(
      elements.namePreview,
      name,
      "名前未設定"
    );

    setText(
      elements.workPreview,
      work,
      "作品未設定"
    );

    setText(
      elements.titlePreview,
      title,
      "肩書き・立場"
    );

    setText(
      elements.summaryPreview,
      summary,
      "キャラクターの概要を入力すると、ここに表示されます。"
    );

    /*
     * 画像未登録時の丸いアイコンに、
     * キャラクター名の先頭文字を表示
     */

    if (
      elements.previewInitial
    ) {
      elements.previewInitial
        .textContent =
        name
          ? Array.from(name)[0]
          : "✦";
    }

    if (
      elements.themeColorPreview
    ) {
      elements.themeColorPreview
        .style
        .backgroundColor =
        themeColor;
    }

    /*
     * タグプレビュー
     */

    if (
      elements.tagPreview
    ) {
      const tagElements =
        tags.map(
          (tag) => {
            const tagElement =
              document.createElement(
                "span"
              );

            tagElement.textContent =
              tag;

            return tagElement;
          }
        );

      elements.tagPreview
        .replaceChildren(
          ...tagElements
        );
    }

    /*
     * 画像プレビュー
     */

    if (
      elements.imagePreview &&
      elements.imagePlaceholder
    ) {
      if (image) {
        elements.imagePreview
          .src =
          image;

        elements.imagePreview
          .alt =
          name
            ? `${name}のキャラクター画像`
            : "キャラクター画像";

        elements.imagePreview
          .style
          .objectPosition =
          imagePosition;

        elements.imagePreview
          .hidden =
          false;

        elements.imagePlaceholder
          .hidden =
          true;
      } else {
        elements.imagePreview
          .removeAttribute(
            "src"
          );

        elements.imagePreview
          .alt =
          "";

        elements.imagePreview
          .hidden =
          true;

        elements.imagePlaceholder
          .hidden =
          false;
      }
    }
  }

  /* =======================================================
     Image Helpers
  ======================================================= */

  function loadImageFile(
    file
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.addEventListener(
          "load",
          () => {
            resolve(
              String(
                reader.result ||
                ""
              )
            );
          }
        );

        reader.addEventListener(
          "error",
          () => {
            reject(
              new Error(
                "画像の読み込みに失敗しました。"
              )
            );
          }
        );

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  function resizeImage(
    dataUrl,
    mimeType
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const image =
          new Image();

        image.addEventListener(
          "load",
          () => {
            const longestEdge =
              Math.max(
                image.width,
                image.height
              );

            const scale =
              Math.min(
                1,
                IMAGE_MAX_EDGE /
                  longestEdge
              );

            const width =
              Math.max(
                1,
                Math.round(
                  image.width *
                    scale
                )
              );

            const height =
              Math.max(
                1,
                Math.round(
                  image.height *
                    scale
                )
              );

            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width =
              width;

            canvas.height =
              height;

            const context =
              canvas.getContext(
                "2d"
              );

            if (!context) {
              reject(
                new Error(
                  "画像の変換に失敗しました。"
                )
              );

              return;
            }

            context.drawImage(
              image,
              0,
              0,
              width,
              height
            );

            /*
             * PNGは透過を維持。
             * WebP・JPEGはJPEGとして圧縮。
             */

            const outputType =
              mimeType ===
              "image/png"
                ? "image/png"
                : "image/jpeg";

            const resizedDataUrl =
              canvas.toDataURL(
                outputType,
                IMAGE_QUALITY
              );

            resolve(
              resizedDataUrl
            );
          }
        );

        image.addEventListener(
          "error",
          () => {
            reject(
              new Error(
                "画像ファイルを表示できませんでした。"
              )
            );
          }
        );

        image.src =
          dataUrl;
      }
    );
  }

  function validateImageFile(
    file
  ) {
    if (!file) {
      return {
        valid: false,
        message:
          "画像ファイルを選択してください。",
      };
    }

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      return {
        valid: false,
        message:
          "JPG・PNG・WebP形式の画像を選択してください。",
      };
    }

    if (
      file.size >
      MAX_SOURCE_SIZE
    ) {
      return {
        valid: false,
        message:
          "元画像は10MB以下にしてください。",
      };
    }

    return {
      valid: true,
      message: "",
    };
  }

  async function processImage(
    file
  ) {
    const validation =
      validateImageFile(
        file
      );

    if (!validation.valid) {
      showToast(
        validation.message,
        "error"
      );

      return;
    }

    try {
      const sourceData =
        await loadImageFile(
          file
        );

      const resizedData =
        await resizeImage(
          sourceData,
          file.type
        );

      setValue(
        elements.image,
        resizedData
      );

      updatePreview();
      markDirty();

      showToast(
        "画像を読み込みました。保存すると登録されます。"
      );
    } catch (error) {
      console.error(
        error
      );

      showToast(
        error?.message ||
          "画像の処理に失敗しました。",
        "error"
      );
    } finally {
      if (
        elements.imageInput
      ) {
        elements.imageInput
          .value =
          "";
      }
    }
  }

  function removeImage() {
    setValue(
      elements.image,
      ""
    );

    if (
      elements.imageInput
    ) {
      elements.imageInput
        .value =
        "";
    }

    updatePreview();
    markDirty();

    showToast(
      "画像を削除しました。"
    );
  }

  /* =======================================================
     Validation
  ======================================================= */

  function validateForm() {
    let isValid =
      true;

    /*
     * キャラクター名
     */

    const nameError =
      byId("nameError");

    if (
      !getValue(
        elements.name
      )
    ) {
      elements.name
        ?.setAttribute(
          "aria-invalid",
          "true"
        );

      if (nameError) {
        nameError.hidden =
          false;
      }

      isValid =
        false;
    } else {
      elements.name
        ?.removeAttribute(
          "aria-invalid"
        );

      if (nameError) {
        nameError.hidden =
          true;
      }
    }

    /*
     * テーマカラー
     */

    const themeColor =
      normalizeColor(
        getValue(
          elements.themeColor
        )
      );

    if (!themeColor) {
      elements.themeColor
        ?.setAttribute(
          "aria-invalid",
          "true"
        );

      if (
        elements.themeColorError
      ) {
        elements.themeColorError
          .hidden =
          false;
      }

      isValid =
        false;
    } else {
      elements.themeColor
        ?.removeAttribute(
          "aria-invalid"
        );

      if (
        elements.themeColorError
      ) {
        elements.themeColorError
          .hidden =
          true;
      }

      setValue(
        elements.themeColor,
        themeColor
      );

      setValue(
        elements.themeColorPicker,
        themeColor
      );
    }

    /*
     * 最初のエラー位置へ移動
     */

    if (!isValid) {
      const firstInvalid =
        form.querySelector(
          '[aria-invalid="true"]'
        );

      firstInvalid
        ?.focus();

      firstInvalid
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

      showToast(
        "入力内容を確認してください。",
        "error"
      );
    }

    return isValid;
  }
    /* =======================================================
     Form Population / Page Mode
  ======================================================= */

  function populateForm(
    characterData
  ) {
    const data =
      characterData || {};

    $$("[name]", form).forEach(
      (field) => {
        if (
          field.type === "file"
        ) {
          return;
        }

        const fieldName =
          field.name;

        if (!fieldName) {
          return;
        }

        field.value =
          data[fieldName] ?? "";
      }
    );

    const themeColor =
      normalizeColor(
        data.themeColor
      ) ||
      DEFAULT_COLOR;

    setValue(
      elements.themeColor,
      themeColor
    );

    setValue(
      elements.themeColorPicker,
      themeColor
    );

    setValue(
      elements.characterId,
      data.id || ""
    );

    setValue(
      elements.image,
      data.image || ""
    );

    if (
      elements.imagePosition &&
      !getValue(
        elements.imagePosition
      )
    ) {
      setValue(
        elements.imagePosition,
        "center"
      );
    }

    state.loadedData = {
      ...data,
    };

    updatePreview();

    updateStatus(
      data.updatedAt
    );
  }

  function setCreateMode() {
    const newCharacter = {
      id: createId(),

      themeColor:
        DEFAULT_COLOR,

      imagePosition:
        "center",

      image: "",

      createdAt: "",

      updatedAt: "",
    };

    state.mode =
      "create";

    state.id =
      newCharacter.id;

    state.loadedData = {
      ...newCharacter,
    };

    populateForm(
      newCharacter
    );

    if (
      elements.pageTitle
    ) {
      elements.pageTitle
        .textContent =
        "新規キャラクター";
    }

    document.title =
      "新規キャラクター | Character Archive";

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          true;
      }
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton
        .hidden =
        true;
    }

    markClean(
      newCharacter
    );
  }

  function setEditMode(
    characterData
  ) {
    state.mode =
      "edit";

    state.id =
      String(
        characterData.id
      );

    state.loadedData = {
      ...characterData,
    };

    populateForm(
      characterData
    );

    if (
      elements.pageTitle
    ) {
      elements.pageTitle
        .textContent =
        characterData.name ||
        "キャラクター編集";
    }

    document.title =
      `${
        characterData.name ||
        "キャラクター編集"
      } | Character Archive`;

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          false;
      }
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton
        .hidden =
        false;
    }

    markClean(
      characterData
    );
  }

  function setDuplicateMode(
    sourceData
  ) {
    const duplicateData = {
      ...sourceData,

      id:
        createId(),

      name:
        sourceData.name
          ? `${sourceData.name}のコピー`
          : "",

      createdAt: "",

      updatedAt: "",
    };

    state.mode =
      "duplicate";

    state.id =
      duplicateData.id;

    state.loadedData = {
      ...duplicateData,
    };

    populateForm(
      duplicateData
    );

    if (
      elements.pageTitle
    ) {
      elements.pageTitle
        .textContent =
        "キャラクターを複製";
    }

    document.title =
      "キャラクターを複製 | Character Archive";

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          true;
      }
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton
        .hidden =
        true;
    }

    state.originalComparable =
      "";

    markDirty();

    showToast(
      "複製データを作成しました。保存すると新規登録されます。"
    );
  }

  function initializePageMode() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const characterId =
      params.get("id") ||
      params.get("characterId") ||
      "";

    const duplicateMode =
      params.get("mode") ===
        "duplicate" ||
      params.get("duplicate") ===
        "true";

    if (!characterId) {
      setCreateMode();
      return;
    }

    const characterData =
      findCharacter(
        characterId
      );

    if (!characterData) {
      showToast(
        "指定されたキャラクターが見つかりませんでした。",
        "error"
      );

      setCreateMode();

      return;
    }

    if (duplicateMode) {
      setDuplicateMode(
        characterData
      );
    } else {
      setEditMode(
        characterData
      );
    }
  }

  /* =======================================================
     Save
  ======================================================= */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      state.saving ||
      !validateForm()
    ) {
      return;
    }

    const previousMode =
      state.mode;

    const characterData =
      getCharacterData();

    state.id =
      characterData.id;

    setBusy(true);

    try {
      const result =
        await Promise.resolve(
          saveCharacter(
            characterData
          )
        );

      const savedData =
        result &&
        typeof result ===
          "object"
          ? {
              ...characterData,
              ...result,
            }
          : characterData;

      state.mode =
        "edit";

      state.id =
        savedData.id;

      state.loadedData = {
        ...savedData,
      };

      setValue(
        elements.characterId,
        savedData.id
      );

      populateForm(
        savedData
      );

      markClean(
        savedData
      );

      const currentUrl =
        new URL(
          window.location.href
        );

      currentUrl
        .searchParams
        .set(
          "id",
          savedData.id
        );

      currentUrl
        .searchParams
        .delete(
          "mode"
        );

      currentUrl
        .searchParams
        .delete(
          "duplicate"
        );

      window.history
        .replaceState(
          {},
          "",
          currentUrl
        );

      duplicateButtons.forEach(
        (button) => {
          button.disabled =
            false;
        }
      );

      if (
        elements.deleteButton
      ) {
        elements.deleteButton
          .hidden =
          false;
      }

      if (
        elements.pageTitle
      ) {
        elements.pageTitle
          .textContent =
          savedData.name ||
          "キャラクター編集";
      }

      document.title =
        `${
          savedData.name ||
          "キャラクター編集"
        } | Character Archive`;

      showToast(
        previousMode ===
          "edit"
          ? "キャラクターを保存しました。"
          : "キャラクターを登録しました。"
      );
    } catch (error) {
      console.error(
        error
      );

      const errorMessage =
        String(
          error?.message ||
          ""
        );

      const quotaExceeded =
        error?.name ===
          "QuotaExceededError" ||
        errorMessage
          .toLowerCase()
          .includes(
            "quota"
          );

      showToast(
        quotaExceeded
          ? "保存容量を超えました。画像を小さくするか、不要なキャラクターを削除してください。"
          : errorMessage ||
            "保存に失敗しました。",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     Duplicate
  ======================================================= */

  function duplicateCurrentCharacter() {
    if (
      state.mode !== "edit"
    ) {
      showToast(
        "先にキャラクターを保存してください。",
        "error"
      );

      return;
    }

    const currentData =
      getCharacterData();

    setDuplicateMode(
      currentData
    );

    const currentUrl =
      new URL(
        window.location.href
      );

    currentUrl.search =
      "";

    window.history
      .replaceState(
        {},
        "",
        currentUrl
      );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =======================================================
     New Character
  ======================================================= */

  function startNewCharacter() {
    if (state.dirty) {
      state.pendingUrl =
        "character.html";

      openDialog(
        elements.unsavedDialog
      );

      return;
    }

    window.location.href =
      "character.html";
  }

  /* =======================================================
     JSON Export
  ======================================================= */

  function exportCharacterJson() {
    const characterData =
      getCharacterData();

    const fileName =
      sanitizeFileName(
        characterData.name
      );

    const json =
      JSON.stringify(
        characterData,
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

    const objectUrl =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      objectUrl;

    anchor.download =
      `${fileName}.json`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      objectUrl
    );

    showToast(
      "JSONを書き出しました。"
    );
  }

  /* =======================================================
     Copy
  ======================================================= */

  function fallbackCopyText(
    text
  ) {
    const temporaryTextarea =
      document.createElement(
        "textarea"
      );

    temporaryTextarea.value =
      text;

    temporaryTextarea
      .setAttribute(
        "readonly",
        ""
      );

    temporaryTextarea.style
      .position =
      "fixed";

    temporaryTextarea.style
      .top =
      "-9999px";

    temporaryTextarea.style
      .left =
      "-9999px";

    temporaryTextarea.style
      .opacity =
      "0";

    document.body.appendChild(
      temporaryTextarea
    );

    temporaryTextarea.select();

    temporaryTextarea
      .setSelectionRange(
        0,
        temporaryTextarea
          .value
          .length
      );

    const copied =
      document.execCommand(
        "copy"
      );

    temporaryTextarea.remove();

    if (!copied) {
      throw new Error(
        "コピーに失敗しました。"
      );
    }
  }

  async function copyText(
    text
  ) {
    const normalizedText =
      String(text || "");

    if (
      !normalizedText.trim()
    ) {
      throw new Error(
        "コピーする内容がありません。"
      );
    }

    if (
      navigator.clipboard &&
      typeof navigator.clipboard
        .writeText ===
        "function" &&
      window.isSecureContext
    ) {
      await navigator.clipboard
        .writeText(
          normalizedText
        );

      return;
    }

    fallbackCopyText(
      normalizedText
    );
  }

  async function handleCopyButton(
    event
  ) {
    const button =
      event.currentTarget;

    const targetId =
      button.dataset
        .copyTarget ||
      "";

    const targetElement =
      byId(targetId);

    if (!targetElement) {
      showToast(
        "コピー対象が見つかりません。",
        "error"
      );

      return;
    }

    const targetText =
      "value" in
      targetElement
        ? targetElement.value
        : targetElement
            .textContent;

    try {
      await copyText(
        targetText
      );

      const originalText =
        button.textContent;

      button.textContent =
        "コピー済み";

      button.disabled =
        true;

      showToast(
        "コピーしました。"
      );

      window.setTimeout(
        () => {
          button.textContent =
            originalText;

          button.disabled =
            false;
        },
        1000
      );
    } catch (error) {
      console.error(
        error
      );

      showToast(
        error?.message ||
          "コピーに失敗しました。",
        "error"
      );
    }
  }

  /* =======================================================
     Delete
  ======================================================= */

  function openDeleteDialog() {
    if (
      state.mode !== "edit"
    ) {
      showToast(
        "保存前のキャラクターは削除できません。",
        "error"
      );

      return;
    }

    if (
      elements.deleteTargetName
    ) {
      elements.deleteTargetName
        .textContent =
        getValue(
          elements.name
        ) ||
        "名前未設定";
    }

    openDialog(
      elements.deleteDialog
    );
  }

  async function confirmDeleteCharacter() {
    if (
      state.mode !== "edit" ||
      !state.id
    ) {
      return;
    }

    if (
      elements.deleteConfirmButton
    ) {
      elements.deleteConfirmButton
        .disabled =
        true;
    }

    try {
      await Promise.resolve(
        deleteCharacter(
          state.id
        )
      );

      state.dirty =
        false;

      closeDialog(
        elements.deleteDialog
      );

      showToast(
        "キャラクターを削除しました。"
      );

      window.setTimeout(
        () => {
          window.location.href =
            "index.html";
        },
        450
      );
    } catch (error) {
      console.error(
        error
      );

      showToast(
        error?.message ||
          "削除に失敗しました。",
        "error"
      );
    } finally {
      if (
        elements.deleteConfirmButton
      ) {
        elements.deleteConfirmButton
          .disabled =
          false;
      }
    }
  }

  /* =======================================================
     Unsaved Navigation
  ======================================================= */

  function shouldGuardNavigation() {
    return (
      state.dirty &&
      !state.saving
    );
  }

  function interceptLinkNavigation(
    event
  ) {
    const link =
      event.currentTarget;

    if (
      !shouldGuardNavigation() ||
      link.target === "_blank" ||
      link.hasAttribute(
        "download"
      )
    ) {
      return;
    }

    event.preventDefault();

    state.pendingUrl =
      link.href;

    openDialog(
      elements.unsavedDialog
    );
  }

  function leaveWithoutSaving() {
    const navigationUrl =
      state.pendingUrl;

    state.pendingUrl =
      "";

    state.dirty =
      false;

    closeDialog(
      elements.unsavedDialog
    );

    if (navigationUrl) {
      window.location.href =
        navigationUrl;
    }
  }

    /* =======================================================
     Event Listeners
  ======================================================= */

  form.addEventListener(
    "submit",
    handleSubmit
  );

  form.addEventListener(
    "input",
    (event) => {
      const target =
        event.target;

      /*
       * テーマカラーの文字入力を
       * カラーピッカーへ同期
       */

      if (
        target ===
        elements.themeColor
      ) {
        const color =
          normalizeColor(
            getValue(
              elements.themeColor
            )
          );

        if (color) {
          setValue(
            elements.themeColorPicker,
            color
          );
        }
      }

      /*
       * 名前入力時にエラーを解除
       */

      if (
        target ===
        elements.name
      ) {
        elements.name
          ?.removeAttribute(
            "aria-invalid"
          );

        const nameError =
          byId("nameError");

        if (nameError) {
          nameError.hidden =
            true;
        }
      }

      /*
       * プレビューと未保存状態を更新
       */

      updatePreview();
      markDirty();
    }
  );

  form.addEventListener(
    "change",
    () => {
      updatePreview();
      markDirty();
    }
  );

  /* =======================================================
     Theme Color Events
  ======================================================= */

  elements.themeColorPicker
    ?.addEventListener(
      "input",
      () => {
        const color =
          normalizeColor(
            getValue(
              elements.themeColorPicker
            )
          ) ||
          DEFAULT_COLOR;

        setValue(
          elements.themeColor,
          color
        );

        elements.themeColor
          ?.removeAttribute(
            "aria-invalid"
          );

        if (
          elements.themeColorError
        ) {
          elements.themeColorError
            .hidden =
            true;
        }

        updatePreview();
        markDirty();
      }
    );

  elements.themeColor
    ?.addEventListener(
      "blur",
      () => {
        const color =
          normalizeColor(
            getValue(
              elements.themeColor
            )
          );

        if (!color) {
          return;
        }

        setValue(
          elements.themeColor,
          color
        );

        setValue(
          elements.themeColorPicker,
          color
        );

        elements.themeColor
          ?.removeAttribute(
            "aria-invalid"
          );

        if (
          elements.themeColorError
        ) {
          elements.themeColorError
            .hidden =
            true;
        }

        updatePreview();
      }
    );

  /* =======================================================
     Image Events
  ======================================================= */

  elements.imageInput
    ?.addEventListener(
      "change",
      (event) => {
        const file =
          event.target
            .files?.[0];

        processImage(
          file
        );
      }
    );

  elements.changeImageButton
    ?.addEventListener(
      "click",
      () => {
        elements.imageInput
          ?.click();
      }
    );

  elements.removeImageButton
    ?.addEventListener(
      "click",
      removeImage
    );

  /*
   * ドラッグ＆ドロップ
   */

  [
    "dragenter",
    "dragover",
  ].forEach(
    (eventName) => {
      elements.imageDropzone
        ?.addEventListener(
          eventName,
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            elements.imageDropzone
              ?.classList
              .add(
                "is-dragover"
              );
          }
        );
    }
  );

  [
    "dragleave",
    "drop",
  ].forEach(
    (eventName) => {
      elements.imageDropzone
        ?.addEventListener(
          eventName,
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            elements.imageDropzone
              ?.classList
              .remove(
                "is-dragover"
              );
          }
        );
    }
  );

  elements.imageDropzone
    ?.addEventListener(
      "drop",
      (event) => {
        const file =
          event.dataTransfer
            ?.files?.[0];

        processImage(
          file
        );
      }
    );

  /*
   * 保存済み画像が壊れていた場合、
   * プレースホルダーへ戻す
   */

  elements.imagePreview
    ?.addEventListener(
      "error",
      () => {
        if (
          elements.imagePreview
        ) {
          elements.imagePreview
            .hidden =
            true;
        }

        if (
          elements.imagePlaceholder
        ) {
          elements.imagePlaceholder
            .hidden =
            false;
        }
      }
    );

  /* =======================================================
     Save Buttons
  ======================================================= */

  saveButtons.forEach(
    (button) => {
      /*
       * form="characterForm"があるボタンは
       * ブラウザ標準でsubmitされるため、
       * 追加イベントは付けない
       */

      if (
        button.getAttribute(
          "form"
        ) ===
        "characterForm"
      ) {
        return;
      }

      button.addEventListener(
        "click",
        () => {
          if (
            typeof form.requestSubmit ===
              "function"
          ) {
            form.requestSubmit();
          } else {
            form.dispatchEvent(
              new Event(
                "submit",
                {
                  bubbles: true,
                  cancelable: true,
                }
              )
            );
          }
        }
      );
    }
  );

  /* =======================================================
     Duplicate Buttons
  ======================================================= */

  duplicateButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        duplicateCurrentCharacter
      );
    }
  );

  /* =======================================================
     New Character Buttons
  ======================================================= */

  newCharacterButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        startNewCharacter
      );
    }
  );

  /* =======================================================
     Copy Buttons
  ======================================================= */

  $$(
    "[data-copy-target]"
  ).forEach(
    (button) => {
      button.addEventListener(
        "click",
        handleCopyButton
      );
    }
  );

  /* =======================================================
     Export / Print / Scroll
  ======================================================= */

  elements.exportCharacterButton
    ?.addEventListener(
      "click",
      exportCharacterJson
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
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }
    );

  /* =======================================================
     Delete Dialog Events
  ======================================================= */

  elements.deleteButton
    ?.addEventListener(
      "click",
      openDeleteDialog
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

  elements.deleteCancelButton
    ?.addEventListener(
      "click",
      () => {
        closeDialog(
          elements.deleteDialog
        );
      }
    );

  elements.deleteConfirmButton
    ?.addEventListener(
      "click",
      confirmDeleteCharacter
    );

  elements.deleteDialog
    ?.addEventListener(
      "click",
      handleDialogBackdropClick
    );

  /* =======================================================
     Unsaved Dialog Events
  ======================================================= */

  elements.unsavedDialogClose
    ?.addEventListener(
      "click",
      () => {
        state.pendingUrl =
          "";

        closeDialog(
          elements.unsavedDialog
        );
      }
    );

  elements.unsavedStayButton
    ?.addEventListener(
      "click",
      () => {
        state.pendingUrl =
          "";

        closeDialog(
          elements.unsavedDialog
        );
      }
    );

  elements.unsavedLeaveButton
    ?.addEventListener(
      "click",
      leaveWithoutSaving
    );

  elements.unsavedDialog
    ?.addEventListener(
      "click",
      handleDialogBackdropClick
    );

  /* =======================================================
     Keyboard Events
  ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {
      /*
       * Ctrl + S / Command + Sで保存
       */

      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key
          .toLowerCase() ===
          "s"
      ) {
        event.preventDefault();

        if (
          typeof form.requestSubmit ===
            "function"
        ) {
          form.requestSubmit();
        }

        return;
      }

      /*
       * Escapeキーでダイアログを閉じる
       */

      if (
        event.key ===
        "Escape"
      ) {
        if (
          elements.deleteDialog
            ?.open
        ) {
          closeDialog(
            elements.deleteDialog
          );

          return;
        }

        if (
          elements.unsavedDialog
            ?.open
        ) {
          state.pendingUrl =
            "";

          closeDialog(
            elements.unsavedDialog
          );
        }
      }
    }
  );

  /* =======================================================
     Navigation Guard
  ======================================================= */

  $$(
    'a[href]:not([href^="#"])'
  ).forEach(
    (link) => {
      link.addEventListener(
        "click",
        interceptLinkNavigation
      );
    }
  );

  window.addEventListener(
    "beforeunload",
    (event) => {
      if (
        !shouldGuardNavigation()
      ) {
        return;
      }

      event.preventDefault();

      event.returnValue =
        "";
    }
  );

  /* =======================================================
     Initialize
  ======================================================= */

  function initialize() {
    initializePageMode();

    updatePreview();

    /*
     * 最初からhiddenが付いていない場合の保険
     */

    if (
      elements.toast
    ) {
      elements.toast.hidden =
        true;
    }

    if (
      elements.themeColorError
    ) {
      elements.themeColorError
        .hidden =
        true;
    }

    const nameError =
      byId("nameError");

    if (nameError) {
      nameError.hidden =
        true;
    }
  }

  initialize();
})();