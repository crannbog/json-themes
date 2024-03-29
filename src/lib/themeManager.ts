/* eslint-disable @typescript-eslint/no-explicit-any */

import { ComponentsConfig, IThemeManager, ThemeType, ThemingBackdropFilterDefinition,
    ThemingBeforeAfterDefinition,
    ThemingBorderDefinition,
    ThemingBorderMap,
    ThemingBorderSet,
    ThemingBoxSet,
    ThemingColorMap,
    ThemingColorSet,
    ThemingConfig,
    ThemingFontDefinition,
    ThemingFontSet,
    ThemingGradientDefinition,
    Transitionable } from "./types.ts";
import { css, setup } from "goober";
import { deepmerge, deepmergeCustom } from "deepmerge-ts";
import { prefix } from "goober/prefixer";
import { createGlobalStyles } from "goober/global";

const dollarVarRegex = /\$\$(?:[\w.]*\|?)/gm;

const selectors = {
    invalid:      "&:invalid,&[aria-invalid=true],&[aria-invalid=grammar],&[aria-invalid=spelling]",
    checked:      "&:checked,&[aria-checked=true],&[aria-checked=mixed]",
    pressed:      "&[aria-pressed=true],&[aria-pressed=mixed]",
    current:      "&[aria-current=true],&[aria-current=page],&[aria-current=step],&[aria-current=location],&[aria-current=date],&[aria-current=time]",
    focus:        "&:focus,&:focus-within",
    focusVisible: "&:focus-visible",
    hover:        "&:hover",
    active:       "&:active",
    disabled:     "&:disabled,&[aria-disabled=true]"
};

/**
 * A Function to properly sort CSS Selectors
 * @param a First Sort Parameter(key/value pair)
 * @param b Second Sort Parameter
 * @returns sorted Array
 * @example an :active selector should always be higher in specificity than an :hover
 */
// eslint-disable-next-line complexity
const sortCssNestings = (a: [string, unknown], b: [string, unknown]) => {
    const order = [
        "checked",
        "invalid",
        "pressed",
        "current",
        "focus",
        "focus-visible",
        "hover",
        "active",
        "disabled"
    ];

    const _a = order.findIndex(x => a[0].includes(x));
    const _b = order.findIndex(x => b[0].includes(x));

    return _a - _b;
};

const getVarName = (str: string) => str.slice(2);

/**
 * Get a value recursive from an JSON-like object to go to a variable from some def like &&myvars.some.asdf
 * @param root Root JSON-like Object
 * @param path Path to navigate to (string array)
 * @param {*} value optional value to search on
 * @returns resolved variable from path
 */
export const getDeepAttribute = (root: Record<string, any>, path: string[], value: any = null): any => {
    const val = value ?? root;

    if(!path || path.length === 0) {
        if(typeof val === "string" && val.includes("$$"))
            return `${val}`.replace(dollarVarRegex,
                str => getDeepAttribute(root, getVarName(str.replace("|", "")).split("."))
            );

        return val;
    }

    if(!val[path[0]]) return null;

    return getDeepAttribute(root, path.slice(1), val[path[0]]);
};

/**
 * Resolve global Variables
 * @param varStr $$var String
 * @param theme the theming config
 * @param customResolver custom resolver function in case you don't want to return a .toString()
 * @returns a resolved variable
 */
const resolveGlobalsVar = (varStr: string, theme: ThemingConfig, customResolver?: (res: unknown) => any) => {
    const deep = getDeepAttribute(theme.globals, getVarName(varStr).split("."));

    if(deep === null) {
        console.warn(`No Var found for ${varStr}. Skipped.`);
        return "";
    }

    if(customResolver)
        return customResolver(deep);

    return deep?.toString() || "";
};

/**
 * Resolve a global variable definition string of theming config
 * @param value the value that can be a value or a variable
 * @param theme theming config
 * @param customResolver optional custom resolver, for example to resolve gradient definitions which are not pure CSS
 * @returns {string} either the value or the resolved value from a variable
 */
const resolveGlobalsVarString = (value: unknown, theme: ThemingConfig, customResolver?: (res: unknown) => any) => {
    return (`${value}`.replace(dollarVarRegex, str => {
        return resolveGlobalsVar(str.replaceAll("|", ""), theme, customResolver);
    }));
};

