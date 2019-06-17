const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const livescript = require("rollup-plugin-livescript");
const pegjs = require("rollup-plugin-pegjs");
const extensions = require("rollup-plugin-extensions");
const { terser } = require("rollup-plugin-terser");

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
            extensions({extensions: [".js", ".ls", ".pegjs"]}),
            pegjs({plugins: [require('./src/plugin-pegjs.js')]}),
            livescript(),
            commonjs({extensions: [".js", ".ls", ".pegjs"]}),
            nodeResolve({extensions: [".js", ".ls", ".pegjs"]}),
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
        plugins: [
            extensions({extensions: [".js", ".ls", ".pegjs"]}),
            pegjs({plugins: [require('./src/plugin-pegjs.js')]}),
            livescript(),
            commonjs({extensions: [".js", ".ls", ".pegjs"]}),
            nodeResolve({extensions: [".js", ".ls", ".pegjs"]})
        ]
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
            extensions({extensions: [".js", ".ls", ".pegjs"]}),
            pegjs({plugins: [require('./src/plugin-pegjs.js')]}),
            livescript(),
            commonjs({extensions: [".js", ".ls", ".pegjs"]}),
            nodeResolve({extensions: [".js", ".ls", ".pegjs"]}),
            terser({keep_classnames: true})
        ]
    }
]
