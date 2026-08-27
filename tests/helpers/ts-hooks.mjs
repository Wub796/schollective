/**
 * Module resolution hooks that let the test suite import application source
 * directly.
 *
 * Node strips TypeScript types natively, but it does not replicate a bundler's
 * resolution: it needs a real file extension, and it knows nothing about the
 * `@/*` path alias from tsconfig.json. The source uses both (`from "./academic-data"`,
 * `from "@/lib/security"`), so without these hooks a test can only import modules
 * that happen to have no imports of their own.
 *
 * That limitation is what pushed the old tests toward re-implementing logic
 * inside the test file, which proves nothing about the code that ships. With this
 * in place a test imports the real module.
 *
 * Registered via tests/helpers/register.mjs, loaded by `npm test`.
 */

import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = resolvePath(ROOT, "src");

/** Extensions to try, in the order a bundler would. */
const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs", ".jsx"];

function firstExisting(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (existsSync(candidate)) return candidate;
  }
  for (const ext of EXTENSIONS) {
    const candidate = resolvePath(base, `index${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // The `@/*` alias from tsconfig.json maps to `src/*`.
  if (specifier.startsWith("@/")) {
    const found = firstExisting(resolvePath(SRC, specifier.slice(2)));
    if (found) {
      return { url: pathToFileURL(found).href, shortCircuit: true };
    }
  }

  // Extensionless relative imports inside the source tree.
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const found = firstExisting(resolvePath(parentDir, specifier));
    if (found) {
      return { url: pathToFileURL(found).href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
