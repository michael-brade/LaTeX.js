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

const plugins = [
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
        ]
    }),
    commonjs({extensions: [".js", ".ls", ".pegjs"]}),
    resolve({extensions: [".js", ".ls", ".pegjs"]}),
    ...(process.env.NODE_ENV === "production" ? [terser({keep_classnames:true})] : [])
];

const ext = process.env.NODE_ENV === "production" ? ".min.js" : ".js"

export default [
    {
        input: "src/index.js",
        output: [
            {
                format: "esm",
                sourcemap: true,
                file: `dist/latex.esm${ext}`
            },
            {
                format: "umd",
                sourcemap: true,
                name: "latexjs",
                file: `dist/latex${ext}`
            }
        ],
        plugins
    },
    {
        input: "docs/js/playground.js",
        output: {
            format: "umd",
            sourcemap: true,
            name: "Playground",
            file: `docs/js/playground.bundle${ext}`
        },
        plugins
    },
    {
        input: "src/latex.component.js",
        output: [
            {
                format: "esm",
                sourcemap: true,
                file: `dist/latex.component.esm${ext}`
            },
            {
                format: "umd",
                sourcemap: true,
                name: "latexjsComponent",
                file: `dist/latex.component${ext}`
            }
        ],
        plugins
    }
]
