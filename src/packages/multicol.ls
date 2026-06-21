'use strict'

export class Multicol

    args = @args = {}

    # CTOR
    (generator, options) ->
        @g = generator


    # multicolumns

    # \begin{multicols}{number}[pretext][premulticols size]
    args.\multicols =   <[ V n o? o? ]>

    \multicols          : (cols, pre) -> [ pre, @g.create @g.multicols cols ]
