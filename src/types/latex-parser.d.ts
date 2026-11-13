// typings for the peggy-generated LaTeX parser (src/parser/latex-parser.pegjs, built by lib/vite-plugin-peggy.ts)

declare module "*.pegjs" {
    import type { parser, ParserOptions } from "peggy";
    import type { Generator } from "../generator/generator.ts";

    export interface LaTeXParserOptions<G extends Generator> extends ParserOptions {
        generator: G;
    }

    /** parses the given LaTeX source with the given generator and returns that generator */
    export function parse<G extends Generator>(input: string, options: LaTeXParserOptions<G>): G;

    export const SyntaxError: typeof parser.SyntaxError;
    export type SyntaxError = parser.SyntaxError;
}
