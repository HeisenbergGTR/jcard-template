/**
 * J-Card Template: Root Elements
 *
 * For internal use only.
 */

import { qs } from "./common/functions.mjs";

/** Application root element. */
export const application = qs(document, "article");
/** Output root element. */
export const output = qs(application, "#output");
/** Template root element: the outside of the card. */
export const template = qs(application, "#jcard > .template-outside");
/** Inside (reverse side) template root element. */
export const insideTemplate = qs(application, "#jcard > .template-inside");
