import React, { PropsWithChildren, useEffect, useState } from "react";
import { ComponentsConfig, IThemeManager, ThemeManager } from "./themeManager";
import { ThemingConfig } from "./types";

export const ThemingContext = React.createContext<null | ComponentsConfig[]>(null);

export const ThemingProvider = (props: PropsWithChildren<{
    themingConfig: ThemingConfig,
    pool?: ThemingConfig[],
    suppressTransitionsTimeout?: number
}>) => {
    const [manager, setManager] = useState<IThemeManager>();
    const [theme, setTheme] = useState<{
        components: ComponentsConfig[]
        globalStyles: Function // eslint-disable-line @typescript-eslint/ban-types
    } | null>(null);
    const [suppressTransitions, setSuppressTransitions] = useState(false);

    useEffect(() => {
        const mgr = new ThemeManager();

        mgr.init(React.createElement);

        setManager(mgr);
    }, []);

    useEffect(() => {
        if(!props.themingConfig)
            throw new Error("No Theming Config provided");


        if(manager && props.themingConfig) {
            const result = manager.loadTheme(props.themingConfig, props.pool);

            setSuppressTransitions(true);

            setTheme(result);
        }
    }, [manager, props.themingConfig]);

    useEffect(() => {
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
        <ThemingContext.Provider value={theme?.components || null}>
            {props.children}
        </ThemingContext.Provider>
    </>;
};
