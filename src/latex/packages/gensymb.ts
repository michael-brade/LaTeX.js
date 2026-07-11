import he from 'he';

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
        ["degree", he.decode('&deg;')],         // °   U+00B0
        ["celsius", "\u2103"],                  // ℃   U+2103
        ["perthousand", he.decode('&permil;')], // ‰   U+2030
        ["ohm", "\u2126"],                      // Ω   U+2126
        ["micro", he.decode('&mu;')]            // μ   U+03BC
    ]);
}
