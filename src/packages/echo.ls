'use strict'


# macros just for testing
export class Echo

    args = @args = {}

    # CTOR
    (generator, options) ->



    args.gobbleO = <[ H o? ]>

    \gobbleO : -> []



    args.echoO = <[ H o? ]>

    \echoO : (o) ->
        [ "-", o, "-" ]


    args.echoOGO = <[ H o? g o? ]>

    \echoOGO : (o1, g, o2) ->
        []
            ..push "-", o1, "-" if o1
            ..push "+", g,  "+"
            ..push "-", o2, "-" if o2


    args.echoGOG = <[ H g o? g ]>

    \echoGOG : (g1, o, g2) ->
        [ "+", g1, "+" ]
            ..push "-", o,  "-" if o
            ..push "+", g2, "+"
