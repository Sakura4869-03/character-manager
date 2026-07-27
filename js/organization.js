"use strict";

/* =========================================================
   Creative Archive
   organization.js
   organization.html 完全対応版
========================================================= */

(() => {
  /* =======================================================
     Constants
  ======================================================= */

  const DEFAULT_COLOR = "#8B6FC2";
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

  const form =
    document.getElementById(
      "organizationForm"
    );

  if (!form) {
    console.warn(
      "organizationFormが見つかりません。"
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

    organizationId:
      byId("organizationId"),

    name:
      byId("name"),

    reading:
      byId("reading"),

    shortName:
      byId("shortName"),

    work:
      byId("work"),

    type:
      byId("type"),

    status:
      byId("status"),

    founded:
      byId("founded"),

    location:
      byId("location"),

    leader:
      byId("leader"),

    parentOrganization:
      byId("parentOrganization"),

    symbol:
      byId("symbol"),

    motto:
      byId("motto"),

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

    typePreview:
      byId("typePreview"),

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

    exportOrganizationButton:
      byId(
        "exportOrganizationButton"
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

    nameError:
      byId("nameError"),
  };

  const saveButtons =
    $$(".js-save-organization");

  const duplicateButtons =
    $$(".js-duplicate-organization");

  const newOrganizationButtons =
    $$("[data-new-organization]");

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
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID ===
        "function"
    ) {
      return crypto.randomUUID();
    }

    return [
      "organization",
      Date.now().toString(36),
      Math.random()
        .toString(36)
        .slice(2, 10),
    ].join("-");
  }

  function normalizeColor(value) {
    const color =
      String(value || "")
        .trim()
        .toUpperCase();

    if (
      /^#[0-9A-F]{6}$/.test(
        color
      )
    ) {
      return color;
    }

    if (
      /^[0-9A-F]{6}$/.test(
        color
      )
    ) {
      return `#${color}`;
    }

    return "";
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
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

  function splitTags(value) {
    return String(value || "")
      .split(/[,\n、]+/)
      .map((tag) =>
        tag.trim()
      )
      .filter(Boolean)
      .filter(
        (
          tag,
          index,
          tags
        ) =>
          tags.indexOf(tag) ===
          index
      );
  }

  function sanitizeFileName(value) {
    const name =
      String(value || "")
        .trim()
        .replace(
          /[\\/:*?"<>|]/g,
          "_"
        )
        .replace(
          /\s+/g,
          "_"
        );

    return (
      name ||
      "organization"
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

  function getOrganizationData() {
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

      shortName:
        getValue(
          elements.shortName
        ),

      work:
        getValue(
          elements.work
        ),

      type:
        getValue(
          elements.type
        ),

      status:
        getValue(
          elements.status
        ),

      founded:
        getValue(
          elements.founded
        ),

      location:
        getValue(
          elements.location
        ),

      leader:
        getValue(
          elements.leader
        ),

      parentOrganization:
        getValue(
          elements.parentOrganization
        ),

      symbol:
        getValue(
          elements.symbol
        ),

      motto:
        getValue(
          elements.motto
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

      image:
        getValue(
          elements.image
        ),

      imagePosition:
        getValue(
          elements.imagePosition
        ) || "center",

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
    data
  ) {
    const normalized = {
      ...data,
    };

    delete normalized.updatedAt;

    return JSON.stringify(
      normalized
    );
  }

  /* =======================================================
     Dirty State
  ======================================================= */

  function updateStatus(
    updatedAt = ""
  ) {
    if (
      elements.saveStatus
    ) {
      elements.saveStatus
        .textContent =
        state.dirty
          ? "未保存の変更があります"
          : "保存済み";

      elements.saveStatus
        .classList
        .toggle(
          "is-dirty",
          state.dirty
        );
    }

    if (
      elements.updatedAt
    ) {
      elements.updatedAt
        .textContent =
        updatedAt
          ? `最終更新：${formatDate(
              updatedAt
            )}`
          : "";
    }
  }

  function markDirty() {
    const current =
      getComparableData(
        getOrganizationData()
      );

    state.dirty =
      current !==
      state.originalComparable;

    updateStatus(
      state.loadedData
        ?.updatedAt || ""
    );
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
      window.Common &&
      typeof window.Common.showToast ===
        "function"
    ) {
      window.Common.showToast(
        message,
        type
      );

      return;
    }

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
      typeof HTMLDialogElement ===
        "undefined" ||
      !(
        dialog instanceof
        HTMLDialogElement
      )
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
      elements.deleteButton.disabled =
        state.saving ||
        state.mode !== "edit";
    }
  }

  /* =======================================================
     Storage Adapter
  ======================================================= */

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

function getAllOrganizations() {
  const organizations =
    getStorageApi()
      .getOrganizations();

  return Array.isArray(
    organizations
  )
    ? organizations
    : [];
}

function findOrganizationById(
  id
) {
  if (!id) {
    return null;
  }

  return (
    getStorageApi()
      .getOrganizationById(id) ||
    null
  );
}

function persistOrganization(
  data
) {
  return getStorageApi()
    .saveOrganization(data);
}

function removeOrganization(
  id
) {
  if (!id) {
    return false;
  }

  return getStorageApi()
    .deleteOrganization(id);
}
    /* =======================================================
     Validation
  ======================================================= */

  function clearErrors() {
    if (
      elements.nameError
    ) {
      elements.nameError.hidden =
        true;
    }

    if (
      elements.themeColorError
    ) {
      elements.themeColorError.hidden =
        true;
    }

    elements.name
      ?.removeAttribute(
        "aria-invalid"
      );

    elements.themeColor
      ?.removeAttribute(
        "aria-invalid"
      );
  }

  function validateForm() {
    clearErrors();

    let valid = true;
    let firstInvalid = null;

    if (
      !getValue(
        elements.name
      )
    ) {
      valid = false;

      if (
        elements.nameError
      ) {
        elements.nameError.hidden =
          false;
      }

      elements.name
        ?.setAttribute(
          "aria-invalid",
          "true"
        );

      firstInvalid =
        elements.name;
    }

    const rawColor =
      getValue(
        elements.themeColor
      );

    if (
      rawColor &&
      !normalizeColor(rawColor)
    ) {
      valid = false;

      if (
        elements.themeColorError
      ) {
        elements.themeColorError.hidden =
          false;
      }

      elements.themeColor
        ?.setAttribute(
          "aria-invalid",
          "true"
        );

      if (!firstInvalid) {
        firstInvalid =
          elements.themeColor;
      }
    }

    firstInvalid?.focus();

    return valid;
  }

  /* =======================================================
     Save / Load
  ======================================================= */

  function saveOrganization(
    event
  ) {
    event?.preventDefault();

    if (
      state.saving ||
      !validateForm()
    ) {
      return;
    }

    setBusy(true);

    try {
      const data =
        getOrganizationData();

      const saved =
        persistOrganization(
          data
        );

      state.mode = "edit";
      state.id =
        saved.id || data.id;
      state.loadedData = {
        ...data,
        ...saved,
      };

      setValue(
        elements.organizationId,
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
        "組織・施設を保存しました。"
      );
    } catch (error) {
      console.error(error);

      showToast(
        error?.message ||
          "保存に失敗しました。",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  function loadOrganization() {
    const parameters =
      new URLSearchParams(
        window.location.search
      );

    const id =
      parameters.get("id");

    if (!id) {
      initializeNewOrganization();

      return;
    }

    const organization =
      findOrganizationById(
        id
      );

    if (!organization) {
      showToast(
        "指定された組織・施設が見つかりません。",
        "error"
      );

      initializeNewOrganization();

      return;
    }

    state.mode = "edit";
    state.id =
      String(
        organization.id
      );
    state.loadedData =
      organization;

    fillForm(
      organization
    );

    updateEditorMode();
    renderPreview();
    markClean(
      organization
    );
  }

  function initializeNewOrganization() {
    const api =
      getStorageApi();

    const empty =
      api &&
      typeof api.createEmptyOrganization ===
        "function"
        ? api.createEmptyOrganization()
        : {
            id: createId(),

            name: "",
            reading: "",
            shortName: "",
            work: "",
            type: "",
            status: "",
            founded: "",
            location: "",
            leader: "",
            parentOrganization: "",
            symbol: "",
            motto: "",
            tags: [],
            summary: "",

            image: "",
            imagePosition:
              "center",
            themeColor:
              DEFAULT_COLOR,

            purpose: "",
            history: "",
            structure: "",
            activities: "",
            membership: "",
            rules: "",
            resources: "",
            allies: "",
            enemies: "",
            influence: "",
            appearance: "",
            interior: "",
            atmosphere: "",

            promptJa: "",
            promptEn: "",
            negativePrompt: "",
            notes: "",
          };

    state.mode = "create";
    state.id =
      empty.id ||
      createId();
    state.loadedData = null;

    form.reset();

    fillForm({
      ...empty,

      id:
        state.id,

      themeColor:
        empty.themeColor ||
        DEFAULT_COLOR,

      imagePosition:
        empty.imagePosition ||
        "center",
    });

    updateEditorMode();
    renderPreview();

    const current =
      getOrganizationData();

    state.originalComparable =
      getComparableData(
        current
      );

    state.dirty = false;

    updateStatus();
  }
    function fillForm(data) {
    $$("[name]", form).forEach(
      (field) => {
        if (
          field.type === "file"
        ) {
          return;
        }

        let value =
          data[field.name];

        if (
          field.name === "tags" &&
          Array.isArray(value)
        ) {
          value =
            value.join(", ");
        }

        if (
          field.type ===
          "checkbox"
        ) {
          field.checked =
            Boolean(value);

          return;
        }

        if (
          field.type === "radio"
        ) {
          field.checked =
            String(field.value) ===
            String(value ?? "");

          return;
        }

        field.value =
          value ?? "";
      }
    );

    setValue(
      elements.organizationId,
      data.id ||
        state.id
    );

    setValue(
      elements.image,
      data.image || ""
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
      elements.themeColorPicker.value =
        color.toLowerCase();
    }

    setValue(
      elements.imagePosition,
      data.imagePosition ||
        "center"
    );
  }

  function updateEditorMode() {
    const isEdit =
      state.mode === "edit";

    setText(
      elements.pageTitle,
      isEdit
        ? "組織・施設を編集"
        : "新規組織・施設"
    );

    if (
      elements.deleteButton
    ) {
      elements.deleteButton.hidden =
        !isEdit;

      elements.deleteButton.disabled =
        state.saving ||
        !isEdit;
    }

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          state.saving ||
          !isEdit;
      }
    );
  }

  function updateUrlId(id) {
    const url =
      new URL(
        window.location.href
      );

    url.searchParams.set(
      "id",
      id
    );

    window.history.replaceState(
      {},
      "",
      url.toString()
    );
  }

  /* =======================================================
     Preview
  ======================================================= */

  function renderPreview() {
    const name =
      getValue(
        elements.name
      );

    const work =
      getValue(
        elements.work
      );

    const type =
      getValue(
        elements.type
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
      elements.namePreview,
      name,
      "組織名未設定"
    );

    setText(
      elements.workPreview,
      work,
      "作品未設定"
    );

    setText(
      elements.typePreview,
      type,
      "種類・分類"
    );

    setText(
      elements.summaryPreview,
      summary,
      "組織・施設の概要を入力すると、ここに表示されます。"
    );

    if (
      elements.previewInitial
    ) {
      elements.previewInitial.textContent =
        name
          ? name.charAt(0)
          : "⌂";
    }

    if (
      elements.themeColorPreview
    ) {
      elements.themeColorPreview.style.backgroundColor =
        color;
    }

    renderPreviewTags(
      tags
    );

    renderPreviewImage();
  }

  function renderPreviewTags(
    tags
  ) {
    if (
      !elements.tagPreview
    ) {
      return;
    }

    elements.tagPreview.innerHTML =
      "";

    tags
      .slice(0, 6)
      .forEach(
        (tag) => {
          const span =
            document.createElement(
              "span"
            );

          span.className =
            "tag";

          span.textContent =
            tag;

          elements.tagPreview.appendChild(
            span
          );
        }
      );
  }

  function renderPreviewImage() {
    const src =
      getValue(
        elements.image
      );

    if (
      !elements.imagePreview ||
      !elements.imagePlaceholder
    ) {
      return;
    }

    if (!src) {
      elements.imagePreview.hidden =
        true;

      elements.imagePreview.removeAttribute(
        "src"
      );

      elements.imagePreview.removeAttribute(
        "alt"
      );

      elements.imagePlaceholder.hidden =
        false;

      return;
    }

    elements.imagePreview.src =
      src;

    elements.imagePreview.alt =
      getValue(
        elements.name
      ) ||
      "組織・施設画像";

    elements.imagePreview.hidden =
      false;

    elements.imagePlaceholder.hidden =
      true;

    elements.imagePreview.style.objectPosition =
      getValue(
        elements.imagePosition
      ) ||
      "center";
  }
    /* =======================================================
     Image Handling
  ======================================================= */

  async function handleImageFile(
    file
  ) {
    if (!file) {
      return;
    }

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      showToast(
        "JPG・PNG・WebP形式の画像を選択してください。",
        "error"
      );

      return;
    }

    if (
      file.size >
      MAX_SOURCE_SIZE
    ) {
      showToast(
        "画像は10MB以下にしてください。",
        "error"
      );

      return;
    }

    try {
      const dataUrl =
        await resizeImage(
          file
        );

      setValue(
        elements.image,
        dataUrl
      );

      renderPreview();
      markDirty();

      showToast(
        "画像を設定しました。"
      );
    } catch (error) {
      console.error(error);

      showToast(
        error?.message ||
          "画像の読み込みに失敗しました。",
        "error"
      );
    } finally {
      if (
        elements.imageInput
      ) {
        elements.imageInput.value =
          "";
      }
    }
  }

  function resizeImage(file) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onerror =
          () => {
            reject(
              new Error(
                "画像を読み込めませんでした。"
              )
            );
          };

        reader.onload =
          () => {
            const image =
              new Image();

            image.onerror =
              () => {
                reject(
                  new Error(
                    "画像を処理できませんでした。"
                  )
                );
              };

            image.onload =
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
                      "画像を処理できませんでした。"
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

                const outputType =
                  file.type ===
                  "image/png"
                    ? "image/png"
                    : file.type ===
                        "image/webp"
                      ? "image/webp"
                      : "image/jpeg";

                let dataUrl;

                try {
                  dataUrl =
                    canvas.toDataURL(
                      outputType,
                      IMAGE_QUALITY
                    );
                } catch (error) {
                  reject(
                    new Error(
                      "画像の変換に失敗しました。"
                    )
                  );

                  return;
                }

                if (
                  !dataUrl ||
                  dataUrl ===
                    "data:,"
                ) {
                  reject(
                    new Error(
                      "画像の変換に失敗しました。"
                    )
                  );

                  return;
                }

                resolve(
                  dataUrl
                );
              };

            image.src =
              String(
                reader.result
              );
          };

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  function removeImage() {
    setValue(
      elements.image,
      ""
    );

    renderPreview();
    markDirty();

    showToast(
      "画像を削除しました。"
    );
  }

  /* =======================================================
     Duplicate / Delete
  ======================================================= */

  function duplicateOrganization() {
    if (
      state.mode !== "edit" ||
      state.saving
    ) {
      return;
    }

    const data =
      getOrganizationData();

    const now =
      new Date().toISOString();

    const duplicated = {
      ...data,

      id:
        createId(),

      name:
        data.name
          ? `${data.name}（コピー）`
          : "名称未設定（コピー）",

      createdAt:
        now,

      updatedAt:
        now,
    };

    try {
      const saved =
        persistOrganization(
          duplicated
        );

      const savedId =
        saved?.id ||
        duplicated.id;

      state.dirty =
        false;

      window.location.href =
        `organization.html?id=${encodeURIComponent(
          savedId
        )}`;
    } catch (error) {
      console.error(error);

      showToast(
        error?.message ||
          "複製に失敗しました。",
        "error"
      );
    }
  }

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
        elements.name
      ),
      "この組織・施設"
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

    setBusy(true);

    try {
      const deleted =
        removeOrganization(
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
        "index.html?type=organization";
    } catch (error) {
      console.error(error);

      showToast(
        error?.message ||
          "削除に失敗しました。",
        "error"
      );

      setBusy(false);
    }
  }
    /* =======================================================
     Export / Copy
  ======================================================= */

  function exportOrganization() {
    const data =
      getOrganizationData();

    const json =
      JSON.stringify(
        data,
        null,
        2
      );

    const blob =
      new Blob([json], {
        type: "application/json",
      });

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;

    anchor.download =
      `${sanitizeFileName(
        data.name
      )}.json`;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
      url
    );

    showToast(
      "JSONを書き出しました。"
    );
  }

  async function copyFieldValue(
    fieldId
  ) {
    const field =
      byId(fieldId);

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
        navigator.clipboard
          .writeText
      ) {
        await navigator.clipboard.writeText(
          value
        );
      } else {
        field.focus();
        field.select();

        document.execCommand(
          "copy"
        );

        field.setSelectionRange(
          value.length,
          value.length
        );
      }

      showToast(
        "コピーしました。"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "コピーに失敗しました。",
        "error"
      );
    }
  }

  /* =======================================================
     Navigation Guard
  ======================================================= */

  function requestNavigation(
    url
  ) {
    if (!url) {
      return;
    }

    if (!state.dirty) {
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
    state.dirty = false;

    const url =
      state.pendingUrl ||
      "index.html?type=organization";

    state.pendingUrl =
      "";

    closeDialog(
      elements.unsavedDialog
    );

    window.location.href =
      url;
  }

  /* =======================================================
     Sidebar
  ======================================================= */

  function openSidebar() {
    document.body.classList.add(
      "is-menu-open"
    );

    elements.sidebar?.classList.add(
      "is-open"
    );

    elements.sidebarOverlay?.removeAttribute(
      "hidden"
    );
  }

  function closeSidebar() {
    document.body.classList.remove(
      "is-menu-open"
    );

    elements.sidebar?.classList.remove(
      "is-open"
    );

    elements.sidebarOverlay?.setAttribute(
      "hidden",
      ""
    );
  }

  /* =======================================================
     Events
  ======================================================= */

  function bindEvents() {
    form.addEventListener(
      "submit",
      saveOrganization
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

    elements.imageInput
      ?.addEventListener(
        "change",
        (event) => {
          handleImageFile(
            event.target.files?.[0]
          );
        }
      );

    elements.changeImageButton
      ?.addEventListener(
        "click",
        () => {
          elements.imageInput?.click();
        }
      );

    elements.removeImageButton
      ?.addEventListener(
        "click",
        removeImage
      );

    elements.imageDropzone
      ?.addEventListener(
        "dragover",
        (event) => {
          event.preventDefault();

          elements.imageDropzone.classList.add(
            "is-dragover"
          );
        }
      );

    elements.imageDropzone
      ?.addEventListener(
        "dragleave",
        () => {
          elements.imageDropzone.classList.remove(
            "is-dragover"
          );
        }
      );

    elements.imageDropzone
      ?.addEventListener(
        "drop",
        (event) => {
          event.preventDefault();

          elements.imageDropzone.classList.remove(
            "is-dragover"
          );

          handleImageFile(
            event.dataTransfer?.files?.[0]
          );
        }
      );

    elements.themeColorPicker
      ?.addEventListener(
        "input",
        (event) => {
          const color =
            String(
              event.target.value ||
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
            elements.themeColorPicker.value =
              color.toLowerCase();
          }
        }
      );
          saveButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          saveOrganization
        );
      }
    );

    duplicateButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          duplicateOrganization
        );
      }
    );

    newOrganizationButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            requestNavigation(
              "organization.html"
            );
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

    elements.exportOrganizationButton
      ?.addEventListener(
        "click",
        exportOrganization
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
          elements.promptSection?.scrollIntoView(
            {
              behavior:
                "smooth",
              block: "start",
            }
          );
        }
      );

    copyButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const fieldId =
              button.dataset
                .copyTarget;

            if (fieldId) {
              copyFieldValue(
                fieldId
              );
            }
          }
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
        () => {
          state.pendingUrl =
            "";

          closeDialog(
            elements.unsavedDialog
          );
        }
      );

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
      .filter(Boolean)
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
        const isSave =
          (event.ctrlKey ||
            event.metaKey) &&
          event.key.toLowerCase() ===
            "s";

        if (isSave) {
          event.preventDefault();

          saveOrganization(
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

    loadOrganization();

    renderPreview();

    updateEditorMode();

    updateStatus(
      state.loadedData
        ?.updatedAt || ""
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();