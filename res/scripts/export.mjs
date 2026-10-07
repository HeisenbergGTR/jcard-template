/**
 * J-Card Template: Export
 *
 * Renders the card to a high-resolution image without the print dialog, and
 * saves it as a PNG (with its DPI recorded) or a PDF at true size. A sheet
 * collects different cards to lay out together on Letter or A4 pages.
 */

import { getCardName } from "./application-functions.mjs";
import { application } from "./application-model.mjs";
import { EXPORT, LIBRARIES, MESSAGES } from "./constants.mjs";
import { download } from "./common/application-functions.mjs";
import { getSide, getSideTemplate, setSide } from "./sides.mjs";

/** CSS pixels per inch. */
const PX_PER_IN = 96;
/** Library loads by URL. */
const libraries = new Map();
/** Cards collected for a sheet. */
const sheet = [];

/** Loads the script at the given URL once, resolving with the given global. */
function loadLibrary(src, global) {
  if (!libraries.has(src)) {
    libraries.set(
      src,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.crossOrigin = "anonymous";
        script.addEventListener("load", () => resolve(window[global]));
        script.addEventListener("error", () => {
          libraries.delete(src);
          reject(new Error(MESSAGES.exportLibrary));
        });
        document.head.append(script);
      })
    );
  }
  return libraries.get(src);
}

/**
 * Resolves with @font-face rules for every font the card can use, with font
 * files inlined as data URLs: those in readable stylesheets (the app's own
 * and Google Fonts) and custom fonts, which live outside stylesheets.
 */
async function getFontCss() {
  const rules = [];
  Array.from(document.styleSheets).forEach((sheet) => {
    let cssRules;
    try {
      cssRules = sheet.cssRules;
    } catch (error) {
      // Other sites' stylesheets are unreadable, and hold no card fonts.
      return;
    }
    Array.from(cssRules)
      .filter((rule) => rule instanceof CSSFontFaceRule)
      .forEach((rule) =>
        rules.push(inlineUrls(rule.cssText, sheet.href || location.href))
      );
  });
  Object.entries(application.instance.fonts).forEach(([name, src]) =>
    rules.push(
      '@font-face { font-family: "' +
        name.replace(/["\\]/g, "") +
        '"; src: url(' +
        src +
        "); }"
    )
  );
  return (await Promise.all(rules)).join("\n");
}

/** Resolves with the given CSS with its url()s fetched into data URLs. */
async function inlineUrls(css, base) {
  const urls = Array.from(css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g));
  for (const [match, url] of urls) {
    if (url.startsWith("data:")) {
      continue;
    }
    try {
      const blob = await (await fetch(new URL(url, base))).blob();
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result));
        reader.addEventListener("error", () => reject(reader.error));
        reader.readAsDataURL(blob);
      });
      css = css.replace(match, "url(" + data + ")");
    } catch (error) {
      // Leave the URL; the browser falls back to another font.
    }
  }
  return css;
}

/**
 * Renders the card at the given DPI, cropped to the given area: "trim" (the
 * card itself), "bleed" (plus its bleed) or "marks" (plus the crop marks).
 * Resolves with `{ canvas, widthIn, heightIn, dpi }`.
 */
export async function renderCard(
  dpi = EXPORT.dpi,
  area = EXPORT.area,
  side = getSide()
) {
  const library = await loadLibrary(LIBRARIES.htmlToImage, "htmlToImage");
  const shown = getSide();
  const jcard = document.getElementById("jcard");
  const guide = jcard.classList.contains("show-safe");
  setSide(side);
  jcard.classList.remove("show-safe");
  try {
    return await renderShown(library, dpi, area, side);
  } finally {
    setSide(shown);
    jcard.classList.toggle("show-safe", guide);
  }
}

