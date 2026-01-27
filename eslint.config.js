import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  unicorn.configs.recommended,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.js"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/no-empty-function": "off",
      "unicorn/no-null": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/prefer-ternary": "off",
      "unicorn/prefer-event-target": "off",
      "unicorn/prefer-global-this": "off",
      "unicorn/import-style": "off",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/catch-error-name": "off",
    },
  }
);
