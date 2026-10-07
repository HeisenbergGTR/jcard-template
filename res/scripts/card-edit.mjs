/**
 * J-Card Template: Edit on the Card
 *
 * Clicking text on the card opens a small editor for the matching form fields
 * right there; clicking an image area opens actions for that image. Edits go
 * through the form entries, so undo, auto-save and saving all see them.
 */

import { getDataEntry } from "./application-functions.mjs";
import { EVENT_CHANGE, EVENT_INPUT } from "./common/constants.mjs";
import { getOutputs } from "./common/application-functions.mjs";

/** Card text elements by class, with the fields they edit. */
const TEXT_TARGETS = Object.freeze([
  { selector: ".template-front-title-upper", fields: ["titleUpper"] },
  { selector: ".template-spine-title-upper", fields: ["titleUpper"] },
  { selector: ".template-front-title-lower", fields: ["titleLower"] },
  { selector: ".template-spine-title-lower", fields: ["titleLower"] },
  { selector: ".template-note-upper", fields: ["noteUpper"] },
  { selector: ".template-note-lower", fields: ["noteLower"] },
  { selector: ".template-footer", fields: ["footer"] },
  { selector: ".template-side-a-label", fields: ["sideALabel"] },
  { selector: ".template-side-b-label", fields: ["sideBLabel"] },
  { selector: ".template-side-a-contents", fields: ["sideAContents"] },
  { selector: ".template-side-b-contents", fields: ["sideBContents"] },
  { selector: ".template-contents", fields: ["sideAContents", "sideBContents"] },
  { selector: ".template-inside-front-text", fields: ["insideFrontText"] },
  { selector: ".template-inside-back-text", fields: ["insideBackText"] },
  { selector: ".template-inside-spine-text", fields: ["insideSpineText"] },
]);
/** Text selectors for empty inside panels, which open their editor on click. */
const INSIDE_PANELS = Object.freeze([
  { selector: ".template-inside-front-text", slot: "insideFront" },
  { selector: ".template-inside-back-text", slot: "insideBack" },
  { selector: ".template-inside-spine-text", slot: "insideSpine" },
]);
/** Field labels and whether they span lines. */
const FIELDS = Object.freeze({
  footer: { label: "Footer", multiline: true },
  insideBackText: { label: "Inside back flap", multiline: true },
  insideFrontText: { label: "Inside front", multiline: true },
  insideSpineText: { label: "Inside spine" },
  noteLower: { label: "Lower note" },
  noteUpper: { label: "Upper note" },
  sideAContents: { label: "Side A tracks", multiline: true },
  sideALabel: { label: "Side A label" },
  sideBContents: { label: "Side B tracks", multiline: true },
  sideBLabel: { label: "Side B label" },
  titleLower: { label: "Lower title" },
  titleUpper: { label: "Upper title" },
});
/** Image areas by slot. */
const IMAGES = Object.freeze({
  back: { label: "Back image", details: "slot-art-back", input: "input-art-back-image" },
  cover: { label: "Cover image", details: "field-cover-zoom", input: "input-cover-image" },
  spine: { label: "Spine image", details: "slot-art-spine", input: "input-art-spine-image" },
  wrap: { label: "Wrap image (whole card)", details: "slot-art-wrap", input: "input-art-wrap-image" },
  insideBack: { label: "Inside back flap image", details: "slot-art-inside-back", input: "input-art-inside-back-image" },
  insideFront: { label: "Inside front image", details: "slot-art-inside-front", input: "input-art-inside-front-image" },
  insideSpine: { label: "Inside spine image", details: "slot-art-inside-spine", input: "input-art-inside-spine-image" },
  insideWrap: { label: "Inside wrap image (whole inside)", details: "slot-art-inside-wrap", input: "input-art-inside-wrap-image" },
});

/** The popover element. */
let popover = null;

/**
 * Makes the card editable by clicking. The given function says whether the
 * last pointer press on the cover was a drag, so drags do not open the menu.
 */
export function setupCardEditing(wasCoverDrag) {
  const template = getOutputs().root.element;
  const inside = getOutputs().insideRoot.element;
  popover = document.createElement("div");
  popover.className = "card-popover";
  popover.hidden = true;
  popover.setAttribute("role", "dialog");
  document.body.append(popover);
  TEXT_TARGETS.forEach(({ selector }) =>
    [template, inside].forEach((root) =>
      root.querySelectorAll(selector).forEach((element) =>
        element.classList.add("editable-text")
      )
    )
  );
  inside.classList.add("editable-card");
  inside.addEventListener("click", (event) => {
    const text = TEXT_TARGETS.find(({ selector }) =>
      Array.from(inside.querySelectorAll(selector)).some((element) =>
        isOnText(element, event)
      )
    );
    if (text) {
      openText(text.fields, event);
      return;
    }
    openInsidePanel(event);
  });
  template.classList.add("editable-card");
  template.addEventListener("click", (event) => {
    const text = TEXT_TARGETS.find(({ selector }) =>
      Array.from(template.querySelectorAll(selector)).some((element) =>
        isOnText(element, event)
      )
    );
    if (text) {
      openText(text.fields, event);
      return;
    }
    if (
      event.target.closest(".template-cover-frame") ||
      isOver(getOutputs().coverFrame.element, event)
    ) {
      if (!wasCoverDrag()) {
        openImage("cover", event);
      }
      return;
    }
    openImage(getPanel(event), event);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!popover.hidden && !popover.contains(event.target)) {
      close();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popover.hidden) {
      close();
    }
  });
}

