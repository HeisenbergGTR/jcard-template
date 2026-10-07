/**
 * J-Card Template: Constants
 *
 * Shared independent constants.
 */

/** Messages. */
export const MESSAGES = Object.freeze({
  exportDone: "Saved ",
  exportFailed: "Export failed: ",
  exportLibrary: "Could not load the export library. Check your connection.",
  exportWorking: "Rendering…",
  fontBad: "Could not read that font file.",
  lookupEmpty: "Type an artist or album, or fill in the card titles first.",
  lookupFailed: "Search failed: ",
  lookupFetching: "Fetching full-size art\u2026",
  lookupNoArt: "That release has no cover art to download. Try another.",
  lookupNone: "No results. Try fewer words or the other source.",
  lookupSearching: "Searching\u2026",
  lookupTracksDone: "Track list filled in.",
  lookupTracksNone: "No track list found for that release.",
  presetDelete: "Delete the saved style preset ",
  presetName: "Name this style preset:",
  sheetFileName: "J-card sheet",
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

/** Export defaults and sizes in inches. */
export const EXPORT = Object.freeze({
  area: "marks",
  blankImage:
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  bleedIn: 0.1,
  dpi: 300,
  marksIn: 0.25,
  pageMarginIn: 0.25,
  papers: Object.freeze({ a4: [8.27, 11.69], letter: [8.5, 11] }),
});
/** Album art lookup endpoints and limits. */
export const LOOKUP = Object.freeze({
  coverArt: "https://coverartarchive.org/",
  itunes: "https://itunes.apple.com/",
  itunesSize: 3000,
  limit: 24,
  musicBrainz: "https://musicbrainz.org/ws/2/",
  recentMax: 12,
});
/** Libraries loaded on first use. */
export const LIBRARIES = Object.freeze({
  htmlToImage:
    "https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js",
  jsPdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
});

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

/** Settings that are the card's text content rather than its style. */
export const CONTENT_KEYS = Object.freeze([
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
