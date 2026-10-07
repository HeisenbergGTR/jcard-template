/**
 * J-Card Template: Models
 *
 * Form and output model classes.
 */

import { insideTemplate, template } from "./roots.mjs";
import { NUL_ELEMENT, NUL_OBJECT } from "./common/constants.mjs";
import { defaultOrAsIs, qs } from "./common/functions.mjs";
import { ElementModel } from "./common/models.mjs";

/**
 * Represents a J-card template output, on the outside of the card or, with
 * the `inside` option, on its inside.
 */
export class JCardOutput extends ElementModel {
  constructor(options = NUL_OBJECT, prefix = "template-") {
    const root = options.inside ? insideTemplate : template;
    super(
      options.class
        ? defaultOrAsIs(NUL_ELEMENT, qs(root, "." + prefix + options.class))
        : root,
      options
    );
  }
}
