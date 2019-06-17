const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const livescript = require("rollup-plugin-livescript");
const pegjs = require("rollup-plugin-pegjs");
const extensions = require("rollup-plugin-extensions");
const { terser } = require("rollup-plugin-terser");
const replace = require("rollup-plugin-re");
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
                    const glob = require("glob")
                    const path = require("path")
                    return "({"
                        + glob
                            .sync(pattern)
                            .map(f=>`"${path.basename(f,path.extname(f))}": require("${path.resolve(f)}")`)
                            .join(',')
                        + "})";
                }
            }
        ]
    }),
    commonjs({extensions: [".js", ".ls", ".pegjs"]}),
    nodeResolve({extensions: [".js", ".ls", ".pegjs"]})
];

export default [
    {
        input: "src/index.js",
        output: [
            {
                format: "esm",
                sourcemap: true,
                file: "dist/latex.esm.min.js"
            },
            {
                format: "umd",
                sourcemap: true,
                name: "latexjs",
                file: "dist/latex.min.js"
            }
        ],
        plugins: [
            ...plugins,
            terser({keep_classnames: true})
        ]
    },
    {
        input: "src/index.js",
        output: [
            {
                format: "esm",
                sourcemap: true,
                file: "dist/latex.esm.js"
            },
            {
                format: "umd",
                sourcemap: true,
                name: "latexjs",
                file: "dist/latex.js"
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
            file: "docs/js/playground.bundle.min.js"
        },
        plugins: [
            ...plugins,
            terser({keep_classnames: true})
        ]
    }
]
