import { resolve } from 'node:path'

import { defineConfig } from 'vite'

import { checker } from 'vite-plugin-checker'
import dts from 'unplugin-dts/vite'

import babel from "@rolldown/plugin-babel"

import peggy from "./lib/vite-plugin-peggy.ts"

import { visualizer } from 'rollup-plugin-visualizer'
import ignoreInfiniteLoop from "./lib/peggy-plugin-no-infinite-loop.ts"


export default defineConfig(env => {

    const prod = env.mode !== 'development';

    return {
        appType: "custom",

        logLevel: "info",

        plugins: [
            checker({
                typescript: true
            }),

            babel({
                presets: [{
                    preset: () => ({
                        plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]]
                    }),
                    rolldown: {
                        filter: { code: "@" }
                    }
                }]
            }),

            peggy({
                plugins: [ignoreInfiniteLoop],
                trace: false
            }),

            dts({
                // emit to dist/src/ (see "files" in package.json), not to dist/
                // reason this works: entryRoot is the path that gets removed before the rest is appended
                // to the output directory (dist/); thus, "." means that nothing is removed, so src/...
                // is kept for all type files
                entryRoot: ".",
                // also copy hand-written declarations (currently only src/parser/latex-parser.pegjs.d.ts)
                copyDtsFiles: true,
                exclude: ["node_modules/**", "src/cli.ts"],
                beforeWriteFile: (filePath, content) => {
                    // src/types/ only has augmentations needed to compile src/ (copied, they'd lose their import)
                    // TODO: get rid of it by fixing svg.js
                    if (filePath.includes("/dist/src/types/"))
                        return false

                    // "./latex-parser.pegjs" only resolves to latex-parser.pegjs.d.ts with moduleResolution
                    // "bundler"; "./latex-parser.pegjs.ts" also works with "node16"/"nodenext"
                    return { content: content.replace(/(latex-parser\.pegjs)(['"])/g, "$1.ts$2") }
                },
                compilerOptions: {
                    stripInternal: true     // drop members marked @internal from the published types
                },
                insertTypesEntry: true,
                bundleTypes: false          // TODO: true breaks at the moment
            })
        ],

        build: {
            sourcemap: prod,
            // In lib mode, Vite never minifies whitespace of the ES output (esbuild: minifyWhitespace: false,
            // oxc: codegen: false) to keep /*#__PURE__*/ annotations for downstream tree-shaking.
            // With oxc we can re-enable it below; the annotations are kept anyway (output.comments.annotation).
            minify: prod ? 'oxc' : false,

            outDir: 'dist',
            emptyOutDir: true,

            copyPublicDir: false,

            lib: {
                entry: resolve(import.meta.dirname, "src/index.ts"),
                name: "latexjs",
                fileName: "latex",
                formats: ["es", "cjs", "umd"]
            },

            rolldownOptions: {
                // fully minify all formats, including the ES one (see "minify" above)
                output: prod ? { minify: true } : {},

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