/** Renders the side shown; see `renderCard`. */
async function renderShown(library, dpi, area, side) {
  if (document.activeElement && document.activeElement.blur) {
    // The focused cover shows its grid; keep it out of the export.
    document.activeElement.blur();
  }
  await document.fonts.ready;
  const root = document.getElementById("jcard");
  const rootRect = root.getBoundingClientRect();
  const rect = getAreaRect(area, getSideTemplate(side));
  const scale = dpi / PX_PER_IN;
  const full = await library.toCanvas(root, {
    // Empty image slots have nothing to draw.
    filter: (node) =>
      !(node.classList && node.classList.contains("screen-only")) &&
      (!(node instanceof HTMLImageElement) || Boolean(node.getAttribute("src"))),
    fontEmbedCSS: await getFontCss(),
    imagePlaceholder: EXPORT.blankImage,
    pixelRatio: scale,
    skipAutoScale: true,
    // The copy keeps its centring margin otherwise, shifting everything.
    style: { margin: "0" },
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  canvas
    .getContext("2d")
    .drawImage(
      full,
      Math.round((rect.left - rootRect.left) * scale),
      Math.round((rect.top - rootRect.top) * scale),
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  return {
    canvas: canvas,
    dpi: dpi,
    side: side,
    heightIn: rect.height / PX_PER_IN,
    widthIn: rect.width / PX_PER_IN,
  };
}

/** Returns the on-screen rectangle of the given export area of a template. */
function getAreaRect(area, root) {
  const card = root
    .querySelector(".template-boundaries")
    .getBoundingClientRect();
  const template = root.getBoundingClientRect();
  const grow = (rect, inches) => {
    const by = inches * PX_PER_IN;
    return new DOMRect(
      rect.left - by,
      rect.top - by,
      rect.width + 2 * by,
      rect.height + 2 * by
    );
  };
  switch (area) {
    case "trim":
      return card;
    case "bleed":
      return grow(card, EXPORT.bleedIn);
    default:
      return grow(template, EXPORT.marksIn);
  }
}

/** Downloads the given render as a PNG that records its DPI. */
export async function downloadPng(render, suffix = "") {
  const blob = await new Promise((resolve) =>
    render.canvas.toBlob(resolve, "image/png")
  );
  const bytes = withPngDpi(new Uint8Array(await blob.arrayBuffer()), render.dpi);
  const url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
  download(getCardName() + (suffix || "") + ".png", url);
}

/**
 * Downloads the given render as a PDF, either at card size or centred on the
 * given paper ("letter" or "a4").
 */
export async function downloadPdf(renders, paper = "card") {
  const { jsPDF } = await loadLibrary(LIBRARIES.jsPdf, "jspdf");
  renders = [].concat(renders);
  const first = renders[0];
  const size =
    paper === "card" ? [first.widthIn, first.heightIn] : EXPORT.papers[paper];
  const orientation = size[0] > size[1] ? "landscape" : "portrait";
  const pdf = new jsPDF({ format: size, orientation: orientation, unit: "in" });
  const page = getPageSize(pdf);
  renders.forEach((render, index) => {
    if (index) {
      pdf.addPage(size, orientation);
    }
    // Centred, so the inside page mirrors the outside for double-sided prints.
    pdf.addImage(
      render.canvas,
      "PNG",
      (page[0] - render.widthIn) / 2,
      (page[1] - render.heightIn) / 2,
      render.widthIn,
      render.heightIn,
      undefined,
      "FAST"
    );
  });
  pdf.save(getCardName() + ".pdf");
}

/** Adds the given render to the sheet under the current card name. */
export function addToSheet(render) {
  sheet.push({
    dataUrl: render.canvas.toDataURL("image/png"),
    heightIn: render.heightIn,
    name: getCardName() + (render.side === "inside" ? " (inside)" : ""),
    widthIn: render.widthIn,
  });
  return getSheet();
}

/** Removes the sheet card at the given index. */
export function removeFromSheet(index) {
  sheet.splice(index, 1);
  return getSheet();
}

/** Empties the sheet. */
export function clearSheet() {
  sheet.length = 0;
  return getSheet();
}

/** Returns the sheet cards. */
export function getSheet() {
  return sheet.slice();
}

/**
 * Downloads the sheet as a PDF on the given paper, fitting as many cards per
 * page as the better orientation allows, at true size.
 */
export async function downloadSheetPdf(paper = "letter") {
  if (!sheet.length) {
    return;
  }
  const { jsPDF } = await loadLibrary(LIBRARIES.jsPdf, "jspdf");
  const paperSize = EXPORT.papers[paper] || EXPORT.papers.letter;
  const cardW = Math.max(...sheet.map((card) => card.widthIn));
  const cardH = Math.max(...sheet.map((card) => card.heightIn));
  const fit = ([width, height]) => ({
    columns: Math.floor((width - 2 * EXPORT.pageMarginIn) / cardW),
    rows: Math.floor((height - 2 * EXPORT.pageMarginIn) / cardH),
    size: [width, height],
  });
  const layouts = [fit(paperSize), fit([paperSize[1], paperSize[0]])];
  const layout = layouts.reduce((best, next) =>
    next.columns * next.rows > best.columns * best.rows ? next : best
  );
  const perPage = Math.max(1, layout.columns * layout.rows);
  const columns = Math.max(1, layout.columns);
  const rows = Math.max(1, layout.rows);
  const [pageW, pageH] = layout.size;
  const pdf = new jsPDF({
    format: paperSize,
    orientation: pageW > pageH ? "landscape" : "portrait",
    unit: "in",
  });
  const left = (pageW - columns * cardW) / 2;
  const top = (pageH - rows * cardH) / 2;
  sheet.forEach((card, index) => {
    const slot = index % perPage;
    if (index && !slot) {
      pdf.addPage(paperSize, pageW > pageH ? "landscape" : "portrait");
    }
    pdf.addImage(
      card.dataUrl,
      "PNG",
      left + (slot % columns) * cardW,
      top + Math.floor(slot / columns) * cardH,
      card.widthIn,
      card.heightIn,
      undefined,
      "FAST"
    );
  });
  pdf.save(MESSAGES.sheetFileName + ".pdf");
}

/** Returns the page size of the given PDF in its units. */
function getPageSize(pdf) {
  return [pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight()];
}

/** Returns the given PNG bytes with a pHYs chunk recording the given DPI. */
function withPngDpi(bytes, dpi) {
  // Signature (8) + IHDR (4 length + 4 type + 13 data + 4 CRC).
  const AFTER_IHDR = 33;
  const perMetre = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4);
  view.setUint32(8, perMetre);
  view.setUint32(12, perMetre);
  chunk[16] = 1;
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const out = new Uint8Array(bytes.length + chunk.length);
  out.set(bytes.subarray(0, AFTER_IHDR));
  out.set(chunk, AFTER_IHDR);
  out.set(bytes.subarray(AFTER_IHDR), AFTER_IHDR + chunk.length);
  return out;
}

/** Returns the CRC-32 of the given bytes, as used by PNG. */
function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}
