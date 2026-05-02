import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "src/components/ui/**", "**/*.config.{js,ts}"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",

      // Strong-typing policy (v0.115):
      //   - `any` is the actual unsafe escape hatch — banned hard everywhere.
      //   - `unknown` is type-safe (forces narrowing) but we nudge authors
      //     toward more precise types via a warning. Use it deliberately
      //     for genuinely-unknown payloads (parsed JSON, errors) and
      //     narrow at the boundary.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true },
      ],
    },
  },
  // Typed-linting layer: enforces `unknown`-narrowing across src/**.
  // Requires parserOptions.project so the rules can see real types.
  // Policy: spec/architecture/typescript-unknown-policy.md.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**", "src/test/**", "**/*.test.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Force narrowing before reading/calling/assigning/returning `unknown`.
      // `catch (e)` is exempt by design — use `errorMessage(e)` from
      // `src/lib/errors.ts` instead of disabling these rules.
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
    },
  },
  // Tests: relax — fixtures legitimately need `any` for negative-path cases.
  {
    files: ["src/test/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
