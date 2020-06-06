import
    './base': { Base }


export class Report extends Base

    # public static
    @css = "css/book.css"


    # CTOR
    (generator, options) ->
        super ...

        @g.newCounter \chapter
        @g.addToReset \section      \chapter

        @g.setCounter \secnumdepth  2
        @g.setCounter \tocdepth     2

        @g.addToReset \figure       \chapter
        @g.addToReset \table        \chapter
        @g.addToReset \footnote     \chapter



    \chaptername        :-> [ "Chapter" ]
    \bibname            :-> [ "Bibliography" ]

    args = @args = Base.args

    args
     ..\part =          \
     ..\chapter =       <[ V s X o? g ]>

    \part               : (s, toc, ttl) -> [ @g.startsection \part,          -1, s, toc, ttl ]
    \chapter            : (s, toc, ttl) -> [ @g.startsection \chapter,        0, s, toc, ttl ]


    \thechapter         :-> [ @g.arabic @g.counter \chapter ]
    \thesection         :-> @thechapter! ++ "." + @g.arabic @g.counter \section

    \thefigure          :-> (if @g.counter(\chapter) > 0 then @thechapter! ++ "." else []) ++ @g.arabic @g.counter \figure
    \thetable           :-> (if @g.counter(\chapter) > 0 then @thechapter! ++ "." else []) ++ @g.arabic @g.counter \table


    # toc

    args.\tableofcontents = <[ V ]>
    \tableofcontents    : -> @chapter(true, undefined, @g.macro(\contentsname)) ++ [ @g._toc ]


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
        @g.setCounter \chapter 0
        @g.setCounter \section 0
        @[\chaptername] = @[\appendixname]
        @[\thechapter] = -> [ @g.Alph @g.counter \chapter ]
