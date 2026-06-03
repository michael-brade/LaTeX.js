import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from '@rollup/plugin-typescript';
import livescript from "./lib/rollup-plugin-livescript.js";
import pegjs from "./lib/rollup-plugin-pegjs.mjs";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import ignoreInfiniteLoop from "./lib/pegjs-no-infinite-loop.mjs";

const prod = process.env.NODE_ENV === "production"

export default [
// library build
{
    input: "src/index.mjs",
    plugins: [
        // resolve before pegjs so that the filter in pegjs has less left to do
        resolve({extensions: [".js", ".ls"], preferBuiltins: true}),
        pegjs({plugins: [ignoreInfiniteLoop], target: "commonjs", exportVar: "parser", format: "bare", trace: false}),
        livescript(),
        commonjs({ ignoreDynamicRequires: true }),
        visualizer({
            filename: './dist/latex.stats.html',
            sourcemap: prod,
            // template: 'network'
        })
    ],
    output: [{
        file: "./dist/latex.mjs",
        format: "es",
        sourcemap: prod,
        plugins: [...(prod ? [terser()] : [])]
    }, {
        file: "./dist/latex.cjs",
        format: "cjs",
        sourcemap: prod,
        plugins: [...(prod ? [terser()] : [])]
    }, {
        file: "./dist/latex.umd.js",
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
},

// cli build
{
    input: 'src/cli.ts',
    plugins: [
        typescript({
            compilerOptions: {
                "module": "NodeNext",
                "moduleResolution": "NodeNext",
                "rewriteRelativeImportExtensions": false
            }
        })
    ],
    output: {
        file: 'bin/latex.js',
        format: 'es',
        importAttributesKey: 'with',
        banner: '#!/usr/bin/env node'
    },
    external: (id) => true
}
]
