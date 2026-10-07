/**
 * J-Card Template: Event Setup
 *
 * A single call to `setupEvents` makes the magic happen.
 */

import { setupCardEditing } from "./card-edit.mjs";
import { setupSafeArea } from "./safe-area.mjs";
import { getSide, setupSides } from "./sides.mjs";
import {
  ART_SLOTS,
  CONTENT_KEYS,
  FILE_NAME,
  FILTERS,
  MESSAGES,
  TEXT_BLOCKS,
} from "./constants.mjs";
import { getArtKey } from "./application-model.mjs";
import {
  isImageFile,
  loadFile,
  loadReader,
  readCover,
  resetCover,
  saveCover,
  setArt,
  setCover,
  saveDataSaves,
  testAndPrint,
  doPrint,
  undoPrint,
  getApplicationEntry,
  getApplicationEntries,
  getDataEntry,
  getDataEntries,
  getLoadEntry,
  setModifiedBy,
  getPrintEntry,
  getPrintEntries,
  getSaveEntry,
  getViewEntry,
} from "./application-functions.mjs";
import { setBackContents, setFrontContents } from "./edits.mjs";
import {
  addFontFile,
  isFontFile,
  requestGoogleFonts,
  toCssFontList,
} from "./fonts.mjs";
import {
  addRecent,
  fetchArt,
  fetchTracks,
  getRecent,
  searchAlbums,
} from "./lookup.mjs";
import {
  addToSheet,
  clearSheet,
  downloadPdf,
  downloadPng,
  downloadSheetPdf,
  removeFromSheet,
  renderCard,
} from "./export.mjs";
import {
  BUILT_IN_PRESETS,
  applyStyle,
  deleteStyle,
  getSavedPresets,
  saveStyle,
} from "./presets.mjs";
import {
  markSaved,
  redo,
  resetHistory,
  scheduleSnapshot,
  setHistoryListener,
  undo,
} from "./history.mjs";
import {
  NUL_OBJECT,
  EVENT_CHANGE,
  EVENT_INPUT,
} from "./common/constants.mjs";
import {
  getInputSafeValue,
  qsAll,
  setWindowSubtitle,
} from "./common/functions.mjs";
import {
  getButtons,
  isModified,
  getOutputs,
  getReader,
  getRoot,
} from "./common/application-functions.mjs";
import * as ECC from "./common/ecc.mjs";
import {
  OPTIONS_COALESCE,
  OPTIONS_COALESCE_INVERT,
  addActionListener,
  addBooleanListener,
  addClassListener,
  addHtmlListener,
  addStyleVariableListener,
  makeHandler,
  doAfterEdit,
  doBeforeEdit,
  induceAnesthesia,
  removeAnesthesia,
  hasAnesthesia,
} from "./common/events.mjs";
import { collapseAll, expandAll, setForceDark } from "./common/views.mjs";

/** Enable coalescing and append with "pt". */
const OPTIONS_COALESCE_PT = Object.freeze({ coalesce: true, suffix: "pt" });

/** Adds event listeners and their handlers to elements. */
export function setupEvents() {
  setupSides();
  setupApplicationEvents();
  setupArtEvents();
  setupButtonEvents();
  setupCoverEvents();
  setupEntryEvents();
  setupExportEvents();
  setupFileEvents();
  setupFontEvents();
  setupFormEvents();
  setupPresetEvents();
  setupSearchEvents();
  setupViewEvents();
  setupInsideEvents();
  setupSafeArea();
  setupWindowEvents();
}

/** To be run after modification. */
export function doAfterModify(entry) {
  addBeforeUnloadListenerBy(entry);
  setModifiedBy(entry);
  scheduleSnapshot();
}

/** For use during the window `beforeunload` event. */
export function doBeforeUnload(event) {
  // TODO: While page visibility events are superior, we
  //       do not have a self-preserving mechanism.
  if (isModified()) {
    event.preventDefault();
    event.returnValue = MESSAGES.loadDiscard;
    return MESSAGES.loadDiscard;
  }
}

/** Adds listeners to entries that modify the application. */
function setupApplicationEvents() {
  getApplicationEntry("ecc").element.addEventListener("change", (event) => {
    ECC.setBypass(!getInputSafeValue(event.target));
  });
}

/** Adds listeners to buttons that invoke actions. */
function setupButtonEvents() {
  const buttons = getButtons();
  addActionListener(buttons.load, (event) =>
    loadFile(getInputSafeValue(event.target))
  );
  addActionListener(buttons.clearImages, clearImages);
  addActionListener(buttons.clearText, clearText);
  addActionListener(buttons.coverAdjustReset, resetCoverAdjustments);
  addActionListener(buttons.coverReset, () => {
    resetCover();
    scheduleSnapshot();
  });
  addActionListener(buttons.coverRotateLeft, () => rotateCover(-90));
  addActionListener(buttons.coverRotateRight, () => rotateCover(90));
  addActionListener(buttons.print, testAndPrint);
  addActionListener(buttons.redo, redo);
  addActionListener(buttons.save, () => {
    saveDataSaves();
    markSaved();
  });
  addActionListener(buttons.saveCover, saveCover);
  addActionListener(buttons.viewCollapse, collapseAll);
  addActionListener(buttons.viewExpand, expandAll);
  addActionListener(buttons.undo, undo);
  setHistoryListener((canUndo, canRedo) => {
    buttons.undo.element.disabled = !canUndo;
    buttons.redo.element.disabled = !canRedo;
  });
}

