/**
 * J-Card Template: Card Sides
 *
 * Switches the view between the outside of the card and its inside (reverse
 * side). The inside is laid out mirrored, as seen when the card is flipped
 * over, so its panels line up with the outside's when printed double-sided.
 */

import { insideTemplate, template } from "./roots.mjs";

/** Side names. */
export const SIDES = Object.freeze(["outside", "inside"]);

/** The side being shown. */
let side = "outside";
/** Functions to call after the side changes. */
const listeners = [];

/** Returns the side being shown. */
export function getSide() {
  return side;
}

/** Returns the template element of the given side, or of the side shown. */
export function getSideTemplate(which = side) {
  return which === "inside" ? insideTemplate : template;
}

/** Calls the given function with the side after every change. */
export function onSideChange(listener) {
  listeners.push(listener);
}

/** Shows the given side. */
export function setSide(next) {
  if (!SIDES.includes(next) || next === side) {
    return;
  }
  side = next;
  template.classList.toggle("side-hidden", side !== "outside");
  insideTemplate.classList.toggle("side-hidden", side !== "inside");
  document
    .querySelectorAll(".side-toggle [data-side]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.side === side))
    );
  listeners.forEach((listener) => listener(side));
}

/**
 * Wires the side buttons, and makes opening a form section for one side show
 * that side.
 */
export function setupSides() {
  document
    .querySelectorAll(".side-toggle [data-side]")
    .forEach((button) =>
      button.addEventListener("click", () => setSide(button.dataset.side))
    );
  document.querySelectorAll("details[data-side]").forEach((details) =>
    details.addEventListener("toggle", () => {
      if (details.open) {
        setSide(details.dataset.side);
      }
    })
  );
}
