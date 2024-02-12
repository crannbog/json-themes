import test from "ava";
import { ComponentVariant, ThemingConfigFile } from "../types.ts";
import { resolveComponent } from "../themeManager.ts";
import { extractCss } from "goober";

const ExampleConfig: ThemingConfigFile = {
    name:    "Example",
    meta:    [],
    version: "1.0.0",
    globals: {
        colors: {
            bg:  "black",
            fg:  "white",
            mix: "#cc6655"
        },
        mapping: {
            mapped: "$$colors.mix|aa"
        },
        gradient: {
            definition:    "linear-gradient(#e66465, #9198e5)",
            fallbackColor: "#e66465"
        }
    },
    sets: {
        colorSets: {
            base: {
                background: "$$colors.bg",
                foreground: "$$colors.fg"
            }
        },
        fontSets: {
            base: {
                family: "\"Open Sans\", sans-serif"
            }
        },
        borderSets: {
            base: {
                radius: "1rem",
                width:  "0.25rem"
            }
        },
        boxSets: {
            base: {
                borderSet: "$$base",
                colorSet:  "$$base",
                fontSet:   "$$base",
                padding:   "1rem"
            }
        }
    },
    components: {
        Test: {
            default: {
                theming: {
                    colorSet: {
                        __extends:      "$$base",
                        border:         "red",
                        foreground:     "$$gradient",
                        background:     "$$gradient",
                        backdropFilter: {
                            definition:         "blur(5px)",
                            fallbackBackground: "$$gradient"
                        },
                        __hover: {
                            foreground: "red"
                        },
                        __active: {
                            foreground: "blue"
                        },
                        __checked: {
                            foreground: "violet"
                        },
                        __current: {
                            foreground: "green"
                        },
                        __disabled: {
                            foreground: "grey"
                        },
                        __focus: {
                            foreground: "yellow"
                        },
                        __focusVisible: {
                            foreground: "orange"
                        },
                        __invalid: {
                            foreground: "cyan"
                        },
                        __pressed: {
                            foreground: "brown"
                        },
                        __selection: {
                            foreground: "aqua",
                            background: "white"
                        }
                    },
                    fontSet: {
                        family: "sans-serif"
                    },
                    before: {
                        content:  "hi",
                        position: "absolute"
                    },
                    after: {
                        content:  "bye",
                        position: "absolute"
                    },
                    __active: {
                        before: {
                            content:  "hi1",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye1",
                            position: "absolute"
                        }
                    },
                    __checked: {
                        before: {
                            content:  "hi2",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye2",
                            position: "absolute"
                        }
                    },
                    __current: {
                        before: {
                            content:  "hi3",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye3",
                            position: "absolute"
                        }
                    },
                    __disabled: {
                        before: {
                            content:  "hi4",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye4",
                            position: "absolute"
                        }
                    },
                    __focus: {
                        before: {
                            content:  "hi5",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye5",
                            position: "absolute"
                        }
                    },
                    __focusVisible: {
                        before: {
                            content:  "hi6",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye6",
                            position: "absolute"
                        }
                    },
                    __hover: {
                        before: {
                            content:  "hi7",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye7",
                            position: "absolute"
                        }
                    },
                    __invalid: {
                        before: {
                            content:  "hi8",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye8",
                            position: "absolute"
                        }
                    },
                    __pressed: {
                        before: {
                            content:  "hi9",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye9",
                            position: "absolute"
                        }
                    }
                }
            }
        },
        CompA: {
            default: {
                theming: "$$base"
            }
        },
        CompB: {
            default: {
                theming: {
                    borderSet: "$$base",
                    colorSet:  "$$base",
                    fontSet:   "$$base",
                    padding:   "1rem"
                }
            }
        },
        MixedVar: {
            default: {
                theming: {
                    colorSet: {
                        foreground: "$$colors.mix|aa",
                        shadow:     "0 0 1rem $$colors.mix|aa",
                        background: "$$mapping.mapped"
                    }
                }
            }
        }
    }
};

