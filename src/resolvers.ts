/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  dollarVarRegex, getDeepAttribute, getVarName,
  selectors,
  sortCssNestings
} from "./tools.ts";
import type { JSONThemes } from "./types.ts";
import { deepmerge } from "deepmerge-ts";


/**
 * Resolve global Variables
 * @param varStr $$var String
 * @param theme the theming config
 * @param customResolver custom resolver function in case you don't want to return a .toString()
 * @returns a resolved variable
 */

const resolveGlobalsVar = (varStr: string, theme: JSONThemes.ConfigShape, customResolver?: (res: unknown) => any) => {
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

const resolveGlobalsVarString = (value: unknown, theme: JSONThemes.ConfigShape, customResolver?: (res: unknown) => any) => {
  return (`${value}`.replace(dollarVarRegex, (str) => {
    return resolveGlobalsVar(str.replaceAll("|", ""), theme, customResolver);
  }));
};

/**
 * Function to resolve $$ globals Variables inside defaultProps definitions
 * @param props the props
 * @param theme theming config
 * @returns resolved props
 */
export const resolvePropsVars = (props: any, theme: JSONThemes.ConfigShape) => {
  if (!props || !theme) return null;

  const keys = Object.keys(props);

  const resolvedValues: Array<any> = keys?.map((key) => {
    const value = props[key];

    if (typeof value === "string")
      return resolveGlobalsVarString(value, theme);


    if (typeof value === "object")
      return resolvePropsVars(value, theme);


    return value;
  });

  return Object.fromEntries(keys.map((key, i) => ([ key, resolvedValues[i] ])));
};

/**
 * Function to either resolve a color or a gradient defintion
 * @returns a valid CSS color/gradient def
 */
const resolveColorsDefinition = (str: unknown, theme: JSONThemes.ConfigShape, allowGradient = false) => {
  return resolveGlobalsVarString(str, theme, (res) => {
    if (allowGradient && !(typeof res === "string"))
      return resolveGlobalsVarString((res as JSONThemes.GradientDefinition).definition, theme);

    if (!allowGradient && !(typeof res === "string"))
      return resolveGlobalsVarString((res as JSONThemes.GradientDefinition).fallbackBackground, theme) || "";

    return `${res}`;
  });
};

/**
 * Function to either resolve a color or a gradient defintion
 * @returns a valid CSS color/gradient def
 */
const resolveBackdropFilterDefinition = (
  obj: JSONThemes.BackdropFilterDefinition | string,
  theme: JSONThemes.ConfigShape
): object => {
  if (typeof obj === "string" && obj.startsWith("$$"))
    return resolveBackdropFilterDefinition(resolveGlobalsVar(obj, theme, (resolvedObject) => resolvedObject), theme);

  return {
    "backdropFilter": resolveGlobalsVarString(
      (obj as JSONThemes.BackdropFilterDefinition).definition,
      theme
    ),
    "@supports not (backdrop-filter: blur(1px))": {
      background: resolveColorsDefinition((obj as JSONThemes.BackdropFilterDefinition).fallbackBackground, theme, true)
    }
  };
};

/**
 * theming border set defintion to CSS
 */

const borderSetToCss = (borderSet: JSONThemes.BorderSet | string, theme: JSONThemes.ConfigShape): object => {
  if (Array.isArray(borderSet))
    return deepmerge(...borderSet.map((_def) => borderSetToCss(_def, theme)).flat(1)) as object;

  const set: JSONThemes.BorderSet = typeof borderSet === "string" ? theme.sets.borderSets[getVarName(borderSet)] : borderSet;

  if (!set) return {};

  const resolveDefinition = (tdef: JSONThemes.BorderShape, context: string) => {
    return Object.assign(
      {},
      tdef.image && { [`border${context}-image`]: resolveGlobalsVarString(tdef.image, theme) },
      tdef.style && { [`border${context}-style`]: resolveGlobalsVarString(tdef.style, theme) },
      tdef.width && { [`border${context}-width`]: resolveGlobalsVarString(tdef.width, theme) }
    );
  };

  const resolveBorderMap = (bmp: JSONThemes.Transitionable<JSONThemes.BorderShape>) => {
    return Object.assign(
      {},
      resolveDefinition(bmp, ""),
      bmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(bmp.transitionSpeed, theme) },
      bmp.bottom && resolveDefinition(bmp.bottom, "-bottom"),
      bmp.left && resolveDefinition(bmp.left, "-left"),
      bmp.right && resolveDefinition(bmp.right, "-right"),
      bmp.top && resolveDefinition(bmp.top, "-top"),
      bmp.radius && { "border-radius": resolveGlobalsVarString(bmp.radius, theme) },
      bmp.clipPath && { "clip-path": resolveGlobalsVarString(bmp.clipPath, theme) }
    );
  };

  const resolvedSet = Object.assign(
    {},
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

  return Object.assign(
    {},
    ...Object.entries(deepmerge(set.__extends ? borderSetToCss(set.__extends, theme) : 0, resolvedSet))
      .sort(sortCssNestings)
      .map(([ key, value ]) => ({ [key]: value }))
  );
};

/**
 * theming color set defintion to CSS
 */

const colorSetToCss = (
  colorSet: JSONThemes.ColorSet | JSONThemes.ColorSets | string,
  theme: JSONThemes.ConfigShape
): object => {
  if (Array.isArray(colorSet))
    return deepmerge(...colorSet.map((_def) => colorSetToCss(_def, theme)).flat(1)) as object;

  const set: JSONThemes.ColorSet = typeof colorSet === "string" ? theme.sets.colorSets[getVarName(colorSet)] : colorSet;

  if (!set) return {};

  const resolveColorMap = (cmp: JSONThemes.Transitionable<JSONThemes.ColorShape>) => {
    return Object.assign(
      {},
      // TODO cmp.__extends &&
      cmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(cmp.transitionSpeed, theme) },
      cmp.background && { background: resolveColorsDefinition(cmp.background, theme, true) },
      cmp.border && { borderColor: resolveColorsDefinition(cmp.border, theme) },
      cmp.filter && { filter: resolveGlobalsVarString(cmp.filter, theme) },
      cmp.backdropFilter && resolveBackdropFilterDefinition(cmp.backdropFilter, theme),
      cmp.foreground && { color: resolveColorsDefinition(cmp.foreground, theme) },
      cmp.icon && { "& svg": { color: resolveGlobalsVarString(cmp.icon, theme) }},
      cmp.shadow && { boxShadow: resolveGlobalsVarString(cmp.shadow, theme) }
    );
  };

  const resolvedSet = Object.assign(
    {},
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

  return Object.assign(
    {},
    ...Object.entries(deepmerge(set.__extends ? colorSetToCss(set.__extends, theme) : {}, resolvedSet))
      .sort(sortCssNestings)
      .map(([ key, value ]) => ({ [key]: value }))
  );
};

/**
 * theming font set defintion to CSS
 */

const fontSetToCss = (
  fontSet: JSONThemes.FontSet | JSONThemes.FontSets | string,
  theme: JSONThemes.ConfigShape
): object => {
  if (Array.isArray(fontSet))
    return deepmerge(...fontSet.map((_def) => fontSetToCss(_def, theme)).flat(1)) as object;

  const set: JSONThemes.FontSet = typeof fontSet === "string" ? theme.sets.fontSets[getVarName(fontSet)] : fontSet;

  if (!set) return {};

  const resolveFontMap = (fmp: JSONThemes.Transitionable<JSONThemes.FontShape>) => {
    return Object.assign(
      {},
      fmp.transitionSpeed && { transitionDuration: resolveGlobalsVarString(fmp.transitionSpeed, theme) },
      fmp.family && { "font-family": resolveGlobalsVarString(fmp.family, theme) },
      fmp.letterSpacing && { "letter-spacing": resolveGlobalsVarString(fmp.letterSpacing, theme) },
      fmp.lineHeight && { lineHeight: resolveGlobalsVarString(fmp.lineHeight, theme) },
      fmp.size && { fontSize: resolveGlobalsVarString(fmp.size, theme) },
      fmp.style && { fontStyle: resolveGlobalsVarString(fmp.style, theme) },
      fmp.weight && { fontWeight: resolveGlobalsVarString(fmp.weight, theme) },
      fmp.transform && { textTransform: resolveGlobalsVarString(fmp.transform, theme) },
      fmp.decoration && { textDecoration: resolveGlobalsVarString(fmp.decoration, theme) }
    );
  };

  const resolvedSet = Object.assign(
    {},
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

  return Object.assign(
    {},
    ...Object.entries(deepmerge(set.__extends ? fontSetToCss(set.__extends, theme) : {}, resolvedSet))
      .sort(sortCssNestings)
      .map(([ key, value ]) => ({ [key]: value }))
  );
};

/**
 * resolve box defintions from either global boxSets or from neighbour variant definitions
 */

export const resolveBoxDefinition = (
  def: string | JSONThemes.BoxSet | undefined,
  theme: JSONThemes.ConfigShape,
  context?: string
): JSONThemes.BoxSet | null => {
  if (!def) return null;

  if (Array.isArray(def))
    return deepmerge(def.map((x) => resolveBoxDefinition(x, theme, context)).flat(1)) as object;

  if (typeof def === "string" && def.startsWith("$$")) {
    const guess = theme.sets.boxSets[getVarName(def)] || null;

    if (guess) return guess;

    if (context) {
      const otherSource = getDeepAttribute(theme.components, context.split("."), null);

      if (context.includes("parts") && otherSource[getVarName(def)]) return otherSource[getVarName(def)];
      if (otherSource.variants && otherSource.variants[getVarName(def)]) return resolveBoxDefinition(
        otherSource.variants[getVarName(def)]?.theming,
        theme,
        context
      );

      return null;
    }

    return null;
  }

  if (typeof def === "object") return def;

  return null;
};

const resolveBeforeAfter = (
  mode: "before" | "after",
  inp: JSONThemes.BeforeAfterDefinition,
  target: Array<any>,
  theme: JSONThemes.ConfigShape
) => {
  const slctr = `&::${mode}`;

  return target.push({
    [slctr]: Object.fromEntries(Object.keys(inp).map((key) => {
      if (key === "content") return ([ key, inp && `"${inp[key]}"` ]);
      if (key === "transitionSpeed") return ([ "transitionDuration", resolveGlobalsVarString(inp[key], theme) ]);

      return ([ key, resolveGlobalsVarString(inp && inp[key], theme) ]);
    }))
  });
};

/**
 * Resolve complete box definitions including the sets to CSS
 * @returns Box Definition CSS
 */

export const boxDefToCssProps = (
  boxDef: JSONThemes.BoxSet | null,
  theme: JSONThemes.ConfigShape,
  context?: string
): Array<object> => {
  const res = [];

  if (!boxDef) return [];

  if (Array.isArray(boxDef))
    return [ deepmerge(...(boxDef.map((_dev) => boxDefToCssProps(_dev, theme, context)).flat(1))) as object[] ];

  if (boxDef.__extends)
    res.push(...boxDefToCssProps(
      resolveBoxDefinition(boxDef.__extends, theme, context),
      theme,
      context
    ));

  if (boxDef.transform)
    res.push({
      "transform":   resolveGlobalsVarString(boxDef.transform, theme),
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
    res.splice(0, 0, {
      [selectors.hover]: boxDefToCssProps(boxDef.__hover, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });

  if (boxDef.__active)
    res.splice(0, 0, {
      [selectors.active]: boxDefToCssProps(boxDef.__active, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });

  if (boxDef.__focus)
    res.splice(0, 0, {
      [selectors.focus]: boxDefToCssProps(boxDef.__focus, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });

  if (boxDef.__focusVisible)
    res.splice(0, 0, {
      [selectors.focusVisible]: boxDefToCssProps(boxDef.__focusVisible, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });

  if (boxDef.__checked)
    res.splice(0, 0, {
      [selectors.checked]: boxDefToCssProps(boxDef.__checked, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });

  if (boxDef.__disabled)
    res.splice(0, 0, {
      [selectors.disabled]: boxDefToCssProps(boxDef.__disabled, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });

  if (boxDef.__invalid)
    res.splice(0, 0, {
      [selectors.invalid]: boxDefToCssProps(boxDef.__invalid, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });

  if (boxDef.__pressed)
    res.splice(0, 0, {
      [selectors.pressed]: boxDefToCssProps(boxDef.__pressed, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });

  if (boxDef.__current)
    res.splice(0, 0, {
      [selectors.current]: boxDefToCssProps(boxDef.__current, theme, context)
        .reduce((prev, curr) => ({
          ...prev,
          ...curr
        }), {})
    });


  if (res.length === 0) return [];

  const merged = deepmerge(...res) as object;
  const sorted = Object.fromEntries(Object.entries(merged).sort(sortCssNestings));

  return [ sorted ];
};