/**
 * Function to resolve $$ globals Variables inside defaultProps definitions
 * @param props the props
 * @param theme theming config
 * @returns resolved props
 */
const resolvePropsVars = (props: any, theme: ThemingConfig) => {
    if(!props || !theme) return null;

    const keys = Object.keys(props);

    const resolvedValues: Array<any> = keys?.map(key => {
        const value = props[key];

        if(typeof value === "string")
            return resolveGlobalsVarString(value, theme);


        if(typeof value === "object")
            return resolvePropsVars(value, theme);


        return value;
    });

    return Object.fromEntries(keys.map((key, i) => ([key, resolvedValues[i]])));
};

/**
 * Function to either resolve a color or a gradient defintion
 * @returns a valid CSS color/gradient def
 */
const resolveColorsDefinition = (str: unknown, theme: ThemingConfig, allowGradient = false) => {
    return resolveGlobalsVarString(str, theme, res => {
        if(allowGradient && !(typeof res === "string"))
            return resolveGlobalsVarString((res as ThemingGradientDefinition).definition, theme);

        if(!allowGradient && !(typeof res === "string"))
            return resolveGlobalsVarString((res as ThemingGradientDefinition).fallbackColor, theme) || "";

        return `${res}`;
    });
};

/**
 * Function to either resolve a color or a gradient defintion
 * @returns a valid CSS color/gradient def
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const resolveBackdropFilterDefinition = (obj: ThemingBackdropFilterDefinition | string, theme: ThemingConfig): Object => {
    if(typeof obj === "string" && obj.startsWith("$$"))
        return resolveBackdropFilterDefinition(resolveGlobalsVar(obj, theme, (resolvedObject => resolvedObject)), theme);

    return {
        "backdropFilter":                             resolveGlobalsVarString((obj as ThemingBackdropFilterDefinition).definition, theme),
        "@supports not (backdrop-filter: blur(1px))": {
            background: resolveColorsDefinition((obj as ThemingBackdropFilterDefinition).fallbackBackground, theme, true)
        }
    };
};

/**
 * theming border set defintion to CSS
 */
// eslint-disable-next-line complexity
const borderSetToCss = (borderSet: ThemingBorderSet | string, theme: ThemingConfig): object => {
    if(Array.isArray(borderSet))
        return deepmerge(
            ...borderSet.map(_def => borderSetToCss(_def, theme)).flat(1)
        ) as object;

    const set: ThemingBorderSet = typeof borderSet === "string" ? theme.sets.borderSets[getVarName(borderSet)] : borderSet;

    if(!set) return {};

    const resolveDefinition = (tdef: ThemingBorderDefinition, context: string) => {
        return Object.assign({},
            tdef.image && { [`border${context}-image`]: resolveGlobalsVarString(tdef.image, theme) },
            tdef.style && { [`border${context}-style`]: resolveGlobalsVarString(tdef.style, theme) },
            tdef.width && { [`border${context}-width`]: resolveGlobalsVarString(tdef.width, theme) }
        );
    };

    const resolveBorderMap = (bmp: Transitionable<ThemingBorderMap>) => {
        return Object.assign({},
            resolveDefinition(bmp, ""),
            bmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(bmp.transitionSpeed, theme) },
            bmp.bottom && resolveDefinition(bmp.bottom, "-bottom"),
            bmp.left && resolveDefinition(bmp.left, "-left"),
            bmp.right && resolveDefinition(bmp.right, "-right"),
            bmp.top && resolveDefinition(bmp.top, "-top"),
            bmp.radius && { "border-radius": resolveGlobalsVarString(bmp.radius, theme) }
        );
    };

    const resolvedSet = Object.assign({},
        resolveBorderMap(set),
        set.__hover && { [selectors.hover]: resolveBorderMap(set.__hover) },
        set.__active && { [selectors.active]: resolveBorderMap(set.__active) },
        set.__focus && { [selectors.focus]: resolveBorderMap(set.__focus) },
        set.__focusVisible && { [selectors.focusVisible]: resolveBorderMap(set.__focusVisible) },
        set.__checked && { [selectors.checked]: resolveBorderMap(set.__checked) },
        set.__pressed && { [selectors.pressed]: resolveBorderMap(set.__pressed) },
        set.__current && { [selectors.current]: resolveBorderMap(set.__current) },
        set.__invalid && { [selectors.invalid]: resolveBorderMap(set.__invalid) },
        set.__disabled && {
            [selectors.disabled]: {
                ...resolveBorderMap(set.__disabled),
                "pointer-events": "none"
            }
        }
    );

    return Object.assign({},
        ...Object.entries(deepmerge(
            set.__extends ? borderSetToCss(set.__extends, theme) : 0, resolvedSet))
			.sort(sortCssNestings)
			.map(([key, value]) => ({ [key]: value })));
};

