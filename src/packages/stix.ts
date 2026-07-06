import he from 'he'

import type { Generator } from "../generator/generator.ts";


export class Stix
{
    constructor(generator: Generator, options?: any)
    {
        // Inject custom symbols into KaTeX definitions
        generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2664", "\\varspadesuit", true);   // ♤
        generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2665", "\\varheartsuit", true);   // ♥
        generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2666", "\\vardiamondsuit", true); // ♦
        generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2667", "\\varclubsuit", true);    // ♧
    }


    public static symbols: Map<string, string> = new Map([
        ["checkmark", he.decode('&check;')] // ✓ U+2713
    ]);
}
