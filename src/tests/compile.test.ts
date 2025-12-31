import assert from "assert/strict";
import test from "node:test";
import type { JSONThemes } from "../types.ts";
import { compile } from "../transformer.ts";

const minimalConfig: JSONThemes.ConfigShape = {
  name:    "minimal",
  meta:    {},
  globals: {},
  sets:    {
    borderSets: {},
    fontSets:   {},
    colorSets:  {},
    boxSets:    {}
  },
  components: {
    Test: {
      default: {
        theming: {
          colorSet: {
            foreground: "red",
            background: "blue"
          }
        }
      }
    }
  }
};

const minimalResult = `{
  "minimal": {
    "components": {
      "Test": {
        "default": {
          "className": "go3092056493",
          "defaultProps": {},
          "parts": {}
        }
      }
    },
    "css": ".go3092056493{background:blue;color:red;}"
  }
}`;

const secondConfig: JSONThemes.ConfigShape = {
  name:    "second",
  basedOn: "minimal",
  meta:    {},
  globals: {},
  sets:    {
    borderSets: {},
    fontSets:   {},
    colorSets:  {},
    boxSets:    {}
  },
  components: {
    Test: {
      default: {
        theming: {
          colorSet: {
            background: "green"
          }
        }
      }
    }
  }
};

const secondTestResult = `{
  "minimal": {
    "components": {
      "Test": {
        "default": {
          "className": "go3092056493",
          "defaultProps": {},
          "parts": {}
        }
      }
    },
    "css": ".go3092056493{background:blue;color:red;}"
  },
  "second": {
    "components": {
      "Test": {
        "default": {
          "className": "go3092056493",
          "defaultProps": {},
          "parts": {}
        }
      }
    },
    "css": ".go4048503642{background:green;color:red;}"
  }
}`;

test("Test if compile function works", () => {
  const x = compile([ minimalConfig ]);

  assert.strictEqual(minimalResult, JSON.stringify(x, null, 2));
});

test("Test if compile works with dependent config", () => {
  const x = compile([ minimalConfig, secondConfig ]);

  //   console.log(JSON.stringify(x, null, 2));
  assert.strictEqual(JSON.stringify(x, null, 2), secondTestResult);
});
