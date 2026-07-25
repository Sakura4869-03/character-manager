/* ==========================================
   Character Archive
   Common Functions
========================================== */

(function () {
  "use strict";

  let toastTimer = null;

  /**
   * HTMLで特殊な意味を持つ文字をエスケープ
   *
   * @param {unknown} value
   * @returns {string}
   */
  function escapeHtml(value) {
    const text = String(value ?? "");

    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * 属性値用のエスケープ
   *
   * @param {unknown} value
   * @returns {string}
   */
  function escapeAttribute(value) {
    return escapeHtml(value)
      .replace(/`/g, "&#096;");
  }

  /**
   * 改行をbrタグへ変換
   *
   * @param {unknown} value
   * @returns {string}
   */
  function nl2br(value) {
    return escapeHtml(value)
      .replace(/\r\n|\r|\n/g, "<br>");
  }

  /**
   * 文字列の前後空白を除去
   *
   * @param {unknown} value
   * @returns {string}
   */
  function trimText(value) {
    return String(value ?? "").trim();
  }

  /**
   * 長い文字列を省略
   *
   * @param {unknown} value
   * @param {number} maxLength
   * @returns {string}
   */
  function truncateText(value, maxLength = 60) {
    const text = trimText(value);

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}…`;
  }

  /**
   * 日付文字列を日本語表記に変換
   *
   * @param {string} dateString
   * @param {boolean} includeTime
   * @returns {string}
   */
  function formatDate(
    dateString,
    includeTime = false
  ) {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const options = includeTime
      ? {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }
      : {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        };

    return new Intl.DateTimeFormat(
      "ja-JP",
      options
    ).format(date);
  }

  /**
   * 日時を相対表記へ変換
   *
   * @param {string} dateString
   * @returns {string}
   */
  function formatRelativeDate(dateString) {
    if (!dateString) {
      return "";
    }

    const targetDate =
      new Date(dateString);

    if (
      Number.isNaN(
        targetDate.getTime()
      )
    ) {
      return "";
    }

    const now = new Date();

    const diffMilliseconds =
      now.getTime() -
      targetDate.getTime();

    const diffMinutes =
      Math.floor(
        diffMilliseconds /
        1000 /
        60
      );

    if (diffMinutes < 1) {
      return "たった今";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    }

    const diffHours =
      Math.floor(
        diffMinutes / 60
      );

    if (diffHours < 24) {
      return `${diffHours}時間前`;
    }

    const diffDays =
      Math.floor(
        diffHours / 24
      );

    if (diffDays < 7) {
      return `${diffDays}日前`;
    }

    return formatDate(dateString);
  }

  /**
   * URLのクエリパラメータを取得
   *
   * @param {string} parameterName
   * @returns {string}
   */
  function getQueryParameter(
    parameterName
  ) {
    const parameters =
      new URLSearchParams(
        window.location.search
      );

    return (
      parameters.get(
        parameterName
      ) || ""
    );
  }

  /**
   * トースト通知を表示
   *
   * @param {string} message
   * @param {"success"|"error"} type
   * @param {number} duration
   */
  function showToast(
    message,
    type = "success",
    duration = 3000
  ) {
    const toast =
      document.getElementById(
        "toast"
      );

    if (!toast) {
      return;
    }

    if (toastTimer) {
      window.clearTimeout(
        toastTimer
      );
    }

    toast.textContent =
      String(message);

    toast.classList.remove(
      "is-error"
    );

    if (type === "error") {
      toast.classList.add(
        "is-error"
      );
    }

    toast.classList.add(
      "is-visible"
    );

    toastTimer =
      window.setTimeout(
        () => {
          toast.classList.remove(
            "is-visible"
          );
        },
        duration
      );
  }

  /**
   * クリップボードへコピー
   *
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async function copyText(text) {
    const copyValue =
      String(text ?? "");

    if (!copyValue) {
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
          copyValue
        );
      } else {
        const temporaryTextarea =
          document.createElement(
            "textarea"
          );

        temporaryTextarea.value =
          copyValue;

        temporaryTextarea.setAttribute(
          "readonly",
          ""
        );

        temporaryTextarea.style.position =
          "fixed";

        temporaryTextarea.style.top =
          "-9999px";

        document.body.appendChild(
          temporaryTextarea
        );

        temporaryTextarea.select();

        const successful =
          document.execCommand(
            "copy"
          );

        temporaryTextarea.remove();

        if (!successful) {
          throw new Error(
            "copy command failed"
          );
        }
      }

      showToast(
        "クリップボードにコピーしました。"
      );

      return true;
    } catch (error) {
      console.error(
        "コピーに失敗しました。",
        error
      );

      showToast(
        "コピーに失敗しました。",
        "error"
      );

      return false;
    }
  }

  /**
   * 確認ダイアログ
   *
   * @param {string} message
   * @returns {boolean}
   */
  function confirmAction(message) {
    return window.confirm(
      message
    );
  }

  /**
   * サイドメニューを開く
   */
  function openSidebar() {
    document.body.classList.add(
      "is-menu-open"
    );
  }

  /**
   * サイドメニューを閉じる
   */
  function closeSidebar() {
    document.body.classList.remove(
      "is-menu-open"
    );
  }

  /**
   * サイドメニュー処理を初期化
   */
  function initializeSidebar() {
    const openButton =
      document.getElementById(
        "sidebarOpen"
      );

    const closeButton =
      document.getElementById(
        "sidebarClose"
      );

    const overlay =
      document.getElementById(
        "sidebarOverlay"
      );

    if (openButton) {
      openButton.addEventListener(
        "click",
        openSidebar
      );
    }

    if (closeButton) {
      closeButton.addEventListener(
        "click",
        closeSidebar
      );
    }

    if (overlay) {
      overlay.addEventListener(
        "click",
        closeSidebar
      );
    }

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape"
        ) {
          closeSidebar();
        }
      }
    );

    window.addEventListener(
      "resize",
      () => {
        if (
          window.innerWidth >
          900
        ) {
          closeSidebar();
        }
      }
    );
  }

  /**
   * コピー用ボタンを初期化
   */
  function initializeCopyButtons() {
    const copyButtons =
      document.querySelectorAll(
        "[data-copy-target]"
      );

    copyButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          async () => {
            const targetId =
              button.dataset.copyTarget;

            if (!targetId) {
              return;
            }

            const targetElement =
              document.getElementById(
                targetId
              );

            if (!targetElement) {
              showToast(
                "コピー対象が見つかりません。",
                "error"
              );

              return;
            }

            const targetValue =
              "value" in targetElement
                ? targetElement.value
                : targetElement.textContent;

            await copyText(
              targetValue
            );
          }
        );
      }
    );
  }

  /**
   * フォーム入力値を取得
   *
   * @param {HTMLFormElement} form
   * @returns {Object}
   */
  function getFormValues(form) {
    if (
      !(form instanceof HTMLFormElement)
    ) {
      return {};
    }

    const formData =
      new FormData(form);

    const values = {};

    formData.forEach(
      (value, key) => {
        values[key] =
          typeof value === "string"
            ? value.trim()
            : value;
      }
    );

    return values;
  }

  /**
   * フォームへ値をセット
   *
   * @param {HTMLFormElement} form
   * @param {Object} data
   */
  function setFormValues(
    form,
    data
  ) {
    if (
      !(form instanceof HTMLFormElement) ||
      !data ||
      typeof data !== "object"
    ) {
      return;
    }

    Object.entries(data).forEach(
      ([key, value]) => {
        const field =
          form.elements.namedItem(
            key
          );

        if (!field) {
          return;
        }

        if (
          field instanceof RadioNodeList
        ) {
          field.value =
            String(value ?? "");

          return;
        }

        if (
          field instanceof HTMLInputElement &&
          field.type === "checkbox"
        ) {
          field.checked =
            Boolean(value);

          return;
        }

        field.value =
          Array.isArray(value)
            ? value.join(", ")
            : String(value ?? "");
      }
    );
  }

  /**
   * HEXカラーコードが有効か判定
   *
   * @param {string} color
   * @returns {boolean}
   */
  function isValidHexColor(color) {
    return /^#[0-9a-fA-F]{6}$/.test(
      String(color)
    );
  }

  /**
   * 画像を読み込み
   *
   * @param {File} file
   * @returns {Promise<HTMLImageElement>}
   */
  function loadImageFile(file) {
    return new Promise(
      (resolve, reject) => {
        if (
          !(file instanceof File)
        ) {
          reject(
            new Error(
              "画像ファイルが選択されていません。"
            )
          );

          return;
        }

        const reader =
          new FileReader();

        reader.onload = () => {
          const image =
            new Image();

          image.onload = () => {
            resolve(image);
          };

          image.onerror = () => {
            reject(
              new Error(
                "画像を読み込めませんでした。"
              )
            );
          };

          image.src =
            String(reader.result);
        };

        reader.onerror = () => {
          reject(
            new Error(
              "ファイルの読み込みに失敗しました。"
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  }

  /**
   * 画像を縮小してData URLへ変換
   *
   * @param {File} file
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async function resizeImage(
    file,
    options = {}
  ) {
    const {
      maxWidth = 1200,
      maxHeight = 1500,
      quality = 0.84,
      mimeType = "image/jpeg"
    } = options;

    if (
      !(file instanceof File)
    ) {
      throw new Error(
        "画像ファイルを選択してください。"
      );
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      throw new Error(
        "画像形式のファイルを選択してください。"
      );
    }

    const image =
      await loadImageFile(file);

    const widthRatio =
      maxWidth / image.width;

    const heightRatio =
      maxHeight / image.height;

    const scale =
      Math.min(
        widthRatio,
        heightRatio,
        1
      );

    const outputWidth =
      Math.max(
        1,
        Math.round(
          image.width * scale
        )
      );

    const outputHeight =
      Math.max(
        1,
        Math.round(
          image.height * scale
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      outputWidth;

    canvas.height =
      outputHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "画像処理を開始できませんでした。"
      );
    }

    context.drawImage(
      image,
      0,
      0,
      outputWidth,
      outputHeight
    );

    const outputMimeType =
      file.type === "image/png" &&
      mimeType === "image/png"
        ? "image/png"
        : mimeType;

    return canvas.toDataURL(
      outputMimeType,
      quality
    );
  }

  /**
   * ページ初期化
   */
  function initializeCommon() {
    initializeSidebar();
    initializeCopyButtons();
  }

  document.addEventListener(
    "DOMContentLoaded",
    initializeCommon
  );

  /**
   * 外部から利用できるよう公開
   */
  window.CharacterCommon = {
    escapeHtml,
    escapeAttribute,
    nl2br,
    trimText,
    truncateText,

    formatDate,
    formatRelativeDate,

    getQueryParameter,

    showToast,
    copyText,
    confirmAction,

    openSidebar,
    closeSidebar,

    initializeSidebar,
    initializeCopyButtons,

    getFormValues,
    setFormValues,

    isValidHexColor,

    loadImageFile,
    resizeImage
  };
})();