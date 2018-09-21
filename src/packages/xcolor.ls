'use strict'


export class XColor

    args = @args = {}

    # CTOR
    (generator, options) ->



    # color

    # \definecolor{name}{model}{color specification}
    args.\definecolor = <[ HV i? c ]>


    # {name} or [model]{color specification}
    args.\color =       <[ HV i? c ]>

    # {name}{text} or [model]{color specification}{text}
    args.\textcolor =   <[ H i? c g ]>


    args.\colorbox =    <[ H i? c g ]>
    args.\fcolorbox =   <[ H i? c c g ]>
