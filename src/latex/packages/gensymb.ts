import type { Generator } from '../../generator/generator.ts';
import type { PackageOpts } from "../../options.ts";


export class Gensymb
{
    constructor(generator: Generator, options?: PackageOpts)
    {
    }

    // TODO: implement package options

    // the symbols map is just a shortcut and technically equivalent to defining a function (macro)
    // that returns generator.createText(symbol)
    public static symbols: Map<string, string> = new Map([
        ["degree",               "\u00B0"],     // °
        ["celsius",              "\u2103"],     // ℃
        ["perthousand",          "\u2030"],     // ‰
        ["ohm",                  "\u2126"],     // Ω
        ["micro",                "\u03BC"]      // μ
    ]);
}