test("if example theming definition works", t => {
    const testc = resolveComponent("Test", ExampleConfig);

    const css = extractCss();

    const expectedRes = ".go2817175552{background:linear-gradient(#e66465, #9198e5);color:#e66465;border-color:red;backdrop-filter:blur(5px);font-family:sans-serif;}@supports not (backdrop-filter: blur(1px)){.go2817175552{background:linear-gradient(#e66465, #9198e5);}}.go2817175552::selection{color:aqua;background:white;}.go2817175552::before{content:\"hi\";position:absolute;}.go2817175552::after{content:\"bye\";position:absolute;}.go2817175552:checked,.go2817175552[aria-checked=true],.go2817175552[aria-checked=mixed]{color:violet;}.go2817175552:checked::before,.go2817175552[aria-checked=true]::before,.go2817175552[aria-checked=mixed]::before{content:\"hi2\";position:absolute;}.go2817175552:checked::after,.go2817175552[aria-checked=true]::after,.go2817175552[aria-checked=mixed]::after{content:\"bye2\";position:absolute;}.go2817175552:invalid,.go2817175552[aria-invalid=true],.go2817175552[aria-invalid=grammar],.go2817175552[aria-invalid=spelling]{color:cyan;}.go2817175552:invalid::before,.go2817175552[aria-invalid=true]::before,.go2817175552[aria-invalid=grammar]::before,.go2817175552[aria-invalid=spelling]::before{content:\"hi8\";position:absolute;}.go2817175552:invalid::after,.go2817175552[aria-invalid=true]::after,.go2817175552[aria-invalid=grammar]::after,.go2817175552[aria-invalid=spelling]::after{content:\"bye8\";position:absolute;}.go2817175552[aria-pressed=true],.go2817175552[aria-pressed=mixed]{color:brown;}.go2817175552[aria-pressed=true]::before,.go2817175552[aria-pressed=mixed]::before{content:\"hi9\";position:absolute;}.go2817175552[aria-pressed=true]::after,.go2817175552[aria-pressed=mixed]::after{content:\"bye9\";position:absolute;}.go2817175552[aria-current=true],.go2817175552[aria-current=page],.go2817175552[aria-current=step],.go2817175552[aria-current=location],.go2817175552[aria-current=date],.go2817175552[aria-current=time]{color:green;}.go2817175552[aria-current=true]::before,.go2817175552[aria-current=page]::before,.go2817175552[aria-current=step]::before,.go2817175552[aria-current=location]::before,.go2817175552[aria-current=date]::before,.go2817175552[aria-current=time]::before{content:\"hi3\";position:absolute;}.go2817175552[aria-current=true]::after,.go2817175552[aria-current=page]::after,.go2817175552[aria-current=step]::after,.go2817175552[aria-current=location]::after,.go2817175552[aria-current=date]::after,.go2817175552[aria-current=time]::after{content:\"bye3\";position:absolute;}.go2817175552:focus-visible{color:orange;}.go2817175552:focus-visible::before{content:\"hi6\";position:absolute;}.go2817175552:focus-visible::after{content:\"bye6\";position:absolute;}.go2817175552:focus,.go2817175552:focus-within{color:yellow;}.go2817175552:focus::before,.go2817175552:focus-within::before{content:\"hi5\";position:absolute;}.go2817175552:focus::after,.go2817175552:focus-within::after{content:\"bye5\";position:absolute;}.go2817175552:hover{color:red;}.go2817175552:hover::before{content:\"hi7\";position:absolute;}.go2817175552:hover::after{content:\"bye7\";position:absolute;}.go2817175552:active{color:blue;}.go2817175552:active::before{content:\"hi1\";position:absolute;}.go2817175552:active::after{content:\"bye1\";position:absolute;}.go2817175552:disabled,.go2817175552[aria-disabled=true]{color:grey;pointer-events:none;}.go2817175552:disabled::before,.go2817175552[aria-disabled=true]::before{content:\"hi4\";position:absolute;}.go2817175552:disabled::after,.go2817175552[aria-disabled=true]::after{content:\"bye4\";position:absolute;}";

    // console.log(css);

    t.is(typeof css, "string");
    t.is(css, expectedRes);
    t.is(css.includes(testc.variants.find((x: ComponentVariant) => x.variant === "default")?.className as string), true);
});

test("if mixed/concated variables work", t => {
    const testc = resolveComponent("MixedVar", ExampleConfig);

    const css = extractCss();

    t.is(typeof css, "string");
    t.is(css.includes(testc.variants.find((x: ComponentVariant) => x.variant === "default")?.className as string), true);
    t.is(css.includes("color:#cc6655aa"), true);
    t.is(css.includes("background:#cc6655aa"), true);
    t.is(css.includes("0 0 1rem #cc6655aa"), true);
});

test("if equal styles from different spec get merged", t => {
    const compa = resolveComponent("CompA", ExampleConfig);
    const compb = resolveComponent("CompB", ExampleConfig);

    const caName = compa.variants.find((x: ComponentVariant) => x.variant === "default")?.className;
    const cbName = compb.variants.find((x: ComponentVariant) => x.variant === "default")?.className;

    const css = extractCss();

    t.is(caName, cbName);
    t.is(typeof caName === "string" && css.includes(caName), true);
});