/** Adds listeners to entries that update outputs. */
function setupEntryEvents() {
  const i = getDataEntries();
  const o = getOutputs();
  addBackListener(
    i.sideALabel,
    i.sideAContents,
    i.contentsSeparator,
    i.shortBack,
    o.sideAContents,
    OPTIONS_COALESCE
  );
  addBackListener(
    i.sideBLabel,
    i.sideBContents,
    i.contentsSeparator,
    i.shortBack,
    o.sideBContents,
    OPTIONS_COALESCE
  );
  addClassListener(
    i.backContentsVisible,
    o.back,
    "hidden",
    OPTIONS_COALESCE_INVERT
  );
  addClassListener(i.bold, o.root, "bold", OPTIONS_COALESCE);
  addClassListener(getApplicationEntry("coverSnap"), o.coverFrame, "snap-grid");
  addStyleVariableListener(
    getApplicationEntries(),
    "coverGrid",
    OPTIONS_COALESCE
  );
  addClassListener(i.coverFlipH, o.coverFrame, "flip-h", OPTIONS_COALESCE);
  addClassListener(i.coverFlipV, o.coverFrame, "flip-v", OPTIONS_COALESCE);
  addClassListener(i.fillCover, o.coverFrame, "fill", OPTIONS_COALESCE);
  addClassListener(
    i.coverVisible,
    o.coverFrame,
    "hidden",
    OPTIONS_COALESCE_INVERT
  );
  addClassListener(i.forceCaps, o.root, "force-caps", OPTIONS_COALESCE);
  addClassListener(
    i.frontContentsVisible,
    o.contents,
    "hidden",
    OPTIONS_COALESCE_INVERT
  );
  addClassListener(
    i.frontContentsVisible,
    o.frontTitleGroup,
    "center",
    OPTIONS_COALESCE_INVERT
  );
  addClassListener(
    i.frontTitleVisible,
    o.frontTitleGroup,
    "hidden",
    OPTIONS_COALESCE_INVERT
  );
  addClassListener(i.italicize, o.root, "italicize", OPTIONS_COALESCE);
  addClassListener(i.reverse, o.root, "reverse", OPTIONS_COALESCE);
  addClassListener(i.shortBack, o.root, "short-back", OPTIONS_COALESCE);
  addClassListener(i.shortSpine, o.root, "short-spine", OPTIONS_COALESCE);
  addClassListener(
    i.spineTitleVisible,
    o.spineTitleGroup,
    "hidden",
    OPTIONS_COALESCE_INVERT
  );
  addFrontListener(
    i.sideAContents,
    i.sideBContents,
    i.contentsSeparator,
    o.contents,
    OPTIONS_COALESCE
  );
  addHtmlListener(i.footer, o.footer, OPTIONS_COALESCE);
  addHtmlListener(i.noteLower, o.noteLower, OPTIONS_COALESCE);
  addHtmlListener(i.noteUpper, o.noteUpper, OPTIONS_COALESCE);
  addHtmlListener(i.sideALabel, o.sideALabel, OPTIONS_COALESCE);
  addHtmlListener(i.sideBLabel, o.sideBLabel, OPTIONS_COALESCE);
  addHtmlListener(i.titleLower, o.frontTitleLower, OPTIONS_COALESCE);
  addHtmlListener(i.titleLower, o.spineTitleLower, OPTIONS_COALESCE);
  addHtmlListener(i.titleUpper, o.frontTitleUpper, OPTIONS_COALESCE);
  addHtmlListener(i.titleUpper, o.spineTitleUpper, OPTIONS_COALESCE);
  [i.coverImage, getLoadEntry("cover")].forEach((entry) => {
    entry.element.addEventListener("change", () => {
      const files = entry.element.files;
      if (files && files.length) {
        applyCoverFile(files[0]);
      }
    });
  });
  addStyleVariableListener(i, "backContentsAlignment", OPTIONS_COALESCE);
  addStyleVariableListener(i, "backSize", OPTIONS_COALESCE_PT);
  addStyleVariableListener(i, "cardColor", OPTIONS_COALESCE);
  addStyleVariableListener(i, "coverHeightFactor", OPTIONS_COALESCE);
  addStyleVariableListener(i, "coverOffsetX", OPTIONS_COALESCE);
  addStyleVariableListener(i, "coverOffsetY", OPTIONS_COALESCE);
  addStyleVariableListener(i, "coverRotate", OPTIONS_COALESCE);
  addStyleVariableListener(i, "coverZoom", OPTIONS_COALESCE);
  Object.keys(TEXT_BLOCKS).forEach((block) => {
    addStyleVariableListener(i, block + "OffsetX", OPTIONS_COALESCE_PT);
    addStyleVariableListener(i, block + "OffsetY", OPTIONS_COALESCE_PT);
    addStyleVariableListener(i, block + "LetterSpacing", OPTIONS_COALESCE_PT);
    addStyleVariableListener(i, block + "LineHeight", OPTIONS_COALESCE);
  });
  addFontListener(i.fontFamily, "--jCardFontFamily");
  addFontListener(i.titleFontFamily, "--jCardTitleFontFamily");
  addStyleVariableListener(i, "footerAlignment", OPTIONS_COALESCE);
  addStyleVariableListener(i, "footerSize", OPTIONS_COALESCE_PT);
  addStyleVariableListener(i, "frontContentsAlignment", OPTIONS_COALESCE);
  addStyleVariableListener(i, "frontSize", OPTIONS_COALESCE_PT);
  addStyleVariableListener(i, "frontTitleAlignment", OPTIONS_COALESCE);
  addStyleVariableListener(i, "noteAlignment", OPTIONS_COALESCE);
  addStyleVariableListener(i, "noteSize", OPTIONS_COALESCE_PT);
  addStyleVariableListener(i, "spineTitleAlignment", OPTIONS_COALESCE);
  addStyleVariableListener(i, "textColor", OPTIONS_COALESCE);
  addStyleVariableListener(i, "titleLowerSize", OPTIONS_COALESCE_PT);
  addStyleVariableListener(i, "titleUpperSize", OPTIONS_COALESCE_PT);
  addStyleVariableListener(
    getApplicationEntries(),
    "fontSizeFactorInvert",
    OPTIONS_COALESCE
  );
}

