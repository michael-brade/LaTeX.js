import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livescript from "./lib/rollup-plugin-livescript";
import pegjs from "./lib/rollup-plugin-pegjs";
import { terser } from "rollup-plugin-terser";
import replace from "rollup-plugin-re";
import copy from 'rollup-plugin-copy';
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
                file: "dist/latex.esm.js",
                globals: {
                    svgdom: 'svgdom'
                }
            },
            external: ['svgdom'],
            plugins: [...plugins("esm"),
                visualizer({
                    filename: 'dist/latex.esm.stats.html',
                    sourcemap: true,
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
                file: "dist/latex.js",
                globals: {
                    svgdom: 'svgdom'
                }
            },
            external: ['svgdom'],
            plugins: plugins("umd")
        } :
process.env.GOAL === "playground" ?
        {
            input: "docs/js/playground.js",
            output: {
                format: "umd",
                sourcemap: prod,
                name: "Playground",
                file: "docs/.vuepress/public/js/playground.bundle.js",
                globals: {
                    svgdom: 'svgdom'
                }
            },
            external: ['svgdom'],
            plugins: [...plugins("umd"),
                copy({
                    targets: [
                        { src: 'src/css/*', dest: 'docs/css/' },
                        { src: 'src/js/*', dest: 'docs/js/' }
                    ],
                    verbose: true
                }),
                visualizer({
                    filename: 'docs/js/playground.stats.html',
                    sourcemap: true,
                    // template: 'sunburst'
                })
            ]
        } :
process.env.GOAL === "webcomponent-esm" ?
        {
            input: "src/latex.component.js",
            output: {
                format: "esm",
                sourcemap: prod,
                file: "dist/latex.component.esm.js",
                globals: {
                    svgdom: 'svgdom'
                }
            },
            external: ['svgdom'],
            plugins: [...plugins("esm"),
                visualizer({
                    filename: 'dist/latex.component.esm.stats.html',
                    sourcemap: true
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
                file: "dist/latex.component.js",
                globals: {
                    svgdom: 'svgdom'
                }
            },
            external: ['svgdom'],
            plugins: plugins("umd")
        } : {}
