import { useContext, useEffect, useState } from "react";
import { ThemingContext } from "./themeContext";
import { ComponentsConfig } from "./types";

type ThemingVariant<T = object> = {
    className: string,
    defaultProps: T,
    parts: {
        [key: string]: string
    }
    variant: string
}

export const useThemeVariants = <T>(component: string): ThemingVariant<T>[] | null => {
    const themeContext = useContext(ThemingContext);
    const [res, setRes] = useState<ThemingVariant<T>[] | null>();

    useEffect(() => {
        setRes((themeContext?.find(x => x.component === component)?.variants as ThemingVariant<T>[]) || null);
    }, [themeContext, component]);

    return res ?? null;
};

const calcThemingVariant = <T>(_variant: string | null, _comp: string, ctx: ComponentsConfig[]) =>
    ctx?.find(x => x.component === _comp)?.variants
    .find(vrnt => vrnt.variant === _variant) as unknown as ThemingVariant<T> ?? null;

export const useThemeVariant = <T>(component: string, variant: string | null = "default"): [ThemingVariant<T> | null, T] => {
    const themeContext = useContext(ThemingContext);
    const [themingVariant, setThemingVariant] = useState<ThemingVariant<T> | null>(themeContext ? calcThemingVariant<T>(variant, component, themeContext) : null);

    useEffect(() => {
        if(!themeContext) return () => { };
        if(variant === null) return setThemingVariant(null);

        const vrnt = calcThemingVariant<T>(variant, component, themeContext);

        if(vrnt === null) return console.warn(`No corresponding theme variant "${variant}" found for ${component}.`);

        return setThemingVariant(vrnt);
    }, [themeContext, component, variant]);

    return [themingVariant ?? null, (themingVariant?.defaultProps || {}) as T];
};
