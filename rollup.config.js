import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

export default {
    input: "dist/index.js",
    output: {
        format: "esm",
        file: "dist/latex.esm.js"
    },
    plugins: [nodeResolve(), commonjs()]
}