/** Adds listeners to file operators. */
function setupFileEvents() {
  getReader().addEventListener("load", () => {
    induceAnesthesia();
    loadReader();
    ECC.flush();
    removeAnesthesia();
    resetHistory();
  });
  let dragTimeout;
  document.addEventListener("dragover", (event) => {
    if (!hasDropPayload(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    document.body.classList.add("dropping");
    clearTimeout(dragTimeout);
    dragTimeout = setTimeout(
      () => document.body.classList.remove("dropping"),
      200
    );
  });
  document.addEventListener("drop", (event) => {
    if (!hasDropPayload(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    clearTimeout(dragTimeout);
    document.body.classList.remove("dropping");
    const transfer = event.dataTransfer;
    const files = Array.from(transfer.files);
    const fonts = files.filter(isFontFile);
    const data = files.find((file) => !isImageFile(file) && !isFontFile(file));
    const image = files.find(isImageFile);
    if (fonts.length) {
      applyFontFiles(fonts);
    } else if (data) {
      loadFile([data]);
    } else if (image) {
      const slot = getDropSlot(event);
      slot ? applyArtFile(slot, image) : applyCoverFile(image);
    } else {
      const url = transfer.getData("text/uri-list").split(/\r?\n/)[0];
      if (url) {
        applyCoverUrl(url);
      }
    }
  });
  document.addEventListener("paste", (event) => {
    const transfer = event.clipboardData;
    const image = Array.from(transfer.files).find(isImageFile);
    // Let text pastes into fields through, even if an image came along.
    if (
      !image ||
      (event.target instanceof Element &&
        event.target.matches("input, textarea") &&
        transfer.types.includes("text/plain"))
    ) {
      return;
    }
    event.preventDefault();
    getSide() === "inside"
      ? applyArtFile("insideFront", image)
      : applyCoverFile(image);
  });
}

/**
 * Returns whether the given drag carries files or links, as opposed to text
 * being dragged into a field.
 */
function hasDropPayload(transfer) {
  return (
    transfer.types.includes("Files") || transfer.types.includes("text/uri-list")
  );
}

/** Adds listeners for the album art search. */
function setupSearchEvents() {
  const byId = (id) => document.getElementById(id);
  const status = byId("search-status");
  const detail = byId("search-detail");
  let selected = null;
  const toText = (html) =>
    new DOMParser().parseFromString(html, "text/html").body.textContent.trim();
  const describe = (result) =>
    [result.year, result.format, result.country].filter(Boolean).join(" \u00b7 ");
  // Builds a clickable tile for the given result.
  const makeTile = (result) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "search-tile";
    tile.title = result.artist + " \u2013 " + result.title;
    const image = new Image();
    image.alt = "";
    image.loading = "lazy";
    image.src = result.thumb;
    // MusicBrainz releases without art 404; keep the tile, drop the image.
    image.addEventListener("error", () => tile.classList.add("no-art"));
    const caption = document.createElement("span");
    caption.textContent = result.title;
    const meta = document.createElement("small");
    meta.textContent = result.artist + (describe(result) ? " \u00b7 " + describe(result) : "");
    tile.append(image, caption, meta);
    tile.addEventListener("click", () => select(result, tile));
    return tile;
  };
  const select = (result, tile) => {
    selected = result;
    document
      .querySelectorAll(".search-tile.selected")
      .forEach((other) => other.classList.remove("selected"));
    tile.classList.add("selected");
    byId("search-preview").src = result.thumb;
    byId("search-info").textContent =
      result.artist + " \u2013 " + result.title + (describe(result) ? " (" + describe(result) + ")" : "");
    detail.hidden = false;
    status.textContent = "";
  };
  const showRecent = (recent) => {
    byId("search-recent").hidden = !recent.length;
    byId("search-recent-list").replaceChildren(...recent.map(makeTile));
  };
  const search = () => {
    const artist =
      byId("search-artist").value.trim() ||
      toText(getDataEntry("titleLower").valueOrLkgOrPreset);
    const album =
      byId("search-album").value.trim() ||
      toText(getDataEntry("titleUpper").valueOrLkgOrPreset);
    if (!artist && !album) {
      status.textContent = MESSAGES.lookupEmpty;
      return;
    }
    status.textContent = MESSAGES.lookupSearching;
    detail.hidden = true;
    selected = null;
    searchAlbums(artist, album, byId("search-source").value)
      .then((results) => {
        byId("search-results").replaceChildren(...results.map(makeTile));
        status.textContent = results.length ? "" : MESSAGES.lookupNone;
      })
      .catch((error) => {
        status.textContent = MESSAGES.lookupFailed + error.message;
      });
  };
  byId("button-search").addEventListener("click", search);
  ["search-artist", "search-album"].forEach((id) =>
    byId(id).addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        search();
      }
    })
  );
  detail.querySelectorAll("[data-use]").forEach((button) =>
    button.addEventListener("click", () => {
      if (!selected) {
        return;
      }
      const result = selected;
      const target = button.dataset.use;
      status.textContent = MESSAGES.lookupFetching;
      fetchArt(result)
        .then((blob) =>
          target === "cover" ? applyCoverFile(blob) : applyArtFile(target, blob)
        )
        .then(() => {
          status.textContent = "";
          return addRecent(result).then(showRecent);
        })
        .catch((error) => {
          status.textContent =
            error.message === "No cover art"
              ? MESSAGES.lookupNoArt
              : MESSAGES.lookupFailed + error.message;
        });
    })
  );
  byId("button-search-titles").addEventListener("click", () => {
    if (!selected) {
      return;
    }
    [
      ["titleUpper", selected.title],
      ["titleLower", selected.artist],
    ].forEach(([key, value]) => {
      const entry = getDataEntry(key);
      entry.value = value;
      entry.element.dispatchEvent(EVENT_INPUT);
    });
  });
  byId("button-search-tracks").addEventListener("click", () => {
    if (!selected) {
      return;
    }
    status.textContent = MESSAGES.lookupSearching;
    fetchTracks(selected)
      .then(({ sideA, sideB }) => {
        if (!sideA.length && !sideB.length) {
          status.textContent = MESSAGES.lookupTracksNone;
          return;
        }
        [
          ["sideAContents", sideA],
          ["sideBContents", sideB],
        ].forEach(([key, titles]) => {
          const entry = getDataEntry(key);
          entry.value = titles.join("\n");
          entry.element.dispatchEvent(EVENT_INPUT);
        });
        status.textContent = MESSAGES.lookupTracksDone;
      })
      .catch((error) => {
        status.textContent = MESSAGES.lookupFailed + error.message;
      });
  });
  getRecent().then(showRecent);
}

