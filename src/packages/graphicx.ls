'use strict'

export class Graphicx

    args = @args = {}

    # CTOR
    (generator, options) ->

    # 3 Colour   TODO: also in xcolor - include xcolor instead?


    # 4.2 Rotation

    # rotation

    # \rotatebox[key-val list]{angle}{text}

    args.\rotatebox = <[ H kv? n hg ]>
    \rotatebox      : (kvl, angle, text) ->
        # origin=one or two of: lrctbB
        # x=<dimen>
        # y=<dimen>
        # units=<number>


    # 4.3 Scaling

    # TODO: check if they all need to be hg instead of g?

    # \scalebox{h-scale}[v-scale]{text}
    args.\scalebox = <[ H n n? g ]>
    \scalebox    : (hsc, vsc, text) ->
        # style="transform: scale(hsc, vsc);"


    # \reflectbox{text}
    args.\reflectbox = <[ H g ]>
    \reflectbox    : (text) ->
        @\scalebox -1, 1, text


    # \resizebox*{h-length}{v-length}{text}
    args.\resizebox = <[ H s l l g ]>
    \resizebox    : (s, hl, vl, text) ->


    # 4.4 Including Graphics Files

    # TODO: restrict to just one path?
    # { {path1/} {path2/} }
    args.\graphicspath = <[ HV gl ]>
    \graphicspath       : (paths) !->


    # graphics: \includegraphics*[<llx,lly>][<urx,ury>]{<file>}     TODO
    # graphicx: \includegraphics*[<key-val list>]{<file>}

    args.\includegraphics = <[ H s kv? kv? k ]>
    \includegraphics    : (s, kvl, kvl2, file) ->
        # LaTeX supports the following keys:
        #
        # set bounding box:
        #  * bb = a b c d
        #  * bbllx=a, bblly=b, bburx=c, bbury=d => equivalent to bb=a b c d
        #  * natwidth=w, natheight=h => equivalent to bb=0 0 h w
        #
        # hiresbb, pagebox
        #
        # viewport
        # trim
        #
        # angle, origin (for rotation)
        #
        # width, height
        # totalheight
        #
        # scale
        #
        # clip
        # draft
        #
        # type, ext, read, command
        #
        # quiet
        # page (when including a pdf)
        # interpolate

        # order of the keys is important! insert into map in order!

        [ @g.createImage kvl.get("width"), kvl.get("height"), file ]
