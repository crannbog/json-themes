
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
    __checked?: Transitionable<T>,
    __current?: Transitionable<T>,
    __disabled?: Transitionable<T>,
    __focus?: Transitionable<T>,
    __focusVisible?: Transitionable<T>,
    __hover?: Transitionable<T>,
    __invalid?: Transitionable<T>,
    __pressed?: Transitionable<T>
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
export type ThemingBoxDefinition = ThemingSet<{
    height?: ThemingDefinition,
    padding?: ThemingDefinition,
    width?: ThemingDefinition,
    transform?: ThemingDefinition
}> & Extendable<{
    borderSet?: string | ThemingBorderSet,
    colorSet?: string | ThemingColorSet,
    fontSet?: string | ThemingFontSet
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

export type ThemingConfigFile = {
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

export type ComponentVariant = {
    variant: string;
    className: string;
    defaultProps: object;
    parts: {
        [key: string]: string
    }
}

export type ComponentsConfig = {
    component: string
    variants: ComponentVariant[]
}

export type ThemeType = {
    name: string,
    components: ComponentsConfig[],
    globalStyles: Function // eslint-disable-line @typescript-eslint/ban-types
}

export type IThemeManager = {
    readonly __lastActiveTheme: {
        name: string,
        components: ComponentsConfig[],
        globalStyles: Function // eslint-disable-line @typescript-eslint/ban-types
    } | null
    init: (componentCreationFunction: Function) => void // eslint-disable-line @typescript-eslint/ban-types
    loadTheme: (themeConfig: ThemingConfig, pool?: ThemingConfig[]) => {
        components: ComponentsConfig[],
        globalStyles: Function // eslint-disable-line @typescript-eslint/ban-types,
        name: string
    } | null
}
