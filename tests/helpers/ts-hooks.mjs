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

import { existsSync, readFileSync, statSync } from "node:fs";
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

  // A dependency subpath with no extension, in a package that declares no
  // `exports` map.
  //
  // `next` is the case: `next/server` is what every middleware and route handler
  // imports, and webpack resolves it to the sibling `server.js`, but Node ESM
  // cannot — without an `exports` map there is nothing to tell it the extension.
  // That made the real middleware unimportable from a test.
  //
  // Guarded on the package having no `exports` field so this can never shadow a
  // package that declares one: those already resolve correctly, and reaching past
  // their map would pick the wrong file.
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    const pkgName = specifier.startsWith("@")
      ? specifier.split("/").slice(0, 2).join("/")
      : specifier.split("/")[0];
    const pkgManifest = resolvePath(ROOT, "node_modules", pkgName, "package.json");
    if (existsSync(pkgManifest) && !("exports" in JSON.parse(readFileSync(pkgManifest, "utf8")))) {
      const found = firstExisting(resolvePath(ROOT, "node_modules", specifier));
      if (found) {
        return { url: pathToFileURL(found).href, shortCircuit: true };
      }
    }
  }

  return nextResolve(specifier, context);
}
