import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livescript from "./lib/rollup-plugin-livescript";
import pegjs from "./lib/rollup-plugin-pegjs";
import { terser } from "rollup-plugin-terser";
import sourcemaps from 'rollup-plugin-sourcemaps';
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
        commonjs({
            extensions: [".js", ".ls"],
            ignore: ["svgdom"]
        }),
        visualizer({
            filename: 'dist/latex.stats.html',
            sourcemap: prod,
            // template: 'network'
        })
    ],
    output: [{
        file: "dist/latex.mjs",
        format: "esm",
        sourcemap: prod,
        plugins: [...(prod ? [terser()] : [])]
    }, {
        file: "dist/latex.js",
        format: "umd",
        name: "latexjs",
        sourcemap: prod,
        plugins: [...(prod ? [terser()] : [])]
    }]
}, {
    // ES6 modules cannot be used without MIME types, so they don't work from local files,
    // therefore also create a commonjs webcomponent for local usage
    input: "src/latex.component.mjs",
    plugins: [
        resolve(),
        sourcemaps()
    ],
    output: {
        file: "dist/latex.component.js",
        format: "umd",
        name: "LaTeXJSComponent",
        sourcemap: prod
    }
}]
