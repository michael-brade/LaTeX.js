'use strict'

export class Graphicx

    args = @args = {}

    # CTOR
    (generator, options) ->



    # TODO: restrict to just one path?
    # { {path1/} {path2/} }
    args.\graphicspath = <[ HV gl ]>
    \graphicspath       : (paths) !->



    # graphics: \includegraphics*[<llx,lly>][<urx,ury>]{<file>}
    # graphicx: \includegraphics*[<key-val list>]{<file>}

    args.\includegraphics = <[ H s kv? k ]>






    # rotation

    # \rotatebox[key-val list]{angle}{text}
    args.\rotatebox =   <[ H kv? f g ]>


    # scaling

    # \scalebox{h-scale}[v-scale]{text}
    # \reflectbox{text}
    # \resizebox*{h-length}{v-length}{text}
