import path, { resolve } from 'node:path'

import { defineConfig, ConfigEnv } from 'vite';

// import { checker } from 'vite-plugin-checker';
import dts from 'unplugin-dts/vite'

import livescript from "./lib/rollup-plugin-livescript.js";
import pegjs from "./lib/rollup-plugin-pegjs.mjs";

import { visualizer } from 'rollup-plugin-visualizer';
import ignoreInfiniteLoop from "./lib/pegjs-no-infinite-loop.mjs";


export default defineConfig((env: ConfigEnv) => {

    const prod = env.mode !== 'development';

    return {
        appType: "custom",

        logLevel: "info",

        plugins: [
            // checker({
            //     typescript: true
            // }),
            livescript(),
            pegjs({
                plugins: [ignoreInfiniteLoop],
                target: "commonjs",
                exportVar: "parser",
                format: "bare",
                trace: false
            }),
            dts({
                // outDirs: './dist',
                // insertTypesEntry: true
            })
        ],

        resolve: {
            alias: {
                'node:module': path.resolve(__dirname, 'src/mocks/node-module-mock.js'),
                'module': path.resolve(__dirname, 'src/mocks/node-module-mock.js'),
            }
        },
        oxc: false, // then requires esbuild

        build: {
            sourcemap: prod,
            minify: prod ? 'esbuild' : false,

            outDir: 'dist',
            emptyOutDir: true,

            copyPublicDir: false,

            lib: {
                entry: resolve(import.meta.dirname, "src/index.js"),
                name: "latexjs",
                fileName: "latex",
                formats: ["es", "cjs", "umd"]
            },

            rolldownOptions: {
                plugins: [
                    visualizer({
                        filename: './dist/latex.stats.html',
                        sourcemap: prod
                    })
                ]
            }
        }
    }
});
