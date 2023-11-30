/* eslint-disable */
import { defineConfig } from "vite";
const path = require("path");
import react from "@vitejs/plugin-react";
import { peerDependencies } from './package.json'

const config = {
	libName: "@circle/json-themes"
}

// https://vitejs.dev/config/
export default defineConfig(() => {
	return {
		plugins: [react({
			jsxRuntime: "classic"
		})],
		build: {
			cssCodeSplit: false,
			emptyOutDir: true,
			sourcemap: false,
			minify: true,
			outDir: path.resolve(__dirname, "dist"),
			lib: {
				entry: path.resolve(__dirname, "src/lib/index.ts"),
				name: config.libName,
				fileName: (format) => `index.${format}.js`
			},
			rollupOptions: {
				external: [...Object.keys(peerDependencies)],
				cache: false,
				output: {
					exports: "named",
					compact: true,
					sourcemap: false,
					minifyInternalExports: true,
					strict: true,
					globals: {
						...Object.fromEntries(
							Object.keys(peerDependencies).map(key => {
								if(key === "react") return [key, "React"];
								if(key === "react-dom") return [key, "ReactDOM"];

								return [key, key]
							})
						)
					}
				}
			},
			commonjsOptions: {
				sourceMap: false,
				transformMixedEsModules: true
			}
		},

	}
});