/**
 * Returns whether the given click landed on the given element's letters. Text
 * boxes can be far bigger than their text and overlap, notably on the spine.
 */
function isOnText(element, event) {
  if (!element.textContent.trim()) {
    return false;
  }
  const range = document.createRange();
  range.selectNodeContents(element);
  const slop = 3;
  return Array.from(range.getClientRects()).some(
    (rect) =>
      event.clientX >= rect.left - slop &&
      event.clientX <= rect.right + slop &&
      event.clientY >= rect.top - slop &&
      event.clientY <= rect.bottom + slop
  );
}

/**
 * Opens the menu for the inside panel under the given click, with a shortcut
 * to write text there, or the inside wrap image away from the panels.
 */
function openInsidePanel(event) {
  const outputs = getOutputs();
  const panel = INSIDE_PANELS.find(({ slot }) =>
    isOver(outputs["art" + slot.charAt(0).toUpperCase() + slot.slice(1)].element, event)
  );
  openImage(panel ? panel.slot : "insideWrap", event);
  if (panel) {
    const key = panel.slot + "Text";
    const actions = popover.querySelector(".card-popover-actions");
    actions.prepend(
      makeButton("Write text", () => {
        openText([key], event);
      })
    );
  }
}

/** Returns the image slot under the given click: spine, back, or the wrap. */
function getPanel(event) {
  const outputs = getOutputs();
  if (isOver(outputs.artSpine.element, event)) {
    return "spine";
  }
  if (isOver(outputs.artBack.element, event)) {
    return "back";
  }
  return "wrap";
}

/** Returns whether the given click is inside the given element's box. */
function isOver(element, event) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

/** Opens an editor for the given fields at the given click. */
function openText(keys, event) {
  const heading = document.createElement("strong");
  heading.textContent = "Edit text";
  const controls = keys.map((key) => {
    const entry = getDataEntry(key);
    const info = FIELDS[key];
    const label = document.createElement("label");
    const caption = document.createElement("span");
    caption.textContent = info.label;
    const input = document.createElement(info.multiline ? "textarea" : "input");
    if (info.multiline) {
      input.rows = Math.min(10, Math.max(3, entry.element.value.split("\n").length));
    } else {
      input.type = "text";
    }
    input.value = entry.element.value;
    input.className = "follow-font-family";
    input.addEventListener("input", () => {
      entry.element.value = input.value;
      entry.element.dispatchEvent(EVENT_INPUT);
    });
    input.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter" && !info.multiline) {
        keyEvent.preventDefault();
        close();
      }
    });
    label.append(caption, input);
    return label;
  });
  const actions = document.createElement("div");
  actions.className = "card-popover-actions";
  actions.append(
    makeButton("Show in form", () => {
      close();
      reveal(getDataEntry(keys[0]).element, true);
    }),
    makeButton("Done", close)
  );
  show([heading, ...controls, actions], event);
  const first = popover.querySelector("input, textarea");
  first.focus();
  first.select();
}

/** Opens actions for the given image slot at the given click. */
function openImage(slot, event) {
  const info = IMAGES[slot];
  const heading = document.createElement("strong");
  heading.textContent = info.label;
  const actions = document.createElement("div");
  actions.className = "card-popover-actions";
  actions.append(
    makeButton("Choose image…", () => {
      close();
      document.getElementById(info.input).click();
    }),
    makeButton("Search art", () => {
      close();
      const search = document.getElementById("art-search");
      search.open = true;
      reveal(document.getElementById("search-album"), true);
    }),
    makeButton("Adjust…", () => {
      close();
      reveal(document.getElementById(info.details), false);
    }),
    makeButton("Remove", () => {
      close();
      if (slot === "cover") {
        const visible = getDataEntry("coverVisible");
        visible.value = false;
        visible.element.dispatchEvent(EVENT_CHANGE);
      } else {
        document
          .getElementById(info.input.replace(/^input-/, "button-").replace(/-image$/, "-remove"))
          .click();
      }
    })
  );
  const hint = document.createElement("small");
  hint.textContent =
    slot === "cover"
      ? "Tip: drag the cover to move it, and scroll to zoom."
      : "Tip: you can also drop an image straight onto this part of the card.";
  show([heading, actions, hint], event);
  actions.querySelector("button").focus();
}

/** Shows the popover with the given content near the given click. */
function show(children, event) {
  popover.replaceChildren(...children);
  popover.hidden = false;
  const margin = 8;
  const rect = popover.getBoundingClientRect();
  const left = Math.min(
    Math.max(margin, event.clientX + margin),
    window.innerWidth - rect.width - margin
  );
  const top = Math.min(
    Math.max(margin, event.clientY + margin),
    window.innerHeight - rect.height - margin
  );
  popover.style.left = Math.max(margin, left) + "px";
  popover.style.top = Math.max(margin, top) + "px";
}

/** Closes the popover. */
function close() {
  popover.hidden = true;
  popover.replaceChildren();
}

/** Returns a button with the given label that runs the given action. */
function makeButton(label, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

/**
 * Opens every collapsed section around the given element, scrolls to it and
 * optionally focuses it.
 */
function reveal(element, focus) {
  for (let node = element; node; node = node.parentElement) {
    if (node.tagName === "DETAILS") {
      node.open = true;
    }
  }
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  if (focus) {
    element.focus({ preventScroll: true });
  }
}
