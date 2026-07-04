import he from 'he';

import type { Generator } from '../generator/generator.ts';


export class Gensymb
{
    constructor(generator: Generator, options?: any)
    {
    }

    // TODO: implement package options

    public symbols: Map<string, string> = new Map([
        ["degree", he.decode('&deg;')],         // °   U+00B0
        ["celsius", "\u2103"],                  // ℃   U+2103
        ["perthousand", he.decode('&permil;')], // ‰   U+2030
        ["ohm", "\u2126"],                      // Ω   U+2126
        ["micro", he.decode('&mu;')]            // μ   U+03BC
    ]);
}
