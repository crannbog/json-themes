/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, setup } from "goober";
import { deepmerge, deepmergeCustom } from "deepmerge-ts";
import { prefix } from "goober/prefixer";
import { createGlobalStyles } from "goober/global";
const dollarVarRegex = /\$\$(?:[\w.]*\|?)/gm;
const selectors = {
    invalid: "&:invalid,&[aria-invalid=true],&[aria-invalid=grammar],&[aria-invalid=spelling]",
    checked: "&:checked,&[aria-checked=true],&[aria-checked=mixed]",
    pressed: "&[aria-pressed=true],&[aria-pressed=mixed]",
    current: "&[aria-current=true],&[aria-current=page],&[aria-current=step],&[aria-current=location],&[aria-current=date],&[aria-current=time]",
    focus: "&:focus,&:focus-within",
    focusVisible: "&:focus-visible",
    hover: "&:hover",
    active: "&:active",
    disabled: "&:disabled,&[aria-disabled=true]"
};
/**
 * A Function to properly sort CSS Selectors
 * @param a First Sort Parameter(key/value pair)
 * @param b Second Sort Parameter
 * @returns sorted Array
 * @example an :active selector should always be higher in specificity than an :hover
 */
// eslint-disable-next-line complexity
const sortCssNestings = (a, b) => {
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
const getVarName = (str) => str.slice(2);
/**
 * Get a value recursive from an JSON-like object to go to a variable from some def like &&myvars.some.asdf
 * @param root Root JSON-like Object
 * @param path Path to navigate to (string array)
 * @param {*} value optional value to search on
 * @returns resolved variable from path
 */
export const getDeepAttribute = (root, path, value = null) => {
    const val = value ?? root;
    if (!path || path.length === 0) {
        if (typeof val === "string" && val.includes("$$"))
            return `${val}`.replace(dollarVarRegex, str => getDeepAttribute(root, getVarName(str.replace("|", "")).split(".")));
        return val;
    }
    if (!val[path[0]])
        return null;
    return getDeepAttribute(root, path.slice(1), val[path[0]]);
};
/**
 * Resolve global Variables
 * @param varStr $$var String
 * @param theme the theming config
 * @param customResolver custom resolver function in case you don't want to return a .toString()
 * @returns a resolved variable
 */
const resolveGlobalsVar = (varStr, theme, customResolver) => {
    const deep = getDeepAttribute(theme.globals, getVarName(varStr).split("."));
    if (deep === null) {
        console.warn(`No Var found for ${varStr}. Skipped.`);
        return "";
    }
    if (customResolver)
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
const resolveGlobalsVarString = (value, theme, customResolver) => {
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
const resolvePropsVars = (props, theme) => {
    if (!props || !theme)
        return null;
    const keys = Object.keys(props);
    const resolvedValues = keys?.map(key => {
        const value = props[key];
        if (typeof value === "string")
            return resolveGlobalsVarString(value, theme);
        if (typeof value === "object")
            return resolvePropsVars(value, theme);
        return value;
    });
    return Object.fromEntries(keys.map((key, i) => ([key, resolvedValues[i]])));
};
/**
 * Function to either resolve a color or a gradient defintion
 * @returns a valid CSS color/gradient def
 */
const resolveColorsDefinition = (str, theme, allowGradient = false) => {
    return resolveGlobalsVarString(str, theme, res => {
        if (allowGradient && !(typeof res === "string"))
            return resolveGlobalsVarString(res.definition, theme);
        if (!allowGradient && !(typeof res === "string"))
            return resolveGlobalsVarString(res.fallbackColor, theme) || "";
        return `${res}`;
    });
};
/**
 * Function to either resolve a color or a gradient defintion
 * @returns a valid CSS color/gradient def
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const resolveBackdropFilterDefinition = (obj, theme) => {
    if (typeof obj === "string" && obj.startsWith("$$"))
        return resolveBackdropFilterDefinition(resolveGlobalsVar(obj, theme, (resolvedObject => resolvedObject)), theme);
    return {
        "backdropFilter": resolveGlobalsVarString(obj.definition, theme),
        "@supports not (backdrop-filter: blur(1px))": {
            background: resolveColorsDefinition(obj.fallbackBackground, theme, true)
        }
    };
};
/**
 * theming border set defintion to CSS
 */
// eslint-disable-next-line complexity
const borderSetToCss = (borderSet, theme) => {
    if (Array.isArray(borderSet))
        return deepmerge(...borderSet.map(_def => borderSetToCss(_def, theme)).flat(1));
    const set = typeof borderSet === "string" ? theme.sets.borderSets[getVarName(borderSet)] : borderSet;
    if (!set)
        return {};
    const resolveDefinition = (tdef, context) => {
        return Object.assign({}, tdef.image && { [`border${context}-image`]: resolveGlobalsVarString(tdef.image, theme) }, tdef.style && { [`border${context}-style`]: resolveGlobalsVarString(tdef.style, theme) }, tdef.width && { [`border${context}-width`]: resolveGlobalsVarString(tdef.width, theme) });
    };
    const resolveBorderMap = (bmp) => {
        return Object.assign({}, resolveDefinition(bmp, ""), bmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(bmp.transitionSpeed, theme) }, bmp.bottom && resolveDefinition(bmp.bottom, "-bottom"), bmp.left && resolveDefinition(bmp.left, "-left"), bmp.right && resolveDefinition(bmp.right, "-right"), bmp.top && resolveDefinition(bmp.top, "-top"), bmp.radius && { "border-radius": resolveGlobalsVarString(bmp.radius, theme) });
    };
    const resolvedSet = Object.assign({}, resolveBorderMap(set), set.__hover && { [selectors.hover]: resolveBorderMap(set.__hover) }, set.__active && { [selectors.active]: resolveBorderMap(set.__active) }, set.__focus && { [selectors.focus]: resolveBorderMap(set.__focus) }, set.__focusVisible && { [selectors.focusVisible]: resolveBorderMap(set.__focusVisible) }, set.__checked && { [selectors.checked]: resolveBorderMap(set.__checked) }, set.__pressed && { [selectors.pressed]: resolveBorderMap(set.__pressed) }, set.__current && { [selectors.current]: resolveBorderMap(set.__current) }, set.__invalid && { [selectors.invalid]: resolveBorderMap(set.__invalid) }, set.__disabled && {
        [selectors.disabled]: {
            ...resolveBorderMap(set.__disabled),
            "pointer-events": "none"
        }
    });
    return Object.assign({}, ...Object.entries(deepmerge(set.__extends ? borderSetToCss(set.__extends, theme) : 0, resolvedSet))
        .sort(sortCssNestings)
        .map(([key, value]) => ({ [key]: value })));
};
/**
 * theming color set defintion to CSS
 */
// eslint-disable-next-line complexity
const colorSetToCss = (colorSet, theme) => {
    if (Array.isArray(colorSet))
        return deepmerge(...colorSet.map(_def => colorSetToCss(_def, theme)).flat(1));
    const set = typeof colorSet === "string" ? theme.sets.colorSets[getVarName(colorSet)] : colorSet;
    if (!set)
        return {};
    const resolveColorMap = (cmp) => {
        return Object.assign({}, 
        // TODO cmp.__extends &&
        cmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(cmp.transitionSpeed, theme) }, cmp.background && { background: resolveColorsDefinition(cmp.background, theme, true) }, cmp.border && { borderColor: resolveColorsDefinition(cmp.border, theme) }, cmp.filter && { filter: resolveGlobalsVarString(cmp.filter, theme) }, cmp.backdropFilter && resolveBackdropFilterDefinition(cmp.backdropFilter, theme), cmp.foreground && { color: resolveColorsDefinition(cmp.foreground, theme) }, cmp.icon && { "& svg": { color: resolveGlobalsVarString(cmp.icon, theme) } }, cmp.shadow && { boxShadow: resolveGlobalsVarString(cmp.shadow, theme) });
    };
    const resolvedSet = Object.assign({}, resolveColorMap(set), set.__hover && { [selectors.hover]: resolveColorMap(set.__hover) }, set.__active && { [selectors.active]: resolveColorMap(set.__active) }, set.__focus && { [selectors.focus]: resolveColorMap(set.__focus) }, set.__focusVisible && { [selectors.focusVisible]: resolveColorMap(set.__focusVisible) }, set.__checked && { [selectors.checked]: resolveColorMap(set.__checked) }, set.__pressed && { [selectors.pressed]: resolveColorMap(set.__pressed) }, set.__current && { [selectors.current]: resolveColorMap(set.__current) }, set.__invalid && { [selectors.invalid]: resolveColorMap(set.__invalid) }, set.__disabled && {
        [selectors.disabled]: {
            ...resolveColorMap(set.__disabled),
            "pointer-events": "none"
        }
    }, set.__selection && {
        "&::selection": {
            color: resolveGlobalsVarString(set.__selection.foreground, theme),
            background: resolveColorsDefinition(set.__selection.background, theme)
        }
    });
    return Object.assign({}, ...Object.entries(deepmerge(set.__extends ? colorSetToCss(set.__extends, theme) : {}, resolvedSet))
        .sort(sortCssNestings)
        .map(([key, value]) => ({ [key]: value })));
};
/**
 * theming font set defintion to CSS
 */
// eslint-disable-next-line complexity
const fontSetToCss = (fontSet, theme) => {
    if (Array.isArray(fontSet))
        return deepmerge(...fontSet.map(_def => fontSetToCss(_def, theme)).flat(1));
    const set = typeof fontSet === "string" ? theme.sets.fontSets[getVarName(fontSet)] : fontSet;
    if (!set)
        return {};
    const resolveFontMap = (fmp) => {
        return Object.assign({}, fmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(fmp.transitionSpeed, theme) }, fmp.family && { "font-family": resolveGlobalsVarString(fmp.family, theme) }, fmp.letterSpacing && { "letter-spacing": resolveGlobalsVarString(fmp.letterSpacing, theme) }, fmp.lineHeight && { lineHeight: resolveGlobalsVarString(fmp.lineHeight, theme) }, fmp.size && { fontSize: resolveGlobalsVarString(fmp.size, theme) }, fmp.style && { fontStyle: resolveGlobalsVarString(fmp.style, theme) }, fmp.weight && { fontWeight: resolveGlobalsVarString(fmp.weight, theme) }, fmp.transform && { textTransform: resolveGlobalsVarString(fmp.transform, theme) });
    };
    const resolvedSet = Object.assign({}, resolveFontMap(set), set.__hover && { [selectors.hover]: resolveFontMap(set.__hover) }, set.__active && { [selectors.active]: resolveFontMap(set.__active) }, set.__focus && { [selectors.focus]: resolveFontMap(set.__focus) }, set.__focusVisible && { [selectors.focusVisible]: resolveFontMap(set.__focusVisible) }, set.__checked && { [selectors.checked]: resolveFontMap(set.__checked) }, set.__pressed && { [selectors.pressed]: resolveFontMap(set.__pressed) }, set.__current && { [selectors.current]: resolveFontMap(set.__current) }, set.__invalid && { [selectors.invalid]: resolveFontMap(set.__invalid) }, set.__disabled && {
        [selectors.disabled]: {
            ...resolveFontMap(set.__disabled),
            "pointer-events": "none"
        }
    });
    return Object.assign({}, ...Object.entries(deepmerge(set.__extends ? fontSetToCss(set.__extends, theme) : {}, resolvedSet))
        .sort(sortCssNestings)
        .map(([key, value]) => ({ [key]: value })));
};
/**
 * resolve box defintions from either global boxSets or from neighbour variant definitions
 */
