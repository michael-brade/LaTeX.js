import { Args, HasMacros, Macro, type ArgType, type MacroMeta } from "./macros.ts";



@HasMacros
export class LaTeX {
    static macros: Record<string | symbol, MacroMeta> = {};

    constructor(generator, CustomMacros) {

    }

    @Macro("V")
    @Args("g", ["o?", "g"])
    myMacro() {

    }
}
