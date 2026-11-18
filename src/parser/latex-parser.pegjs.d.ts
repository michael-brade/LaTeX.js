// Types of the peggy-generated LaTeX parser (latex-parser.pegjs, compiled by lib/vite-plugin-peggy.ts).
//
// TypeScript resolves the import "./latex-parser.pegjs" to this file, and unplugin-dts copies it to
// dist/, so it is part of the published types. It mirrors peggy's types instead of importing them,
// because peggy is only a devDependency.

import type { Generator } from "../generator/generator.ts";


/** a position in the parsed source */
export interface Location {
    /** line (1-based) */
    line: number;
    /** column (1-based) */
    column: number;
    /** offset (0-based) */
    offset: number;
}

/** the start and end position of something in the parsed source */
export interface LocationRange {
    /** the `grammarSource` option given to `parse()` */
    source: any;
    start: Location;
    /** position after the end */
    end: Location;
}

/** what the parser expected at the position of a SyntaxError */
export type Expectation =
    | { type: "literal"; text: string; ignoreCase: boolean }
    | { type: "class"; parts: (string[] | string)[]; inverted: boolean; ignoreCase: boolean; unicode: boolean }
    | { type: "any" }
    | { type: "end" }
    | { type: "other"; description: string };


export interface LaTeXParserOptions<G extends Generator> {
    /** the generator that receives the parsed document */
    generator: G;
    /** attached to every LocationRange, e.g. the file name */
    grammarSource?: any;
    startRule?: string;
    [key: string]: any;
}


/** parses the given LaTeX source with the given generator and returns that generator */
export function parse<G extends Generator>(input: string, options: LaTeXParserOptions<G>): G;


/** thrown by parse() if the LaTeX source cannot be parsed */
export class SyntaxError extends globalThis.SyntaxError {
    /** where the error happened */
    location: LocationRange;
    /** possible tokens at the error position, or `null` if the error was raised by `error()` */
    expected: Expectation[] | null;
    /** the character at the error position, or `null` if the error was raised by `error()` */
    found: string | null;

    /** a detailed error message, given the parsed sources (matched by `grammarSource`) */
    format(sources: { source: any; text: string }[]): string;

    static buildMessage(expected: Expectation[], found: string | null): string;
}
