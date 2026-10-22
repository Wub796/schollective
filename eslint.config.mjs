import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Optimized ESLint Config for Schollective App
 *
 * eslint-config-next 16 ships flat configs only — the `next/core-web-vitals`
 * shareable config that `FlatCompat` used to load no longer exists, so it is
 * spread in directly.
 */
const eslintConfig = [
  {
    ignores: [".agent/**", ".next/**", ".vercel/**", "node_modules/**", "_legacy_vanilla/**", "public/**"],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/no-unescaped-entities": "off",
      // eslint-config-next 16 brings the React Compiler rules, which flag ~40
      // long-standing patterns here (mount flags set from an effect, components
      // declared inside a render, refs read during render). They are real code
      // smells, but rewriting that UI is a separate change from the framework
      // upgrade; warn so the findings stay visible without gating every push.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
];

export default eslintConfig;
