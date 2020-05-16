import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livescript from "./lib/rollup-plugin-livescript";
import pegjs from "./lib/rollup-plugin-pegjs";
import { terser } from "rollup-plugin-terser";
import replace from "rollup-plugin-re";
import visualizer from 'rollup-plugin-visualizer';
import ignoreInfiniteLoop from './lib/pegjs-no-infinite-loop.js';

const prod = process.env.NODE_ENV === "production"

const plugins = (format) => [
    // resolve before pegjs so that the filter in pegjs has less left to do
    resolve({extensions: [".js", ".ls"], preferBuiltins: true}),
    pegjs({plugins: [ignoreInfiniteLoop], target: "commonjs", exportVar: "parser", format: "bare", trace: false}),
    livescript(),
    replace({
        replaces: {
            __url: format === "esm" ? "import.meta.url" : "document.currentScript.src"
        }
    }),
    commonjs({
        extensions: [".js", ".ls"],
        ignore: ["svgdom"],
        namedExports: {
            'src/latex-parser.pegjs.js': [ 'parse', 'SyntaxError' ]
        }
    }),
    ...(prod ? [terser()] : [])
];

export default
process.env.GOAL === "library-esm" ?
        {
            input: "src/index.js",
            output: {
                format: "esm",
                sourcemap: prod,
                file: "dist/latex.esm.js"
            },
            plugins: [...plugins("esm"),
                visualizer({
                    filename: 'dist/latex.esm.stats.html',
                    sourcemap: prod,
                    // template: 'network'
                })
            ]
        } :
process.env.GOAL === "library-umd" ?
        {
            input: "src/index.js",
            output: {
                format: "umd",
                sourcemap: prod,
                name: "latexjs",
                file: "dist/latex.js"
            },
            plugins: plugins("umd")
        } :
process.env.GOAL === "webcomponent-esm" ?
        {
            input: "src/latex.component.js",
            output: {
                format: "esm",
                sourcemap: prod,
                file: "dist/latex.component.esm.js"
            },
            plugins: [...plugins("esm"),
                visualizer({
                    filename: 'dist/latex.component.esm.stats.html',
                    sourcemap: prod
                })
            ]
        } :
process.env.GOAL === "webcomponent-umd" ?
        {
            input: "src/latex.component.js",
            output: {
                format: "umd",
                sourcemap: prod,
                name: "latexjs",
                file: "dist/latex.component.js"
            },
            plugins: plugins("umd")
        } : {}
