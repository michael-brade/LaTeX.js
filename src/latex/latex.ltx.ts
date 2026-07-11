import type { Generator } from "../generator/generator.ts";
import { Args, HasMacros, Macro, type ArgType, type MacroMeta } from "../macros.ts";

import { symbols } from "./symbols.ts";


@HasMacros
export class LaTeX
{
    static macros = new Map<string | symbol, MacroMeta>();

    #g: Generator;

    constructor(generator: Generator, CustomMacros: new (g: Generator) => any)
    {
        this.#g = generator
    }

    public static symbols = symbols


    @Macro("V")
    @Args("g", "o?", "g")
    myMacro()
    {

    }
}
