'use strict'

require! {
    './base': { Base }
}


export class Article extends Base

    # public static
    @css = "css/article.css"


    # CTOR
    (generator) ->
        super ...

        @g.setCounter \secnumdepth  3
        @g.setCounter \tocdepth     3


    args = @args = Base.args

    \refname            :-> [ "References" ]


    # toc

    args.\tableofcontents = <[ V ]>
    \tableofcontents    : -> @section(true, undefined, @g.macro(\contentsname)) ++ [ @g._toc ]


    args.\appendix =    <[ V ]>

    \appendix           :!->
        @g.setCounter \section 0
        @g.setCounter \subsection 0
        @[\thesection] = -> [ @g.Alph @g.counter \section ]
