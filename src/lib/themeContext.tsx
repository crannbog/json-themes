import React, { PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThemeManager } from "./themeManager.ts";
import { ComponentsConfig, IThemeManager, ThemingConfig } from "./types.ts";
import { deepmerge } from "deepmerge-ts";

export const ThemingContext = React.createContext<null | ComponentsConfig[]>([]);

type ThemingContexType = {
    name: string,
    components: ComponentsConfig[]
    globalStyles: Function // eslint-disable-line @typescript-eslint/ban-types
}

export const ThemingProvider = (props: PropsWithChildren<{
    themingConfig?: ThemingConfig,
    pool?: ThemingConfig[],
    suppressTransitionsTimeout?: number
}>) => {
    const manager = useRef<IThemeManager>(new ThemeManager());
    const [theme, setTheme] = useState<ThemingContexType | null>(null);
    const [suppressTransitions, setSuppressTransitions] = useState(false);

    useEffect(() => {
        if(manager.current)
            manager.current.init(React.createElement);
    }, [manager.current]);

    useEffect(() => {
        if(!props.themingConfig)
            throw new Error("No Theming Config provided");

        if(manager.current && props.themingConfig && props.themingConfig.name !== theme?.name) {
            const result = manager.current.loadTheme(props.themingConfig, props.pool);

            setSuppressTransitions(true);

            setTheme(deepmerge(result));
        }
    }, [manager.current, props, theme]);

    useLayoutEffect(() => {
        if(suppressTransitions) {
            const stls = document.createElement("style");

            stls.innerHTML = "html,body * { transition-duration: 0s !important; }";
            stls.id = "__suppressTransitionsDecl";

            document.head.appendChild(stls);

            const timer = setTimeout(() => setSuppressTransitions(false), props.suppressTransitionsTimeout || 333);

            return () => clearTimeout(timer);
        }

        document.getElementById("__suppressTransitionsDecl")?.remove();

        return () => {};
    }, [suppressTransitions]);

    return <>
        <ThemingContext.Provider value={[...(theme?.components || [])]}>
            {theme && props.children}
        </ThemingContext.Provider>
    </>;
};
