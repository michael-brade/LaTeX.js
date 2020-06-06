'use strict'

import 'he'

export class Stix

    args = @args = {}

    # CTOR
    (generator, options) ->
        generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2664", "\\varspadesuit", true)     # ♤
        generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2665", "\\varheartsuit", true)     # ♥
        generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2666", "\\vardiamondsuit", true)   # ♦
        generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2667", "\\varclubsuit", true)      # ♧


    symbols = @symbols = new Map([
        * \checkmark            he.decode '&check;'     # ✓   U+2713
    ])
