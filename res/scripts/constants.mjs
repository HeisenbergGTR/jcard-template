/**
 * J-Card Template: Constants
 *
 * Shared independent constants.
 */

/** Messages. */
export const MESSAGES = Object.freeze({
  fontBad: "Could not read that font file.",
  presetDelete: "Delete the saved style preset ",
  presetName: "Name this style preset:",
  storageFailed: "Browser storage failed:",
  autosaveFound: "Unsaved J-card from ",
  loadDiscard: "This discards any unsaved changes made to the current J-card.",
  coverBadType: "That is not an image file: ",
  coverFetch:
    "Could not grab that image from the other page. Try right-clicking it, " +
    "choosing Copy image, then pressing Ctrl+V here.",
  loadLarge: "Its size is greater than 256 MiB, proceed with loading?",
});
/** CSS custom property prefix. */
export const CSS_PREFIX = "jCard";
/** Data MIME type. */
export const DATA_TYPE = "application/json";
/** Data version. */
export const DATA_VERSION = "2";
/** Data file name extension. */
export const FILE_EXTENSION = ".jcard.json";
/** Maximum file name length in characters. */
export const FILE_NAME_LENGTH_MAX = 255 - FILE_EXTENSION.length;
/** Default file name. */
export const FILE_NAME = "Unnamed";
/** Maximum safe file size in bytes. Data files may embed the cover image. */
export const FILE_SIZE_MAX_SAFE = 268435456;

/** Milliseconds of quiet before an edit is recorded for undo. */
export const HISTORY_DELAY = 500;
/** Maximum undo steps. */
export const HISTORY_MAX = 100;

/** Generic CSS font families, which must not be quoted. */
export const GENERIC_FONTS = Object.freeze([
  "cursive",
  "emoji",
  "fangsong",
  "fantasy",
  "math",
  "monospace",
  "sans-serif",
  "serif",
  "system-ui",
  "ui-monospace",
  "ui-rounded",
  "ui-sans-serif",
  "ui-serif",
]);
/** Google Fonts offered by name and loaded on demand. */
export const GOOGLE_FONTS = Object.freeze([
  "Abril Fatface",
  "Anton",
  "Archivo Black",
  "Bebas Neue",
  "Caveat",
  "Courier Prime",
  "Monoton",
  "Oswald",
  "Permanent Marker",
  "Playfair Display",
  "Press Start 2P",
  "Righteous",
  "Roboto Condensed",
  "Rock Salt",
  "Shrikhand",
  "Space Mono",
  "Special Elite",
  "VT323",
]);

/** Panel image slots besides the front cover. */
export const ART_SLOTS = Object.freeze(["wrap", "back", "spine"]);
/** Image filter keys, applied to the cover and each slot. */
export const FILTERS = Object.freeze(["Brightness", "Contrast", "Saturate"]);

/** Text blocks with fine adjustments, by key, with their default line height. */
export const TEXT_BLOCKS = Object.freeze({
  back: 1.1,
  footer: 1.1,
  frontContents: 1.2,
  frontTitle: 1.1,
  note: 1.1,
  spineTitle: 1.1,
});

/** Default cover image source. */
export const COVER_IMAGE = "res/media/cover.png";

/** Regular Expressions. */
export const regexps = Object.freeze({
  /** Source file name extension. */
  fileExtension: new RegExp(/(\.jcard)?\.json$/),
  /** Embedded cover image data URL. */
  coverData: new RegExp(/^data:image\/([\w.+-]+)[;,]/),
  /** Font data URL. */
  fontData: new RegExp(/^data:[^,]*,/),
  /** Font file name extension. */
  fontFile: new RegExp(/\.(otf|ttf|woff2?)$/i),
  /** Image MIME type. */
  imageType: new RegExp(/^image\//),
  /** Source file MIME type. */
  fileType: new RegExp(/^(application\/json|text\/)/),
});