// eslint-disable-next-line complexity
const resolveBoxDefinition = (def, theme, context) => {
    if (!def)
        return null;
    if (Array.isArray(def))
        return deepmerge(def.map(x => resolveBoxDefinition(x, theme, context)).flat(1));
    if (typeof def === "string" && def.startsWith("$$")) {
        const guess = theme.sets.boxSets[getVarName(def)] || null;
        if (guess)
            return guess;
        if (context) {
            const otherSource = getDeepAttribute(theme.components, context.split("."), null);
            if (context.includes("parts") && otherSource[getVarName(def)])
                return otherSource[getVarName(def)];
            if (otherSource.variants && otherSource.variants[getVarName(def)])
                return resolveBoxDefinition(otherSource.variants[getVarName(def)]?.theming, theme, context);
            return null;
        }
        return null;
    }
    if (typeof def === "object")
        return def;
    return null;
};
const resolveBeforeAfter = (mode, inp, target, theme) => {
    const slctr = `&::${mode}`;
    return target.push({
        [slctr]: Object.fromEntries(Object.keys(inp).map(key => {
            if (key === "content")
                return ([key, inp && `"${inp[key]}"`]);
            if (key === "transitionSpeed")
                return (["transitionDuration", resolveGlobalsVarString(inp[key], theme)]);
            return ([key, resolveGlobalsVarString(inp && inp[key], theme)]);
        }))
    });
};
/**
 * Resolve complete box definitions including the sets to CSS
 * @returns Box Definition CSS
 */