/** Adds listeners for the Export section. */
function setupExportEvents() {
  const byId = (id) => document.getElementById(id);
  const status = byId("export-status");
  const list = byId("sheet-list");
  const buttons = ["export-png", "export-pdf", "sheet-add"].map((id) =>
    byId("button-" + id)
  );
  // Resolves with one render per chosen side.
  const render = async () => {
    const choice = byId("input-export-side").value;
    const sides =
      choice === "both"
        ? ["outside", "inside"]
        : [choice === "shown" ? getSide() : choice];
    const renders = [];
    for (const side of sides) {
      renders.push(
        await renderCard(
          Number(byId("input-export-dpi").value),
          byId("input-export-area").value,
          side
        )
      );
    }
    return renders;
  };
  const describe = (results) => {
    const result = results[0];
    return (
      (results.length > 1 ? results.length + " sides, " : "") +
      result.canvas.width +
    " × " +
    result.canvas.height +
    " px, " +
    result.widthIn.toFixed(2) +
    " × " +
    result.heightIn.toFixed(2) +
    " in at " +
    result.dpi +
    " DPI"
    );
  };
  // Runs the given export step, showing progress and failures.
  const run = (step) => {
    buttons.forEach((button) => (button.disabled = true));
    status.textContent = MESSAGES.exportWorking;
    return render()
      .then(step)
      .catch((error) => {
        status.textContent =
          MESSAGES.exportFailed + ((error && error.message) || String(error));
      })
      .finally(() => buttons.forEach((button) => (button.disabled = false)));
  };
  const showSheet = (cards) => {
    list.replaceChildren(
      ...cards.map((card, index) => {
        const item = document.createElement("li");
        const image = new Image();
        image.src = card.dataUrl;
        image.alt = card.name;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () =>
          showSheet(removeFromSheet(index))
        );
        item.append(image, document.createTextNode(card.name), remove);
        return item;
      })
    );
    byId("button-sheet-pdf").disabled = !cards.length;
    byId("button-sheet-clear").disabled = !cards.length;
  };
  buttons[0].addEventListener("click", () =>
    run((results) =>
      Promise.all(
        results.map((result) =>
          downloadPng(
            result,
            results.length > 1 ? " (" + result.side + ")" : ""
          )
        )
      ).then(() => {
        const result = results;
        status.textContent =
          MESSAGES.exportDone + "PNG: " + describe(result) + ".";
      })
    )
  );
  buttons[1].addEventListener("click", () =>
    run((results) =>
      downloadPdf(results, byId("input-export-paper").value).then(() => {
        const result = results;
        status.textContent =
          MESSAGES.exportDone + "PDF: " + describe(result) + ".";
      })
    )
  );
  buttons[2].addEventListener("click", () =>
    run((results) => {
      results.forEach((result) => showSheet(addToSheet(result)));
      status.textContent = "";
    })
  );
  byId("button-sheet-pdf").addEventListener("click", () => {
    const paper = byId("input-export-paper").value;
    downloadSheetPdf(paper === "card" ? "letter" : paper).catch((error) => {
      status.textContent = MESSAGES.exportFailed + error.message;
    });
  });
  byId("button-sheet-clear").addEventListener("click", () =>
    showSheet(clearSheet())
  );
}

/** Adds listeners for adding font files. */
function setupFontEvents() {
  document.getElementById("input-font-files").addEventListener(
    "change",
    (event) => {
      applyFontFiles(Array.from(event.target.files));
      event.target.value = "";
    }
  );
}

