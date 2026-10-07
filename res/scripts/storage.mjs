/**
 * J-Card Template: Storage
 *
 * A small promise wrapper over IndexedDB for data that stays in this browser:
 * the auto-save, the font library, and saved style presets. Failures, such as
 * in private windows, resolve to undefined instead of throwing.
 */

import { MESSAGES } from "./constants.mjs";

/** Database name and version. */
const DB_NAME = "jcard-template";
const DB_VERSION = 2;
/** Object store names. */
export const STORES = Object.freeze({
  autosave: "autosave",
  fonts: "fonts",
  presets: "presets",
});

/** Resolves with the value under the given key in the given store. */
export function get(store, key) {
  return withStore(store, "readonly", (objectStore) => objectStore.get(key));
}

/** Resolves with all `[key, value]` pairs in the given store. */
export function getAll(store) {
  return withStore(store, "readonly", (objectStore) => {
    const out = [];
    const request = objectStore.openCursor();
    request.addEventListener("success", () => {
      const cursor = request.result;
      if (cursor) {
        out.push([cursor.key, cursor.value]);
        cursor.continue();
      }
    });
    return { request: request, result: () => out };
  });
}

/** Stores the given value under the given key in the given store. */
export function put(store, key, value) {
  return withStore(store, "readwrite", (objectStore) =>
    objectStore.put(value, key)
  );
}

/** Removes the given key from the given store. */
export function remove(store, key) {
  return withStore(store, "readwrite", (objectStore) =>
    objectStore.delete(key)
  );
}

/**
 * Runs the given request maker on the given store and resolves with the
 * request result once its transaction completes. The maker may instead return
 * `{ request, result }` to supply its own result.
 */
function withStore(store, mode, makeRequest) {
  return new Promise((resolve) => {
    let open;
    try {
      open = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      return resolve();
    }
    open.addEventListener("upgradeneeded", () => {
      Object.values(STORES).forEach((name) => {
        if (!open.result.objectStoreNames.contains(name)) {
          open.result.createObjectStore(name);
        }
      });
    });
    open.addEventListener("error", () => resolve());
    open.addEventListener("success", () => {
      const db = open.result;
      try {
        const transaction = db.transaction(store, mode);
        const made = makeRequest(transaction.objectStore(store));
        // A bare request's `result` throws until it finishes, so read it late.
        const result =
          made instanceof IDBRequest ? () => made.result : made.result;
        transaction.addEventListener("complete", () => resolve(result()));
        transaction.addEventListener("error", () => {
          console.warn(MESSAGES.storageFailed, transaction.error);
          resolve();
        });
      } catch (error) {
        console.warn(MESSAGES.storageFailed, error);
        resolve();
      } finally {
        db.close();
      }
    });
  });
}
