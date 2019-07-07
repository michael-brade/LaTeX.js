import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import livescript from "rollup-plugin-livescript";
import pegjs from "rollup-plugin-pegjs";
import extensions from "rollup-plugin-extensions";
import { terser } from "rollup-plugin-terser";
import babel from "rollup-plugin-babel";
import postcss from "rollup-plugin-postcss";
import postcssURL from "postcss-url";
import postcssImport from "postcss-import";
const ignoreErrors = require('./src/plugin-pegjs.js');

const prod = process.env.NODE_ENV === "production"

const plugins = (format) => [
    extensions({extensions: [".js", ".ls", ".pegjs"]}),
    pegjs({plugins: [ignoreErrors], target: "commonjs", format: "commonjs"}),
    livescript(),
    babel({
        extensions: ['.js','.ls'],
        exclude: /node_modules/,
        plugins: ["macros", "@babel/plugin-syntax-dynamic-import"]
    }),
    postcss({
        plugins: [
            postcssImport(),
            postcssURL({ url: "inline", filter: /\.woff2?$/ })
        ],
        inject: false
    }),
    commonjs({extensions: [".js", ".ls", ".pegjs"]}),
    resolve({extensions: [".js", ".ls", ".pegjs"]}),
    ...(prod ? [terser({keep_classnames:true})] : [])
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
            plugins: plugins("esm")
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
process.env.GOAL === "playground" ?
        {
            input: "docs/js/playground.js",
            output: {
                format: "umd",
                sourcemap: prod,
                name: "Playground",
                file: "docs/js/playground.bundle.js"
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
            plugins: plugins("esm")
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