/**
 * Adds the given font files to the library, then uses the last one as the
 * card's font family.
 */
function applyFontFiles(files) {
  return Promise.all(
    files.map((file) => addFontFile(file).catch(() => null))
  ).then((names) => {
    const name = names.filter(Boolean).pop();
    if (!name) {
      alert(MESSAGES.fontBad);
      return;
    }
    const entry = getDataEntry("fontFamily");
    entry.value = name;
    entry.element.dispatchEvent(EVENT_INPUT);
  });
}

/**
 * Adds an input event listener to the given font family entry that sets the
 * given style variable to it as a valid CSS font list, loading any Google
 * Fonts it names. An empty list removes the variable.
 */
function addFontListener(entry, variable) {
  entry.element.addEventListener(
    "input",
    makeHandler(() => {
      doBeforeEdit(entry);
      const value = String(entry.valueOrLkgOrPreset);
      requestGoogleFonts(value);
      getRoot().element.style.setProperty(variable, toCssFontList(value));
      return doAfterEdit(entry);
    }, OPTIONS_COALESCE)
  );
}

/** Adds listeners for the style preset picker. */
function setupPresetEvents() {
  const select = document.getElementById("select-style-preset");
  const remove = document.getElementById("button-style-delete");
  const BUILT_IN = "built-in:";
  const SAVED = "saved:";
  let saved = new Map();
  const fill = (selected) =>
    getSavedPresets().then((entries) => {
      saved = new Map(entries);
      const group = (label, prefix, names) => {
        const element = document.createElement("optgroup");
        element.label = label;
        names.forEach((name) => element.append(new Option(name, prefix + name)));
        return element;
      };
      select.replaceChildren(
        group("Built-in", BUILT_IN, Object.keys(BUILT_IN_PRESETS))
      );
      if (saved.size) {
        select.append(group("Saved", SAVED, Array.from(saved.keys())));
      }
      if (selected) {
        select.value = selected;
      }
      remove.disabled = !select.value.startsWith(SAVED);
    });
  select.addEventListener("change", () => {
    remove.disabled = !select.value.startsWith(SAVED);
  });
  document.getElementById("button-style-apply").addEventListener("click", () => {
    const value = select.value;
    const style = value.startsWith(SAVED)
      ? saved.get(value.substring(SAVED.length))
      : BUILT_IN_PRESETS[value.substring(BUILT_IN.length)];
    if (style) {
      applyStyle(style);
      doAfterModify({ save: true });
    }
  });
  document.getElementById("button-style-save").addEventListener("click", () => {
    const name = (prompt(MESSAGES.presetName) || "").trim();
    if (name) {
      saveStyle(name).then(() => fill(SAVED + name));
    }
  });
  remove.addEventListener("click", () => {
    const name = select.value.substring(SAVED.length);
    if (select.value.startsWith(SAVED) && confirm(MESSAGES.presetDelete + name)) {
      deleteStyle(name).then(() => fill());
    }
  });
  fill();
}

/** Adds listeners for the inside of the card. */
function setupInsideEvents() {
  const i = getDataEntries();
  const o = getOutputs();
  [
    [i.insideFrontText, o.insideFrontText],
    [i.insideBackText, o.insideBackText],
    [i.insideSpineText, o.insideSpineText],
  ].forEach(([entry, output]) =>
    entry.element.addEventListener(
      "input",
      makeHandler(() => {
        doBeforeEdit(entry);
        // Keep blank lines, which separate verses and paragraphs.
        output.element.innerHTML = String(entry.valueOrLkgOrPreset)
          .replace(/\r\n?/g, "\n")
          .split("\n")
          .join("<br />");
        return doAfterEdit(entry);
      }, OPTIONS_COALESCE)
    )
  );
  [
    "insideBackAlignment",
    "insideCardColor",
    "insideFrontAlignment",
    "insideFrontColumns",
    "insideSpineAlignment",
    "insideTextColor",
  ].forEach((key) => addStyleVariableListener(i, key, OPTIONS_COALESCE));
  ["insideBackSize", "insideFrontSize", "insideSpineSize"].forEach((key) =>
    addStyleVariableListener(i, key, OPTIONS_COALESCE_PT)
  );
  // Both sides share the card's shape.
  addClassListener(i.shortBack, o.insideRoot, "short-back", OPTIONS_COALESCE);
  addClassListener(i.shortSpine, o.insideRoot, "short-spine", OPTIONS_COALESCE);
}

/** Adds listeners for the panel image slots. */
function setupArtEvents() {
  const i = getDataEntries();
  ART_SLOTS.forEach((slot) => {
    const key = getArtKey(slot);
    const frame = getOutputs()[key].element;
    i[key + "Image"].element.addEventListener("change", (event) => {
      const files = event.target.files;
      if (files && files.length) {
        applyArtFile(slot, files[0]);
      }
    });
    addActionListener(getButtons()[key + "Remove"], () => {
      setArt(slot, null);
      doAfterModify({ save: true });
    });
    i[key + "Turn"].element.addEventListener("input", (event) => {
      const turn = Number(getInputSafeValue(event.target));
      frame.classList.toggle("turned", turn === 90 || turn === 270);
    });
    ["Fit", "Turn", "Zoom", "OffsetX", "OffsetY", "Opacity", ...FILTERS].forEach(
      (setting) =>
        addStyleVariableListener(i, key + setting, OPTIONS_COALESCE)
    );
  });
  FILTERS.forEach((filter) =>
    addStyleVariableListener(i, "cover" + filter, OPTIONS_COALESCE)
  );
}

