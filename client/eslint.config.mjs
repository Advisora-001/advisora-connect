import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // These rules are stylistic / experimental and would otherwise block
    // `next build` (which fails on ESLint errors). They are relaxed to
    // warnings so the production build passes:
    //  - no-explicit-any: the API client returns loosely-typed server payloads.
    //  - react-hooks/set-state-in-effect & react-hooks/immutability: React 19
    //    react-hooks v5 rules that flag standard data-fetching patterns.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
