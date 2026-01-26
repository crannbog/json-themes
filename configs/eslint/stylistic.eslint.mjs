import stylistic from "@stylistic/eslint-plugin";

export default (config = {}) => {
  return [
    stylistic.configs.recommended,
    {
      files:   [ "**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}" ],
      plugins: { "@stylistic": stylistic },
      rules:   {
        "@stylistic/array-bracket-spacing": [ 2, "always", { objectsInArrays: false }],
        "@stylistic/array-element-newline": [
          2, {
            ArrayPattern: {
              minItems:  3,
              multiline: true,
            },
            ArrayExpression: "consistent",
          },
        ],
        "@stylistic/array-bracket-newline": [ 2, { multiline: true }],
        "@stylistic/arrow-parens":          [ 2, "always" ],
        "@stylistic/arrow-spacing":         [
          2, {
            before: true,
            after:  true,
          },
        ],
        "@stylistic/block-spacing": [ 2 ],
        "@stylistic/brace-style":   [ 2, "1tbs", { allowSingleLine: true }],
        "@stylistic/comma-dangle":  [ 2, "only-multiline" ],
        "@stylistic/comma-spacing": [
          2, {
            before: false,
            after:  true,
          },
        ],
        "@stylistic/comma-style":               [ 2 ],
        "@stylistic/computed-property-spacing": [ 2, "never" ],
        "@stylistic/curly-newline":             [
          2, {
            multiline:   true,
            consistent:  true,
            minElements: 3,
          },
        ],
        "@stylistic/dot-location":                   [ 2, "property" ],
        "@stylistic/eol-last":                       [ "error", "always" ],
        "@stylistic/function-call-argument-newline": [ "error", "consistent" ],
        "@stylistic/function-call-spacing":          [ "error", "never" ],
        "@stylistic/function-paren-newline":         [ 2, "multiline" ],
        "@stylistic/implicit-arrow-linebreak":       [ 2, "beside" ],
        "@stylistic/jsx-child-element-spacing":      [ 2 ],
        "@stylistic/jsx-closing-bracket-location":   [ 2, "after-props" ],
        "@stylistic/jsx-closing-tag-location":       [ "error", "tag-aligned" ],
        "@stylistic/jsx-curly-brace-presence":       [ 2, "never" ],
        "@stylistic/jsx-curly-newline":              [ 2, "consistent" ],
        "@stylistic/jsx-curly-spacing":              [
          2, {
            when:     "never",
            children: true,
          },
        ],
        "@stylistic/jsx-equals-spacing":          [ 2, "never" ],
        "@stylistic/jsx-first-prop-new-line":     [ 2, "multiline-multiprop" ],
        "@stylistic/jsx-function-call-newline":   [ 2, "always" ],
        "@stylistic/indent":                      [ 2, 2 ],
        "@stylistic/jsx-indent-props":            [ 2, 2 ],
        "@stylistic/jsx-max-props-per-line":      [ 2, { maximum: 3 }],
        "@stylistic/jsx-one-expression-per-line": [ 2 ],
        "@stylistic/jsx-pascal-case":             [ 2 ],
        "@stylistic/jsx-quotes":                  [ 2, "prefer-double" ],
        "@stylistic/jsx-self-closing-comp":       [ 2 ],
        "@stylistic/jsx-sort-props":              [ 2 ],
        "@stylistic/jsx-tag-spacing":             [ 2, { beforeSelfClosing: "always" }],
        "@stylistic/jsx-wrap-multilines":         [
          2, {
            declaration:   "parens-new-line",
            assignment:    "parens-new-line",
            return:        "parens-new-line",
            arrow:         "parens-new-line",
            condition:     "ignore",
            logical:       "ignore",
            prop:          "ignore",
            propertyValue: "ignore",
          },
        ],
        "@stylistic/key-spacing": [
          2, {
            mode:  "strict",
            align: "value",
          },
        ],
        "@stylistic/keyword-spacing":          [ 2, { before: true }],
        "@stylistic/linebreak-style":          [ 2, "unix" ],
        "@stylistic/max-len":                  [ 2, { code: 127 }],
        "@stylistic/max-statements-per-line":  [ 2, { max: 2 }],
        "@stylistic/member-delimiter-style":   [ 2 ],
        "@stylistic/multiline-ternary":        [ 2, "always-multiline" ],
        "@stylistic/new-parens":               [ 2, "always" ],
        "@stylistic/newline-per-chained-call": [ 2, { ignoreChainWithDepth: 2 }],
        "@stylistic/no-confusing-arrow":       [ 2 ],
        "@stylistic/no-extra-parens":          [ 2 ],
        "@stylistic/no-extra-semi":            [ 2 ],
        "@stylistic/no-mixed-operators":       [ 2 ],
        "@stylistic/no-multi-spaces":          [
          2, {
            exceptions: {
              Property:         true,
              TSTypeAnnotation: true
            }
          }
        ],
        "@stylistic/no-multiple-empty-lines":       [ 2, { max: 2 }],
        "@stylistic/no-tabs":                       [ 2 ],
        "@stylistic/no-trailing-spaces":            [ 2 ],
        "@stylistic/no-whitespace-before-property": [ 2 ],
        "@stylistic/object-curly-newline":          [
          2, {
            multiline:     true,
            minProperties: 3,
            consistent:    true,
          },
        ],
        "@stylistic/object-curly-spacing": [
          2, "always", {
            objectsInObjects: false,
            arraysInObjects:  false,
          },
        ],
        "@stylistic/object-property-newline":         [ 2, { allowAllPropertiesOnSameLine: false }],
        "@stylistic/operator-linebreak":              [ 2, "before" ],
        "@stylistic/padded-blocks":                   [ 2, "never" ],
        "@stylistic/padding-line-between-statements": [
          2,
          {
            blankLine: "always",
            prev:      "*",
            next:      "block-like",
          },
          {
            blankLine: "always",
            prev:      "*",
            next:      "return",
          }
        ],
        "@stylistic/quote-props":              [ 2, "consistent-as-needed" ],
        "@stylistic/quotes":                   [ 2, "double" ],
        "@stylistic/rest-spread-spacing":      [ 2, "never" ],
        "@stylistic/semi":                     [ 2, "always" ],
        "@stylistic/semi-spacing":             [ 2 ],
        "@stylistic/semi-style":               [ 2, "last" ],
        "@stylistic/space-before-blocks":      [ 2 ],
        "@stylistic/space-in-parens":          [ 2, "never" ],
        "@stylistic/space-infix-ops":          [ 2 ],
        "@stylistic/space-unary-ops":          [ 2 ],
        "@stylistic/switch-colon-spacing":     [ 2 ],
        "@stylistic/template-curly-spacing":   [ 2 ],
        "@stylistic/template-tag-spacing":     [ 2 ],
        "@stylistic/type-annotation-spacing":  [ 2 ],
        "@stylistic/type-generic-spacing":     [ 2 ],
        "@stylistic/type-named-tuple-spacing": [ 2 ],
        "@stylistic/wrap-iife":                [ 2 ],
        "@stylistic/wrap-regex":               [ 2 ],
        ...config,
      },
    },
  ];
};