/** Sets the given panel image slot to the given image file. */
function applyArtFile(slot, file) {
  return readCover(file).then(
    (src) => {
      setArt(slot, src);
      doAfterModify({ save: true });
    },
    () => {}
  );
}

/**
 * Returns the panel image slot a dropped image should go to: the wrap when
 * Shift is held, the spine or back when dropped on them, or null for the cover.
 */
function getDropSlot(event) {
  const inside = getSide() === "inside";
  if (event.shiftKey) {
    return inside ? "insideWrap" : "wrap";
  }
  const outputs = getOutputs();
  const isOver = (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  };
  if (inside) {
    // The front is checked last; the inside has no cover to fall back to.
    return (
      ["insideSpine", "insideBack", "insideFront"].find((slot) =>
        isOver(outputs[getArtKey(slot)].element)
      ) || "insideFront"
    );
  }
  return ["spine", "back"].find((slot) =>
    isOver(outputs[getArtKey(slot)].element)
  ) || null;
}

/** Empties every text field on the card. */
function clearText() {
  CONTENT_KEYS.forEach((key) => {
    const entry = getDataEntry(key);
    entry.value = "";
    entry.element.dispatchEvent(EVENT_INPUT);
  });
}

/** Hides the cover and removes every panel image. */
function clearImages() {
  resetCover();
  ART_SLOTS.forEach((slot) => setArt(slot, null));
  const visible = getDataEntry("coverVisible");
  visible.value = false;
  visible.element.dispatchEvent(EVENT_CHANGE);
  doAfterModify({ save: true });
}

/** Shows the cover if it was hidden or cleared. */
function showCover() {
  const visible = getDataEntry("coverVisible");
  if (!visible.valueOrLkgOrPreset) {
    visible.value = true;
    visible.element.dispatchEvent(EVENT_CHANGE);
  }
}

/** Sets the cover image to the given image file and marks the card modified. */
function applyCoverFile(file) {
  return readCover(file).then(
    (src) => {
      setCover(src);
      resetCoverAdjustments();
      showCover();
      doAfterModify({ save: true });
    },
    () => {}
  );
}

/**
 * Sets the cover image to the image at the given URL, such as one dragged from
 * another page. Fails on sites that do not allow cross-origin reads.
 */
function applyCoverUrl(url) {
  return fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      if (!isImageFile(blob)) {
        throw new TypeError();
      }
      return applyCoverFile(blob);
    })
    .catch(() => alert(MESSAGES.coverFetch));
}

/** Adds listeners to entries that update entries. */
function setupFormEvents() {
  // Keep each slider and its number box in step.
  qsAll(getRoot().element, 'input[type="range"][data-for]').forEach((range) => {
    const number = document.getElementById(range.dataset.for);
    number.addEventListener("input", () => {
      range.value = number.value || number.placeholder;
    });
    range.addEventListener("input", () => {
      number.value = range.value;
      number.dispatchEvent(EVENT_INPUT);
    });
  });
  addBooleanListener(
    getDataEntry("fillCover"),
    getDataEntry("coverHeightFactor").element,
    "disabled"
  );
  addBooleanListener(
    getSaveEntry("follow"),
    getSaveEntry("name").element,
    "disabled"
  );
}

/** Adds listeners to entries that modify the view. */
function setupViewEvents() {
  addClassListener(getViewEntry("reverse"), getRoot(), "reverse");
  getSaveEntry("name").element.addEventListener(
    "input",
    makeHandler((event) => {
      setWindowSubtitle(getInputSafeValue(event.target) || FILE_NAME);
    }, OPTIONS_COALESCE)
  );
  getViewEntry("forceDark").element.addEventListener("change", (event) => {
    setForceDark(getInputSafeValue(event.target));
  });
}

/** Adds listeners to the window. */
function setupWindowEvents() {
  window.addEventListener("beforeprint", () => {
    ECC.flush();
    doPrint(
      getPrintEntry("start").valueOrLkgOrPreset,
      getPrintEntry("count").valueOrLkgOrPreset,
      getPrintEntry("margin").valueOrLkgOrPreset,
      getPrintEntry("opacity").valueOrLkgOrPreset,
      getPrintEntry("outline").valueOrLkgOrPreset,
      getPrintEntry("sides").valueOrLkgOrPreset
    );
  });
  window.addEventListener("afterprint", undoPrint);
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (
      !(event.ctrlKey || event.metaKey) ||
      event.altKey ||
      (key !== "z" && key !== "y")
    ) {
      return;
    }
    // Text boxes keep their own undo for typing.
    if (
      event.target instanceof Element &&
      event.target.matches(
        'textarea, input:not([type]), input[type="text"], input[type="search"]'
      )
    ) {
      return;
    }
    event.preventDefault();
    key === "y" || event.shiftKey ? redo() : undo();
  });
}

/** CSS pixels per inch. */
const PX_PER_IN = 96;
/** Pointer travel in pixels before a press on the cover becomes a drag. */
const DRAG_THRESHOLD = 4;
/** Print quality bands by minimum DPI, best first. */
const QUALITIES = Object.freeze([
  { dpi: 300, name: "sharp", label: "Sharp ✓" },
  { dpi: 200, name: "good", label: "Good" },
  { dpi: 150, name: "soft", label: "May look soft" },
  { dpi: 0, name: "blurry", label: "Will look blurry" },
]);
/** Target DPI for print quality advice. */
const DPI_TARGET = 300;

