export const dollarVarRegex = /\$\$(?:[\w.]*\|?)/gm;

/**
 * Mapping of CSS selectors for all SETs
 */
export const selectors = {
  invalid:      "&:invalid,&[aria-invalid=true],&[aria-invalid=grammar],&[aria-invalid=spelling]",
  checked:      "&:checked,&[aria-checked=true],&[aria-checked=mixed]",
  pressed:      "&[aria-pressed=true],&[aria-pressed=mixed]",
  // eslint-disable-next-line @stylistic/max-len
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
export const sortCssNestings = (a: [string, unknown], b: [string, unknown]) => {
  const order = [
    "checked",
    "pressed",
    "current",
    "focus",
    "focus-visible",
    "invalid",
    "hover",
    "active",
    "disabled"
  ];

  const _a = order.findIndex((x) => a[0].includes(x));
  const _b = order.findIndex((x) => b[0].includes(x));

  return _a - _b;
};

/**
 * Get name of a $$reference
 * @param str: string
 * @returns the name (string)
 */
export const getVarName = (str: string) => str.slice(2);

/**
 * Get a value recursive from an JSON-like object to go to a variable from some def like &&myvars.some.asdf
 * @param root Root JSON-like Object
 * @param path Path to navigate to (string array)
 * @param {*} value optional value to search on
 * @returns resolved variable from path
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
export const getDeepAttribute = (root: Record<string, any>, path: string[], value: any = null): any => {
  const val = value ?? root;

  if (!path || path.length === 0) {
    if (typeof val === "string" && val.includes("$$"))
      return `${val}`.replace(
        dollarVarRegex,
        (str) => getDeepAttribute(root, getVarName(str.replace("|", "")).split("."))
      );

    return val;
  }

  if (!val[path[0]]) return null;

  return getDeepAttribute(root, path.slice(1), val[path[0]]);
};
