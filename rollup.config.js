import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import livescript from "rollup-plugin-livescript";
import pegjs from "rollup-plugin-pegjs";
import extensions from "rollup-plugin-extensions";
import { terser } from "rollup-plugin-terser";
import replace from "rollup-plugin-re";
import copy from 'rollup-plugin-copy';
import glob from "glob";
import path from "path";
const ignoreErrors = require('./src/plugin-pegjs.js');

const prod = process.env.NODE_ENV === "production"

const plugins = (format) => [
    extensions({extensions: [".js", ".ls", ".pegjs"]}),
    pegjs({plugins: [ignoreErrors], target: "commonjs", exportVar: "parser", format: "bare", trace: false}),
    livescript(),
    replace({
        patterns: [
            {
                match: /\/src\//,
                test: /requireAll\("([^"]+)"\)/g,
                replace(_, pattern) {
                    return "({"
                        + glob
                            .sync(pattern)
                            .map(f=>`"${path.basename(f)}": require("${path.resolve(f)}")`)
                            .join(',')
                        + "})";
                }
            }
        ],
        replaces: {
            __url: format === "esm" ? "import.meta.url" : "document.currentScript.src"
        }
    }),
    commonjs({
        extensions: [".js", ".ls", ".pegjs"],
        namedExports: {
            'src/latex-parser.pegjs': [ 'parse', 'SyntaxError' ],
            'src/generator.ls': [ 'Generator' ],
            'src/html-generator.ls': [ 'HtmlGenerator' ]
        }
    }),
    resolve({extensions: [".js", ".ls", ".pegjs"], preferBuiltins: true}),
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
            plugins: [...plugins("umd"),
                copy({
                    targets: [
                        { src: 'src/css/*', dest: 'docs/css/' },
                        { src: 'src/js/*', dest: 'docs/js/' }
                    ],
                    verbose: true
                })
            ]
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