/** Adds pointer, wheel and keyboard controls to the cover on the card. */
function setupCoverEvents() {
  const frame = getOutputs().coverFrame.element;
  let drag = null;
  let dragged = false;
  setupCardEditing(() => dragged);
  getOutputs().cover.element.addEventListener("load", updateCoverQuality);
  getDataEntry("coverZoom").element.addEventListener(
    "input",
    updateCoverQuality
  );
  new ResizeObserver(updateCoverQuality).observe(frame);
  setupArtSourceLinks();
  frame.tabIndex = 0;
  frame.addEventListener("pointerdown", (event) => {
    if (event.button) {
      return;
    }
    event.preventDefault();
    frame.focus();
    frame.setPointerCapture(event.pointerId);
    frame.classList.add("dragging");
    dragged = false;
    drag = {
      x: event.clientX,
      y: event.clientY,
      offsetX: Number(getDataEntry("coverOffsetX").valueOrLkgOrPreset),
      offsetY: Number(getDataEntry("coverOffsetY").valueOrLkgOrPreset),
    };
  });
  frame.addEventListener("pointermove", (event) => {
    if (!drag) {
      return;
    }
    // Small wobbles during a click are not a drag.
    if (
      !dragged &&
      Math.hypot(event.clientX - drag.x, event.clientY - drag.y) <
        DRAG_THRESHOLD
    ) {
      return;
    }
    dragged = true;
    const rect = frame.getBoundingClientRect();
    const free = event.ctrlKey;
    frame.classList.toggle("free", free);
    setCoverNumber(
      "coverOffsetX",
      snapOffset(
        drag.offsetX + ((event.clientX - drag.x) / rect.width) * 100,
        free
      )
    );
    setCoverNumber(
      "coverOffsetY",
      snapOffset(
        drag.offsetY + ((event.clientY - drag.y) / rect.height) * 100,
        free
      )
    );
  });
  ["pointerup", "pointercancel"].forEach((type) => {
    frame.addEventListener(type, () => {
      drag = null;
      frame.classList.remove("dragging", "free");
    });
  });
  frame.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoomCover(event.deltaY < 0 ? 1.05 : 1 / 1.05);
    },
    { passive: false }
  );
  frame.addEventListener("keydown", (event) => {
    const big = event.shiftKey;
    switch (event.key) {
      case "ArrowLeft":
        nudgeCover("coverOffsetX", -1, event);
        break;
      case "ArrowRight":
        nudgeCover("coverOffsetX", 1, event);
        break;
      case "ArrowUp":
        nudgeCover("coverOffsetY", -1, event);
        break;
      case "ArrowDown":
        nudgeCover("coverOffsetY", 1, event);
        break;
      case "+":
      case "=":
        zoomCover(big ? 1.1 : 1.01);
        break;
      case "-":
      case "_":
        zoomCover(big ? 1 / 1.1 : 1 / 1.01);
        break;
      case "[":
      case "{":
        rotateCover(big ? -15 : -0.5);
        break;
      case "]":
      case "}":
        rotateCover(big ? 15 : 0.5);
        break;
      case "0":
      case ")":
        resetCoverAdjustments();
        break;
      default:
        return;
    }
    event.preventDefault();
  });
}

/**
 * Fills in search links to cover art sources from the card titles just before
 * they are followed. The lower title is taken as the artist.
 */
function setupArtSourceLinks() {
  const toText = (html) =>
    new DOMParser().parseFromString(html, "text/html").body.textContent.trim();
  const fill = (event) => {
    const link = event.target.closest && event.target.closest("a[data-search]");
    if (!link) {
      return;
    }
    const artist = toText(getDataEntry("titleLower").valueOrLkgOrPreset);
    const album = toText(getDataEntry("titleUpper").valueOrLkgOrPreset);
    if (artist || album) {
      link.href = link.dataset.search
        .replace("{artist}", encodeURIComponent(artist))
        .replace("{album}", encodeURIComponent(album));
    }
  };
  qsAll(getRoot().element, ".art-sources").forEach((list) => {
    ["pointerover", "focusin", "click", "auxclick", "contextmenu"].forEach(
      (type) => list.addEventListener(type, fill)
    );
  });
}

/**
 * Shows the cover's effective print resolution, given its frame size, the
 * object-fit cover scaling, and the zoom.
 */
function updateCoverQuality() {
  const element = document.getElementById("cover-quality");
  const image = getOutputs().cover.element;
  const frame = getOutputs().coverFrame.element;
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!element) {
    return;
  }
  if (!width || !height || !frame.offsetWidth) {
    element.textContent = "";
    return;
  }
  const style = getComputedStyle(frame);
  const widthIn = parseFloat(style.width) / PX_PER_IN;
  const heightIn = parseFloat(style.height) / PX_PER_IN;
  const zoom =
    Number(getDataEntry("coverZoom").valueOrLkgOrPreset) ||
    getDataEntry("coverZoom").preset;
  const dpi = Math.round(
    1 / (Math.max(widthIn / width, heightIn / height) * zoom)
  );
  const quality = QUALITIES.find((band) => dpi >= band.dpi);
  let text =
    dpi +
    " DPI: " +
    quality.label +
    ". Image " +
    width +
    " × " +
    height +
    " px on a " +
    widthIn.toFixed(3).replace(/\.?0+$/, "") +
    " × " +
    heightIn.toFixed(3).replace(/\.?0+$/, "") +
    " in area.";
  if (dpi < DPI_TARGET) {
    text +=
      " For " +
      DPI_TARGET +
      " DPI at this zoom, use at least " +
      Math.ceil(widthIn * DPI_TARGET * zoom) +
      " × " +
      Math.ceil(heightIn * DPI_TARGET * zoom) +
      " px.";
  }
  element.textContent = text;
  element.classList.remove(...QUALITIES.map((band) => band.name));
  element.classList.add(quality.name);
}

