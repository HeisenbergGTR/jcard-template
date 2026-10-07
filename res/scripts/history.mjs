/**
 * J-Card Template: History
 *
 * Undo/redo by whole-card snapshots, and auto-save of the latest snapshot to
 * IndexedDB so unsaved work survives a closed tab. Snapshots share the cover
 * data URL string by reference, so large covers cost no extra memory.
 */

import { ART_SLOTS, HISTORY_DELAY, HISTORY_MAX } from "./constants.mjs";
import * as storage from "./storage.mjs";
import { STORES } from "./storage.mjs";
import {
  preserveDataSaves,
  restoreDataSaves,
} from "./application-functions.mjs";
import * as ECC from "./common/ecc.mjs";
import { doAfterModify } from "./events.mjs";
import { induceAnesthesia, removeAnesthesia } from "./common/events.mjs";

/** Auto-save record key. */
const AUTOSAVE_KEY = 1;

/** Snapshots, oldest first. */
let stack = [];
/** Index of the snapshot matching the current card. */
let index = -1;
/** Pending snapshot timeout. */
let timeout = null;
/** Called after the stack changes, with whether undo and redo are possible. */
let onChange = () => {};

/** Sets the function to call after the history changes. */
export function setHistoryListener(listener) {
  onChange = listener;
  notify();
}

/** Starts a new history from the current card, such as after a load. */
export function resetHistory() {
  clearTimeout(timeout);
  stack = [preserveDataSaves()];
  index = 0;
  notify();
}

/** Records the current card after edits settle. */
export function scheduleSnapshot() {
  if (index < 0) {
    return;
  }
  clearTimeout(timeout);
  timeout = setTimeout(commitSnapshot, HISTORY_DELAY);
}

/** Records the current card now, if it differs from the current snapshot. */
export function commitSnapshot() {
  clearTimeout(timeout);
  if (index < 0) {
    return false;
  }
  const snapshot = preserveDataSaves();
  if (isSame(snapshot, stack[index])) {
    return false;
  }
  stack = stack.slice(0, index + 1);
  stack.push(snapshot);
  if (stack.length > HISTORY_MAX) {
    stack.shift();
  }
  index = stack.length - 1;
  notify();
  writeAutosave({ data: snapshot, time: Date.now(), saved: false });
  return true;
}

/** Steps back one snapshot. */
export function undo() {
  commitSnapshot();
  if (index > 0) {
    restore(stack[--index]);
  }
}

/** Steps forward one snapshot. */
export function redo() {
  commitSnapshot();
  if (index < stack.length - 1) {
    restore(stack[++index]);
  }
}

/** Marks the auto-save as saved to a file, so it is not offered on restart. */
export function markSaved() {
  commitSnapshot();
  readAutosave().then((record) => {
    if (record) {
      writeAutosave({ ...record, saved: true });
    }
  });
}

/**
 * Offers to restore unsaved work from a previous visit by calling the given
 * function with the record's time and a restore function.
 */
export function offerAutosave(prompt) {
  return readAutosave().then((record) => {
    if (record && !record.saved && record.data) {
      prompt(new Date(record.time), () => {
        restore(record.data);
        resetHistory();
      });
    }
  });
}

/** Forgets the auto-saved card. */
export function discardAutosave() {
  return storage.remove(STORES.autosave, AUTOSAVE_KEY);
}

/** Loads the given snapshot into the card without recording it. */
function restore(snapshot) {
  induceAnesthesia();
  restoreDataSaves(snapshot);
  ECC.flush();
  removeAnesthesia();
  doAfterModify({ save: true });
  notify();
}

/** Returns whether the given snapshots describe the same card. */
function isSame(a, b) {
  if (!a || !b || a.cover !== b.cover) {
    return false;
  }
  const artA = a.art || {};
  const artB = b.art || {};
  if (ART_SLOTS.some((slot) => artA[slot] !== artB[slot])) {
    return false;
  }
  if (
    Object.keys(a.fonts || {}).join() !== Object.keys(b.fonts || {}).join()
  ) {
    return false;
  }
  const strip = (snapshot) => ({
    ...snapshot,
    art: null,
    cover: null,
    fonts: null,
  });
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

/** Tells the listener whether undo and redo are possible. */
function notify() {
  onChange(index > 0, index >= 0 && index < stack.length - 1);
}

/** Resolves with the auto-save record, or undefined. */
function readAutosave() {
  return storage.get(STORES.autosave, AUTOSAVE_KEY);
}

/** Stores the given auto-save record. */
function writeAutosave(record) {
  return storage.put(STORES.autosave, AUTOSAVE_KEY, record);
}
