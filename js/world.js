"use strict";

(() => {
  const DEFAULT_COLOR = "#5B67B7";
  const MAX_SOURCE_SIZE = 10 * 1024 * 1024;
  const IMAGE_MAX_EDGE = 1400;
  const IMAGE_QUALITY = 0.86;

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const form =
    document.getElementById(
      "worldForm"
    );

  if (!form) {
    return;
  }

  const $ = (
    selector,
    root = document
  ) =>
    root.querySelector(
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

  const el = {
    worldId:
      byId("worldId"),

    name:
      byId("name"),

    series:
      byId("series"),

    genre:
      byId("genre"),

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
      byId(
        "changeImageButton"
      ),

    removeImageButton:
      byId(
        "removeImageButton"
      ),

    imagePosition:
      byId("imagePosition"),

    themeColor:
      byId("themeColor"),

    themeColorPicker:
      byId(
        "themeColorPicker"
      ),

    themeColorError:
      byId(
        "themeColorError"
      ),

    imagePreview:
      byId("imagePreview"),

    imagePlaceholder:
      byId(
        "imagePlaceholder"
      ),

    previewInitial:
      byId("previewInitial"),

    themeColorPreview:
      byId(
        "themeColorPreview"
      ),

    seriesPreview:
      byId("seriesPreview"),

    namePreview:
      byId("namePreview"),

    genrePreview:
      byId("genrePreview"),

    summaryPreview:
      byId(
        "summaryPreview"
      ),

    tagPreview:
      byId("tagPreview"),

    pageTitle:
      byId("pageTitle"),

    saveStatus:
      byId("saveStatus"),

    updatedAt:
      byId("updatedAt"),

    exportWorldButton:
      byId(
        "exportWorldButton"
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
  };

  const saveButtons =
    $$(".js-save-world");

  const duplicateButtons =
    $$(".js-duplicate-world");

  const newButtons =
    $$("[data-new-world]");

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

  const getValue = (
    node
  ) =>
    node
      ? String(
          node.value ?? ""
        ).trim()
      : "";

  const setValue = (
    node,
    value
  ) => {
    if (node) {
      node.value =
        value ?? "";
    }
  };

  const setText = (
    node,
    value,
    fallback = ""
  ) => {
    if (node) {
      node.textContent =
        String(
          value ?? ""
        ).trim() ||
        fallback;
    }
  };

  const createId = () =>
    crypto?.randomUUID?.() ||
    `world-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

  const normalizeColor = (
    input
  ) => {
    const text =
      String(
        input || ""
      )
        .trim()
        .toUpperCase();

    const color =
      text.startsWith("#")
        ? text
        : `#${text}`;

    return /^#[0-9A-F]{6}$/.test(
      color
    )
      ? color
      : "";
  };

  const splitTags = (
    raw
  ) =>
    String(
      raw || ""
    )
      .split(
        /[,、，\n]/
      )
      .map(
        (value) =>
          value.trim()
      )
      .filter(
        Boolean
      )
      .slice(
        0,
        20
      );

  const formatDate = (
    value
  ) => {
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
  };

  const sanitize = (
    name
  ) =>
    String(
      name || ""
    )
      .replace(
        /[\/:*?"<>|]/g,
        "_"
      )
      .trim() ||
    "world";

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

  function readWorlds() {
    const worlds =
      getStorageApi()
        .getWorlds();

    return Array.isArray(
      worlds
    )
      ? worlds
      : [];
  }

  function saveWorld(
    data
  ) {
    return getStorageApi()
      .saveWorld(
        data
      );
  }

  function deleteWorld(
    id
  ) {
    if (!id) {
      return false;
    }

    return getStorageApi()
      .deleteWorld(
        id
      );
  }

  function findWorld(
    id
  ) {
    if (!id) {
      return null;
    }

    return (
      getStorageApi()
        .getWorldById(
          id
        ) ||
      null
    );
  }
    function getFormObject() {
    const data = {};

    $$("[name]", form).forEach((field) => {
      if (field.type !== "file") {
        data[field.name] = field.value;
      }
    });

    return data;
  }

  function getWorldData() {
    const now = new Date().toISOString();
    const raw = getFormObject();

    return {
      ...raw,
      id:
        state.id ||
        getValue(el.worldId) ||
        createId(),
      image: getValue(el.image),
      themeColor:
        normalizeColor(
          getValue(el.themeColor)
        ) || DEFAULT_COLOR,
      createdAt:
        state.mode === "edit" &&
        state.loadedData?.createdAt
          ? state.loadedData.createdAt
          : now,
      updatedAt: now,
    };
  }

  function comparable(
    data = getWorldData()
  ) {
    const copy = {
      ...data,
    };

    delete copy.updatedAt;

    return JSON.stringify(
      copy
    );
  }

  function updateStatus(
    updatedAt =
      state.loadedData?.updatedAt
  ) {
    if (el.saveStatus) {
      el.saveStatus.classList.toggle(
        "is-dirty",
        state.dirty
      );

      el.saveStatus.classList.toggle(
        "is-saved",
        !state.dirty &&
          state.mode === "edit"
      );

      el.saveStatus.textContent =
        state.dirty
          ? "未保存の変更あり"
          : state.mode === "edit"
            ? "保存済み"
            : "未保存";
    }

    if (el.updatedAt) {
      el.updatedAt.textContent =
        formatDate(
          updatedAt
        );
    }
  }

  function markDirty() {
    if (state.saving) {
      return;
    }

    state.dirty =
      comparable() !==
      state.originalComparable;

    updateStatus();
  }

  function markClean(data) {
    state.originalComparable =
      comparable(data);

    state.dirty =
      false;

    updateStatus(
      data?.updatedAt
    );
  }
    function showToast(
    message,
    type = "success"
  ) {
    if (
      !el.toast ||
      !el.toastMessage
    ) {
      return;
    }

    clearTimeout(
      state.toastTimer
    );

    el.toastMessage.textContent =
      message;

    el.toast.hidden =
      false;

    el.toast.dataset.type =
      type;

    state.toastTimer =
      setTimeout(() => {
        el.toast.hidden =
          true;
      }, 3200);
  }

  function openDialog(
    dialog
  ) {
    if (!dialog) {
      return;
    }

    if (
      typeof dialog.showModal ===
        "function" &&
      !dialog.open
    ) {
      dialog.showModal();
    } else {
      dialog.setAttribute(
        "open",
        ""
      );
    }
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
    } else {
      dialog.removeAttribute(
        "open"
      );
    }
  }

  function setBusy(
    busy
  ) {
    state.saving =
      Boolean(busy);

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
      el.deleteButton
    ) {
      el.deleteButton.disabled =
        state.saving;
    }
  }

  function updatePreview() {
    const color =
      normalizeColor(
        getValue(
          el.themeColor
        )
      ) ||
      DEFAULT_COLOR;

    document.documentElement.style.setProperty(
      "--preview-color",
      color
    );

    document.documentElement.style.setProperty(
      "--accent-color",
      color
    );

    setText(
      el.namePreview,
      getValue(el.name),
      "世界観名未設定"
    );

    setText(
      el.seriesPreview,
      getValue(el.series),
      "作品未設定"
    );

    setText(
      el.genrePreview,
      getValue(el.genre),
      "ジャンル未設定"
    );

    setText(
      el.summaryPreview,
      getValue(el.summary),
      "世界観の概要を入力すると、ここに表示されます。"
    );

    if (
      el.previewInitial
    ) {
      el.previewInitial.textContent =
        getValue(el.name)
          ? Array.from(
              getValue(
                el.name
              )
            )[0]
          : "✦";
    }

    if (
      el.themeColorPreview
    ) {
      el.themeColorPreview.style.backgroundColor =
        color;
    }

    if (
      el.tagPreview
    ) {
      const tags =
        splitTags(
          getValue(
            el.tags
          )
        );

      const tagElements =
        tags.map(
          (tag) => {
            const span =
              document.createElement(
                "span"
              );

            span.textContent =
              tag;

            return span;
          }
        );

      el.tagPreview.replaceChildren(
        ...tagElements
      );
    }

    const image =
      getValue(
        el.image
      );

    if (
      el.imagePreview &&
      el.imagePlaceholder
    ) {
      if (image) {
        el.imagePreview.src =
          image;

        el.imagePreview.alt =
          getValue(el.name)
            ? `${getValue(el.name)}の世界観イメージ`
            : "世界観イメージ";

        el.imagePreview.style.objectPosition =
          getValue(
            el.imagePosition
          ) ||
          "center";

        el.imagePreview.hidden =
          false;

        el.imagePlaceholder.hidden =
          true;
      } else {
        el.imagePreview.removeAttribute(
          "src"
        );

        el.imagePreview.hidden =
          true;

        el.imagePlaceholder.hidden =
          false;
      }
    }
  }
    function validate() {
    let ok = true;

    const nameError =
      byId("nameError");

    if (
      !getValue(el.name)
    ) {
      el.name?.setAttribute(
        "aria-invalid",
        "true"
      );

      if (nameError) {
        nameError.hidden =
          false;
      }

      ok = false;
    } else {
      el.name?.removeAttribute(
        "aria-invalid"
      );

      if (nameError) {
        nameError.hidden =
          true;
      }
    }

    const color =
      normalizeColor(
        getValue(
          el.themeColor
        )
      );

    if (!color) {
      el.themeColor?.setAttribute(
        "aria-invalid",
        "true"
      );

      if (
        el.themeColorError
      ) {
        el.themeColorError.hidden =
          false;
      }

      ok = false;
    } else {
      el.themeColor?.removeAttribute(
        "aria-invalid"
      );

      if (
        el.themeColorError
      ) {
        el.themeColorError.hidden =
          true;
      }

      setValue(
        el.themeColor,
        color
      );

      setValue(
        el.themeColorPicker,
        color
      );
    }

    if (!ok) {
      form
        .querySelector(
          '[aria-invalid="true"]'
        )
        ?.focus();

      showToast(
        "入力内容を確認してください。",
        "error"
      );
    }

    return ok;
  }

  function populate(
    data = {}
  ) {
    $$(
      "[name]",
      form
    ).forEach(
      (field) => {
        if (
          field.type !==
            "file" &&
          field.name
        ) {
          field.value =
            data[
              field.name
            ] ?? "";
        }
      }
    );

    const color =
      normalizeColor(
        data.themeColor
      ) ||
      DEFAULT_COLOR;

    setValue(
      el.themeColor,
      color
    );

    setValue(
      el.themeColorPicker,
      color
    );

    setValue(
      el.worldId,
      data.id || ""
    );

    setValue(
      el.image,
      data.image || ""
    );

    if (
      el.imagePosition &&
      !getValue(
        el.imagePosition
      )
    ) {
      setValue(
        el.imagePosition,
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

  function setCreate() {
    const data = {
      id:
        createId(),

      themeColor:
        DEFAULT_COLOR,

      imagePosition:
        "center",

      image:
        "",

      createdAt:
        "",

      updatedAt:
        "",
    };

    state.mode =
      "create";

    state.id =
      data.id;

    populate(
      data
    );

    if (
      el.pageTitle
    ) {
      el.pageTitle.textContent =
        "新規世界観";
    }

    document.title =
      "新規世界観 | Character Archive";

    duplicateButtons.forEach(
      (button) => {
        button.disabled =
          true;
      }
    );

    if (
      el.deleteButton
    ) {
      el.deleteButton.hidden =
        true;
    }

    markClean(
      data
    );
  }
    function setEdit(data) {
    state.mode = "edit";
    state.id = String(data.id);

    populate(data);

    if (el.pageTitle) {
      el.pageTitle.textContent =
        data.name ||
        "世界観編集";
    }

    document.title =
      `${data.name || "世界観編集"} | Character Archive`;

    duplicateButtons.forEach((button) => {
      button.disabled = false;
    });

    if (el.deleteButton) {
      el.deleteButton.hidden = false;
    }

    markClean(data);
  }

  function setDuplicate(source) {
    const data = {
      ...source,
      id: createId(),
      name: source.name
        ? `${source.name}のコピー`
        : "",
      createdAt: "",
      updatedAt: "",
    };

    state.mode = "duplicate";
    state.id = data.id;

    populate(data);

    if (el.pageTitle) {
      el.pageTitle.textContent =
        "世界観を複製";
    }

    duplicateButtons.forEach((button) => {
      button.disabled = true;
    });

    if (el.deleteButton) {
      el.deleteButton.hidden = true;
    }

    state.originalComparable = "";

    markDirty();
  }

  function initializeMode() {
    const params =
      new URLSearchParams(
        location.search
      );

    const id =
      params.get("id") || "";

    if (!id) {
      setCreate();
      return;
    }

    const data =
      findWorld(id);

    if (!data) {
      showToast(
        "指定された世界観が見つかりませんでした。",
        "error"
      );

      setCreate();
      return;
    }

    if (
      params.get("mode") ===
      "duplicate"
    ) {
      setDuplicate(data);
    } else {
      setEdit(data);
    }
  }
    async function submit(event) {
    event.preventDefault();

    if (
      state.saving ||
      !validate()
    ) {
      return;
    }

    const previousMode =
      state.mode;

    const data =
      getWorldData();

    setBusy(true);

    try {
      const saved =
        await Promise.resolve(
          saveWorld(data)
        );

      state.mode =
        "edit";

      state.id =
        saved.id;

      populate(saved);

      markClean(saved);

      const url =
        new URL(
          location.href
        );

      url.searchParams.set(
        "id",
        saved.id
      );

      url.searchParams.delete(
        "mode"
      );

      history.replaceState(
        {},
        "",
        url
      );

      duplicateButtons.forEach(
        (button) => {
          button.disabled =
            false;
        }
      );

      if (
        el.deleteButton
      ) {
        el.deleteButton.hidden =
          false;
      }

      if (
        el.pageTitle
      ) {
        el.pageTitle.textContent =
          saved.name ||
          "世界観編集";
      }

      showToast(
        previousMode ===
          "edit"
          ? "世界観を保存しました。"
          : "世界観を登録しました。"
      );
    } catch (error) {
      console.error(
        error
      );

      showToast(
        "保存に失敗しました。画像容量も確認してください。",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  function loadImage(file) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload =
          () =>
            resolve(
              String(
                reader.result ||
                  ""
              )
            );

        reader.onerror =
          () =>
            reject(
              new Error(
                "画像の読み込みに失敗しました。"
              )
            );

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  function resizeImage(
    url,
    type
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const image =
          new Image();

        image.onload =
          () => {
            const scale =
              Math.min(
                1,
                IMAGE_MAX_EDGE /
                  Math.max(
                    image.width,
                    image.height
                  )
              );

            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width =
              Math.max(
                1,
                Math.round(
                  image.width *
                    scale
                )
              );

            canvas.height =
              Math.max(
                1,
                Math.round(
                  image.height *
                    scale
                )
              );

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
              canvas.width,
              canvas.height
            );

            resolve(
              canvas.toDataURL(
                type ===
                  "image/png"
                  ? "image/png"
                  : "image/jpeg",
                IMAGE_QUALITY
              )
            );
          };

        image.onerror =
          () =>
            reject(
              new Error(
                "画像を表示できませんでした。"
              )
            );

        image.src =
          url;
      }
    );
  }
    async function processImage(file) {
    if (!file) {
      return;
    }

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      showToast(
        "JPG・PNG・WebP形式を選択してください。",
        "error"
      );
      return;
    }

    if (
      file.size >
      MAX_SOURCE_SIZE
    ) {
      showToast(
        "元画像は10MB以下にしてください。",
        "error"
      );
      return;
    }

    try {
      const sourceUrl =
        await loadImage(
          file
        );

      const resizedUrl =
        await resizeImage(
          sourceUrl,
          file.type
        );

      setValue(
        el.image,
        resizedUrl
      );

      updatePreview();
      markDirty();

      showToast(
        "画像を読み込みました。"
      );
    } catch (error) {
      console.error(
        error
      );

      showToast(
        error.message ||
          "画像の読み込みに失敗しました。",
        "error"
      );
    } finally {
      if (
        el.imageInput
      ) {
        el.imageInput.value =
          "";
      }
    }
  }

  async function copyTarget(
    event
  ) {
    const target =
      byId(
        event.currentTarget.dataset.copyTarget
      );

    const text =
      target?.value ||
      target?.textContent ||
      "";

    if (
      !text.trim()
    ) {
      showToast(
        "コピーする内容がありません。",
        "error"
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      showToast(
        "コピーしました。"
      );
    } catch (error) {
      console.error(
        error
      );

      showToast(
        "コピーに失敗しました。",
        "error"
      );
    }
  }

  function exportJson() {
    const data =
      getWorldData();

    const blob =
      new Blob(
        [
          JSON.stringify(
            data,
            null,
            2
          ),
        ],
        {
          type:
            "application/json;charset=utf-8",
        }
      );

    const link =
      document.createElement(
        "a"
      );

    const objectUrl =
      URL.createObjectURL(
        blob
      );

    link.href =
      objectUrl;

    link.download =
      `${sanitize(
        data.name
      )}.json`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      objectUrl
    );
  }
    form.addEventListener(
    "submit",
    submit
  );

  form.addEventListener(
    "input",
    (event) => {
      if (
        event.target ===
        el.themeColor
      ) {
        const color =
          normalizeColor(
            getValue(
              el.themeColor
            )
          );

        if (color) {
          setValue(
            el.themeColorPicker,
            color
          );
        }
      }

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

  el.themeColorPicker?.addEventListener(
    "input",
    () => {
      setValue(
        el.themeColor,
        getValue(
          el.themeColorPicker
        )
      );

      updatePreview();
      markDirty();
    }
  );

  el.imageInput?.addEventListener(
    "change",
    (event) =>
      processImage(
        event.target.files?.[0]
      )
  );

  el.changeImageButton?.addEventListener(
    "click",
    () =>
      el.imageInput?.click()
  );

  el.removeImageButton?.addEventListener(
    "click",
    () => {
      setValue(
        el.image,
        ""
      );

      updatePreview();
      markDirty();
    }
  );

  [
    "dragenter",
    "dragover",
  ].forEach((name) => {
    el.imageDropzone?.addEventListener(
      name,
      (event) => {
        event.preventDefault();

        el.imageDropzone.classList.add(
          "is-dragover"
        );
      }
    );
  });

  [
    "dragleave",
    "drop",
  ].forEach((name) => {
    el.imageDropzone?.addEventListener(
      name,
      (event) => {
        event.preventDefault();

        el.imageDropzone.classList.remove(
          "is-dragover"
        );
      }
    );
  });

  el.imageDropzone?.addEventListener(
    "drop",
    (event) =>
      processImage(
        event.dataTransfer
          ?.files?.[0]
      )
  );

  duplicateButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          if (
            state.mode !==
            "edit"
          ) {
            return;
          }

          setDuplicate(
            getWorldData()
          );

          history.replaceState(
            {},
            "",
            location.pathname
          );
        }
      );
    }
  );

  newButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          if (
            state.dirty
          ) {
            state.pendingUrl =
              "world.html";

            openDialog(
              el.unsavedDialog
            );

            return;
          }

          location.href =
            "world.html";
        }
      );
    }
  );

  $$("[data-copy-target]").forEach(
    (button) => {
      button.addEventListener(
        "click",
        copyTarget
      );
    }
  );

  el.exportWorldButton?.addEventListener(
    "click",
    exportJson
  );

  el.printButton?.addEventListener(
    "click",
    () => print()
  );

  el.scrollToPromptButton?.addEventListener(
    "click",
    () =>
      el.promptSection?.scrollIntoView(
        {
          behavior:
            "smooth",
        }
      )
  );
    el.deleteButton?.addEventListener(
    "click",
    () => {
      if (
        el.deleteTargetName
      ) {
        el.deleteTargetName.textContent =
          getValue(el.name) ||
          "この世界観";
      }

      openDialog(
        el.deleteDialog
      );
    }
  );

  el.deleteDialogClose?.addEventListener(
    "click",
    () => {
      closeDialog(
        el.deleteDialog
      );
    }
  );

  el.deleteCancelButton?.addEventListener(
    "click",
    () => {
      closeDialog(
        el.deleteDialog
      );
    }
  );

  el.deleteConfirmButton?.addEventListener(
    "click",
    async () => {
      if (
        state.saving ||
        !state.id
      ) {
        return;
      }

      setBusy(true);

      try {
        await Promise.resolve(
          deleteWorld(
            state.id
          )
        );

        state.dirty =
          false;

        closeDialog(
          el.deleteDialog
        );

        location.href =
          "index.html";
      } catch (error) {
        console.error(
          error
        );

        showToast(
          "世界観の削除に失敗しました。",
          "error"
        );

        setBusy(false);
      }
    }
  );

  el.unsavedDialogClose?.addEventListener(
    "click",
    () => {
      closeDialog(
        el.unsavedDialog
      );
    }
  );

  el.unsavedStayButton?.addEventListener(
    "click",
    () => {
      state.pendingUrl =
        "";

      closeDialog(
        el.unsavedDialog
      );
    }
  );

  el.unsavedLeaveButton?.addEventListener(
    "click",
    () => {
      const url =
        state.pendingUrl;

      state.dirty =
        false;

      state.pendingUrl =
        "";

      closeDialog(
        el.unsavedDialog
      );

      if (url) {
        location.href =
          url;
      }
    }
  );

  $$(
    'a[href]:not([href^="#"])'
  ).forEach(
    (anchor) => {
      anchor.addEventListener(
        "click",
        (event) => {
          if (
            !state.dirty ||
            state.saving
          ) {
            return;
          }

          event.preventDefault();

          state.pendingUrl =
            anchor.href;

          openDialog(
            el.unsavedDialog
          );
        }
      );
    }
  );

  addEventListener(
    "beforeunload",
    (event) => {
      if (
        state.dirty &&
        !state.saving
      ) {
        event.preventDefault();

        event.returnValue =
          "";
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key.toLowerCase() ===
          "s"
      ) {
        event.preventDefault();

        form.requestSubmit();
      }

      if (
        event.key ===
        "Escape"
      ) {
        closeDialog(
          el.deleteDialog
        );

        closeDialog(
          el.unsavedDialog
        );
      }
    }
  );

  initializeMode();
  updatePreview();

  if (
    el.toast
  ) {
    el.toast.hidden =
      true;
  }
})();