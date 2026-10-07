/**
 * J-Card Template: Safe Area Guide
 *
 * Shows, on screen only, where text is safe from trimming and folding: inset
 * from the card's outer edges and from each fold. Text crossing it is
 * outlined, and counted beside the toggle.
 */

import { MESSAGES } from "./constants.mjs";
import { getSideTemplate, onSideChange } from "./sides.mjs";

/** Browser storage key for the toggle. */
const STORAGE_KEY = "jcard.safeGuide";
/** Card text elements to check. */
const TEXT_SELECTOR = [
  ".template-contents",
  ".template-footer",
  ".template-front-title-lower",
  ".template-front-title-upper",
  ".template-inside-back-text",
  ".template-inside-front-text",
  ".template-inside-spine-text",
  ".template-note-lower",
  ".template-note-upper",
  ".template-side-a-contents",
  ".template-side-a-label",
  ".template-side-b-contents",
  ".template-side-b-label",
  ".template-spine-title-lower",
  ".template-spine-title-upper",
].join(", ");
/** Allowed overlap in pixels, for rounding. */
const TOLERANCE = 0.5;

/** Pending check timeout. */
let timeout = null;

/** Wires the toggle and keeps the check up to date. */
export function setupSafeArea() {
  const toggle = document.getElementById("input-safe-guide");
  try {
    toggle.checked = localStorage.getItem(STORAGE_KEY) !== "off";
  } catch (error) {
    // Storage may be unavailable; keep the default.
  }
  setGuideVisible(toggle.checked);
  toggle.addEventListener("change", () => {
    setGuideVisible(toggle.checked);
    try {
      localStorage.setItem(STORAGE_KEY, toggle.checked ? "on" : "off");
    } catch (error) {
      // The choice still applies for this visit.
    }
  });
  // Capture sees the app's own non-bubbling input events too.
  ["input", "change"].forEach((type) =>
    document.addEventListener(type, scheduleCheck, true)
  );
  window.addEventListener("resize", scheduleCheck);
  document.fonts.addEventListener("loadingdone", scheduleCheck);
  new MutationObserver(scheduleCheck).observe(
    document.getElementById("jcard"),
    { characterData: true, childList: true, subtree: true }
  );
  onSideChange(scheduleCheck);
  scheduleCheck();
}

/** Shows or hides the guide. */
export function setGuideVisible(visible) {
  document.getElementById("jcard").classList.toggle("show-safe", visible);
  scheduleCheck();
}

/** Returns whether the guide is shown. */
export function isGuideVisible() {
  return document.getElementById("jcard").classList.contains("show-safe");
}

/** Checks the shown side soon, after edits settle and styles apply. */
export function scheduleCheck() {
  clearTimeout(timeout);
  timeout = setTimeout(checkSafeArea, 200);
}

/** Outlines and counts text on the shown side that crosses the safe area. */
export function checkSafeArea() {
  const warning = document.getElementById("safe-warning");
  document
    .querySelectorAll("#jcard .outside-safe")
    .forEach((element) => element.classList.remove("outside-safe"));
  if (!isGuideVisible()) {
    warning.textContent = "";
    return 0;
  }
  const root = getSideTemplate();
  const safe = {};
  ["back", "spine", "front"].forEach((panel) => {
    safe[panel] = root
      .querySelector(".template-safe-" + panel)
      .getBoundingClientRect();
  });
  let count = 0;
  root.querySelectorAll(TEXT_SELECTOR).forEach((element) => {
    if (!element.textContent.trim()) {
      return;
    }
    const panel = element.closest(".template-back")
      ? "back"
      : element.closest(".template-spine")
      ? "spine"
      : "front";
    const area = safe[panel];
    const range = document.createRange();
    range.selectNodeContents(element);
    const crosses = Array.from(range.getClientRects()).some(
      (rect) =>
        rect.width > 0 &&
        (rect.left < area.left - TOLERANCE ||
          rect.right > area.right + TOLERANCE ||
          rect.top < area.top - TOLERANCE ||
          rect.bottom > area.bottom + TOLERANCE)
    );
    if (crosses) {
      element.classList.add("outside-safe");
      count++;
    }
  });
  warning.textContent = count
    ? "⚠ " +
      (count === 1 ? MESSAGES.safeWarningOne : count + MESSAGES.safeWarningMany) +
      MESSAGES.safeWarning
    : "";
  return count;
}
