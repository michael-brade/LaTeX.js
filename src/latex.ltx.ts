import type { Generator } from "./generator/generator.ts";
import { Args, HasMacros, Macro, type ArgType, type MacroMeta } from "./macros.ts";


@HasMacros
export class LaTeX
{
    static macros = new Map<string | symbol, MacroMeta>();

    #g: Generator;

    constructor(generator: Generator, CustomMacros: new (g: Generator) => any)
    {
        this.#g = generator
    }

    @Macro("V")
    @Args("g", "o?", "g")
    myMacro()
    {

    }
}
