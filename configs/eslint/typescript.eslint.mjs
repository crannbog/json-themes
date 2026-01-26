import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import path from "node:path";

export default (config = {}) => {
  return [
    tseslint.configs.recommended,
    {
      files:           [ "**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}" ],
      plugins:         { js },
      extends:         [ "js/recommended" ],
      languageOptions: {
        globals: {
          ...globals.browser
        },
        parserOptions: {
          tsconfigRootDir: path.resolve("./")
        }
      },
      rules: {
        "no-unused-vars":                    "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_" }
        ],
        "prefer-const":                 [ 2 ],
        "no-dupe-keys":                 [ 2 ],
        "no-empty-pattern":             [ 2 ],
        "no-ex-assign":                 [ 2 ],
        "no-func-assign":               [ 2 ],
        "no-import-assign":             [ 2 ],
        "no-irregular-whitespace":      [ 2 ],
        "no-loss-of-precision":         [ 2 ],
        "no-new-native-nonconstructor": [ 2 ],
        "no-self-assign":               [ 2 ],
        "no-setter-return":             [ 2 ],
        "no-template-curly-in-string":  [ 2 ],
        "complexity":                   [ 2, 5 ],
        "default-case-last":            [ 2 ],
        "no-undef":                     [ 2 ],
        "id-length":                    [
          2, {
            min:        2,
            max:        36,
            exceptions: [
              "i",
              "j",
              "x",
              "e",
              "y",
              "z",
              "a",
              "b",
              "T",
              "U",
              "V",
              "W",
              "X",
              "Y",
              "Z",
              "_",
              "Q",
              "autoAcceptConnections",
              "getDerivedStateFromProps",
            ],
          },
        ]
      },
      ...config,
    }
  ];
};
