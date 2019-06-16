import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";

export default {
    input: "dist/index.js",
    output: {
        format: "esm",
        file: "dist/latex.esm.js"
    },
    plugins: [nodeResolve(), commonjs(), terser()]
}
