import { defineConfig } from "eslint/config";
import styleConfig from "../../configs/eslint/stylistic.eslint.mjs";
import baseConfig from "../../configs/eslint/typescript.eslint.mjs";

export default defineConfig([ ...baseConfig(), ...styleConfig({}) ]);
