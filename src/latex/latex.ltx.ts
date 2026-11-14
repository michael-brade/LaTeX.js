import type { Generator } from "../generator/generator.ts";
import { Args, Macro } from "../macros.ts";

import { symbols } from "./symbols.ts";


export class LaTeX
{
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