/**
 * theming color set defintion to CSS
 */
// eslint-disable-next-line complexity
const colorSetToCss = (colorSet: ThemingColorSet | ThemingColorSet[] | string, theme: ThemingConfig): object => {
    if(Array.isArray(colorSet))
        return deepmerge(
            ...colorSet.map(_def => colorSetToCss(_def, theme)).flat(1)
        ) as object;

    const set: ThemingColorSet = typeof colorSet === "string" ? theme.sets.colorSets[getVarName(colorSet)] : colorSet;

    if(!set) return {};

    const resolveColorMap = (cmp: Transitionable<ThemingColorMap>) => {
        return Object.assign({},
            // TODO cmp.__extends &&
            cmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(cmp.transitionSpeed, theme) },
            cmp.background && { background: resolveColorsDefinition(cmp.background, theme, true) },
            cmp.border && { borderColor: resolveColorsDefinition(cmp.border, theme) },
            cmp.filter && { filter: resolveGlobalsVarString(cmp.filter, theme) },
            cmp.backdropFilter && resolveBackdropFilterDefinition(cmp.backdropFilter, theme),
            cmp.foreground && { color: resolveColorsDefinition(cmp.foreground, theme) },
            cmp.icon && { "& svg": { color: resolveGlobalsVarString(cmp.icon, theme) } },
            cmp.shadow && { boxShadow: resolveGlobalsVarString(cmp.shadow, theme) }
        );
    };

    const resolvedSet = Object.assign({},
        resolveColorMap(set),
        set.__hover && { [selectors.hover]: resolveColorMap(set.__hover) },
        set.__active && { [selectors.active]: resolveColorMap(set.__active) },
        set.__focus && { [selectors.focus]: resolveColorMap(set.__focus) },
        set.__focusVisible && { [selectors.focusVisible]: resolveColorMap(set.__focusVisible) },
        set.__checked && { [selectors.checked]: resolveColorMap(set.__checked) },
        set.__pressed && { [selectors.pressed]: resolveColorMap(set.__pressed) },
        set.__current && { [selectors.current]: resolveColorMap(set.__current) },
        set.__invalid && { [selectors.invalid]: resolveColorMap(set.__invalid) },
        set.__disabled && {
            [selectors.disabled]: {
                ...resolveColorMap(set.__disabled),
                "pointer-events": "none"
            }
        },
        set.__selection && {
            "&::selection": {
                color:      resolveGlobalsVarString(set.__selection.foreground, theme),
                background: resolveColorsDefinition(set.__selection.background, theme)
            }
        }
    );

    return Object.assign({},
        ...Object.entries(deepmerge(
            set.__extends ? colorSetToCss(set.__extends, theme) : {}, resolvedSet))
			.sort(sortCssNestings)
			.map(([key, value]) => ({ [key]: value })));
};

/**
 * theming font set defintion to CSS
 */
