"use strict";

/* =========================================================
   Character Archive
   character.js
========================================================= */

(function () {
  /* =======================================================
     Constants
  ======================================================= */

  const DEFAULT_THEME_COLOR = "#6C7CFF";
  const DEFAULT_CATEGORY = "未分類";
  const DEFAULT_NAME = "名前未設定";
  const DEFAULT_SUB_NAME = "CHARACTER NAME";

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

  /* =======================================================
     DOM Elements
  ======================================================= */

  const characterForm = document.getElementById("characterForm");

  if (!characterForm) {
    console.warn("characterFormが見つかりません。");
    return;
  }

  const elements = {
    form: characterForm,

    characterId: document.getElementById("characterId"),

    name: document.getElementById("name"),
    nameKana: document.getElementById("nameKana"),
    nameEn: document.getElementById("nameEn"),
    category: document.getElementById("category"),
    age: document.getElementById("age"),
    gender: document.getElementById("gender"),
    height: document.getElementById("height"),
    occupation: document.getElementById("occupation"),
    affiliation: document.getElementById("affiliation"),

    imageUrl: document.getElementById("imageUrl"),
    imageFile: document.getElementById("imageFile"),
    imageRemoveButton: document.getElementById("imageRemoveButton"),
    imageSettingPreview: document.getElementById("imageSettingPreview"),
    imageSettingPreviewImage: document.getElementById(
      "imageSettingPreviewImage"
    ),
    imageSettingEmpty: document.getElementById("imageSettingEmpty"),

    themeColor: document.getElementById("themeColor"),
    themeColorPicker: document.getElementById("themeColorPicker"),
    themeColorError: document.getElementById("themeColorError"),

    appearance: document.getElementById("appearance"),
    personality: document.getElementById("personality"),
    speech: document.getElementById("speech"),
    likes: document.getElementById("likes"),
    dislikes: document.getElementById("dislikes"),
    abilities: document.getElementById("abilities"),
    background: document.getElementById("background"),
    relationships: document.getElementById("relationships"),
    costume: document.getElementById("costume"),

    promptJa: document.getElementById("promptJa"),
    promptEn: document.getElementById("promptEn"),
    negativePrompt: document.getElementById("negativePrompt"),
    notes: document.getElementById("notes"),

    saveButton: document.getElementById("saveButton"),
    duplicateButton: document.getElementById("duplicateButton"),
    deleteButton: document.getElementById("deleteButton"),
    updatedAt: document.getElementById("updatedAt"),

    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage"),

    deleteDialog: document.getElementById("deleteDialog"),
    deleteDialogClose: document.getElementById("deleteDialogClose"),
    deleteCancelButton: document.getElementById("deleteCancelButton"),
    deleteConfirmButton: document.getElementById("deleteConfirmButton"),
    deleteTargetName: document.getElementById("deleteTargetName"),

    unsavedDialog: document.getElementById("unsavedDialog"),
    unsavedDialogClose: document.getElementById("unsavedDialogClose"),
    unsavedStayButton: document.getElementById("unsavedStayButton"),
    unsavedLeaveButton: document.getElementById("unsavedLeaveButton"),

    previewImage: document.getElementById("previewImage"),
    previewImagePlaceholder: document.getElementById(
      "previewImagePlaceholder"
    ),
    previewName: document.getElementById("previewName"),
    previewNameSub: document.getElementById("previewNameSub"),
    previewCategory: document.getElementById("previewCategory"),
    previewAge: document.getElementById("previewAge"),
    previewGender: document.getElementById("previewGender"),
    previewHeight: document.getElementById("previewHeight"),
    previewOccupation: document.getElementById("previewOccupation"),
    previewAffiliation: document.getElementById("previewAffiliation"),
    previewThemeChip: document.getElementById("previewThemeChip"),
    previewThemeCode: document.getElementById("previewThemeCode"),
  };

  /* =======================================================
     State
  ======================================================= */

  const state = {
    mode: "create",
    characterId: "",
    originalData: null,
    currentImage: "",
    uploadedImage: "",
    isDirty: false,
    isSaving: false,
    pendingNavigationUrl: "",
    toastTimer: null,
  };

  /* =======================================================
     URL Parameters
  ======================================================= */

  function getUrlParameters() {
    return new URLSearchParams(window.location.search);
  }

  function getCharacterIdFromUrl() {
    const params = getUrlParameters();

    return (
      params.get("id") ||
      params.get("characterId") ||
      ""
    ).trim();
  }

  function isDuplicateMode() {
    const params = getUrlParameters();

    return (
      params.get("mode") === "duplicate" ||
      params.get("duplicate") === "true"
    );
  }

  /* =======================================================
     General Helpers
  ======================================================= */

  function getElementValue(element) {
    if (!element) {
      return "";
    }

    return String(element.value || "").trim();
  }

  function setElementValue(element, value) {
    if (!element) {
      return;
    }

    element.value = value ?? "";
  }

  function setElementText(element, value, fallback = "") {
    if (!element) {
      return;
    }

    const normalizedValue = String(value ?? "").trim();

    element.textContent = normalizedValue || fallback;
  }

  function setElementHidden(element, shouldHide) {
    if (!element) {
      return;
    }

    element.hidden = Boolean(shouldHide);
  }

  function normalizeHexColor(value) {
    const color = String(value || "").trim().toUpperCase();

    if (!color) {
      return DEFAULT_THEME_COLOR;
    }

    const withHash = color.startsWith("#")
      ? color
      : `#${color}`;

    if (!HEX_COLOR_PATTERN.test(withHash)) {
      return "";
    }

    return withHash;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function createCharacterId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return [
      "character",
      Date.now(),
      Math.random().toString(36).slice(2, 10),
    ].join("-");
  }

  function formatDateTime(value) {
    if (!value) {
      return "未保存";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "未保存";
    }

    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function getDisplayValue(value, fallback = "未設定") {
    const normalizedValue = String(value ?? "").trim();

    return normalizedValue || fallback;
  }

  function getNumberDisplay(value, suffix = "") {
    const normalizedValue = String(value ?? "").trim();

    if (!normalizedValue) {
      return "未設定";
    }

    return `${normalizedValue}${suffix}`;
  }

  /* =======================================================
     Form Data
  ======================================================= */

  function getFormData() {
    const now = new Date().toISOString();

    const characterId =
      state.characterId ||
      getElementValue(elements.characterId) ||
      createCharacterId();

    const themeColor =
      normalizeHexColor(getElementValue(elements.themeColor)) ||
      DEFAULT_THEME_COLOR;

    return {
      id: characterId,

      name: getElementValue(elements.name),
      nameKana: getElementValue(elements.nameKana),
      nameEn: getElementValue(elements.nameEn),
      category: getElementValue(elements.category),
      age: getElementValue(elements.age),
      gender: getElementValue(elements.gender),
      height: getElementValue(elements.height),
      occupation: getElementValue(elements.occupation),
      affiliation: getElementValue(elements.affiliation),

      image: state.uploadedImage || state.currentImage || "",
      imageUrl: getElementValue(elements.imageUrl),
      themeColor,

      appearance: getElementValue(elements.appearance),
      personality: getElementValue(elements.personality),
      speech: getElementValue(elements.speech),
      likes: getElementValue(elements.likes),
      dislikes: getElementValue(elements.dislikes),
      abilities: getElementValue(elements.abilities),
      background: getElementValue(elements.background),
      relationships: getElementValue(elements.relationships),
      costume: getElementValue(elements.costume),

      promptJa: getElementValue(elements.promptJa),
      promptEn: getElementValue(elements.promptEn),
      negativePrompt: getElementValue(elements.negativePrompt),
      notes: getElementValue(elements.notes),

      createdAt:
        state.originalData?.createdAt ||
        now,

      updatedAt: now,
    };
  }

  function getComparableFormData() {
    const data = getFormData();

    delete data.updatedAt;

    return data;
  }

  function hasFormChanged() {
    if (!state.originalData) {
      const currentData = getComparableFormData();

      const ignoredKeys = [
        "id",
        "createdAt",
        "themeColor",
      ];

      return Object.entries(currentData).some(
        ([key, value]) =>
          !ignoredKeys.includes(key) &&
          String(value ?? "").trim() !== ""
      );
    }

    const currentData = getComparableFormData();
    const originalData = {
      ...state.originalData,
    };

    delete originalData.updatedAt;

    return (
      JSON.stringify(currentData) !==
      JSON.stringify(originalData)
    );
  }

  /* =======================================================
     Preview
  ======================================================= */

  function getPreviewImageSource() {
    const uploadedImage = String(
      state.uploadedImage || ""
    ).trim();

    if (uploadedImage) {
      return uploadedImage;
    }

    const imageUrl = getElementValue(elements.imageUrl);

    if (imageUrl) {
      return imageUrl;
    }

    return String(state.currentImage || "").trim();
  }

  function updatePreviewImage() {
    const imageSource = getPreviewImageSource();
    const hasImage = Boolean(imageSource);

    if (elements.previewImage) {
      if (hasImage) {
        elements.previewImage.src = imageSource;
        elements.previewImage.alt =
          getElementValue(elements.name) ||
          "キャラクター画像";
      } else {
        elements.previewImage.removeAttribute("src");
        elements.previewImage.alt = "";
      }

      setElementHidden(elements.previewImage, !hasImage);
    }

    setElementHidden(
      elements.previewImagePlaceholder,
      hasImage
    );

    if (elements.imageSettingPreviewImage) {
      if (hasImage) {
        elements.imageSettingPreviewImage.src = imageSource;
        elements.imageSettingPreviewImage.alt =
          getElementValue(elements.name) ||
          "キャラクター画像";
      } else {
        elements.imageSettingPreviewImage.removeAttribute("src");
        elements.imageSettingPreviewImage.alt = "";
      }

      setElementHidden(
        elements.imageSettingPreviewImage,
        !hasImage
      );
    }

    setElementHidden(elements.imageSettingEmpty, hasImage);
    setElementHidden(elements.imageRemoveButton, !hasImage);
  }

  function updatePreviewColor() {
    const enteredColor = getElementValue(elements.themeColor);

    const themeColor =
      normalizeHexColor(enteredColor) ||
      DEFAULT_THEME_COLOR;

    document.documentElement.style.setProperty(
      "--preview-color",
      themeColor
    );

    if (elements.previewThemeChip) {
      elements.previewThemeChip.style.backgroundColor =
        themeColor;
    }

    setElementText(
      elements.previewThemeCode,
      themeColor,
      DEFAULT_THEME_COLOR
    );
  }

  function updatePreview() {
    const name = getElementValue(elements.name);
    const nameEn = getElementValue(elements.nameEn);
    const nameKana = getElementValue(elements.nameKana);

    const subName =
      nameEn ||
      nameKana ||
      DEFAULT_SUB_NAME;

    setElementText(
      elements.previewName,
      name,
      DEFAULT_NAME
    );

    setElementText(
      elements.previewNameSub,
      subName,
      DEFAULT_SUB_NAME
    );

    setElementText(
      elements.previewCategory,
      getElementValue(elements.category),
      DEFAULT_CATEGORY
    );

    setElementText(
      elements.previewAge,
      getNumberDisplay(
        getElementValue(elements.age),
        "歳"
      )
    );

    setElementText(
      elements.previewGender,
      getDisplayValue(
        getElementValue(elements.gender)
      )
    );

    setElementText(
      elements.previewHeight,
      getNumberDisplay(
        getElementValue(elements.height),
        "cm"
      )
    );

    setElementText(
      elements.previewOccupation,
      getDisplayValue(
        getElementValue(elements.occupation)
      )
    );

    setElementText(
      elements.previewAffiliation,
      getDisplayValue(
        getElementValue(elements.affiliation)
      )
    );

    updatePreviewImage();
    updatePreviewColor();
  }

  /* =======================================================
     Theme Color
  ======================================================= */

  function showThemeColorError(message) {
    if (!elements.themeColorError) {
      return;
    }

    if (message) {
      elements.themeColorError.textContent = message;
      elements.themeColorError.hidden = false;
    } else {
      elements.themeColorError.hidden = true;
    }
  }

  function validateThemeColor() {
    const enteredColor = getElementValue(elements.themeColor);

    if (!enteredColor) {
      setElementValue(
        elements.themeColor,
        DEFAULT_THEME_COLOR
      );

      setElementValue(
        elements.themeColorPicker,
        DEFAULT_THEME_COLOR
      );

      showThemeColorError("");
      updatePreviewColor();

      return true;
    }

    const normalizedColor =
      normalizeHexColor(enteredColor);

    if (!normalizedColor) {
      elements.themeColor?.setAttribute(
        "aria-invalid",
        "true"
      );

      showThemeColorError(
        "「#」を含む6桁のHEXカラーコードを入力してください。"
      );

      return false;
    }

    elements.themeColor?.removeAttribute(
      "aria-invalid"
    );

    setElementValue(
      elements.themeColor,
      normalizedColor
    );

    setElementValue(
      elements.themeColorPicker,
      normalizedColor
    );

    showThemeColorError("");
    updatePreviewColor();

    return true;
  }

  function syncColorPickerToInput() {
    const color =
      normalizeHexColor(
        getElementValue(elements.themeColorPicker)
      ) || DEFAULT_THEME_COLOR;

    setElementValue(elements.themeColor, color);
    showThemeColorError("");
    elements.themeColor?.removeAttribute(
      "aria-invalid"
    );

    updatePreviewColor();
    markAsDirty();
  }

  function syncColorInputToPicker() {
    const color = normalizeHexColor(
      getElementValue(elements.themeColor)
    );

    if (color) {
      setElementValue(elements.themeColor, color);
      setElementValue(elements.themeColorPicker, color);
      showThemeColorError("");
      elements.themeColor?.removeAttribute(
        "aria-invalid"
      );

      updatePreviewColor();
    }
  }

  /* =======================================================
     Image Handling
  ======================================================= */

  function validateImageFile(file) {
    if (!file) {
      return {
        valid: false,
        message: "画像ファイルを選択してください。",
      };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        message:
          "JPEG、PNG、WebP、GIF形式の画像を選択してください。",
      };
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        message:
          "画像サイズは5MB以下にしてください。",
      };
    }

    return {
      valid: true,
      message: "",
    };
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        resolve(String(reader.result || ""));
      });

      reader.addEventListener("error", () => {
        reject(
          new Error(
            "画像ファイルの読み込みに失敗しました。"
          )
        );
      });

      reader.readAsDataURL(file);
    });
  }

  async function handleImageFileChange(event) {
    const file =
      event.currentTarget?.files?.[0] || null;

    if (!file) {
      return;
    }

    const validation = validateImageFile(file);

    if (!validation.valid) {
      showToast(validation.message, "error");

      if (elements.imageFile) {
        elements.imageFile.value = "";
      }

      return;
    }

    try {
      const imageData = await readImageFile(file);

      state.uploadedImage = imageData;

      setElementValue(elements.imageUrl, "");
      updatePreviewImage();
      markAsDirty();

      showToast(
        "画像を読み込みました。保存すると登録されます。",
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "画像の読み込みに失敗しました。",
        "error"
      );
    }
  }

  function removeCharacterImage() {
    state.uploadedImage = "";
    state.currentImage = "";

    setElementValue(elements.imageUrl, "");

    if (elements.imageFile) {
      elements.imageFile.value = "";
    }

    updatePreviewImage();
    markAsDirty();

    showToast(
      "画像を削除しました。保存すると変更が反映されます。",
      "success"
    );
  }

  function handleImageUrlInput() {
    if (getElementValue(elements.imageUrl)) {
      state.uploadedImage = "";

      if (elements.imageFile) {
        elements.imageFile.value = "";
      }
    }

    updatePreviewImage();
    markAsDirty();
  }

  /* =======================================================
     Dirty State
  ======================================================= */

  function markAsDirty() {
    state.isDirty = true;
  }

  function clearDirtyState() {
    state.isDirty = false;
  }

    /* =======================================================
     Toast
  ======================================================= */

  function showToast(message, type = "success") {
    if (!elements.toast || !elements.toastMessage) {
      return;
    }

    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
      state.toastTimer = null;
    }

    elements.toast.classList.remove(
      "is-success",
      "is-error"
    );

    if (type === "error") {
      elements.toast.classList.add("is-error");
    } else {
      elements.toast.classList.add("is-success");
    }

    elements.toastMessage.textContent =
      String(message || "");

    elements.toast.hidden = false;

    state.toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
      elements.toast.classList.remove(
        "is-success",
        "is-error"
      );

      state.toastTimer = null;
    }, 3200);
  }

  /* =======================================================
     Clipboard
  ======================================================= */

  async function copyText(text) {
    const normalizedText = String(text || "");

    if (!normalizedText) {
      throw new Error("コピーする内容がありません。");
    }

    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function" &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(normalizedText);
      return;
    }

    const temporaryTextarea =
      document.createElement("textarea");

    temporaryTextarea.value = normalizedText;
    temporaryTextarea.setAttribute("readonly", "");
    temporaryTextarea.style.position = "fixed";
    temporaryTextarea.style.top = "-9999px";
    temporaryTextarea.style.left = "-9999px";
    temporaryTextarea.style.opacity = "0";

    document.body.appendChild(temporaryTextarea);

    temporaryTextarea.select();
    temporaryTextarea.setSelectionRange(
      0,
      temporaryTextarea.value.length
    );

    const copied = document.execCommand("copy");

    temporaryTextarea.remove();

    if (!copied) {
      throw new Error("コピーに失敗しました。");
    }
  }

  async function handleCopyButton(event) {
    const button = event.currentTarget;
    const targetId =
      button?.dataset?.copyTarget || "";

    if (!targetId) {
      showToast(
        "コピー対象が設定されていません。",
        "error"
      );

      return;
    }

    const targetElement =
      document.getElementById(targetId);

    if (!targetElement) {
      showToast(
        "コピー対象が見つかりません。",
        "error"
      );

      return;
    }

    const text =
      "value" in targetElement
        ? targetElement.value
        : targetElement.textContent;

    try {
      await copyText(text);

      const originalText = button.textContent;

      button.textContent = "コピー済み";
      button.disabled = true;

      showToast(
        "クリップボードにコピーしました。",
        "success"
      );

      window.setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 1200);
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "コピーに失敗しました。",
        "error"
      );
    }
  }

  /* =======================================================
     Storage API Adapter
  ======================================================= */

  function getStorageApi() {
    return (
      window.CharacterStorage ||
      window.characterStorage ||
      window.StorageManager ||
      null
    );
  }

  function readAllCharacters() {
    const storageApi = getStorageApi();

    if (!storageApi) {
      throw new Error(
        "storage.jsの読み込みを確認してください。"
      );
    }

    if (
      typeof storageApi.getCharacters === "function"
    ) {
      const characters =
        storageApi.getCharacters();

      return Array.isArray(characters)
        ? characters
        : [];
    }

    if (
      typeof storageApi.getAllCharacters === "function"
    ) {
      const characters =
        storageApi.getAllCharacters();

      return Array.isArray(characters)
        ? characters
        : [];
    }

    if (
      typeof storageApi.loadCharacters === "function"
    ) {
      const characters =
        storageApi.loadCharacters();

      return Array.isArray(characters)
        ? characters
        : [];
    }

    throw new Error(
      "キャラクター一覧を取得する関数が見つかりません。"
    );
  }

  function readCharacterById(characterId) {
    const storageApi = getStorageApi();

    if (!storageApi) {
      throw new Error(
        "storage.jsの読み込みを確認してください。"
      );
    }

    if (
      typeof storageApi.getCharacterById === "function"
    ) {
      return (
        storageApi.getCharacterById(characterId) ||
        null
      );
    }

    if (
      typeof storageApi.findCharacterById === "function"
    ) {
      return (
        storageApi.findCharacterById(characterId) ||
        null
      );
    }

    const characters = readAllCharacters();

    return (
      characters.find(
        (character) =>
          String(character?.id || "") ===
          String(characterId || "")
      ) || null
    );
  }

  function saveCharacterToStorage(characterData) {
    const storageApi = getStorageApi();

    if (!storageApi) {
      throw new Error(
        "storage.jsの読み込みを確認してください。"
      );
    }

    if (
      typeof storageApi.saveCharacter === "function"
    ) {
      return storageApi.saveCharacter(characterData);
    }

    if (
      typeof storageApi.upsertCharacter === "function"
    ) {
      return storageApi.upsertCharacter(characterData);
    }

    if (
      typeof storageApi.updateCharacter === "function" &&
      state.mode === "edit"
    ) {
      return storageApi.updateCharacter(
        characterData.id,
        characterData
      );
    }

    if (
      typeof storageApi.addCharacter === "function"
    ) {
      return storageApi.addCharacter(characterData);
    }

    throw new Error(
      "キャラクターを保存する関数が見つかりません。"
    );
  }

  function deleteCharacterFromStorage(characterId) {
    const storageApi = getStorageApi();

    if (!storageApi) {
      throw new Error(
        "storage.jsの読み込みを確認してください。"
      );
    }

    if (
      typeof storageApi.deleteCharacter === "function"
    ) {
      return storageApi.deleteCharacter(characterId);
    }

    if (
      typeof storageApi.removeCharacter === "function"
    ) {
      return storageApi.removeCharacter(characterId);
    }

    if (
      typeof storageApi.deleteCharacterById === "function"
    ) {
      return storageApi.deleteCharacterById(
        characterId
      );
    }

    throw new Error(
      "キャラクターを削除する関数が見つかりません。"
    );
  }

  /* =======================================================
     Form Population
  ======================================================= */

  function setFormData(characterData) {
    const data = characterData || {};

    setElementValue(
      elements.characterId,
      data.id || ""
    );

    setElementValue(elements.name, data.name);
    setElementValue(elements.nameKana, data.nameKana);
    setElementValue(elements.nameEn, data.nameEn);
    setElementValue(elements.category, data.category);
    setElementValue(elements.age, data.age);
    setElementValue(elements.gender, data.gender);
    setElementValue(elements.height, data.height);
    setElementValue(
      elements.occupation,
      data.occupation
    );
    setElementValue(
      elements.affiliation,
      data.affiliation
    );

    setElementValue(
      elements.imageUrl,
      data.imageUrl || ""
    );

    const themeColor =
      normalizeHexColor(data.themeColor) ||
      DEFAULT_THEME_COLOR;

    setElementValue(
      elements.themeColor,
      themeColor
    );

    setElementValue(
      elements.themeColorPicker,
      themeColor
    );

    setElementValue(
      elements.appearance,
      data.appearance
    );

    setElementValue(
      elements.personality,
      data.personality
    );

    setElementValue(elements.speech, data.speech);
    setElementValue(elements.likes, data.likes);
    setElementValue(
      elements.dislikes,
      data.dislikes
    );

    setElementValue(
      elements.abilities,
      data.abilities
    );

    setElementValue(
      elements.background,
      data.background
    );

    setElementValue(
      elements.relationships,
      data.relationships
    );

    setElementValue(
      elements.costume,
      data.costume
    );

    setElementValue(
      elements.promptJa,
      data.promptJa
    );

    setElementValue(
      elements.promptEn,
      data.promptEn
    );

    setElementValue(
      elements.negativePrompt,
      data.negativePrompt
    );

    setElementValue(elements.notes, data.notes);

    state.currentImage =
      String(data.image || "").trim();

    state.uploadedImage = "";

    if (elements.imageFile) {
      elements.imageFile.value = "";
    }

    setElementText(
      elements.updatedAt,
      formatDateTime(data.updatedAt),
      "未保存"
    );

    updatePreview();
  }

  function createEmptyCharacterData() {
    return {
      id: createCharacterId(),

      name: "",
      nameKana: "",
      nameEn: "",
      category: "",
      age: "",
      gender: "",
      height: "",
      occupation: "",
      affiliation: "",

      image: "",
      imageUrl: "",
      themeColor: DEFAULT_THEME_COLOR,

      appearance: "",
      personality: "",
      speech: "",
      likes: "",
      dislikes: "",
      abilities: "",
      background: "",
      relationships: "",
      costume: "",

      promptJa: "",
      promptEn: "",
      negativePrompt: "",
      notes: "",

      createdAt: "",
      updatedAt: "",
    };
  }

  /* =======================================================
     Mode
  ======================================================= */

  function setCreateMode() {
    const emptyData = createEmptyCharacterData();

    state.mode = "create";
    state.characterId = emptyData.id;
    state.originalData = null;
    state.currentImage = "";
    state.uploadedImage = "";

    setFormData(emptyData);

    setElementHidden(elements.deleteButton, true);

    if (elements.duplicateButton) {
      elements.duplicateButton.disabled = true;
    }

    document.title =
      "キャラクターを新規作成 | Character Archive";

    clearDirtyState();
  }

  function setEditMode(characterData) {
    state.mode = "edit";
    state.characterId =
      String(characterData.id || "");

    state.originalData = {
      ...characterData,
    };

    setFormData(characterData);

    setElementHidden(elements.deleteButton, false);

    if (elements.duplicateButton) {
      elements.duplicateButton.disabled = false;
    }

    document.title =
      `${characterData.name || "キャラクター編集"} | Character Archive`;

    clearDirtyState();
  }

  function setDuplicateMode(sourceData) {
    const now = new Date().toISOString();

    const duplicatedData = {
      ...sourceData,

      id: createCharacterId(),

      name: sourceData.name
        ? `${sourceData.name}のコピー`
        : "",

      createdAt: now,
      updatedAt: "",
    };

    state.mode = "duplicate";
    state.characterId = duplicatedData.id;
    state.originalData = null;

    setFormData(duplicatedData);

    setElementHidden(elements.deleteButton, true);

    if (elements.duplicateButton) {
      elements.duplicateButton.disabled = true;
    }

    setElementText(elements.updatedAt, "未保存");

    document.title =
      "キャラクターを複製 | Character Archive";

    markAsDirty();

    showToast(
      "複製データを作成しました。保存すると新しいキャラクターとして登録されます。",
      "success"
    );
  }

  function initializeCharacterMode() {
    const characterId = getCharacterIdFromUrl();
    const duplicateMode = isDuplicateMode();

    if (!characterId) {
      setCreateMode();
      return;
    }

    try {
      const characterData =
        readCharacterById(characterId);

      if (!characterData) {
        showToast(
          "指定されたキャラクターが見つかりませんでした。",
          "error"
        );

        setCreateMode();
        return;
      }

      if (duplicateMode) {
        setDuplicateMode(characterData);
      } else {
        setEditMode(characterData);
      }
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "キャラクターデータの読み込みに失敗しました。",
        "error"
      );

      setCreateMode();
    }
  }

  /* =======================================================
     Validation
  ======================================================= */

  function clearFieldError(element) {
    if (!element) {
      return;
    }

    element.removeAttribute("aria-invalid");

    const errorId =
      element.getAttribute("aria-describedby");

    if (!errorId) {
      return;
    }

    const errorElement =
      document.getElementById(errorId);

    if (errorElement) {
      errorElement.hidden = true;
    }
  }

  function setFieldError(
    element,
    message,
    explicitErrorElement = null
  ) {
    if (!element) {
      return;
    }

    element.setAttribute(
      "aria-invalid",
      "true"
    );

    let errorElement = explicitErrorElement;

    if (!errorElement) {
      const errorId =
        element.getAttribute("aria-describedby");

      if (errorId) {
        errorElement =
          document.getElementById(errorId);
      }
    }

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.hidden = false;
    }
  }

  function validateRequiredName() {
    if (!elements.name) {
      return true;
    }

    clearFieldError(elements.name);

    const name = getElementValue(elements.name);

    if (!name) {
      setFieldError(
        elements.name,
        "キャラクター名を入力してください。"
      );

      return false;
    }

    return true;
  }

  function validateImageUrl() {
    if (!elements.imageUrl) {
      return true;
    }

    clearFieldError(elements.imageUrl);

    const imageUrl =
      getElementValue(elements.imageUrl);

    if (!imageUrl) {
      return true;
    }

    try {
      const parsedUrl = new URL(
        imageUrl,
        window.location.href
      );

      const validProtocol =
        parsedUrl.protocol === "http:" ||
        parsedUrl.protocol === "https:" ||
        parsedUrl.protocol === "data:";

      if (!validProtocol) {
        throw new Error(
          "使用できないURL形式です。"
        );
      }

      return true;
    } catch (error) {
      setFieldError(
        elements.imageUrl,
        "正しい画像URLを入力してください。"
      );

      return false;
    }
  }

  function validateForm() {
    const validationResults = [
      validateRequiredName(),
      validateThemeColor(),
      validateImageUrl(),
    ];

    const isValid =
      validationResults.every(Boolean);

    if (!isValid) {
      const firstInvalidElement =
        characterForm.querySelector(
          '[aria-invalid="true"]'
        );

      firstInvalidElement?.focus();

      firstInvalidElement?.scrollIntoView({
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
     Input Change
  ======================================================= */

  function handleFormInput(event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (
      target === elements.imageFile ||
      target === elements.themeColorPicker
    ) {
      return;
    }

    if (target === elements.imageUrl) {
      handleImageUrlInput();
      return;
    }

    if (target === elements.themeColor) {
      syncColorInputToPicker();
    }

    clearFieldError(target);
    updatePreview();
    markAsDirty();
  }

  function handleFormChange(event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target === elements.themeColor) {
      validateThemeColor();
    }

    updatePreview();
    markAsDirty();
  }

    /* =======================================================
     Save
  ======================================================= */

  function setSavingState(isSaving) {
    state.isSaving = Boolean(isSaving);

    characterForm.classList.toggle(
      "is-loading",
      state.isSaving
    );

    if (elements.saveButton) {
      elements.saveButton.disabled =
        state.isSaving;
    }

    if (elements.duplicateButton) {
      elements.duplicateButton.disabled =
        state.isSaving ||
        state.mode !== "edit";
    }

    if (elements.deleteButton) {
      elements.deleteButton.disabled =
        state.isSaving;
    }
  }

  function updateUrlAfterSave(characterId) {
    const url = new URL(window.location.href);

    url.searchParams.set("id", characterId);
    url.searchParams.delete("mode");
    url.searchParams.delete("duplicate");

    window.history.replaceState(
      {},
      "",
      url.toString()
    );
  }

  function handleSaveResult(savedData, fallbackData) {
    const normalizedData =
      savedData &&
      typeof savedData === "object"
        ? {
            ...fallbackData,
            ...savedData,
          }
        : fallbackData;

    state.mode = "edit";
    state.characterId =
      String(normalizedData.id || fallbackData.id);

    state.originalData = {
      ...normalizedData,
    };

    state.currentImage =
      String(normalizedData.image || "").trim();

    state.uploadedImage = "";

    setElementValue(
      elements.characterId,
      state.characterId
    );

    setElementText(
      elements.updatedAt,
      formatDateTime(normalizedData.updatedAt)
    );

    setElementHidden(elements.deleteButton, false);

    if (elements.duplicateButton) {
      elements.duplicateButton.disabled = false;
    }

    updateUrlAfterSave(state.characterId);
    updatePreview();
    clearDirtyState();

    document.title =
      `${normalizedData.name || "キャラクター編集"} | Character Archive`;
  }

  async function handleFormSubmit(event) {
    event.preventDefault();

    if (state.isSaving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const characterData = getFormData();

    state.characterId = characterData.id;

    setSavingState(true);

    try {
      const savedData =
        await Promise.resolve(
          saveCharacterToStorage(characterData)
        );

      handleSaveResult(
        savedData,
        characterData
      );

      showToast(
        state.mode === "edit"
          ? "キャラクターを保存しました。"
          : "キャラクターを登録しました。",
        "success"
      );
    } catch (error) {
      console.error(error);

      const isQuotaError =
        error?.name === "QuotaExceededError" ||
        String(error?.message || "")
          .toLowerCase()
          .includes("quota");

      showToast(
        isQuotaError
          ? "保存容量を超えました。画像サイズを小さくするか、不要なキャラクターを削除してください。"
          : error.message ||
              "キャラクターの保存に失敗しました。",
        "error"
      );
    } finally {
      setSavingState(false);
    }
  }

  /* =======================================================
     Duplicate
  ======================================================= */

  function handleDuplicate() {
    if (
      state.mode !== "edit" ||
      !state.characterId
    ) {
      showToast(
        "先にキャラクターを保存してください。",
        "error"
      );

      return;
    }

    const characterData = getFormData();
    const now = new Date().toISOString();

    const duplicatedData = {
      ...characterData,

      id: createCharacterId(),

      name: characterData.name
        ? `${characterData.name}のコピー`
        : "",

      createdAt: now,
      updatedAt: "",
    };

    state.mode = "duplicate";
    state.characterId = duplicatedData.id;
    state.originalData = null;
    state.currentImage =
      String(duplicatedData.image || "").trim();
    state.uploadedImage = "";

    setFormData(duplicatedData);

    setElementValue(
      elements.characterId,
      duplicatedData.id
    );

    setElementText(elements.updatedAt, "未保存");

    setElementHidden(elements.deleteButton, true);

    if (elements.duplicateButton) {
      elements.duplicateButton.disabled = true;
    }

    const url = new URL(window.location.href);

    url.search = "";

    window.history.replaceState(
      {},
      "",
      url.toString()
    );

    document.title =
      "キャラクターを複製 | Character Archive";

    markAsDirty();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    showToast(
      "複製データを作成しました。保存すると新しいキャラクターとして登録されます。",
      "success"
    );
  }

  /* =======================================================
     Dialog Helpers
  ======================================================= */

  function openDialog(dialog) {
    if (!dialog) {
      return;
    }

    if (
      typeof dialog.showModal === "function"
    ) {
      if (!dialog.open) {
        dialog.showModal();
      }

      return;
    }

    dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog) {
      return;
    }

    if (
      typeof dialog.close === "function" &&
      dialog.open
    ) {
      dialog.close();
      return;
    }

    dialog.removeAttribute("open");
  }

  function handleDialogBackdropClick(event) {
    const dialog = event.currentTarget;

    if (
      !(dialog instanceof HTMLDialogElement)
    ) {
      return;
    }

    const rect =
      dialog.getBoundingClientRect();

    const clickedInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!clickedInside) {
      closeDialog(dialog);
    }
  }

  /* =======================================================
     Delete
  ======================================================= */

  function openDeleteDialog() {
    if (
      state.mode !== "edit" ||
      !state.characterId
    ) {
      showToast(
        "削除できる保存済みデータがありません。",
        "error"
      );

      return;
    }

    setElementText(
      elements.deleteTargetName,
      getElementValue(elements.name),
      "名前未設定"
    );

    openDialog(elements.deleteDialog);
  }

  async function confirmDeleteCharacter() {
    if (!state.characterId) {
      return;
    }

    if (elements.deleteConfirmButton) {
      elements.deleteConfirmButton.disabled = true;
    }

    try {
      await Promise.resolve(
        deleteCharacterFromStorage(
          state.characterId
        )
      );

      clearDirtyState();
      closeDialog(elements.deleteDialog);

      showToast(
        "キャラクターを削除しました。",
        "success"
      );

      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "キャラクターの削除に失敗しました。",
        "error"
      );
    } finally {
      if (elements.deleteConfirmButton) {
        elements.deleteConfirmButton.disabled = false;
      }
    }
  }

  /* =======================================================
     Unsaved Changes
  ======================================================= */

  function shouldConfirmNavigation() {
    return (
      state.isDirty &&
      hasFormChanged() &&
      !state.isSaving
    );
  }

  function proceedPendingNavigation() {
    const destination =
      state.pendingNavigationUrl;

    state.pendingNavigationUrl = "";

    closeDialog(elements.unsavedDialog);
    clearDirtyState();

    if (destination) {
      window.location.href = destination;
    }
  }

  function cancelPendingNavigation() {
    state.pendingNavigationUrl = "";
    closeDialog(elements.unsavedDialog);
  }

  function handleInternalLinkClick(event) {
    const link = event.currentTarget;

    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const destination = link.href;

    if (
      !destination ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    if (!shouldConfirmNavigation()) {
      return;
    }

    event.preventDefault();

    state.pendingNavigationUrl = destination;

    openDialog(elements.unsavedDialog);
  }

  function handleBeforeUnload(event) {
    if (!shouldConfirmNavigation()) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  }

  /* =======================================================
     Image Error
  ======================================================= */

  function handlePreviewImageError() {
    const imageUrl =
      getElementValue(elements.imageUrl);

    if (imageUrl) {
      showToast(
        "画像URLから画像を読み込めませんでした。",
        "error"
      );
    }

    if (elements.previewImage) {
      elements.previewImage.hidden = true;
    }

    if (elements.imageSettingPreviewImage) {
      elements.imageSettingPreviewImage.hidden = true;
    }

    setElementHidden(
      elements.previewImagePlaceholder,
      false
    );

    setElementHidden(
      elements.imageSettingEmpty,
      false
    );
  }

  /* =======================================================
     Event Registration
  ======================================================= */

  function registerCopyButtonEvents() {
    const copyButtons =
      document.querySelectorAll(
        "[data-copy-target]"
      );

    copyButtons.forEach((button) => {
      button.addEventListener(
        "click",
        handleCopyButton
      );
    });
  }

  function registerInternalLinkEvents() {
    const internalLinks =
      document.querySelectorAll(
        'a[href]:not([href^="#"])'
      );

    internalLinks.forEach((link) => {
      link.addEventListener(
        "click",
        handleInternalLinkClick
      );
    });
  }

  function registerFormEvents() {
    characterForm.addEventListener(
      "submit",
      handleFormSubmit
    );

    characterForm.addEventListener(
      "input",
      handleFormInput
    );

    characterForm.addEventListener(
      "change",
      handleFormChange
    );

    elements.imageFile?.addEventListener(
      "change",
      handleImageFileChange
    );

    elements.imageRemoveButton?.addEventListener(
      "click",
      removeCharacterImage
    );

    elements.themeColorPicker?.addEventListener(
      "input",
      syncColorPickerToInput
    );

    elements.themeColor?.addEventListener(
      "blur",
      validateThemeColor
    );

    elements.previewImage?.addEventListener(
      "error",
      handlePreviewImageError
    );

    elements.imageSettingPreviewImage?.addEventListener(
      "error",
      handlePreviewImageError
    );
  }

  function registerActionEvents() {
    elements.duplicateButton?.addEventListener(
      "click",
      handleDuplicate
    );

    elements.deleteButton?.addEventListener(
      "click",
      openDeleteDialog
    );

    elements.deleteDialogClose?.addEventListener(
      "click",
      () => closeDialog(elements.deleteDialog)
    );

    elements.deleteCancelButton?.addEventListener(
      "click",
      () => closeDialog(elements.deleteDialog)
    );

    elements.deleteConfirmButton?.addEventListener(
      "click",
      confirmDeleteCharacter
    );

    elements.unsavedDialogClose?.addEventListener(
      "click",
      cancelPendingNavigation
    );

    elements.unsavedStayButton?.addEventListener(
      "click",
      cancelPendingNavigation
    );

    elements.unsavedLeaveButton?.addEventListener(
      "click",
      proceedPendingNavigation
    );

    elements.deleteDialog?.addEventListener(
      "click",
      handleDialogBackdropClick
    );

    elements.unsavedDialog?.addEventListener(
      "click",
      handleDialogBackdropClick
    );

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );
  }

  /* =======================================================
     Initial Form State
  ======================================================= */

  function initializeDefaultValues() {
    if (
      elements.themeColor &&
      !getElementValue(elements.themeColor)
    ) {
      setElementValue(
        elements.themeColor,
        DEFAULT_THEME_COLOR
      );
    }

    if (
      elements.themeColorPicker &&
      !getElementValue(elements.themeColorPicker)
    ) {
      setElementValue(
        elements.themeColorPicker,
        DEFAULT_THEME_COLOR
      );
    }
  }

  function initializeImageVisibility() {
    setElementHidden(elements.previewImage, true);
    setElementHidden(
      elements.imageSettingPreviewImage,
      true
    );

    setElementHidden(
      elements.imageRemoveButton,
      true
    );

    setElementHidden(
      elements.previewImagePlaceholder,
      false
    );

    setElementHidden(
      elements.imageSettingEmpty,
      false
    );
  }

  function initializeDialogs() {
    closeDialog(elements.deleteDialog);
    closeDialog(elements.unsavedDialog);
  }

  /* =======================================================
     Initialize
  ======================================================= */

  function initialize() {
    initializeDefaultValues();
    initializeImageVisibility();
    initializeDialogs();

    registerFormEvents();
    registerActionEvents();
    registerCopyButtonEvents();
    registerInternalLinkEvents();

    initializeCharacterMode();
    updatePreview();
  }

  initialize();
})();