/**
 * Nudges the cover offset by its key in the given direction (1 or -1) for the
 * given key event: Ctrl for fine steps, Shift for big steps, and otherwise to
 * the next grid line when snapping.
 */
function nudgeCover(key, direction, event) {
  const value = Number(getDataEntry(key).valueOrLkgOrPreset);
  if (event.ctrlKey) {
    return setCoverNumber(key, value + direction * 0.1);
  }
  if (isSnapping()) {
    const step = getGrid() * (event.shiftKey ? 5 : 1);
    const lines = value / step;
    const next =
      direction > 0
        ? Math.floor(lines + 1e-6) + 1
        : Math.ceil(lines - 1e-6) - 1;
    return setCoverNumber(key, next * step);
  }
  return setCoverNumber(key, value + direction * (event.shiftKey ? 5 : 0.5));
}

/** Returns the snap grid size in percent of the cover frame. */
function getGrid() {
  return (
    Number(getApplicationEntry("coverGrid").valueOrLkgOrPreset) ||
    getApplicationEntry("coverGrid").preset
  );
}

/** Returns whether cover snapping is on. */
function isSnapping() {
  return Boolean(getApplicationEntry("coverSnap").valueOrLkgOrPreset);
}

/**
 * Returns the given cover offset snapped to the nearest grid line or to where
 * the cover edges meet the frame edges, unless free or snapping is off.
 */
function snapOffset(value, free = false) {
  if (free || !isSnapping()) {
    return value;
  }
  const grid = getGrid();
  const zoom = Number(getDataEntry("coverZoom").valueOrLkgOrPreset) || 1;
  const edge = Math.abs(zoom - 1) * 50;
  return [Math.round(value / grid) * grid, edge, -edge].reduce(
    (best, target) =>
      Math.abs(target - value) < Math.abs(best - value) ? target : best
  );
}

/** Resets the cover zoom, position, rotation and flips. */
function resetCoverAdjustments() {
  ["coverOffsetX", "coverOffsetY", "coverRotate", "coverZoom"].forEach((key) =>
    setCoverNumber(key, getDataEntry(key).preset)
  );
  ["coverFlipH", "coverFlipV"].forEach((key) => {
    const entry = getDataEntry(key);
    entry.value = entry.preset;
    entry.element.dispatchEvent(EVENT_CHANGE);
  });
}

/** Rotates the cover by the given degrees, wrapping within ±180. */
function rotateCover(degrees) {
  let angle = Number(getDataEntry("coverRotate").valueOrLkgOrPreset) + degrees;
  angle = ((((angle + 180) % 360) + 360) % 360) - 180;
  return setCoverNumber("coverRotate", angle === -180 ? 180 : angle);
}

/**
 * Sets the cover number entry by its key to the given value, clamped to its
 * limits and rounded to its step, then applies it.
 */
function setCoverNumber(key, value) {
  const entry = getDataEntry(key);
  const element = entry.element;
  const decimals = (element.step.split(".")[1] || "").length;
  value = Math.min(Number(element.max), Math.max(Number(element.min), value));
  entry.value = String(Number(value.toFixed(decimals)));
  element.dispatchEvent(EVENT_INPUT);
}

/**
 * Multiplies the cover zoom by the given factor, moving by at least one step so
 * that small zooms do not round back to themselves.
 */
function zoomCover(factor) {
  const zoom = Number(getDataEntry("coverZoom").valueOrLkgOrPreset);
  const next = zoom * factor;
  return setCoverNumber(
    "coverZoom",
    factor > 1 ? Math.max(next, zoom + 0.01) : Math.min(next, zoom - 0.01)
  );
}

/**
 * Adds an input event listener to the given entries that sets the back contents
 * to the given output.
 */
function addBackListener(
  label,
  contents,
  separator,
  shortBack,
  output,
  options = NUL_OBJECT
) {
  [label, contents, separator, shortBack].forEach((entry) => {
    entry.element.addEventListener(
      "input",
      makeHandler(() => {
        return (
          doBeforeEdit(entry) &&
          setBackContents(output, label, contents, separator, shortBack) &&
          doAfterEdit(entry)
        );
      }, options)
    );
  });
}

/**
 * Adds a `beforeunload` event listener to the window by modified flag and the
 * given entry.
 */
function addBeforeUnloadListenerBy(entry) {
  if (!isModified() && entry.save) {
    window.addEventListener("beforeunload", doBeforeUnload);
  }
}

/**
 * Adds an input event listener to the given entries that sets the front
 * contents to the given output.
 */
function addFrontListener(
  aContents,
  bContents,
  separator,
  output,
  options = NUL_OBJECT
) {
  [aContents, bContents, separator].forEach((entry) => {
    entry.element.addEventListener(
      "input",
      makeHandler(() => {
        return (
          doBeforeEdit(entry) &&
          setFrontContents(output, aContents, bContents, separator) &&
          doAfterEdit(entry)
        );
      }, options)
    );
  });
}
