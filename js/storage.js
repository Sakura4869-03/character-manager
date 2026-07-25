/* ==========================================
   Character Archive
   LocalStorage Management
========================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "characterArchive.characters";
  const STORAGE_VERSION_KEY = "characterArchive.version";
  const STORAGE_VERSION = "1.0.0";

  /**
   * 保存データを取得
   *
   * @returns {Array}
   */
  function getCharacters() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return [];
    }

    try {
      const parsedData = JSON.parse(savedData);

      if (!Array.isArray(parsedData)) {
        console.warn(
          "キャラクターデータの形式が不正です。空の配列を返します。"
        );

        return [];
      }

      return parsedData;
    } catch (error) {
      console.error(
        "キャラクターデータの読み込みに失敗しました。",
        error
      );

      return [];
    }
  }

  /**
   * キャラクターデータをすべて保存
   *
   * @param {Array} characters
   * @returns {boolean}
   */
  function saveCharacters(characters) {
    if (!Array.isArray(characters)) {
      console.error(
        "保存するデータは配列である必要があります。"
      );

      return false;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(characters)
      );

      localStorage.setItem(
        STORAGE_VERSION_KEY,
        STORAGE_VERSION
      );

      return true;
    } catch (error) {
      console.error(
        "キャラクターデータの保存に失敗しました。",
        error
      );

      if (
        error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        throw new Error(
          "保存容量を超えました。画像を減らすか、バックアップ後に不要なキャラクターを削除してください。"
        );
      }

      throw new Error(
        "データの保存に失敗しました。"
      );
    }
  }

  /**
   * IDを生成
   *
   * @returns {string}
   */
  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return [
      "character",
      Date.now(),
      Math.random().toString(36).slice(2, 10)
    ].join("_");
  }

  /**
   * 空のキャラクターデータを作成
   *
   * @returns {Object}
   */
  function createEmptyCharacter() {
    const now = new Date().toISOString();

    return {
      id: createId(),

      name: "",
      reading: "",
      title: "",
      work: "",

      age: "",
      gender: "",
      birthday: "",
      height: "",

      schoolYear: "",
      className: "",
      affiliation: "",
      motif: "",

      image: "",
      imagePosition: "center",
      themeColor: "#738cff",

      tags: [],

      summary: "",

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

      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * IDからキャラクターを取得
   *
   * @param {string} characterId
   * @returns {Object|null}
   */
  function getCharacterById(characterId) {
    if (!characterId) {
      return null;
    }

    const characters = getCharacters();

    return (
      characters.find(
        (character) => character.id === characterId
      ) || null
    );
  }

  /**
   * キャラクターを追加
   *
   * @param {Object} characterData
   * @returns {Object}
   */
  function addCharacter(characterData) {
    const characters = getCharacters();
    const now = new Date().toISOString();

    const character = {
      ...createEmptyCharacter(),
      ...characterData,
      id: characterData.id || createId(),
      createdAt: characterData.createdAt || now,
      updatedAt: now
    };

    characters.push(character);

    saveCharacters(characters);

    return character;
  }

  /**
   * キャラクターを更新
   *
   * @param {string} characterId
   * @param {Object} characterData
   * @returns {Object|null}
   */
  function updateCharacter(
    characterId,
    characterData
  ) {
    const characters = getCharacters();

    const targetIndex = characters.findIndex(
      (character) => character.id === characterId
    );

    if (targetIndex === -1) {
      return null;
    }

    const currentCharacter = characters[targetIndex];

    const updatedCharacter = {
      ...currentCharacter,
      ...characterData,
      id: currentCharacter.id,
      createdAt: currentCharacter.createdAt,
      updatedAt: new Date().toISOString()
    };

    characters[targetIndex] = updatedCharacter;

    saveCharacters(characters);

    return updatedCharacter;
  }

  /**
   * 追加または更新
   *
   * @param {Object} characterData
   * @returns {Object}
   */
  function saveCharacter(characterData) {
    if (!characterData || typeof characterData !== "object") {
      throw new Error(
        "キャラクターデータが正しくありません。"
      );
    }

    const existingCharacter = characterData.id
      ? getCharacterById(characterData.id)
      : null;

    if (existingCharacter) {
      return updateCharacter(
        characterData.id,
        characterData
      );
    }

    return addCharacter(characterData);
  }

  /**
   * キャラクターを削除
   *
   * @param {string} characterId
   * @returns {boolean}
   */
  function deleteCharacter(characterId) {
    const characters = getCharacters();

    const filteredCharacters = characters.filter(
      (character) => character.id !== characterId
    );

    if (
      filteredCharacters.length === characters.length
    ) {
      return false;
    }

    saveCharacters(filteredCharacters);

    return true;
  }

  /**
   * すべてのキャラクターを削除
   *
   * @returns {boolean}
   */
  function clearCharacters() {
    try {
      localStorage.removeItem(STORAGE_KEY);

      return true;
    } catch (error) {
      console.error(
        "キャラクターデータの削除に失敗しました。",
        error
      );

      return false;
    }
  }

  /**
   * タグを配列形式に整える
   *
   * @param {string|Array} tags
   * @returns {Array}
   */
  function normalizeTags(tags) {
    if (Array.isArray(tags)) {
      return [
        ...new Set(
          tags
            .map((tag) => String(tag).trim())
            .filter(Boolean)
        )
      ];
    }

    if (typeof tags === "string") {
      return [
        ...new Set(
          tags
            .split(/[、,]/)
            .map((tag) => tag.trim())
            .filter(Boolean)
        )
      ];
    }

    return [];
  }

  /**
   * バックアップ用データを生成
   *
   * @returns {Object}
   */
  function createBackupData() {
    return {
      appName: "Character Archive",
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      characters: getCharacters()
    };
  }

  /**
   * バックアップJSONをダウンロード
   *
   * @returns {void}
   */
  function downloadBackup() {
    const backupData = createBackupData();

    const jsonText = JSON.stringify(
      backupData,
      null,
      2
    );

    const blob = new Blob(
      [jsonText],
      {
        type: "application/json"
      }
    );

    const downloadUrl =
      URL.createObjectURL(blob);

    const dateText =
      new Date()
        .toISOString()
        .slice(0, 10);

    const link =
      document.createElement("a");

    link.href = downloadUrl;

    link.download =
      `character-archive-backup-${dateText}.json`;

    document.body.appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(downloadUrl);
  }

  /**
   * バックアップ内容を検証
   *
   * @param {unknown} backupData
   * @returns {Array}
   */
  function validateBackupData(backupData) {
    if (
      Array.isArray(backupData)
    ) {
      return backupData;
    }

    if (
      backupData &&
      typeof backupData === "object" &&
      Array.isArray(backupData.characters)
    ) {
      return backupData.characters;
    }

    throw new Error(
      "対応していないバックアップ形式です。"
    );
  }

  /**
   * バックアップJSONから復元
   *
   * @param {File} file
   * @param {"replace"|"merge"} mode
   * @returns {Promise<Array>}
   */
  async function restoreBackup(
    file,
    mode = "replace"
  ) {
    if (!(file instanceof File)) {
      throw new Error(
        "復元するJSONファイルを選択してください。"
      );
    }

    const fileText =
      await file.text();

    let parsedData;

    try {
      parsedData =
        JSON.parse(fileText);
    } catch (error) {
      throw new Error(
        "JSONファイルの読み込みに失敗しました。"
      );
    }

    const restoredCharacters =
      validateBackupData(parsedData)
        .map((character) => {
          const now =
            new Date().toISOString();

          return {
            ...createEmptyCharacter(),
            ...character,

            id:
              character.id ||
              createId(),

            tags:
              normalizeTags(character.tags),

            createdAt:
              character.createdAt ||
              now,

            updatedAt:
              character.updatedAt ||
              now
          };
        });

    if (mode === "merge") {
      const currentCharacters =
        getCharacters();

      const characterMap =
        new Map();

      currentCharacters.forEach(
        (character) => {
          characterMap.set(
            character.id,
            character
          );
        }
      );

      restoredCharacters.forEach(
        (character) => {
          characterMap.set(
            character.id,
            character
          );
        }
      );

      const mergedCharacters =
        Array.from(
          characterMap.values()
        );

      saveCharacters(
        mergedCharacters
      );

      return mergedCharacters;
    }

    saveCharacters(
      restoredCharacters
    );

    return restoredCharacters;
  }

  /**
   * 保存容量の概算を取得
   *
   * @returns {Object}
   */
  function getStorageUsage() {
    const savedData =
      localStorage.getItem(STORAGE_KEY) || "";

    const usedBytes =
      new Blob([savedData]).size;

    return {
      bytes: usedBytes,
      kilobytes:
        Math.round(
          (usedBytes / 1024) * 100
        ) / 100,

      megabytes:
        Math.round(
          (usedBytes / 1024 / 1024) * 100
        ) / 100
    };
  }

  /**
   * 外部から使えるように公開
   */
  window.CharacterStorage = {
    getCharacters,
    saveCharacters,

    createId,
    createEmptyCharacter,

    getCharacterById,
    addCharacter,
    updateCharacter,
    saveCharacter,
    deleteCharacter,
    clearCharacters,

    normalizeTags,

    createBackupData,
    downloadBackup,
    restoreBackup,

    getStorageUsage
  };
})();