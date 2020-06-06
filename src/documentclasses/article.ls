import
    './base': { Base }


export class Article extends Base

    # public static
    @css = "css/article.css"


    # CTOR
    (generator, options) ->
        super ...

        @g.setCounter \secnumdepth  3
        @g.setCounter \tocdepth     3


    args = @args = Base.args

    \refname            :-> [ "References" ]


    # toc

    args.\tableofcontents = <[ V ]>
    \tableofcontents    : -> @section(true, undefined, @g.macro(\contentsname)) ++ [ @g._toc ]


    args.\abstract =    <[ V ]>

    \abstract           :->
        # onecolumn, no titlepage
        @g.setFontSize "small"

        # TODO use center env directly instead...
        @g.enterGroup!
        @g.setFontWeight("bf")
        head = @g.create @g.list, @g.macro("abstractname"), "center"
        @g.exitGroup!

        [ head ] ++ @quotation!

    \endabstract        :!-> @endquotation!


    args.\appendix =    <[ V ]>

    \appendix           :!->
        @g.setCounter \section 0
        @g.setCounter \subsection 0
        @[\thesection] = -> [ @g.Alph @g.counter \section ]
