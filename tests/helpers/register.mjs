/**
 * Installs the TypeScript/alias resolution hooks for the test suite.
 *
 * Loaded via `node --import ./tests/helpers/register.mjs` (see package.json
 * "test"). Kept separate from ts-hooks.mjs because `module.register` runs the
 * hooks on their own thread and needs a module specifier to load, not a
 * function.
 */

import { register } from "node:module";

register("./ts-hooks.mjs", import.meta.url);
