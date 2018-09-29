'use strict'

export class Hyperref

    args = @args = {}

    # CTOR
    (generator, options) ->


    # package: hyperref

    args.\href =        <[ H o? u g ]>
    \href               : (opts, url, txt) -> [ @g.create @g.link(url), txt ]

    args.\url =         <[ H u ]>
    \url                : (url) -> [ @g.create @g.link(url), @g.createText(url) ]

    args.\nolinkurl =   <[ H u ]>
    \nolinkurl          : (url) -> [ @g.create @g.link(), @g.createText(url) ]


    # TODO
    # \hyperbaseurl  HV u

    # \hyperref[label]{link text} --- like \ref{label}, but use "link text" for display
    # args.\hyperref =    <[ H o? g ]>
    # \hyperref           : (label, txt) -> [ @g.ref label ]
