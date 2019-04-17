'use strict'

# base class for all standard documentclasses
#
export class Base

    args = @args = {}

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



        # default: letterpaper, 10pt, onecolumn, oneside

        @g.setLength \paperheight       new @g.Length 11, "in"
        @g.setLength \paperwidth        new @g.Length 8.5, "in"
        @g.setLength \@@size            new @g.Length 10, "pt"

        for opt in @options
            opt = Object.keys(opt).0
            switch opt
            | "oneside" =>
            | "twoside" =>      # twoside doesn't make sense in single-page HTML

            | "onecolumn" =>    # TODO
            | "twocolumn" =>

            | "titlepage" =>    # TODO
            | "notitlepage" =>

            | "fleqn" =>
            | "leqno" =>

            | "a4paper" =>
                @g.setLength \paperheight   new @g.Length 297, "mm"
                @g.setLength \paperwidth    new @g.Length 210, "mm"
            | "a5paper" =>
                @g.setLength \paperheight   new @g.Length 210, "mm"
                @g.setLength \paperwidth    new @g.Length 148, "mm"
            | "b5paper" =>
                @g.setLength \paperheight   new @g.Length 250, "mm"
                @g.setLength \paperwidth    new @g.Length 176, "mm"
            | "letterpaper" =>
                @g.setLength \paperheight   new @g.Length 11, "in"
                @g.setLength \paperwidth    new @g.Length 8.5, "in"
            | "legalpaper" =>
                @g.setLength \paperheight   new @g.Length 14, "in"
                @g.setLength \paperwidth    new @g.Length 8.5, "in"
            | "executivepaper" =>
                @g.setLength \paperheight   new @g.Length 10.5, "in"
                @g.setLength \paperwidth    new @g.Length 7.25, "in"
            | "landscape" =>
                tmp = @g.length \paperheight
                @g.setLength \paperheight   @g.length \paperwidth
                @g.setLength \paperwidth    tmp

            | otherwise =>
                # check if a point size was given -> set font size
                value = parseFloat opt
                if value != NaN and opt.endsWith "pt" and String(value) == opt.substring 0, opt.length - 2
                    @g.setLength \@@size new @g.Length value, "pt"



        ## textwidth

        pt345 = new @g.Length 345, "pt"
        inch = new @g.Length 1, "in"

        textwidth = @g.length(\paperwidth).sub(inch.mul 2)
        if textwidth.cmp(pt345) == 1
            textwidth = pt345

        @g.setLength \textwidth textwidth


        ## margins

        @g.setLength \marginparsep new @g.Length 11, "pt"
        @g.setLength \marginparpush new @g.Length 5, "pt"

        # in px
        margins = @g.length(\paperwidth).sub @g.length(\textwidth)
        oddsidemargin = margins.mul(0.5).sub(inch)
        marginparwidth = margins.mul(0.5).sub(@g.length(\marginparsep)).sub(inch.mul 0.8)
        if marginparwidth.cmp(inch.mul(2)) == 1
            marginparwidth = inch.mul(2)

        @g.setLength \oddsidemargin oddsidemargin
        @g.setLength \marginparwidth marginparwidth

        # \evensidemargin = \paperwidth - 2in - \textwidth - \oddsidemargin
        # \@settopoint\evensidemargin



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
            @g.createVSpace new @g.Length 2, "em"
            title
            @g.createVSpace new @g.Length 1.5, "em"
            author
            @g.createVSpace new @g.Length 1, "em"
            date
            @g.createVSpace new @g.Length 1.5, "em"
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
