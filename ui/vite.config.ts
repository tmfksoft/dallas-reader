import GlobalPolyFill from "@esbuild-plugins/node-globals-polyfill";
import NodeModulesPolyfillPlugin from "@esbuild-plugins/node-modules-polyfill";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
            plugins: [
                GlobalPolyFill({
                    process: true,
                    buffer: true,
                }),
				NodeModulesPolyfillPlugin()
            ],
        },
    },
    resolve: {
        alias: {
            process: "process/browser",
            stream: "stream-browserify",
            zlib: "browserify-zlib",
            util: "util",
			ws: "isomorphic-ws"
        },
    },
})