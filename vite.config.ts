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
                // emit src/**/*.ts to dist/types/**/*.d.ts: entryRoot is the part of each source path that
                // gets removed before the rest is appended to outDirs (default: the smallest common directory
                // of all sources, so set it explicitly to keep the layout stable)
                entryRoot: "src",
                // .d.ts for "import", plus a CommonJS copy as .d.cts for "require" (package.json "exports"):
                // in a "type": "module" package, .d.ts files are ESM types, and a CJS consumer can't use them
                // (TS1479 with "node16"); the .d.cts files import each other with ".cjs" specifiers
                outDirs: ["dist/types", { dir: "dist/types", moduleFormat: "cjs" }],
                // also copy hand-written declarations (currently only src/parser/latex-parser.pegjs.d.ts)
                copyDtsFiles: true,
                exclude: ["node_modules/**", "src/cli.ts"],
                beforeWriteFile: (filePath, content) => {
                    // "./latex-parser.pegjs" only resolves to latex-parser.pegjs.d.ts with moduleResolution
                    // "bundler"; "./latex-parser.pegjs.ts" also works with "node16"/"nodenext"
                    content = content.replace(/(latex-parser\.pegjs)(['"])/g, "$1.ts$2")

                    // unplugin-dts only rewrites the first import() of a nested type, e.g.
                    // import('../util/stack.cjs').default<import('./groups.ts').StackItem>; fix the rest, or
                    // the .d.cts would reference the ESM .d.ts (TS1542 with "node16")
                    if (filePath.endsWith(".d.cts"))
                        content = content.replace(/(['"]\.\.?\/[^'"]*)\.ts(['"])/g, "$1.cjs$2")

                    return { content }
                },
                compilerOptions: {
                    stripInternal: true     // drop members marked @internal from the published types
                },
                insertTypesEntry: false,    // package.json points to dist/types/index.d.ts directly
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
