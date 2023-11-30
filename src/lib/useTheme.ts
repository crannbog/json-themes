import { useContext, useEffect, useState } from "react";
import { ThemingContext } from "./themeContext";

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

    return res || null;
};

export const useThemeVariant = <T>(component: string, variant: string | null = "default"): [ThemingVariant<T> | null, T] => {
    const themeContext = useContext(ThemingContext);
    const calcThemingVariant = (_variant: string | null) => themeContext?.find(x => x.component === component)?.variants.find(vrnt => vrnt.variant === _variant) as unknown as ThemingVariant<T> || null;

    const [themingVariant, setThemingVariant] = useState<ThemingVariant<T> | null>(calcThemingVariant(variant));

    useEffect(() => {
        if(!themeContext) return () => { };
        if(variant === null) return setThemingVariant(null);

        const vrnt = calcThemingVariant(variant);

        if(vrnt === null) return console.warn(`No corresponding theme variant "${variant}" found for ${component}.`);

        return setThemingVariant(vrnt);
    }, [themeContext, component, variant]);

    return [themingVariant || null, themingVariant?.defaultProps as T];
};
