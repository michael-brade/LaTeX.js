import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livescript from "./lib/rollup-plugin-livescript";
import pegjs from "./lib/rollup-plugin-pegjs";
import { terser } from "rollup-plugin-terser";
import visualizer from 'rollup-plugin-visualizer';
import ignoreInfiniteLoop from './lib/pegjs-no-infinite-loop.js';

const prod = process.env.NODE_ENV === "production"

const plugins = () => [
    // resolve before pegjs so that the filter in pegjs has less left to do
    resolve({extensions: [".js", ".ls"], preferBuiltins: true}),
    pegjs({plugins: [ignoreInfiniteLoop], target: "commonjs", exportVar: "parser", format: "bare", trace: false}),
    livescript(),
    commonjs({
        extensions: [".js", ".ls"],
        namedExports: {
            'src/latex-parser.pegjs.js': [ 'parse', 'SyntaxError' ]
        },
        ignore: ["svgdom"]
    })
];

export default
process.env.GOAL === "library" ?
        {
            input: "src/index.js",
            output: [{
                file: "dist/latex.esm.js",
                format: "esm",
                sourcemap: prod,
                plugins: [...(prod ? [terser()] : [])]
            }, {
                file: "dist/latex.js",
                format: "umd",
                name: "latexjs",
                sourcemap: prod,
                plugins: [...(prod ? [terser()] : [])]
            }],
            plugins: [
                ...plugins(),
                visualizer({
                    filename: 'dist/latex.stats.html',
                    sourcemap: prod,
                    // template: 'network'
                })
            ]
        } :
process.env.GOAL === "webcomponent" ?
        {
            input: "src/latex.component.js",
            output: [{
                file: "dist/latex.component.esm.js",
                format: "esm",
                sourcemap: prod,
                plugins: [...(prod ? [terser()] : [])]
            }, {
                file: "dist/latex.component.js",
                format: "umd",
                name: "latexjs",
                sourcemap: prod,
                plugins: [...(prod ? [terser()] : [])]
            }],
            plugins: [
                ...plugins(),
                visualizer({
                    filename: 'dist/latex.component.stats.html',
                    sourcemap: prod
                })
            ]
        } : {}
