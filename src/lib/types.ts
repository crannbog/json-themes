
export type ThemingReference = `$$${string}`
export type ThemingDefinition = string | ThemingReference | null;
type ThemingNumberDefinition = ThemingDefinition | number;
type ThemingImageDefintion = ThemingDefinition;

export type ThemingDefinitionDefaultsEnum = "inherit" | "initial" | "unset";

export type ThemingColorDefinitionDefaultsEnum = "currentColor" | "transparent";

export type Extendable<T> = T & {
    __extends?: ThemingReference
}

export type Transitionable<T> = T & {
    transitionSpeed?: ThemingNumberDefinition
}

type ThemingSet<T> = {
    __active?: Transitionable<T>,
    __disabled?: Transitionable<T>,
    __focus?: Transitionable<T>,
    __focusVisible?: Transitionable<T>,
    __hover?: Transitionable<T>
    __checked?: Transitionable<T>
} & Transitionable<T>

export type ThemingDefinitionDefaults = ThemingDefinitionDefaultsEnum;
export type ThemingColorDefinitionDefaults = ThemingDefinitionDefaultsEnum | ThemingColorDefinitionDefaultsEnum;
export type ThemingGradientDefinition = {
    definition: ThemingDefinition,
    fallbackColor: ThemingDefinition
};

export type ThemingColorDefinition = ThemingDefinition | ThemingGradientDefinition | ThemingColorDefinitionDefaults;
export type ThemingBackdropFilterDefinition = {
    definition: ThemingDefinition,
    fallbackBackground: ThemingColorDefinition
};

// Colors
export type ThemingColorMap = Extendable<{
    backdropFilter?: ThemingBackdropFilterDefinition | ThemingReference,
    background?: ThemingColorDefinition,
    border?: ThemingDefinition,
    filter?: ThemingDefinition,
    foreground?: ThemingColorDefinition,
    icon?: ThemingColorDefinition,
    shadow?: ThemingDefinition
}>;

export type ThemingColorSet = ThemingSet<ThemingColorMap> & {
    __selection?: {
        foreground: ThemingColorDefinition,
        background: ThemingColorDefinition
    }
};

export type ThemingColorSets = {
    [key: string]: ThemingColorSet
};

// Fonts
export type ThemingFontDefinition = Extendable<{
    family?: ThemingDefinition,
    letterSpacing?: ThemingNumberDefinition,
    lineHeight?: ThemingNumberDefinition,
    size?: ThemingNumberDefinition,
    style?: "italic" | "oblique" | "normal" | null | ThemingDefinitionDefaults,
    transform?: ThemingDefinition
    weight?: ThemingNumberDefinition
}>;

export type ThemingFontSet = ThemingSet<ThemingFontDefinition>;

export type ThemingFontSets = {
    [key: string]: ThemingFontSet
};

// Borders
export type ThemingBorderDefinition = {
    image?: ThemingImageDefintion,
    style?: "dotted" | "dashed" | "solid" | "double" | "groove" | "ridge" | "inset" | "outset" | "none" | "hidden",
    width?: ThemingNumberDefinition
};

export type ThemingBorderMap = Extendable<{
    radius?: ThemingNumberDefinition,
    bottom?: ThemingBorderDefinition,
    left?: ThemingBorderDefinition,
    right?: ThemingBorderDefinition,
    top?: ThemingBorderDefinition
} & ThemingBorderDefinition>;

export type ThemingBorderSet = ThemingSet<ThemingBorderMap>;

export type ThemingBorderSets = {
    [key: string]: ThemingBorderSet
};

export type ThemingBeforeAfterDefinition = {
    content: string
    [key: string]: ThemingDefinition | ThemingReference
};

// Boxes
export type ThemingBoxDefinition = Extendable<{
    animation?: "fadeIn" | "popIn" | ThemingReference,
    borderSet?: string | ThemingBorderSet,
    colorSet?: string | ThemingColorSet,
    fontSet?: string | ThemingFontSet,
    height?: ThemingDefinition,
    // margin?: ThemingDefinition,
    padding?: ThemingDefinition,
    width?: ThemingDefinition
}>;

export type ThemingBoxSet = ThemingBoxDefinition & ThemingSet<{
    before?: ThemingBeforeAfterDefinition,
    after?: ThemingBeforeAfterDefinition
}>

export type ThemingBoxSets = {
    [key: string]: ThemingBoxSet
}

// General

export type ThemingGlobalsType = {
    [key: string]: string | number | ThemingGlobalsType
};

export type ThemingConfigSets = {
    borderSets: ThemingBorderSets,
    boxSets: ThemingBoxSets
    colorSets: ThemingColorSets,
    fontSets: ThemingFontSets
};

export type ThemingVariant = Extendable<{
    theming?: ThemingReference | ThemingBoxSet,
    parts?: { [key: string]: ThemingReference | ThemingBoxSet}
    defaultProps?: object
}>;

export type ThemingComponent = Extendable<{
    default?: ThemingVariant
    variants?: {
        [key: string]: ThemingVariant
    }
}>;

export type ThemingComponents = {
    [key: string]: ThemingComponent
}

export type ThemingAnimations = {
    [key: string]: string
}

export type ThemingConfigFile = {
    animations?: ThemingAnimations
    assets?: {
        baseUrl?: string
    },
    basedOn?: string,
    components: ThemingComponents
    globals: ThemingGlobalsType,
    meta: Array<{ [key: string]: string }>,
    name: string,
    sets: ThemingConfigSets,
    version: string
};

export type ThemingConfig = ThemingConfigFile;

export type ThemeableComponentProps<T> = {
    variant?: string | null
} & T;
