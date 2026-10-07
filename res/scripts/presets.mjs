/**
 * J-Card Template: Style Presets
 *
 * A style is every saved setting except the card's text and its images'
 * placement, so applying one restyles a card without touching its content.
 * Built-in presets list only what differs from the defaults.
 */

import {
  preserveDataSaves,
  getDataEntry,
  getDataSaveEntries,
  updateData,
} from "./application-functions.mjs";
import { getUsedFonts, registerFonts } from "./fonts.mjs";
import * as storage from "./storage.mjs";
import { STORES } from "./storage.mjs";

/** Settings that are the card's content rather than its style. */
const CONTENT_KEYS = Object.freeze([
  "footer",
  "noteLower",
  "noteUpper",
  "sideAContents",
  "sideALabel",
  "sideBContents",
  "sideBLabel",
  "titleLower",
  "titleUpper",
]);
/** Settings that place a particular image, which do not carry over. */
const PLACEMENT = /^(cover|art\w+?)(OffsetX|OffsetY|Zoom|Rotate|Turn|FlipH|FlipV)$/;

/** Built-in presets by name. */
export const BUILT_IN_PRESETS = Object.freeze({
  Default: {},
  Minimal: {
    forceCaps: false,
    frontContentsVisible: false,
    frontTitleAlignment: "left",
    frontTitleLetterSpacing: 0.5,
    textColor: "#222222",
    titleLowerSize: 10,
    titleUpperSize: 16,
  },
  "Retro retail": {
    bold: true,
    cardColor: "#f2e8cf",
    fontFamily: "Oswald",
    frontTitleLetterSpacing: 1,
    spineTitleLetterSpacing: 1,
    textColor: "#3a2618",
    titleFontFamily: "Bebas Neue",
    titleLowerSize: 13,
    titleUpperSize: 20,
  },
  "Mixtape handwritten": {
    backSize: 9,
    cardColor: "#fffdf5",
    fontFamily: "Permanent Marker",
    forceCaps: false,
    frontSize: 10,
    textColor: "#1d3c8f",
    titleUpperSize: 16,
  },
  Typewriter: {
    cardColor: "#f4f1ea",
    fontFamily: "Special Elite",
    forceCaps: false,
    frontContentsLineHeight: 1.35,
    textColor: "#222222",
  },
  "Neon night": {
    cardColor: "#0d0221",
    fontFamily: "Space Mono",
    textColor: "#ff2a6d",
    titleFontFamily: "Monoton",
    titleLowerSize: 10,
    titleUpperSize: 12,
  },
  "Bold block": {
    bold: true,
    cardColor: "#111111",
    fontFamily: "Archivo Black",
    frontTitleAlignment: "left",
    textColor: "#f5d300",
    titleUpperSize: 22,
  },
});

/** Returns the keys of settings that make up a style. */
export function getStyleKeys() {
  return Object.keys(getDataSaveEntries()).filter(
    (key) => !CONTENT_KEYS.includes(key) && !PLACEMENT.test(key)
  );
}

/** Returns the current card's style, with any custom fonts it uses. */
export function captureStyle() {
  const data = preserveDataSaves();
  const out = {};
  getStyleKeys().forEach((key) => {
    out[key] = data[key];
  });
  const fonts = getUsedFonts(data.fontFamily, data.titleFontFamily);
  if (Object.keys(fonts).length) {
    out.fonts = fonts;
  }
  return out;
}

/**
 * Applies the given style; settings it leaves out return to their defaults.
 * Resolves once its fonts are registered.
 */
export function applyStyle(style = {}) {
  getStyleKeys().forEach((key) => {
    const entry = getDataEntry(key);
    entry.value = key in style ? style[key] : entry.preset;
  });
  updateData();
  return registerFonts(style.fonts);
}

/** Resolves with saved presets as `[name, style]` pairs, sorted by name. */
export function getSavedPresets() {
  return storage
    .getAll(STORES.presets)
    .then((entries) =>
      (entries || []).sort(([a], [b]) => String(a).localeCompare(b))
    );
}

/** Saves the current style as a preset under the given name. */
export function saveStyle(name) {
  return storage.put(STORES.presets, name, captureStyle());
}

/** Deletes the saved preset with the given name. */
export function deleteStyle(name) {
  return storage.remove(STORES.presets, name);
}
