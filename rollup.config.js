const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const livescript = require("rollup-plugin-livescript");
const pegjs = require("rollup-plugin-pegjs");
const extensions = require("rollup-plugin-extensions");
const { terser } = require("rollup-plugin-terser");
const replace = require("rollup-plugin-re");
const glob = require("glob");
const path = require("path");
const ignoreErrors = require('./src/plugin-pegjs.js');

const prod = process.env.NODE_ENV === "production"

const plugins = (format) => [
    extensions({extensions: [".js", ".ls", ".pegjs"]}),
    pegjs({plugins: [ignoreErrors], target: "commonjs", format: "commonjs"}),
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
    commonjs({extensions: [".js", ".ls", ".pegjs"]}),
    resolve({extensions: [".js", ".ls", ".pegjs"]}),
    ...(prod ? [terser({keep_classnames:true})] : [])
];

export default [
    // library
    {
        input: "src/index.js",
        output: {
            format: "esm",
            sourcemap: prod,
            file: "dist/latex.esm.js"
        },
        plugins: plugins("esm")
    },
    {
        input: "src/index.js",
        output: {
            format: "umd",
            sourcemap: prod,
            name: "latexjs",
            file: "dist/latex.js"
        },
        plugins: plugins("umd")
    },
    // playground
    {
        input: "docs/js/playground.js",
        output: {
            format: "umd",
            sourcemap: prod,
            name: "Playground",
            file: "docs/js/playground.bundle.js"
        },
        plugins: plugins("umd")
    },
    // webcomponent
    {
        input: "src/latex.component.js",
        output: {
            format: "esm",
            sourcemap: prod,
            file: "dist/latex.component.esm.js"
        },
        plugins: plugins("esm")
    },
    {
        input: "src/latex.component.js",
        output: {
            format: "umd",
            sourcemap: prod,
            name: "latexjs",
            file: "dist/latex.component.js"
        },
        plugins: plugins("umd")
    }
]
