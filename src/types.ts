// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JSONThemes {
  export type Defaults = "inherit" | "initial" | "unset";
  export type ColorDefaults = "currentColor" | "transparent" | Defaults;

  /**
   * A reference can refer to different things within the json file.
   * As a value it refers to a value within the "globals" section.
   * As "__extends" it refers to the current scope, like the name of a colorSet or fontSet.
   */
  export type Reference = `$$${string}`;
  /**
   * A "value", can be valid CSS or a Reference
   */
  export type Definition = string | Reference | null;

  /**
   * Extendable means "can inherit from..."
   */
  export type Extendable<T> = T & {
    __extends?: Reference
  };

  /**
   * an entity which accepts the "transition" css property.
   * Why? Animations should be bound to the components/ui and are not part of theming.
   * But the duration of an animation can differ between themes.
   */
  export type Transitionable<T> = T & {
    transitionSpeed?: Definition
  };

  /**
   * A ThemingSet is the default entity
   */
  export type Set<T> = {
    __active?:       Transitionable<T>
    __checked?:      Transitionable<T>
    __current?:      Transitionable<T>
    __disabled?:     Transitionable<T>
    __focus?:        Transitionable<T>
    __focusVisible?: Transitionable<T>
    __hover?:        Transitionable<T>
    __invalid?:      Transitionable<T>
    __pressed?:      Transitionable<T>
  } & Transitionable<T>;

  /**
   * Gradients are treated special to support fallback colors for elements which don' support gradients
   */
  export type GradientDefinition = {
    definition:         Definition
    fallbackBackground: Definition
  };

  export type ColorDefinition = Definition | GradientDefinition | ColorDefaults;

  /**
   * Define backdrop CSS filter with fallback possibilities.
   */
  export type BackdropFilterDefinition = {
    definition:         Definition
    fallbackBackground: ColorDefinition
  };


  export type BeforeAfterDefinition = {
    content:       string
    [key: string]: Definition
  };

  /** ============= COLORS ============= */

  export type ColorShape = Extendable<{
    backdropFilter?: BackdropFilterDefinition | Reference
    background?:     Definition
    border?:         Definition
    filter?:         Definition
    foreground?:     Definition
    icon?:           Definition
    shadow?:         Definition
  }>;

  export type ColorSet = Set<ColorShape> & {
    __selection?: {
      foreground: Definition
      background: Definition
    }
  };

  export type ColorSets = {
    [key: string]: ColorSet
  };

  /** ============= Fonts ============= */

  export type FontShape = Extendable<{
    family?:        Definition
    letterSpacing?: Definition
    lineHeight?:    Definition
    size?:          Definition
    style?:         "italic" | "oblique" | "normal" | Defaults | Definition
    transform?:     Definition
    weight?:        Definition
    decoration?:    "none" | "underline" | "overline" | "line-through" | null | Definition
  }>;

  export type FontSet = Set<FontShape>;

  export type FontSets = {
    [key: string]: FontSet
  };

  /** ============= Borders ============= */

  export type BorderDefinition = {
    image?: Definition
    style?: "dotted" | "dashed" | "solid" | "double" | "groove" | "ridge" | "inset" | "outset" | "none" | "hidden" | Defaults
    width?: Definition
  };

  export type BorderShape = Extendable<{
    radius?:   Definition
    clipPath?: Definition
    bottom?:   BorderDefinition
    left?:     BorderDefinition
    right?:    BorderDefinition
    top?:      BorderDefinition
  } & BorderDefinition>;

  export type BorderSet = Set<BorderShape>;

  export type BorderSets = {
    [key: string]: BorderSet
  };

  /** ============= Box ============= */

  export type BoxShape = Extendable<{
    height?:    Definition
    width?:     Definition
    padding?:   Definition
    transform?: Definition
    borderSet?: Reference | BorderSet
    colorSet?:  Reference | ColorSet
    fontSet?:   Reference | FontSet
  }>;

  export type BoxSet = Set<BoxShape & {
    before?: BeforeAfterDefinition
    after?:  BeforeAfterDefinition
  }>;

  export type BoxSets = {
    [key: string]: BoxSet
  };

  /** ============= Config ============= */

  /**
   * Allow JSON tree structures
   */
  export type GlobalsType = {
    [key: string]: string | number | GlobalsType
  };

  export type Variant = Extendable<{
    theming?: Reference | BoxSet
    parts?: {
      [key: string]: Reference | BoxSet
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultProps?: Record<string, any>
  }>;

  export type Component = Extendable<{
    default?:  Variant
    variants?: {
      [key: string]: Variant
    }
  }>;

  export type ConfigShape = {
    name:     string
    basedOn?: string
    meta:     Record<string, object>
    globals:  GlobalsType
    sets: {
      borderSets: BorderSets
      fontSets:   FontSets
      colorSets:  ColorSets
      boxSets:    BoxSets
    }
    components: {
      [key: string]: Component
    }
  };

  export type ComponentContext = {
    className:    string
    defaultProps: object
    parts: {
      // returns another className for each part
      [partName: string]: string
    }
  };

  export type Context = {
    [component: string]: {
      [variant: string]: ComponentContext
    }
  };
}
