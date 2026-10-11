import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: [".next/**", "out/**", "coverage/**", "playwright-report/**", "test-results/**", "public/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // o "use" das fixtures do Playwright não é hook do React
  { files: ["tests/e2e/**"], rules: { "react-hooks/rules-of-hooks": "off" } },
];

export default eslintConfig;
