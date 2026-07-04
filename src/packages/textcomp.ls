import he from 'he';

import type { Generator } from '../generator/generator.ts';


export class Textcomp
{
    constructor(generator: Generator, options?: any)
    {
    }

    public symbols: Map<string, string> = new Map([
        // currencies
        ["textcentoldstyle", "\uF7A2"],        // 
        ["textdollaroldstyle", "\uF724"],      // 
        ["textguarani", "\u20B2"],             // ₲

        // legal symbols
        ["textcopyleft", "\u{1F12F}"],         // 🄯 (note the curly braces for 5-digit hex)

        // old style numerals
        ["textzerooldstyle", "\uF730"],        // 
        ["textoneoldstyle", "\uF731"],         // 
        ["texttwooldstyle", "\uF732"],         // 
        ["textthreeoldstyle", "\uF733"],       // 
        ["textfouroldstyle", "\uF734"],        // 
        ["textfiveoldstyle", "\uF735"],        // 
        ["textsixoldstyle", "\uF736"],         // 
        ["textsevenoldstyle", "\uF737"],       // 
        ["texteightoldstyle", "\uF738"],       // 
        ["textnineoldstyle", "\uF739"],        // 

        // genealogical
        ["textborn", "\u2B51"],                // ⭑             (alternatives: U+002A, U+2605, U+2736)
        ["textdied", he.decode('&dagger;')],   // †     U+2020  (alternative: U+271D)
        // ["textleaf", ""],                   // TODO

        // misc
        ["textpilcrow", he.decode('&para;')],  // ¶ U+00B6
        ["textdblhyphen", "\u2E40"]            // ⹀

        // TODO
        // ["textdblhyphenchar", ""],

        // ["textcapitalcompwordmark", ""],
        // ["textascendercompwordmark", ""],
        // ["textquotestraightbase", ""],
        // ["textquotestraightdblbase", ""],
        // ["textthreequartersemdash", ""],
        // ["texttwelveudash", ""],
        // ["capitaltie", ""],
        // ["newtie", ""],
        // ["capitalnewtie", ""],
        // ["capitalgrave", ""],
        // ["capitalacute", ""],
        // ["capitalcircumflex", ""],
        // ["capitaltilde", ""],
        // ["capitaldieresis", ""],
        // ["capitalhungarumlaut", ""],
        // ["capitalring", ""],
        // ["capitalcaron", ""],
        // ["capitalbreve", ""],
        // ["capitalmacron", ""],
        // ["capitaldotaccent", ""],
        // ["capitalcedilla", ""],
        // ["capitalogonek", ""]

        // all the other symbols are already defined by tuenc.def
    ]);
}
