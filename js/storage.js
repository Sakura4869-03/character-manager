"use strict";

/* =========================================================
   Creative Archive
   storage.js
   5種類の資料データをLocalStorageで管理
========================================================= */

(function () {
  const VERSION = "2.0.0";
  const VERSION_KEY = "characterArchive.version";

  const CONFIG = {
    characters: {
      key: "characterArchive.characters",
      prefix: "character",
      label: "キャラクター"
    },

    worlds: {
      key: "characterArchiveWorlds",
      prefix: "world",
      label: "世界観"
    },

    organizations: {
      key: "characterArchiveOrganizations",
      prefix: "organization",
      label: "組織・施設"
    },

    glossaryItems: {
      key: "characterArchiveGlossary",
      prefix: "glossary",
      label: "用語"
    },

    items: {
      key: "characterArchiveItems",
      prefix: "item",
      label: "アイテム"
    }
  };

  function now() {
    return new Date().toISOString();
  }

  function createId(prefix = "archive") {
    if (window.crypto?.randomUUID) {
      return `${prefix}_${window.crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function normalizeTags(tags) {
    const values = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
        ? tags.split(/[、,，\n]/)
        : [];

    return [
      ...new Set(
        values
          .map((tag) => String(tag).trim())
          .filter(Boolean)
      )
    ];
  }

  function getConfig(type) {
    const config = CONFIG[type];

    if (!config) {
      throw new Error(
        `未対応のデータ種別です: ${type}`
      );
    }

    return config;
  }

  function getCollection(type) {
    const config = getConfig(type);

    const saved =
      localStorage.getItem(config.key);

    if (!saved) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        console.warn(
          `${config.label}データの形式が不正です。`
        );

        return [];
      }

      return parsed;
    } catch (error) {
      console.error(
        `${config.label}データの読み込みに失敗しました。`,
        error
      );

      return [];
    }
  }

  function saveCollection(
    type,
    records
  ) {
    const config =
      getConfig(type);

    if (!Array.isArray(records)) {
      throw new Error(
        `${config.label}の保存データは配列である必要があります。`
      );
    }

    try {
      localStorage.setItem(
        config.key,
        JSON.stringify(records)
      );

      localStorage.setItem(
        VERSION_KEY,
        VERSION
      );

      return true;
    } catch (error) {
      console.error(
        `${config.label}データの保存に失敗しました。`,
        error
      );

      if (
        error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        throw new Error(
          "保存容量を超えました。画像を減らすか、バックアップ後に不要なデータを削除してください。"
        );
      }

      throw new Error(
        `${config.label}データの保存に失敗しました。`
      );
    }
  }

  function getById(
    type,
    id
  ) {
    if (!id) {
      return null;
    }

    return (
      getCollection(type).find(
        (record) =>
          String(record.id) ===
          String(id)
      ) || null
    );
  }

  function addRecord(
    type,
    data,
    createEmpty
  ) {
    const config =
      getConfig(type);

    const records =
      getCollection(type);

    const source =
      data &&
      typeof data === "object"
        ? data
        : {};

    const timestamp =
      now();

    const record = {
      ...createEmpty(),
      ...source,

      id:
        source.id ||
        createId(config.prefix),

      tags:
        normalizeTags(source.tags),

      createdAt:
        source.createdAt ||
        timestamp,

      updatedAt:
        timestamp
    };

    records.push(record);

    saveCollection(
      type,
      records
    );

    return record;
  }
    function updateRecord(
    type,
    id,
    data
  ) {
    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "更新するデータが正しくありません。"
      );
    }

    const records =
      getCollection(type);

    const index =
      records.findIndex(
        (record) =>
          String(record.id) ===
          String(id)
      );

    if (index === -1) {
      return null;
    }

    const current =
      records[index];

    records[index] = {
      ...current,
      ...data,

      id: current.id,

      tags: normalizeTags(
        Object.prototype.hasOwnProperty.call(
          data,
          "tags"
        )
          ? data.tags
          : current.tags
      ),

      createdAt:
        current.createdAt ||
        now(),

      updatedAt:
        now()
    };

    saveCollection(
      type,
      records
    );

    return records[index];
  }

  function saveRecord(
    type,
    data,
    createEmpty
  ) {
    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "保存するデータが正しくありません。"
      );
    }

    return (
      data.id &&
      getById(type, data.id)
    )
      ? updateRecord(
          type,
          data.id,
          data
        )
      : addRecord(
          type,
          data,
          createEmpty
        );
  }

  function deleteRecord(
    type,
    id
  ) {
    const records =
      getCollection(type);

    const filtered =
      records.filter(
        (record) =>
          String(record.id) !==
          String(id)
      );

    if (
      filtered.length ===
      records.length
    ) {
      return false;
    }

    saveCollection(
      type,
      filtered
    );

    return true;
  }

  function clearCollection(type) {
    try {
      localStorage.removeItem(
        getConfig(type).key
      );

      return true;
    } catch (error) {
      console.error(
        `${getConfig(type).label}データの削除に失敗しました。`,
        error
      );

      return false;
    }
  }

  function createEmptyCharacter() {
    const timestamp = now();

    return {
      id:
        createId("character"),

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

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  function createEmptyWorld() {
    const timestamp = now();

    return {
      id:
        createId("world"),

      name: "",
      reading: "",
      series: "",
      genre: "",

      era: "",

      image: "",
      imagePosition: "center",
      themeColor: "#5B67B7",

      tags: [],

      summary: "",
      origin: "",
      geography: "",
      history: "",

      society: "",
      organizations: "",
      species: "",
      culture: "",

      powerSystem: "",
      rules: "",
      terminology: "",

      storyPremise: "",
      characterRelations: "",

      promptJa: "",
      promptEn: "",
      negativePrompt: "",

      notes: "",

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }
    function createEmptyOrganization() {
    const timestamp = now();

    return {
      id:
        createId("organization"),

      name: "",
      reading: "",
      type: "",
      series: "",

      image: "",
      imagePosition: "center",
      themeColor: "#6F7B8A",

      tags: [],

      summary: "",
      purpose: "",
      history: "",
      structure: "",

      leader: "",
      members: "",
      headquarters: "",
      territory: "",

      culture: "",
      rules: "",
      symbols: "",
      uniforms: "",

      allies: "",
      enemies: "",
      relatedCharacters: "",
      relatedWorlds: "",

      promptJa: "",
      promptEn: "",
      negativePrompt: "",

      notes: "",

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  function createEmptyGlossaryItem() {
    const timestamp = now();

    return {
      id:
        createId("glossary"),

      term: "",
      reading: "",
      category: "",
      series: "",

      image: "",
      imagePosition: "center",
      themeColor: "#7A6F9B",

      tags: [],

      summary: "",
      definition: "",
      origin: "",
      usage: "",

      relatedTerms: "",
      relatedCharacters: "",
      relatedOrganizations: "",
      relatedWorlds: "",

      promptJa: "",
      promptEn: "",
      negativePrompt: "",

      notes: "",

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  function createEmptyItem() {
    const timestamp = now();

    return {
      id:
        createId("item"),

      name: "",
      reading: "",
      category: "",
      series: "",

      owner: "",
      creator: "",
      origin: "",

      image: "",
      imagePosition: "center",
      themeColor: "#8B6F47",

      tags: [],

      summary: "",
      appearance: "",
      materials: "",
      abilities: "",

      history: "",
      usage: "",
      restrictions: "",
      symbolism: "",

      relatedCharacters: "",
      relatedOrganizations: "",
      relatedWorlds: "",

      promptJa: "",
      promptEn: "",
      negativePrompt: "",

      notes: "",

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  function getCharacters() {
    return getCollection(
      "characters"
    );
  }

  function saveCharacters(
    characters
  ) {
    return saveCollection(
      "characters",
      characters
    );
  }

  function getCharacterById(id) {
    return getById(
      "characters",
      id
    );
  }

  function addCharacter(data) {
    return addRecord(
      "characters",
      data,
      createEmptyCharacter
    );
  }

  function updateCharacter(
    id,
    data
  ) {
    return updateRecord(
      "characters",
      id,
      data
    );
  }

  function saveCharacter(data) {
    return saveRecord(
      "characters",
      data,
      createEmptyCharacter
    );
  }

  function deleteCharacter(id) {
    return deleteRecord(
      "characters",
      id
    );
  }

  function clearCharacters() {
    return clearCollection(
      "characters"
    );
  }
    function getWorlds() {
    return getCollection(
      "worlds"
    );
  }

  function saveWorlds(
    worlds
  ) {
    return saveCollection(
      "worlds",
      worlds
    );
  }

  function getWorldById(id) {
    return getById(
      "worlds",
      id
    );
  }

  function addWorld(data) {
    return addRecord(
      "worlds",
      data,
      createEmptyWorld
    );
  }

  function updateWorld(
    id,
    data
  ) {
    return updateRecord(
      "worlds",
      id,
      data
    );
  }

  function saveWorld(data) {
    return saveRecord(
      "worlds",
      data,
      createEmptyWorld
    );
  }

  function deleteWorld(id) {
    return deleteRecord(
      "worlds",
      id
    );
  }

  function clearWorlds() {
    return clearCollection(
      "worlds"
    );
  }

  function getOrganizations() {
    return getCollection(
      "organizations"
    );
  }

  function saveOrganizations(
    organizations
  ) {
    return saveCollection(
      "organizations",
      organizations
    );
  }

  function getOrganizationById(id) {
    return getById(
      "organizations",
      id
    );
  }

  function addOrganization(data) {
    return addRecord(
      "organizations",
      data,
      createEmptyOrganization
    );
  }

  function updateOrganization(
    id,
    data
  ) {
    return updateRecord(
      "organizations",
      id,
      data
    );
  }

  function saveOrganization(data) {
    return saveRecord(
      "organizations",
      data,
      createEmptyOrganization
    );
  }

  function deleteOrganization(id) {
    return deleteRecord(
      "organizations",
      id
    );
  }

  function clearOrganizations() {
    return clearCollection(
      "organizations"
    );
  }

  function getGlossaryItems() {
    return getCollection(
      "glossaryItems"
    );
  }

  function saveGlossaryItems(
    glossaryItems
  ) {
    return saveCollection(
      "glossaryItems",
      glossaryItems
    );
  }

  function getGlossaryItemById(id) {
    return getById(
      "glossaryItems",
      id
    );
  }

  function addGlossaryItem(data) {
    return addRecord(
      "glossaryItems",
      data,
      createEmptyGlossaryItem
    );
  }

  function updateGlossaryItem(
    id,
    data
  ) {
    return updateRecord(
      "glossaryItems",
      id,
      data
    );
  }

  function saveGlossaryItem(data) {
    return saveRecord(
      "glossaryItems",
      data,
      createEmptyGlossaryItem
    );
  }

  function deleteGlossaryItem(id) {
    return deleteRecord(
      "glossaryItems",
      id
    );
  }

  function clearGlossaryItems() {
    return clearCollection(
      "glossaryItems"
    );
  }
    function getItems() {
    return getCollection(
      "items"
    );
  }

  function saveItems(
    items
  ) {
    return saveCollection(
      "items",
      items
    );
  }

  function getItemById(id) {
    return getById(
      "items",
      id
    );
  }

  function addItem(data) {
    return addRecord(
      "items",
      data,
      createEmptyItem
    );
  }

  function updateItem(
    id,
    data
  ) {
    return updateRecord(
      "items",
      id,
      data
    );
  }

  function saveItem(data) {
    return saveRecord(
      "items",
      data,
      createEmptyItem
    );
  }

  function deleteItem(id) {
    return deleteRecord(
      "items",
      id
    );
  }

  function clearItems() {
    return clearCollection(
      "items"
    );
  }

  function getAllData() {
    return {
      characters:
        getCharacters(),

      worlds:
        getWorlds(),

      organizations:
        getOrganizations(),

      glossaryItems:
        getGlossaryItems(),

      items:
        getItems()
    };
  }

  function createBackupData() {
    return {
      app:
        "Creative Archive",

      version:
        VERSION,

      exportedAt:
        now(),

      data:
        getAllData()
    };
  }

  function downloadBackup(
    filename
  ) {
    const backup =
      createBackupData();

    const json =
      JSON.stringify(
        backup,
        null,
        2
      );

    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    const date =
      new Date()
        .toISOString()
        .slice(0, 10);

    link.href =
      url;

    link.download =
      filename ||
      `creative-archive-backup-${date}.json`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );

    return true;
  }

  function normalizeBackupData(
    backup
  ) {
    if (
      !backup ||
      typeof backup !== "object"
    ) {
      throw new Error(
        "バックアップデータの形式が正しくありません。"
      );
    }

    if (
      Array.isArray(backup)
    ) {
      return {
        characters:
          backup,

        worlds: [],
        organizations: [],
        glossaryItems: [],
        items: []
      };
    }

    const source =
      backup.data &&
      typeof backup.data === "object"
        ? backup.data
        : backup;

    return {
      characters:
        Array.isArray(
          source.characters
        )
          ? source.characters
          : [],

      worlds:
        Array.isArray(
          source.worlds
        )
          ? source.worlds
          : [],

      organizations:
        Array.isArray(
          source.organizations
        )
          ? source.organizations
          : [],

      glossaryItems:
        Array.isArray(
          source.glossaryItems
        )
          ? source.glossaryItems
          : Array.isArray(
              source.glossary
            )
            ? source.glossary
            : [],

      items:
        Array.isArray(
          source.items
        )
          ? source.items
          : []
    };
  }
    function mergeRecords(
    current,
    incoming
  ) {
    const map = new Map();

    current.forEach((record) => {
      map.set(
        String(record.id),
        record
      );
    });

    incoming.forEach((record) => {
      if (!record || !record.id) {
        return;
      }

      map.set(
        String(record.id),
        record
      );
    });

    return Array.from(
      map.values()
    );
  }

  function restoreBackup(
    backup,
    options = {}
  ) {
    const {
      replace = false
    } = options;

    const normalized =
      normalizeBackupData(
        backup
      );

    const targets = [
      {
        type: "characters",
        getter: getCharacters,
        saver: saveCharacters
      },
      {
        type: "worlds",
        getter: getWorlds,
        saver: saveWorlds
      },
      {
        type: "organizations",
        getter: getOrganizations,
        saver: saveOrganizations
      },
      {
        type: "glossaryItems",
        getter: getGlossaryItems,
        saver: saveGlossaryItems
      },
      {
        type: "items",
        getter: getItems,
        saver: saveItems
      }
    ];

    targets.forEach(
      ({
        type,
        getter,
        saver
      }) => {
        const incoming =
          normalized[type];

        if (replace) {
          saver(incoming);
        } else {
          saver(
            mergeRecords(
              getter(),
              incoming
            )
          );
        }
      }
    );

    return true;
  }

  function getStorageUsage() {
    let total = 0;

    Object.values(
      CONFIG
    ).forEach(
      (config) => {
        const value =
          localStorage.getItem(
            config.key
          ) || "";

        total += value.length;
      }
    );

    return {
      bytes: total,
      kiloBytes:
        (
          total / 1024
        ).toFixed(2),

      megaBytes:
        (
          total /
          1024 /
          1024
        ).toFixed(2)
    };
  }

  function clearAllData() {
    clearCharacters();
    clearWorlds();
    clearOrganizations();
    clearGlossaryItems();
    clearItems();

    return true;
  }
    const storageAPI = {
    VERSION,
    CONFIG,

    createId,
    normalizeTags,

    getCharacters,
    saveCharacters,
    createEmptyCharacter,
    getCharacterById,
    addCharacter,
    updateCharacter,
    saveCharacter,
    deleteCharacter,
    clearCharacters,

    getWorlds,
    saveWorlds,
    createEmptyWorld,
    getWorldById,
    addWorld,
    updateWorld,
    saveWorld,
    deleteWorld,
    clearWorlds,

    getOrganizations,
    saveOrganizations,
    createEmptyOrganization,
    getOrganizationById,
    addOrganization,
    updateOrganization,
    saveOrganization,
    deleteOrganization,
    clearOrganizations,

    getGlossaryItems,
    saveGlossaryItems,
    createEmptyGlossaryItem,
    getGlossaryItemById,
    addGlossaryItem,
    updateGlossaryItem,
    saveGlossaryItem,
    deleteGlossaryItem,
    clearGlossaryItems,

    getItems,
    saveItems,
    createEmptyItem,
    getItemById,
    addItem,
    updateItem,
    saveItem,
    deleteItem,
    clearItems,

    getAllData,
    createBackupData,
    downloadBackup,
    restoreBackup,
    getStorageUsage,
    clearAllData
  };

  window.CharacterStorage =
    storageAPI;

  window.CreativeStorage =
    storageAPI;
})();