// eslint-disable-next-line complexity
const fontSetToCss = (fontSet: ThemingFontSet | ThemingFontSet[] | string, theme: ThemingConfig): object => {
    if(Array.isArray(fontSet))
        return deepmerge(
            ...fontSet.map(_def => fontSetToCss(_def, theme)).flat(1)
        ) as object;

    const set: ThemingFontSet = typeof fontSet === "string" ? theme.sets.fontSets[getVarName(fontSet)] : fontSet;

    if(!set) return {};

    const resolveFontMap = (fmp: Transitionable<ThemingFontDefinition>) => {
        return Object.assign({},
            fmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(fmp.transitionSpeed, theme) },
            fmp.family && { "font-family": resolveGlobalsVarString(fmp.family, theme) },
            fmp.letterSpacing && { "letter-spacing": resolveGlobalsVarString(fmp.letterSpacing, theme) },
            fmp.lineHeight && { lineHeight: resolveGlobalsVarString(fmp.lineHeight, theme) },
            fmp.size && { fontSize: resolveGlobalsVarString(fmp.size, theme) },
            fmp.style && { fontStyle: resolveGlobalsVarString(fmp.style, theme) },
            fmp.weight && { fontWeight: resolveGlobalsVarString(fmp.weight, theme) },
            fmp.transform && { textTransform: resolveGlobalsVarString(fmp.transform, theme) }
        );
    };

    const resolvedSet = Object.assign({},
        resolveFontMap(set),
        set.__hover && { [selectors.hover]: resolveFontMap(set.__hover) },
        set.__active && { [selectors.active]: resolveFontMap(set.__active) },
        set.__focus && { [selectors.focus]: resolveFontMap(set.__focus) },
        set.__focusVisible && { [selectors.focusVisible]: resolveFontMap(set.__focusVisible) },
        set.__checked && { [selectors.checked]: resolveFontMap(set.__checked) },
        set.__pressed && { [selectors.pressed]: resolveFontMap(set.__pressed) },
        set.__current && { [selectors.current]: resolveFontMap(set.__current) },
        set.__invalid && { [selectors.invalid]: resolveFontMap(set.__invalid) },
        set.__disabled && {
            [selectors.disabled]: {
                ...resolveFontMap(set.__disabled),
                "pointer-events": "none"
            }
        }
    );

    return Object.assign({},
        ...Object.entries(deepmerge(
            set.__extends ? fontSetToCss(set.__extends, theme) : {}, resolvedSet))
			.sort(sortCssNestings)
			.map(([key, value]) => ({ [key]: value })));
};

/**
 * resolve box defintions from either global boxSets or from neighbour variant definitions
 */
// eslint-disable-next-line complexity
const resolveBoxDefinition = (def: string | ThemingBoxSet | undefined, theme: ThemingConfig, context?: string): ThemingBoxSet | null => {
    if(!def) return null;

    if(Array.isArray(def))
        return deepmerge(
            def.map(x => resolveBoxDefinition(x, theme, context)).flat(1)
        ) as object;

    if(typeof def === "string" && def.startsWith("$$")) {
        const guess = theme.sets.boxSets[getVarName(def)] || null;

        if(guess) return guess;

        if(context) {
            const otherSource = getDeepAttribute(theme.components, context.split("."), null);

            if(context.includes("parts") && otherSource[getVarName(def)]) return otherSource[getVarName(def)];
            if(otherSource.variants && otherSource.variants[getVarName(def)]) return resolveBoxDefinition(
                otherSource.variants[getVarName(def)]?.theming,
                theme,
                context
            );

            return null;
        }

        return null;
    }

    if(typeof def === "object") return def;

    return null;
};

const resolveBeforeAfter = (mode: "before" | "after", inp:ThemingBeforeAfterDefinition, target: Array<any>, theme: ThemingConfig) => {
    const slctr = `&::${mode}`;

    return target.push({
        [slctr]: Object.fromEntries(
            Object.keys(inp).map(key => {
                if(key === "content") return ([key, inp && `"${inp[key]}"`]);
                if(key === "transitionSpeed") return (["transitionDuration", resolveGlobalsVarString(inp[key], theme)]);

                return ([key, resolveGlobalsVarString(inp && inp[key], theme)]);
            })
        )
    });
};

/**
 * Resolve complete box definitions including the sets to CSS
 * @returns Box Definition CSS
 */
