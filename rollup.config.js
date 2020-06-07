import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livescript from "./lib/rollup-plugin-livescript";
import pegjs from "./lib/rollup-plugin-pegjs";
import { terser } from "rollup-plugin-terser";
import visualizer from 'rollup-plugin-visualizer';
import ignoreInfiniteLoop from './lib/pegjs-no-infinite-loop.js';

const prod = process.env.NODE_ENV === "production"

export default [{
    input: "src/index.mjs",
    plugins: [
        // resolve before pegjs so that the filter in pegjs has less left to do
        resolve({extensions: [".js", ".ls"], preferBuiltins: true}),
        pegjs({plugins: [ignoreInfiniteLoop], target: "commonjs", exportVar: "parser", format: "bare", trace: false}),
        livescript(),
        commonjs(),
        visualizer({
            filename: 'dist/latex.stats.html',
            sourcemap: prod,
            // template: 'network'
        })
    ],
    output: [{
        file: "dist/latex.mjs",
        format: "es",
        sourcemap: prod,
        plugins: [...(prod ? [terser()] : [])]
    }, {
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
}]
