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
    rules: {
      // Calling setState (or a function that calls setState) synchronously inside
      // useEffect is a standard React pattern for initialising state from props/deps.
      // The rule is too strict for this codebase — disable it project-wide.
      "react-hooks/set-state-in-effect": "off",
      // Honour the convention of prefixing intentionally-unused identifiers with `_`.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "varsIgnorePattern": "^_",
          "argsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