// eslint-disable-next-line complexity, max-statements
const boxDefToCssProps = (boxDef: ThemingBoxSet | null, theme: ThemingConfig, context?: string): Array<object> => {
    const res = [];

    if(!boxDef) return [];

    if(Array.isArray(boxDef))
        return [(deepmerge(...(boxDef.map(_dev => boxDefToCssProps(_dev, theme, context)).flat(1))) as object[])];

    if(boxDef.__extends)
        res.push(...boxDefToCssProps(
            resolveBoxDefinition(boxDef.__extends, theme, context),
            theme,
            context
        ));

    if(boxDef.transform)
        res.push({
            "transform":   resolveGlobalsVarString(boxDef.transform, theme),
            "will-change": "transform"
        });

    if(boxDef.borderSet)
        res.push(borderSetToCss(boxDef.borderSet, theme));


    if(boxDef.colorSet)
        res.push(colorSetToCss(boxDef.colorSet, theme));


    if(boxDef.padding)
        res.push({
            padding: resolveGlobalsVarString(boxDef.padding, theme)
        });


    if(boxDef.fontSet)
        res.push(fontSetToCss(boxDef.fontSet, theme));


    if(boxDef.height)
        res.push({
            height: resolveGlobalsVarString(boxDef.height, theme)
        });


    if(boxDef.width)
        res.push({
            width: resolveGlobalsVarString(boxDef.width, theme)
        });

    if(boxDef.before)
        resolveBeforeAfter("before", boxDef.before, res, theme);

    if(boxDef.after)
        resolveBeforeAfter("after", boxDef.after, res, theme);

    if(boxDef.__hover)
        res.splice(0, 0, { [selectors.hover]: boxDefToCssProps(boxDef.__hover, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });

    if(boxDef.__active)
        res.splice(0, 0, { [selectors.active]: boxDefToCssProps(boxDef.__active, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });

    if(boxDef.__focus)
        res.splice(0, 0, { [selectors.focus]: boxDefToCssProps(boxDef.__focus, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });

    if(boxDef.__focusVisible)
        res.splice(0, 0, { [selectors.focusVisible]: boxDefToCssProps(boxDef.__focusVisible, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });

    if(boxDef.__checked)
        res.splice(0, 0, { [selectors.checked]: boxDefToCssProps(boxDef.__checked, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });

    if(boxDef.__disabled)
        res.splice(0, 0, { [selectors.disabled]: boxDefToCssProps(boxDef.__disabled, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });

    if(boxDef.__invalid)
        res.splice(0, 0, { [selectors.invalid]: boxDefToCssProps(boxDef.__invalid, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });

    if(boxDef.__pressed)
        res.splice(0, 0, { [selectors.pressed]: boxDefToCssProps(boxDef.__pressed, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });

    if(boxDef.__current)
        res.splice(0, 0, { [selectors.current]: boxDefToCssProps(boxDef.__current, theme, context)
            .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });


    if(res.length === 0) return [];

    const merged = deepmerge(...res) as object;
    const sorted = Object.fromEntries(Object.entries(merged).sort(sortCssNestings));

    return [sorted];
};

/**
 * Resolve a Component in themeConfig.components. Includes resolving default def, variants and defaultProps
 * Config will include the CSS ClassNames for the component and the parts for all variants.
 * @param component The component
 * @param theme The theming config
 * @returns ComponentConfig
 */
export const resolveComponent = (component: string, theme: ThemingConfig): ComponentsConfig => {
    const componentConfig = theme.components[component];

    if(!componentConfig)
        return {
            component: component,
            variants:  []
        };

    const extendedStuff = componentConfig.__extends ? resolveComponent(getVarName(componentConfig.__extends), theme) : {};

    const variants = [
        componentConfig.default && {
            variant: "default",
            parts:   componentConfig.default.parts ? Object.keys(componentConfig.default.parts as object).map(key => ([key,
                componentConfig.default &&
                resolveBoxDefinition((componentConfig.default.parts as any)[key], theme)
            ])) : [],
            boxDef: resolveBoxDefinition(componentConfig.default?.theming, theme),
            props:  componentConfig.default?.defaultProps
        },
        ...(componentConfig.variants ? Object.keys(componentConfig.variants).filter(x => x !== "default").map(vrnt => componentConfig.variants && ({
            variant: vrnt,
            parts:   (componentConfig.variants[vrnt]?.parts ?? componentConfig.default?.parts) ? Object.entries(
                // merge parts from default into every variant per default
                deepmerge({}, (componentConfig.default?.parts ?? {}), (componentConfig.variants[vrnt]?.parts as object ?? {}))
            ).map(([key, value]) => {
                return ([key,
                    componentConfig.variants &&
                    resolveBoxDefinition(value, theme)
                ]);
            }) : [],
            boxDef: resolveBoxDefinition(componentConfig.variants[vrnt].theming, theme, component),
            props:  componentConfig.variants[vrnt].defaultProps
        })) : [])
    ].filter(x => x && x.boxDef !== null); // eslint-disable-line no-undefined

    return deepmerge(extendedStuff, {
        component: component,
        variants:  variants.map(vrnt => {
            if(!vrnt) return null;

            // eslint-disable-next-line no-undefined
            const context = vrnt.variant !== "default" ? `${component}` : undefined;
            const cssProps = boxDefToCssProps(vrnt.boxDef, theme, context);

            // console.log(component, vrnt.variant, cssProps);

            return ({
                variant:   vrnt.variant,
                className: vrnt.boxDef ? css(cssProps as any) : "",
                parts:     Object.fromEntries(vrnt.parts.map((part: any) => ([part[0], css(boxDefToCssProps(part[1], theme,
                    `${component}.${vrnt.variant === "default" ? "default.parts" : `variants.${vrnt.variant}.parts`}`) as never) || ""]))),
                defaultProps: resolvePropsVars(vrnt.props, theme) || {}
            });
        }) as ComponentsConfig["variants"]
    });
};

/**
 * resolve a configuration object with inheritance
 * @param themeConfig the config
 * @param themesCache already loaded and resolved configs
 * @param themesPool other not yet loaded configs
 * @returns a resolved config (merged with inheritants)
 */
const resolveConfig = (themeConfig: ThemingConfig, themesPool: ThemingConfig[]) => {
    const configKeys = Object.keys(themeConfig);
    const neededKeys = ["name", "components", "version", "globals", "sets"];

    if(!neededKeys.every(key => configKeys.includes(key))) throw Error(`Falsy Theming Configuration: Please check your Config schema for ${themeConfig.name || "config"}`);

    if(themeConfig.basedOn) {
        const resolveBasedOn = (conf: ThemingConfig): ThemingConfig => {
            if(!conf.basedOn || conf.basedOn === "") return conf;

            const merger = deepmergeCustom({
                enableImplicitDefaultMerging: true,
                mergeOthers(values, utils, meta) {
                    if(meta?.parents.length === values.length && values.length > 1 && ([
                        "theming", "colorSet", "borderSet", "fontSet"
                    ] as (string | number | symbol)[]).includes(meta.key))
                        return values;

                    return utils.actions.defaultMerge;
                }
            });

            if(themesPool) {
                const res = themesPool.find((x: ThemingConfig) => x.name === conf.basedOn);

                if(res) return merger(resolveBasedOn(res), conf);
            }

            return conf;
        };

        return resolveBasedOn(themeConfig);
    }

    return themeConfig;
};

export class ThemeManager implements IThemeManager {
    __lastActiveTheme: null | ThemeType = null;

    init(componentCreationFunction: Function) { // eslint-disable-line @typescript-eslint/ban-types
        setup(componentCreationFunction, prefix);
    }

    // eslint-disable-next-line max-statements
    loadTheme(_themeConfig: ThemingConfig, pool?: ThemingConfig[]) {
        if(!_themeConfig) throw Error("No Theming Config found!");

        const resolvedConfig = resolveConfig(deepmerge({}, _themeConfig), pool || []);

        console.debug("Theming configuration:", resolvedConfig);

        if(resolvedConfig === null) return null;

        const components = Object.keys(resolvedConfig.components);

        if(resolvedConfig.name) {
            const styleRoot = (document || window.document).getElementById("_goober");

            if(styleRoot)
                styleRoot.remove();

            const GlobalStyles = createGlobalStyles`html,body {}`;

            const res = {
                name:         resolvedConfig.name,
                components:   components.map(comp => resolveComponent(comp, resolvedConfig)),
                globalStyles: GlobalStyles
            };

            this.__lastActiveTheme = res;

            return res;
        }

        return null;
    }
}
