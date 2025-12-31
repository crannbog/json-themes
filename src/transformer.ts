/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  deepmerge, deepmergeCustom
} from "deepmerge-ts";
import {
  boxDefToCssProps, resolveBoxDefinition, resolvePropsVars
} from "./resolvers.ts";
import { getVarName } from "./tools.ts";
import type { JSONThemes } from "./types.ts";
import * as goober from "goober";

const css = goober.css;

/**
 * Resolve a Component in themeConfig.components. Includes resolving default def, variants and defaultProps
 * Config will include the CSS ClassNames for the component and the parts for all variants.
 * @param component The component
 * @param theme The theming config
 * @returns ComponentConfig
 */
// eslint-disable-next-line complexity
export const resolveComponent = (component: string, theme: JSONThemes.ConfigShape): JSONThemes.Context => {
  const componentConfig = theme.components[component];

  if (!componentConfig)
    return {
      [component]: {}
    };

  const extendedStuff = componentConfig.__extends ? resolveComponent(getVarName(componentConfig.__extends), theme) : {};

  const variants = [
    componentConfig.default && {
      variant: "default",
      parts:   componentConfig.default.parts
        ? Object.keys(componentConfig.default.parts as object).map((key) => ([
          key,
          componentConfig.default
          && resolveBoxDefinition((componentConfig.default.parts as any)[key], theme)
        ]))
        : [],
      boxDef: resolveBoxDefinition(componentConfig.default?.theming, theme),
      props:  componentConfig.default?.defaultProps
    },
    ...(componentConfig.variants
      ? Object.keys(componentConfig.variants).filter((x) => x !== "default")
        // eslint-disable-next-line complexity
        .map((vrnt) => componentConfig.variants && ({
          variant: vrnt,
          parts:   (componentConfig.variants[vrnt]?.parts ?? componentConfig.default?.parts)
            // merge parts from default into every variant per default
            ? Object.entries(deepmerge(
              {},
              (componentConfig.default?.parts ?? {}),
              (componentConfig.variants[vrnt]?.parts as object ?? {})
            )).map(([ key, value ]) => {
              return ([
                key,
                componentConfig.variants
                && resolveBoxDefinition(value, theme)
              ]);
            })
            : [],
          boxDef: resolveBoxDefinition(componentConfig.variants[vrnt].theming, theme, component),
          props:  componentConfig.variants[vrnt].defaultProps
        }))
      : [])
  ].filter((x) => x && x.boxDef !== null);

  const res = deepmerge(extendedStuff, {
    component: component,
    variants:  variants.map((vrnt) => {
      if (!vrnt) return null;


      const context = vrnt.variant !== "default" ? `${component}` : undefined;
      const cssProps = boxDefToCssProps(vrnt.boxDef, theme, context);

      // console.log(component, vrnt.variant, cssProps);

      return ({
        variant:   vrnt.variant,
        className: vrnt.boxDef ? css(cssProps as any) : "",
        parts:     Object.fromEntries(vrnt.parts.map((part: any) => ([
          part[0], css(boxDefToCssProps(
            part[1],
            theme,
            `${component}.${vrnt.variant === "default" ? "default.parts" : `variants.${vrnt.variant}.parts`}`
          ) as never) || ""
        ]))),
        defaultProps: resolvePropsVars(vrnt.props, theme) || {}
      });
    })
  });

  return {
    [component]: Object.fromEntries(res.variants.filter((x) => x !== null).map((vrnt) => ([
      vrnt.variant, {
        className:    vrnt.className,
        defaultProps: vrnt.defaultProps,
        parts:        vrnt.parts
      }
    ])))
  };
};

/**
 * resolve a configuration object with inheritance
 * @param currentTheme the config
 * @param themesCache already loaded and resolved configs
 * @param allThemes other not yet loaded configs
 * @returns a resolved config (merged with inheritants)
 */
export const resolveConfig = (currentTheme: JSONThemes.ConfigShape, allThemes: JSONThemes.ConfigShape[]) => {
  const configKeys = Object.keys(currentTheme);
  const neededKeys = [ "name", "components", "globals", "sets" ];

  if (!neededKeys.every((key) => configKeys.includes(key)))
    throw Error(`Falsy Theming Configuration: Please check your Config schema for ${currentTheme.name || "config"}`);

  if (currentTheme.basedOn) {
    const resolveBasedOn = (conf: JSONThemes.ConfigShape): JSONThemes.ConfigShape => {
      if (!conf.basedOn || conf.basedOn === "") return conf;

      const merger = deepmergeCustom({
        enableImplicitDefaultMerging: true,
        mergeOthers(values, utils, meta) {
          if (meta?.parents.length === values.length
            && values.length > 1
            && ([ "theming", "colorSet", "borderSet", "fontSet" ] as (string | number | symbol)[]).includes(meta.key))
            return values;

          return utils.actions.defaultMerge;
        }
      });

      if (allThemes) {
        const res = allThemes.find((x: JSONThemes.ConfigShape) => x.name === conf.basedOn);

        if (res) return merger(resolveBasedOn(res), conf);
      }

      return conf;
    };

    return resolveBasedOn(currentTheme);
  }

  return currentTheme;
};

const checkConfig = (conf: JSONThemes.ConfigShape): boolean => {
  if (typeof conf.name !== "string") return false;

  if (!conf.components || !conf.globals || !conf.sets) return false;

  return true;
};

export const compile = (configs: JSONThemes.ConfigShape[]) => {
  const output: {
    [themeName: string]: {
      css:        string
      components: JSONThemes.Context
    }
  } = {};

  // take the first component/className as base
  const classNameCache: Record<string, Record<string, string>> = {};
  // collect the classNames which will be replaced to sync classNames between themes. Variant-agnostic.
  const replaceClassNames: Record<string, string> = {};

  [ ...configs ].forEach((config) => {
    if (!checkConfig(config))
      return;

    const resolvedConfig = resolveConfig(config, configs);

    output[config.name] = {
      components: {
        ...Object.fromEntries(Object.keys(resolvedConfig.components)
          .map((compName) => {
            const resolvedComponent = resolveComponent(compName, resolvedConfig)[compName];

            const variantClassNames = Object.fromEntries(Object.keys(resolvedComponent)
              .map((item) => ([ item, resolvedComponent[item].className ])));

            Object.keys(variantClassNames).forEach((variantName) => {
              if (!classNameCache[compName])
                classNameCache[compName] = {};

              if (classNameCache[compName][variantName]) {
                resolvedComponent[variantName].className = classNameCache[compName][variantName];
                replaceClassNames[resolvedComponent[variantName].className] = classNameCache[compName][variantName];

                return;
              } else {
                classNameCache[compName][variantName] = resolvedComponent[variantName].className;

                return;
              }
            });

            return [ compName, resolvedComponent ];
          }))
      },
      css: (() => {
        const string = `${goober.extractCss()}`;

        Object.keys(replaceClassNames).forEach((key) => string.replaceAll(key, replaceClassNames[key]));

        return string;
      })()
    };
  });

  return output;
};
