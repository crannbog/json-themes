import test from "ava";
import { resolveComponent } from "../themeManager.ts";
import { extractCss } from "goober";
const ExampleConfig = {
    name: "Example",
    meta: [],
    version: "1.0.0",
    globals: {
        colors: {
            bg: "black",
            fg: "white",
            mix: "#cc6655"
        },
        mapping: {
            mapped: "$$colors.mix|aa"
        },
        gradient: {
            definition: "linear-gradient(#e66465, #9198e5)",
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
                width: "0.25rem"
            }
        },
        boxSets: {
            base: {
                borderSet: "$$base",
                colorSet: "$$base",
                fontSet: "$$base",
                padding: "1rem"
            }
        }
    },
    components: {
        Test: {
            default: {
                theming: {
                    colorSet: {
                        __extends: "$$base",
                        border: "red",
                        foreground: "$$gradient",
                        background: "$$gradient",
                        backdropFilter: {
                            definition: "blur(5px)",
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
                        content: "hi",
                        position: "absolute"
                    },
                    after: {
                        content: "bye",
                        position: "absolute"
                    },
                    __active: {
                        before: {
                            content: "hi1",
                            position: "absolute"
                        },
                        after: {
                            content: "bye1",
                            position: "absolute"
                        }
                    },
                    __checked: {
                        before: {
                            content: "hi2",
                            position: "absolute"
                        },
                        after: {
                            content: "bye2",
                            position: "absolute"
                        }
                    },
                    __current: {
                        before: {
                            content: "hi3",
                            position: "absolute"
                        },
                        after: {
                            content: "bye3",
                            position: "absolute"
                        }
                    },
                    __disabled: {
                        before: {
                            content: "hi4",
                            position: "absolute"
                        },
                        after: {
                            content: "bye4",
                            position: "absolute"
                        }
                    },
                    __focus: {
                        before: {
                            content: "hi5",
                            position: "absolute"
                        },
                        after: {
                            content: "bye5",
                            position: "absolute"
                        }
                    },
                    __focusVisible: {
                        before: {
                            content: "hi6",
                            position: "absolute"
                        },
                        after: {
                            content: "bye6",
                            position: "absolute"
                        }
                    },
                    __hover: {
                        before: {
                            content: "hi7",
                            position: "absolute"
                        },
                        after: {
                            content: "bye7",
                            position: "absolute"
                        }
                    },
                    __invalid: {
                        before: {
                            content: "hi8",
                            position: "absolute"
                        },
                        after: {
                            content: "bye8",
                            position: "absolute"
                        }
                    },
                    __pressed: {
                        before: {
                            content: "hi9",
                            position: "absolute"
                        },
                        after: {
                            content: "bye9",
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
                    colorSet: "$$base",
                    fontSet: "$$base",
                    padding: "1rem"
                }
            }
        },
        MixedVar: {
            default: {
                theming: {
                    colorSet: {
                        foreground: "$$colors.mix|aa",
                        shadow: "0 0 1rem $$colors.mix|aa",
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
    t.is(css.includes(testc.variants.find((x) => x.variant === "default")?.className), true);
});
test("if mixed/concated variables work", t => {
    const testc = resolveComponent("MixedVar", ExampleConfig);
    const css = extractCss();
    t.is(typeof css, "string");
    t.is(css.includes(testc.variants.find((x) => x.variant === "default")?.className), true);
    t.is(css.includes("color:#cc6655aa"), true);
    t.is(css.includes("background:#cc6655aa"), true);
    t.is(css.includes("0 0 1rem #cc6655aa"), true);
});
test("if equal styles from different spec get merged", t => {
    const compa = resolveComponent("CompA", ExampleConfig);
    const compb = resolveComponent("CompB", ExampleConfig);
    const caName = compa.variants.find((x) => x.variant === "default")?.className;
    const cbName = compb.variants.find((x) => x.variant === "default")?.className;
    const css = extractCss();
    t.is(caName, cbName);
    t.is(typeof caName === "string" && css.includes(caName), true);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWluZ0NvbmZpZ0ZlYXR1cmVzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiL2hvbWUvY214L2Rldi9jcmFubmJvZy9qc29uLXRoZW1lcy8iLCJzb3VyY2VzIjpbInNyYy9saWIvdGVzdHMvdGhlbWluZ0NvbmZpZ0ZlYXR1cmVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sS0FBSyxDQUFDO0FBRXZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3RELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFFcEMsTUFBTSxhQUFhLEdBQXNCO0lBQ3JDLElBQUksRUFBSyxTQUFTO0lBQ2xCLElBQUksRUFBSyxFQUFFO0lBQ1gsT0FBTyxFQUFFLE9BQU87SUFDaEIsT0FBTyxFQUFFO1FBQ0wsTUFBTSxFQUFFO1lBQ0osRUFBRSxFQUFHLE9BQU87WUFDWixFQUFFLEVBQUcsT0FBTztZQUNaLEdBQUcsRUFBRSxTQUFTO1NBQ2pCO1FBQ0QsT0FBTyxFQUFFO1lBQ0wsTUFBTSxFQUFFLGlCQUFpQjtTQUM1QjtRQUNELFFBQVEsRUFBRTtZQUNOLFVBQVUsRUFBSyxtQ0FBbUM7WUFDbEQsYUFBYSxFQUFFLFNBQVM7U0FDM0I7S0FDSjtJQUNELElBQUksRUFBRTtRQUNGLFNBQVMsRUFBRTtZQUNQLElBQUksRUFBRTtnQkFDRixVQUFVLEVBQUUsYUFBYTtnQkFDekIsVUFBVSxFQUFFLGFBQWE7YUFDNUI7U0FDSjtRQUNELFFBQVEsRUFBRTtZQUNOLElBQUksRUFBRTtnQkFDRixNQUFNLEVBQUUsMkJBQTJCO2FBQ3RDO1NBQ0o7UUFDRCxVQUFVLEVBQUU7WUFDUixJQUFJLEVBQUU7Z0JBQ0YsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsS0FBSyxFQUFHLFNBQVM7YUFDcEI7U0FDSjtRQUNELE9BQU8sRUFBRTtZQUNMLElBQUksRUFBRTtnQkFDRixTQUFTLEVBQUUsUUFBUTtnQkFDbkIsUUFB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