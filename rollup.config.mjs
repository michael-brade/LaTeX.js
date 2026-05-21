import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livescript from "./lib/rollup-plugin-livescript.js";
import pegjs from "./lib/rollup-plugin-pegjs.mjs";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import ignoreInfiniteLoop from "./lib/pegjs-no-infinite-loop.mjs";

const prod = process.env.NODE_ENV === "production"

// Shared plugin chain - inlined into each config below so each
// output can have its own externals.
const buildPlugins = () => [
    // resolve before pegjs so that the filter in pegjs has less left to do
    resolve({extensions: [".js", ".ls"], preferBuiltins: true}),
    pegjs({plugins: [ignoreInfiniteLoop], target: "commonjs", exportVar: "parser", format: "bare", trace: false}),
    livescript(),
    commonjs({ ignoreDynamicRequires: true }),
    visualizer({
        filename: 'dist/latex.stats.html',
        sourcemap: prod,
        // template: 'network'
    })
]

export default [
    // ESM output: externalize katex so bundler-using consumers
    // (esbuild, vite, rollup with externals, webpack with
    // externals) supply it themselves and don't ship two copies.
    // Listed as a peerDependency so consumers know they have to.
    {
        input: "src/index.mjs",
        external: ["katex"],
        plugins: buildPlugins(),
        output: [{
            file: "dist/latex.mjs",
            format: "es",
            sourcemap: prod,
            plugins: [...(prod ? [terser()] : [])]
        }]
    },
    // UMD output: legacy <script> users have no peer-dep
    // mechanism, so keep KaTeX bundled here.
    {
        input: "src/index.mjs",
        plugins: buildPlugins(),
        output: [{
            file: "dist/latex.js",
            format: "umd",
            name: "latexjs",
            sourcemap: prod,
            plugins: [
                {
                    name: 'import-meta-to-umd',
                    resolveImportMeta(property) {
                        if (property === 'url') {
                          return `document.currentScript && document.currentScript.src`;
                        }
                        return null;
                    }
                },
                ...(prod ? [terser()] : [])
            ]
        }]
    }
]