// eslint-disable-next-line complexity, max-statements
const boxDefToCssProps = (boxDef, theme, context) => {
    const res = [];
    if (!boxDef)
        return [];
    if (Array.isArray(boxDef))
        return [deepmerge(...(boxDef.map(_dev => boxDefToCssProps(_dev, theme, context)).flat(1)))];
    if (boxDef.__extends)
        res.push(...boxDefToCssProps(resolveBoxDefinition(boxDef.__extends, theme, context), theme, context));
    if (boxDef.transform)
        res.push({
            "transform": resolveGlobalsVarString(boxDef.transform, theme),
            "will-change": "transform"
        });
    if (boxDef.borderSet)
        res.push(borderSetToCss(boxDef.borderSet, theme));
    if (boxDef.colorSet)
        res.push(colorSetToCss(boxDef.colorSet, theme));
    if (boxDef.padding)
        res.push({
            padding: resolveGlobalsVarString(boxDef.padding, theme)
        });
    if (boxDef.fontSet)
        res.push(fontSetToCss(boxDef.fontSet, theme));
    if (boxDef.height)
        res.push({
            height: resolveGlobalsVarString(boxDef.height, theme)
        });
    if (boxDef.width)
        res.push({
            width: resolveGlobalsVarString(boxDef.width, theme)
        });
    if (boxDef.before)
        resolveBeforeAfter("before", boxDef.before, res, theme);
    if (boxDef.after)
        resolveBeforeAfter("after", boxDef.after, res, theme);
    if (boxDef.__hover)
        res.splice(0, 0, { [selectors.hover]: boxDefToCssProps(boxDef.__hover, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (boxDef.__active)
        res.splice(0, 0, { [selectors.active]: boxDefToCssProps(boxDef.__active, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (boxDef.__focus)
        res.splice(0, 0, { [selectors.focus]: boxDefToCssProps(boxDef.__focus, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (boxDef.__focusVisible)
        res.splice(0, 0, { [selectors.focusVisible]: boxDefToCssProps(boxDef.__focusVisible, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (boxDef.__checked)
        res.splice(0, 0, { [selectors.checked]: boxDefToCssProps(boxDef.__checked, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (boxDef.__disabled)
        res.splice(0, 0, { [selectors.disabled]: boxDefToCssProps(boxDef.__disabled, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (boxDef.__invalid)
        res.splice(0, 0, { [selectors.invalid]: boxDefToCssProps(boxDef.__invalid, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (boxDef.__pressed)
        res.splice(0, 0, { [selectors.pressed]: boxDefToCssProps(boxDef.__pressed, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (boxDef.__current)
        res.splice(0, 0, { [selectors.current]: boxDefToCssProps(boxDef.__current, theme, context)
                .reduce((prev, curr) => ({ ...prev, ...curr }), {}) });
    if (res.length === 0)
        return [];
    const merged = deepmerge(...res);
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
export const resolveComponent = (component, theme) => {
    const componentConfig = theme.components[component];
    if (!componentConfig)
        return {
            component: component,
            variants: []
        };
    const extendedStuff = componentConfig.__extends ? resolveComponent(getVarName(componentConfig.__extends), theme) : {};
    const variants = [
        componentConfig.default && {
            variant: "default",
            parts: componentConfig.default.parts ? Object.keys(componentConfig.default.parts).map(key => ([key,
                componentConfig.default &&
                    resolveBoxDefinition(componentConfig.default.parts[key], theme)
            ])) : [],
            boxDef: resolveBoxDefinition(componentConfig.default?.theming, theme),
            props: componentConfig.default?.defaultProps
        },
        ...(componentConfig.variants ? Object.keys(componentConfig.variants).filter(x => x !== "default").map(vrnt => componentConfig.variants && ({
            variant: vrnt,
            parts: (componentConfig.variants[vrnt]?.parts ?? componentConfig.default?.parts) ? Object.entries(
            // merge parts from default into every variant per default
            deepmerge({}, (componentConfig.default?.parts ?? {}), (componentConfig.variants[vrnt]?.parts ?? {}))).map(([key, value]) => {
                return ([key,
                    componentConfig.variants &&
                        resolveBoxDefinition(value, theme)
                ]);
            }) : [],
            boxDef: resolveBoxDefinition(componentConfig.variants[vrnt].theming, theme, component),
            props: componentConfig.variants[vrnt].defaultProps
        })) : [])
    ].filter(x => x && x.boxDef !== null); // eslint-disable-line no-undefined
    return deepmerge(extendedStuff, {
        component: component,
        variants: variants.map(vrnt => {
            if (!vrnt)
                return null;
            // eslint-disable-next-line no-undefined
            const context = vrnt.variant !== "default" ? `${component}` : undefined;
            const cssProps = boxDefToCssProps(vrnt.boxDef, theme, context);
            // console.log(component, vrnt.variant, cssProps);
            return ({
                variant: vrnt.variant,
                className: vrnt.boxDef ? css(cssProps) : "",
                parts: Object.fromEntries(vrnt.parts.map((part) => ([part[0], css(boxDefToCssProps(part[1], theme, `${component}.${vrnt.variant === "default" ? "default.parts" : `variants.${vrnt.variant}.parts`}`)) || ""]))),
                defaultProps: resolvePropsVars(vrnt.props, theme) || {}
            });
        })
    });
};
/**
 * resolve a configuration object with inheritance
 * @param themeConfig the config
 * @param themesCache already loaded and resolved configs
 * @param themesPool other not yet loaded configs
 * @returns a resolved config (merged with inheritants)
 */
const resolveConfig = (themeConfig, themesPool) => {
    const configKeys = Object.keys(themeConfig);
    const neededKeys = ["name", "components", "version", "globals", "sets"];
    if (!neededKeys.every(key => configKeys.includes(key)))
        throw Error(`Falsy Theming Configuration: Please check your Config schema for ${themeConfig.name || "config"}`);
    if (themeConfig.basedOn) {
        const resolveBasedOn = (conf) => {
            if (!conf.basedOn || conf.basedOn === "")
                return conf;
            const merger = deepmergeCustom({
                enableImplicitDefaultMerging: true,
                mergeOthers(values, utils, meta) {
                    if (meta?.parents.length === values.length && values.length > 1 && [
                        "theming", "colorSet", "borderSet", "fontSet"
                    ].includes(meta.key))
                        return values;
                    return utils.actions.defaultMerge;
                }
            });
            if (themesPool) {
                const res = themesPool.find((x) => x.name === conf.basedOn);
                if (res)
                    return merger(resolveBasedOn(res), conf);
            }
            return conf;
        };
        return resolveBasedOn(themeConfig);
    }
    return themeConfig;
};
export class ThemeManager {
    __lastActiveTheme = null;
    init(componentCreationFunction) {
        setup(componentCreationFunction, prefix);
    }
    // eslint-disable-next-line max-statements
    loadTheme(_themeConfig, pool) {
        if (!_themeConfig)
            throw Error("No Theming Config found!");
        const resolvedConfig = resolveConfig(deepmerge({}, _themeConfig), pool || []);
        console.debug("Theming configuration:", resolvedConfig);
        if (resolvedConfig === null)
            return null;
        const components = Object.keys(resolvedConfig.components);
        if (resolvedConfig.name) {
            const styleRoot = (document || window.document).getElementById("_goober");
            if (styleRoot)
                styleRoot.remove();
            const GlobalStyles = createGlobalStyles `html,body {}`;
            const res = {
                name: resolvedConfig.name,
                components: components.map(comp => resolveComponent(comp, resolvedConfig)),
                globalStyles: GlobalStyles
            };
            this.__lastActiveTheme = res;
            return res;
        }
        return null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6Ii9ob21lL2NteC9kZXYvY3Jhbm5ib2cvanNvbi10aGVtZXMvIiwic291cmNlcyI6WyJzcmMvbGliL3RoZW1lTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1REFBdUQ7QUFldkQsT0FBTyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDcEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDMUQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUVuRCxNQUFNLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQztBQUU3QyxNQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBTyxpRkFBaUY7SUFDL0YsT0FBTyxFQUFPLHNEQUFzRDtJQUNwRSxPQUFPLEVBQU8sNENBQTRDO0lBQzFELE9BQU8sRUFBTyxtSUFBbUk7SUFDakosS0FBSyxFQUFTLHdCQUF3QjtJQUN0QyxZQUFZLEVBQUUsaUJBQWlCO0lBQy9CLEtBQUssRUFBUyxTQUFTO0lBQ3ZCLE1BQU0sRUFBUSxVQUFVO0lBQ3hCLFFBQVEsRUFBTSxrQ0FBa0M7Q0FDbkQsQ0FBQztBQUVGOzs7Ozs7R0FNRztBQUNILHNDQUFzQztBQUN0QyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQW9CLEVBQUUsQ0FBb0IsRUFBRSxFQUFFO0lBQ25FLE1BQU0sS0FBSyxHQUFHO1FBQ1YsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULE9BQU87UUFDUCxlQUFlO1FBQ2YsT0FBTztRQUNQLFFBQVE7UUFDUixVQUFVO0tBQ2IsQ0FBQztJQUVGLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEQsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVsRCxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDbkIsQ0FBQyxDQUFDO0FBRUYsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFakQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxJQUF5QixFQUFFLElBQWMsRUFBRSxRQUFhLElBQUksRUFBTyxFQUFFO0lBQ2xHLE1BQU0sR0FBRyxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUM7SUFFMUIsSUFBRyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzVCLElBQUcsT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQzVDLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUNsQyxHQUFHLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDN0UsQ0FBQztRQUVOLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVELElBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFOUIsT0FBTyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUM7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLGlCQUFpQixHQUFHLENBQUMsTUFBYyxFQUFFLEtBQW9CLEVBQUUsY0FBc0MsRUFBRSxFQUFFO0lBQ3ZHLE1BQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTVFLElBQUcsSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsTUFBTSxZQUFZLENBQUMsQ0FBQztRQUNyRCxPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxJQUFHLGNBQWM7UUFDYixPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVoQyxPQUFPLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDbEMsQ0FBQyxDQUFDO0FBRUY7Ozs7OztHQU1HO0FBQ0gsTUFBTSx1QkFBdUIsR0FBRyxDQUFDLEtBQWMsRUFBRSxLQUFvQixFQUFFLGNBQXNDLEVBQUUsRUFBRTtJQUM3RyxPQUFPLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1FBQzdDLE9BQU8saUJBQWlCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNILE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxLQUFVLEVBQUUsS0FBb0IsRUFBRSxFQUFFO0lBQzFELElBQUcsQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFakMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVoQyxNQUFNLGNBQWMsR0FBZSxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQy9DLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV6QixJQUFHLE9BQU8sS0FBSyxLQUFLLFFBQVE7WUFDeEIsT0FBTyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFHakQsSUFBRyxPQUFPLEtBQUssS0FBSyxRQUFRO1lBQ3hCLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRzFDLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hGLENBQUMsQ0FBQztBQUVGOzs7R0FHRztBQUNILE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxHQUFZLEVBQUUsS0FBb0IsRUFBRSxhQUFhLEdBQUcsS0FBSyxFQUFFLEVBQUU7SUFDMUYsT0FBTyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1FBQzdDLElBQUcsYUFBYSxJQUFJLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUM7WUFDMUMsT0FBTyx1QkFBdUIsQ0FBRSxHQUFpQyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV6RixJQUFHLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUM7WUFDM0MsT0FBTyx1QkFBdUIsQ0FBRSxHQUFpQyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFbEcsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDO0FBRUY7OztHQUdHO0FBQ0gsd0RBQXdEO0FBQ3hELE1BQU0sK0JBQStCLEdBQUcsQ0FBQyxHQUE2QyxFQUFFLEtBQW9CLEVBQVUsRUFBRTtJQUNwSCxJQUFHLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztRQUM5QyxPQUFPLCtCQUErQixDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFckgsT0FBTztRQUNILGdCQUFnQixFQUE4Qix1QkFBdUIsQ0FBRSxHQUF1QyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUM7UUFDakksNENBQTRDLEVBQUU7WUFDMUMsVUFBVSxFQUFFLHVCQUF1QixDQUFFLEdBQXVDLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQztTQUNoSDtLQUNKLENBQUM7QUFDTixDQUFDLENBQUM7QUFFRjs7R0FFRztBQUNILHNDQUFzQztBQUN0QyxNQUFNLGNBQWMsR0FBRyxDQUFDLFNBQW9DLEVBQUUsS0FBb0IsRUFBVSxFQUFFO0lBQzFGLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDdkIsT0FBTyxTQUFTLENBQ1osR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FDdEQsQ0FBQztJQUVoQixNQUFNLEdBQUcsR0FBcUIsT0FBTyxTQUFTLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBRXZILElBQUcsQ0FBQyxHQUFHO1FBQUUsT0FBTyxFQUFFLENBQUM7SUFFbkIsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLElBQTZCLEVBQUUsT0FBZSxFQUFFLEVBQUU7UUFDekUsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFDbkIsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsU0FBUyxPQUFPLFFBQVEsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFDeEYsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsU0FBUyxPQUFPLFFBQVEsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFDeEYsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsU0FBUyxPQUFPLFFBQVEsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FDM0YsQ0FBQztJQUNOLENBQUMsQ0FBQztJQUVGLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFxQyxFQUFFLEVBQUU7UUFDL0QsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFDbkIsaUJBQWlCLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUMxQixHQUFHLENBQUMsZUFBZSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUNsRyxHQUFHLENBQUMsTUFBTSxJQUFJLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEVBQ3RELEdBQUcsQ0FBQyxJQUFJLElBQUksaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsRUFDaEQsR0FBRyxDQUFDLEtBQUssSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUNuRCxHQUFHLENBQUMsR0FBRyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQzdDLEdBQUcsQ0FBQyxNQUFNLElBQUksRUFBRSxlQUFlLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRSxDQUNoRixDQUFDO0lBQ04sQ0FBQyxDQUFDO0lBRUYsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQ2hDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUNyQixHQUFHLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQ25FLEdBQUcsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFDdEUsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUNuRSxHQUFHLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQ3hGLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFDekUsR0FBRyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUN6RSxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQ3pFLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFDekUsR0FBRyxDQUFDLFVBQVUsSUFBSTtRQUNkLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xCLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztZQUNuQyxnQkFBZ0IsRUFBRSxNQUFNO1NBQzNCO0tBQ0osQ0FDSixDQUFDO0lBRUYsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFDbkIsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FDdkIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUMvRSxJQUFJLENBQUMsZUFBZSxDQUFDO1NBQ3JCLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDLENBQUM7QUFFRjs7R0FFRztBQUNILHNDQUFzQztBQUN0QyxNQUFNLGFBQWEsR0FBRyxDQUFDLFFBQXNELEVBQUUsS0FBb0IsRUFBVSxFQUFFO0lBQzNHLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7UUFDdEIsT0FBTyxTQUFTLENBQ1osR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FDcEQsQ0FBQztJQUVoQixNQUFNLEdBQUcsR0FBb0IsT0FBTyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0lBRWxILElBQUcsQ0FBQyxHQUFHO1FBQUUsT0FBTyxFQUFFLENBQUM7SUFFbkIsTUFBTSxlQUFlLEdBQUcsQ0FBQyxHQUFvQyxFQUFFLEVBQUU7UUFDN0QsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDbkIsd0JBQXdCO1FBQ3hCLEdBQUcsQ0FBQyxlQUFlLElBQUksRUFBRSxrQkFBa0IsRUFBRSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQ2xHLEdBQUcsQ0FBQyxVQUFVLElBQUksRUFBRSxVQUFVLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFDdEYsR0FBRyxDQUFDLE1BQU0sSUFBSSxFQUFFLFdBQVcsRUFBRSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQ3pFLEdBQUcsQ0FBQyxNQUFNLElBQUksRUFBRSxNQUFNLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRSxFQUNwRSxHQUFHLENBQUMsY0FBYyxJQUFJLCtCQUErQixDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLEVBQ2hGLEdBQUcsQ0FBQyxVQUFVLElBQUksRUFBRSxLQUFLLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUMzRSxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUM1RSxHQUFHLENBQUMsTUFBTSxJQUFJLEVBQUUsU0FBUyxFQUFFLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FDMUUsQ0FBQztJQUNOLENBQUMsQ0FBQztJQUVGLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUNoQyxlQUFlLENBQUMsR0FBRyxDQUFDLEVBQ3BCLEdBQUcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQ2xFLEdBQUcsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQ3JFLEdBQUcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQ2xFLEdBQUcsQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQ3ZGLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQ3hFLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQ3hFLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQ3hFLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQ3hFLEdBQUcsQ0FBQyxVQUFVLElBQUk7UUFDZCxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO1lBQ2xDLGdCQUFnQixFQUFFLE1BQU07U0FDM0I7S0FDSixFQUNELEdBQUcsQ0FBQyxXQUFXLElBQUk7UUFDZixjQUFjLEVBQUU7WUFDWixLQUFLLEVBQU8sdUJBQXVCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDO1lBQ3RFLFVBQVUsRUFBRSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUM7U0FDekU7S0FDSixDQUNKLENBQUM7SUFFRixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUNuQixHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUN2QixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQy9FLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDckIsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9DLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0gsc0NBQXNDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLENBQUMsT0FBbUQsRUFBRSxLQUFvQixFQUFVLEVBQUU7SUFDdkcsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUNyQixPQUFPLFNBQVMsQ0FDWixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUNsRCxDQUFDO0lBRWhCLE1BQU0sR0FBRyxHQUFtQixPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFFN0csSUFBRyxDQUFDLEdBQUc7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUVuQixNQUFNLGNBQWMsR0FBRyxDQUFDLEdBQTBDLEVBQUUsRUFBRTtRQUNsRSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUNuQixHQUFHLENBQUMsZUFBZSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUNsRyxHQUFHLENBQUMsTUFBTSxJQUFJLEVBQUUsYUFBYSxFQUFFLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFDM0UsR0FBRyxDQUFDLGFBQWEsSUFBSSxFQUFFLGdCQUFnQixFQUFFLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFDNUYsR0FBRyxDQUFDLFVBQVUsSUFBSSxFQUFFLFVBQVUsRUFBRSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQ2hGLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxRQUFRLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxFQUNsRSxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUUsU0FBUyxFQUFFLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFDckUsR0FBRyxDQUFDLE1BQU0sSUFBSSxFQUFFLFVBQVUsRUFBRSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQ3hFLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRSxhQUFhLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUNwRixDQUFDO0lBQ04sQ0FBQyxDQUFDO0lBRUYsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQ2hDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFDbkIsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFDakUsR0FBRyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFDcEUsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFDakUsR0FBRyxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFDdEYsR0FBRyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFDdkUsR0FBRyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFDdkUsR0FBRyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFDdkUsR0FBRyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFDdkUsR0FBRyxDQUFDLFVBQVUsSUFBSTtRQUNkLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xCLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7WUFDakMsZ0JBQWdCLEVBQUUsTUFBTTtTQUMzQjtLQUNKLENBQ0osQ0FBQztJQUVGLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQ25CLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQ3ZCLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDOUUsSUFBSSxDQUFDLGVBQWUsQ0FBQztTQUNyQixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDO0FBRUY7O0dBRUc7QUFDSCxzQ0FBc0M7QUFDdEMsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLEdBQXVDLEVBQUUsS0FBb0IsRUFBRSxPQUFnQixFQUF3QixFQUFFO0lBQ25JLElBQUcsQ0FBQyxHQUFHO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFckIsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNqQixPQUFPLFNBQVMsQ0FDWixHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FDdEQsQ0FBQztJQUVoQixJQUFHLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDakQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1FBRTFELElBQUcsS0FBSztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBRXZCLElBQUcsT0FBTyxFQUFFLENBQUM7WUFDVCxNQUFNLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFakYsSUFBRyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUUsT0FBTyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEcsSUFBRyxXQUFXLENBQUMsUUFBUSxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFFLE9BQU8sb0JBQW9CLENBQ3pGLFdBQVcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUM5QyxLQUFLLEVBQ0wsT0FBTyxDQUNWLENBQUM7WUFFRixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELElBQUcsT0FBTyxHQUFHLEtBQUssUUFBUTtRQUFFLE9BQU8sR0FBRyxDQUFDO0lBRXZDLE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQUVGLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxJQUF3QixFQUFFLEdBQWdDLEVBQUUsTUFBa0IsRUFBRSxLQUFvQixFQUFFLEVBQUU7SUFDaEksTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLEVBQUUsQ0FBQztJQUUzQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDZixDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLElBQUcsR0FBRyxLQUFLLFNBQVM7Z0JBQUUsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM3RCxJQUFHLEdBQUcsS0FBSyxpQkFBaUI7Z0JBQUUsT0FBTyxDQUFDLENBQUMsb0JBQW9CLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4RyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQ0w7S0FDSixDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFFRjs7O0dBR0c7QUFDSCxzREFBc0Q7QUFDdEQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLE1BQTRCLEVBQUUsS0FBb0IsRUFBRSxPQUFnQixFQUFpQixFQUFFO0lBQzdHLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUVmLElBQUcsQ0FBQyxNQUFNO1FBQUUsT0FBTyxFQUFFLENBQUM7SUFFdEIsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNwQixPQUFPLENBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFjLENBQUMsQ0FBQztJQUU5RyxJQUFHLE1BQU0sQ0FBQyxTQUFTO1FBQ2YsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLGdCQUFnQixDQUN4QixvQkFBb0IsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsRUFDdEQsS0FBSyxFQUNMLE9BQU8sQ0FDVixDQUFDLENBQUM7SUFFUCxJQUFHLE1BQU0sQ0FBQyxTQUFTO1FBQ2YsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNMLFdBQVcsRUFBSSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQztZQUMvRCxhQUFhLEVBQUUsV0FBVztTQUM3QixDQUFDLENBQUM7SUFFUCxJQUFHLE1BQU0sQ0FBQyxTQUFTO1FBQ2YsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBR3RELElBQUcsTUFBTSxDQUFDLFFBQVE7UUFDZCxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFHcEQsSUFBRyxNQUFNLENBQUMsT0FBTztRQUNiLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDTCxPQUFPLEVBQUUsdUJBQXVCLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUM7U0FDMUQsQ0FBQyxDQUFDO0lBR1AsSUFBRyxNQUFNLENBQUMsT0FBTztRQUNiLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUdsRCxJQUFHLE1BQU0sQ0FBQyxNQUFNO1FBQ1osR0FBRyxDQUFDLElBQUksQ0FBQztZQUNMLE1BQU0sRUFBRSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztTQUN4RCxDQUFDLENBQUM7SUFHUCxJQUFHLE1BQU0sQ0FBQyxLQUFLO1FBQ1gsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNMLEtBQUssRUFBRSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztTQUN0RCxDQUFDLENBQUM7SUFFUCxJQUFHLE1BQU0sQ0FBQyxNQUFNO1FBQ1osa0JBQWtCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTVELElBQUcsTUFBTSxDQUFDLEtBQUs7UUFDWCxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFMUQsSUFBRyxNQUFNLENBQUMsT0FBTztRQUNiLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQztpQkFDakYsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFL0QsSUFBRyxNQUFNLENBQUMsUUFBUTtRQUNkLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQztpQkFDbkYsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFL0QsSUFBRyxNQUFNLENBQUMsT0FBTztRQUNiLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQztpQkFDakYsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFL0QsSUFBRyxNQUFNLENBQUMsY0FBYztRQUNwQixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUM7aUJBQy9GLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRS9ELElBQUcsTUFBTSxDQUFDLFNBQVM7UUFDZixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUM7aUJBQ3JGLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRS9ELElBQUcsTUFBTSxDQUFDLFVBQVU7UUFDaEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDO2lCQUN2RixNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUUvRCxJQUFHLE1BQU0sQ0FBQyxTQUFTO1FBQ2YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDO2lCQUNyRixNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUUvRCxJQUFHLE1BQU0sQ0FBQyxTQUFTO1FBQ2YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDO2lCQUNyRixNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUUvRCxJQUFHLE1BQU0sQ0FBQyxTQUFTO1FBQ2YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxD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