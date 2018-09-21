'use strict'

require! {
    '../macros': { LaTeXBase }
}


# base class for all standard documentclasses
#
export class Base

    # class options
    options: {}

    # CTOR
    (generator, options) ->

        @g = generator
        @options = options if options

        @g.newCounter \part
        @g.newCounter \section
        @g.newCounter \subsection       \section
        @g.newCounter \subsubsection    \subsection
        @g.newCounter \paragraph        \subsubsection
        @g.newCounter \subparagraph     \paragraph

        @g.newCounter \figure
        @g.newCounter \table

        # a4paper (TODO: implement documentclass paper options)
        @g.setLength \paperwidth    { value: 210, unit: "mm" }


        # 10pt, onecolumn, oneside (twoside doesn't make sense in HTML)

        ## textwidth

        pt345 = @g.toPx { value: 345, unit: "pt" }
        inch = @g.toPx { value: 1, unit: "in" }

        textwidth = @g.length(\paperwidth).value - 2*inch.value
        if textwidth > pt345.value
            textwidth = pt345.value

        @g.setLength \textwidth { value: textwidth, unit: "px" }


        ## margins

        @g.setLength \marginparsep { value: 11, unit: "pt" }
        @g.setLength \marginparpush { value: 5, unit: "pt" }

        # in px
        margins = @g.length(\paperwidth).value - @g.length(\textwidth).value
        oddsidemargin = 0.5 * margins - inch.value
        marginparwidth = 0.5 * margins - @g.length(\marginparsep).value - 0.8 * inch.value
        if marginparwidth > 2*inch.value
            marginparwidth = 2*inch.value

        @g.setLength \oddsidemargin { value: oddsidemargin, unit: "px" }
        @g.setLength \marginparwidth { value: marginparwidth, unit: "px" }

        # \evensidemargin = \paperwidth - 2in - \textwidth - \oddsidemargin
        # \@settopoint\evensidemargin

    args = {}
    @args = args


    \contentsname       :-> [ "Contents" ]
    \listfigurename     :-> [ "List of Figures" ]
    \listtablename      :-> [ "List of Tables" ]

    \partname           :-> [ "Part" ]

    \figurename         :-> [ "Figure" ]
    \tablename          :-> [ "Table" ]

    \appendixname       :-> [ "Appendix" ]
    \indexname          :-> [ "Index" ]


    ##############
    # sectioning #
    ##############

    args
     ..\part =          \
     ..\section =       \
     ..\subsection =    \
     ..\subsubsection = \
     ..\paragraph =     \
     ..\subparagraph =  <[ V s X o? g ]>


    \part               : (s, toc, ttl) -> [ @g.startsection \part,           0, s, toc, ttl ]
    \section            : (s, toc, ttl) -> [ @g.startsection \section,        1, s, toc, ttl ]
    \subsection         : (s, toc, ttl) -> [ @g.startsection \subsection,     2, s, toc, ttl ]
    \subsubsection      : (s, toc, ttl) -> [ @g.startsection \subsubsection,  3, s, toc, ttl ]
    \paragraph          : (s, toc, ttl) -> [ @g.startsection \paragraph,      4, s, toc, ttl ]
    \subparagraph       : (s, toc, ttl) -> [ @g.startsection \subparagraph,   5, s, toc, ttl ]


    \thepart            :-> [ @g.Roman @g.counter \part ]
    \thesection         :-> [ @g.arabic @g.counter \section ]
    \thesubsection      :-> @thesection!       ++ "." + @g.arabic @g.counter \subsection
    \thesubsubsection   :-> @thesubsection!    ++ "." + @g.arabic @g.counter \subsubsection
    \theparagraph       :-> @thesubsubsection! ++ "." + @g.arabic @g.counter \paragraph
    \thesubparagraph    :-> @theparagraph!     ++ "." + @g.arabic @g.counter \subparagraph


    # title

    args.\maketitle =   <[ V ]>

    \maketitle          :->
        @g.setTitle @_title

        title = @g.create @g.title, @_title
        author = @g.create @g.author, @_author
        date = @g.create @g.date, if @_date then that else @g.macro \today

        maketitle = @g.create @g.list, [
            @g.createVSpace({ value: 2, unit: "em"})
            title
            @g.createVSpace({ value: 1.5, unit: "em"})
            author
            @g.createVSpace({ value: 1, unit: "em"})
            date
            @g.createVSpace({ value: 1.5, unit: "em"})
        ], "center"


        # reset footnote back to 0
        @g.setCounter \footnote 0

        # reset - maketitle can only be used once
        @_title = null
        @_author = null
        @_date = null
        @_thanks = null

        @\title = @\author = @\date = @\thanks = @\and = @\maketitle = !->

        [ maketitle ]
