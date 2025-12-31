/* eslint-disable @stylistic/max-len */
import assert from "assert/strict";
import test from "node:test";
import type { JSONThemes } from "../types.ts";
import { compile } from "../transformer.ts";

const config: JSONThemes.ConfigShape = {
  name:    "1",
  meta:    {},
  globals: {
    colors: {
      primary: "#f31",
      bg1:     "#edd",
      text:    "#211"
    },
    colorMappings: {
      nested: {
        main: "$$colors.primary"
      }
    }
  },
  sets: {
    colorSets: {
      main: {
        foreground: "$$colors.text",
        background: "$$colors.bg1",
        __hover:    {
          foreground: "$$colors.primary",
        }
      }
    },
    borderSets: {
      main: {
        style:  "solid",
        width:  "thin",
        radius: "1rem"
      }
    },
    fontSets: {
      main: {
        family: "monospace"
      }
    },
    boxSets: {
      supermain: {
        colorSet:  "$$main",
        fontSet:   "$$main",
        borderSet: "$$main",
        padding:   "2rem"
      }
    }
  },
  components: {
    Test: {
      default: {
        theming: {
          __extends: "$$supermain"
        },
        parts: {
          headline: {
            height: "2rem"
          },
          closeButton: {
            colorSet: {
              foreground: "$$colorMappings.nested.main"
            }
          }
        }
      },
      variants: {
        primary: {
          theming: {
            __extends: "$$supermain",
            colorSet:  {
              foreground: "blue"
            }
          },
          parts: {
            headline: {
              width: "3rem"
            }
          }
        }
      }
    },

  }
};

const result = `{
  "1": {
    "components": {
      "Test": {
        "default": {
          "className": "go2713896278",
          "defaultProps": {},
          "parts": {
            "headline": "go1622606978",
            "closeButton": "go3118285779"
          }
        },
        "primary": {
          "className": "go3893090887",
          "defaultProps": {},
          "parts": {
            "headline": "go4237834965",
            "closeButton": "go3118285779"
          }
        }
      }
    },
    "css": ".go2713896278{border-style:solid;border-width:thin;border-radius:1rem;background:#edd;color:#211;padding:2rem;font-family:monospace;}.go2713896278:hover{color:#f31;}.go1622606978{height:2rem;}.go3118285779{color:#f31;}.go3893090887{border-style:solid;border-width:thin;border-radius:1rem;background:#edd;color:blue;padding:2rem;font-family:monospace;}.go3893090887:hover{color:#f31;}.go4237834965{height:2rem;width:3rem;}"
  }
}`;

test("Test if complex compile function works", () => {
  const x = compile([ config ]);

  // console.log(JSON.stringify(x, null, 2));
  // assert.strictEqual(1, 1);
  assert.strictEqual(result, JSON.stringify(x, null, 2));
});
