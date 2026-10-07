/**
 * J-Card Template: Fonts
 *
 * Custom font files (kept in a browser library and embedded in saves of cards
 * that use them), on-demand Google Fonts, and CSS font list formatting.
 */

import { GENERIC_FONTS, GOOGLE_FONTS, regexps } from "./constants.mjs";
import { application } from "./application-model.mjs";
import * as storage from "./storage.mjs";
import { STORES } from "./storage.mjs";

/** Google Fonts already requested, by lower-case name. */
const requested = new Set();
/** Font family suggestion list. */
const list = () => document.getElementById("list-font-family");

/** Returns whether the given file is a font. */
export function isFontFile(file) {
  return Boolean(file) && regexps.fontFile.test(file.name);
}

/** Returns a font family name from the given font file name. */
export function getFontName(fileName) {
  return fileName
    .replace(regexps.fontFile, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns the family names in the given CSS-like font list, unquoted. */
export function splitFontList(value = "") {
  return String(value)
    .split(",")
    .map((name) => name.trim().replace(/^(["'])(.*)\1$/, "$2").trim())
    .filter(Boolean);
}

/**
 * Returns the given font list as valid CSS, quoting family names so ones like
 * "Press Start 2P" work, and leaving generic families such as serif bare.
 */
export function toCssFontList(value = "") {
  return splitFontList(value)
    .map((name) =>
      GENERIC_FONTS.includes(name.toLowerCase())
        ? name
        : '"' + name.replace(/["\\]/g, "") + '"'
    )
    .join(", ");
}

/** Requests any Google Fonts named in the given font list. */
export function requestGoogleFonts(value = "") {
  splitFontList(value).forEach((name) => {
    const match = GOOGLE_FONTS.find(
      (font) => font.toLowerCase() === name.toLowerCase()
    );
    if (!match || requested.has(match.toLowerCase())) {
      return;
    }
    requested.add(match.toLowerCase());
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.crossOrigin = "anonymous";
    link.href =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(match).replace(/%20/g, "+") +
      "&display=swap";
    document.head.append(link);
  });
}

/**
 * Reads the given font file, registers it, and keeps it in the browser font
 * library. Resolves with its family name.
 */
export function addFontFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  }).then((src) => {
    const name = getFontName(file.name);
    return registerFont(name, src).then(() => {
      storage.put(STORES.fonts, name, src);
      return name;
    });
  });
}

/** Registers the given font data URL under the given family name. */
export function registerFont(name, src) {
  if (application.instance.fonts[name] === src) {
    return Promise.resolve(name);
  }
  const face = new FontFace(name, "url(" + src + ")");
  return face.load().then(() => {
    document.fonts.add(face);
    application.instance.fonts[name] = src;
    if (
      !Array.from(list().options).some((option) => option.value === name)
    ) {
      const option = document.createElement("option");
      option.value = name;
      list().prepend(option);
    }
    return name;
  });
}

/** Registers every font in the given name-to-data-URL map. */
export function registerFonts(fonts) {
  return Promise.all(
    Object.entries(fonts || {})
      .filter(
        ([name, src]) =>
          typeof src === "string" && regexps.fontData.test(src)
      )
      .map(([name, src]) => registerFont(name, src).catch(() => null))
  );
}

/** Registers every font in the browser font library. */
export function loadFontLibrary() {
  return storage
    .getAll(STORES.fonts)
    .then((entries) => registerFonts(Object.fromEntries(entries || [])));
}

/** Returns the custom fonts named in the given font lists, by name. */
export function getUsedFonts(...values) {
  const out = {};
  values.forEach((value) =>
    splitFontList(value).forEach((name) => {
      const src = application.instance.fonts[name];
      if (src) {
        out[name] = src;
      }
    })
  );
  return out;
}
