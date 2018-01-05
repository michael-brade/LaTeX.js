


# This is where (custom) macros are defined.
#
# By default, a macro takes no arguments and is a horizontal-mode macro.
# See below for the description of how to declare arguments.
#
# A macro must return an array with elements of type Node or String (text).
#
# This class should be independent of HtmlGenerator and just work with the generator interface.
export class MacrosBase

    # CTOR
    (generator) ->
        @g = generator


    # args: declaring arguments for a macro. If a macro doesn't take arguments and is a
    #       horizontal-mode macro, args can be left undefined for it.
    #
    # syntax:
    #
    # first entry declares the macro type:
    #   H:  horizontal-mode macro
    #   V:  vertical-mode macro - ends the current paragraph
    #   HV: horizontal-vertical-mode macro: must return nothing, i.e., doesn't create output
    #   P:  only in preamble
    #
    # one special entry:
    #   X: execute action (macro body) already now with whatever arguments have been parsed so far;
    #      this is needed when things should be done before the next arguments are parsed
    #
    # rest of the list declares the arguments:
    #   s: optional star
    #
    #   i: id (group)
    #   i?: optional id (group)
    #   k: key (group)
    #   u: url (group)
    #   m: macro (group)
    #   l: length (group)
    #   n: num expression (group)
    #   f: float expression (group)
    #   c: coordinate
    #   p: position
    #
    #   g: arggroup
    #   g+: long arggroup
    #   o: optional arg
    #   o+: long optional arg

    args = {}
    args: args


    args.echoO = <[ H o ]>

    \echoO : (o) ->
        [ "-", o, "-" ]


    args.echoOGO = <[ H o g o ]>

    \echoOGO : (o1, g, o2) ->
        []
            ..push "-", o1, "-" if o1
            ..push "+", g,  "+"
            ..push "-", o2, "-" if o2


    args.echoGOG = <[ H g o g ]>

    \echoGOG : (g1, o, g2) ->
        [ "+", g1, "+" ]
            ..push "-", o,  "-" if o
            ..push "+", g2, "+"


    args.\empty = <[ HV ]>
    \empty :!->


    \TeX :->
        # document.createRange().createContextualFragment('<span class="tex">T<span>e</span>X</span>')
        tex = @g.create @g.inline-block
        tex.setAttribute('class', 'tex')

        tex.appendChild @g.createText 'T'
        e = @g.create @g.inline-block
        e.appendChild @g.createText 'e'
        tex.appendChild e
        tex.appendChild @g.createText 'X'

        return [tex]

    \LaTeX :->
        # <span class="latex">L<span>a</span>T<span>e</span>X</span>
        latex = @g.create @g.inline-block
        latex.setAttribute('class', 'latex')

        latex.appendChild @g.createText 'L'
        a = @g.create @g.inline-block
        a.appendChild @g.createText 'a'
        latex.appendChild a
        latex.appendChild @g.createText 'T'
        e = @g.create @g.inline-block
        e.appendChild @g.createText 'e'
        latex.appendChild e
        latex.appendChild @g.createText 'X'

        return [latex]


    \today              :-> [ new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) ]

    \newline            :-> [ @g.create @g.linebreak ]

    \negthinspace       :-> [ @g.create @g.inline-block, undefined, 'negthinspace' ]



    # vertical mode declarations
    args.\par           = <[ V ]>
    args.\begin         = <[ V ]>
    args.\end           = <[ V ]>
    args.\item          = <[ V ]>


    # switch to onecolumn layout from now on
    args.\onecolumn     = <[ V ]>
    \onecolumn :->

    # switch to twocolumn layout from now on
    args.\twocolumn     = <[ V o ]>
    \twocolumn :->


    # spacing

    args
     ..\smallbreak      = \
     ..\medbreak        = \
     ..\bigbreak        = <[ V ]>

    \smallbreak         :-> [ @g.createVSpaceSkip "smallskip" ]
    \medbreak           :-> [ @g.createVSpaceSkip "medskip" ]
    \bigbreak           :-> [ @g.createVSpaceSkip "bigskip" ]

    args.\addvspace     = <[ V l ]>

    \addvspace          : (l) -> @g.createVSpace l          # TODO not correct?



    ##############
    # sectioning #
    ##############

    \contentsname       :-> [ "Contents" ]
    \listfigurename     :-> [ "List of Figures" ]
    \listtablename      :-> [ "List of Tables" ]

    \partname           :-> [ "Part" ]
    \chaptername        :-> [ "Chapter" ]   # only book and report in LaTeX

    \abstractname       :-> [ "Abstract" ]
    \figurename         :-> [ "Figure" ]
    \tablename          :-> [ "Table" ]

    \appendixname       :-> [ "Appendix" ]
    \refname            :-> [ "References" ]
    \bibname            :-> [ "Bibliography" ]
    \indexname          :-> [ "Index" ]


    args.\tableofcontents = <[ V ]>

    # keep a reference to the TOC element, and fill it as we go along
    \tableofcontents    : ->    # g.create(g.toc)


    args
     ..\part =          \
     ..\chapter =       \                   # only book and report in LaTeX
     ..\section =       \
     ..\subsection =    \
     ..\subsubsection = \
     ..\paragraph =     \
     ..\subparagraph =  <[ V s X o g ]>


    # article
    \part               : (s, toc, ttl) -> [ @g.startsection \part,           0, s, toc, ttl ]

    # book/report
    # \part               : (s, toc, ttl) -> [ @g.startsection \part,          -1, s, toc, ttl ]
    \chapter            : (s, toc, ttl) -> [ @g.startsection \chapter,        0, s, toc, ttl ]

    \section            : (s, toc, ttl) -> [ @g.startsection \section,        1, s, toc, ttl ]
    \subsection         : (s, toc, ttl) -> [ @g.startsection \subsection,     2, s, toc, ttl ]
    \subsubsection      : (s, toc, ttl) -> [ @g.startsection \subsubsection,  3, s, toc, ttl ]
    \paragraph          : (s, toc, ttl) -> [ @g.startsection \paragraph,      4, s, toc, ttl ]
    \subparagraph       : (s, toc, ttl) -> [ @g.startsection \subparagraph,   5, s, toc, ttl ]


    \thepart            :-> [ @g.Roman @g.counter \part ]
    \thechapter         :-> [ @g.arabic @g.counter \chapter ]
    \thesection         :-> (if @g.counter(\chapter) > 0 then @thechapter! ++ "." else []) ++ @g.arabic @g.counter \section
    \thesubsection      :-> @thesection!       ++ "." + @g.arabic @g.counter \subsection
    \thesubsubsection   :-> @thesubsection!    ++ "." + @g.arabic @g.counter \subsubsection
    \theparagraph       :-> @thesubsubsection! ++ "." + @g.arabic @g.counter \paragraph
    \thesubparagraph    :-> @theparagraph!     ++ "." + @g.arabic @g.counter \subparagraph
    \thefigure          :-> (if @g.counter(\chapter) > 0 then @thechapter! ++ "." else []) ++ @g.arabic @g.counter \figure
    \thetable           :-> (if @g.counter(\chapter) > 0 then @thechapter! ++ "." else []) ++ @g.arabic @g.counter \table


    args
     ..\frontmatter =   \
     ..\mainmatter =    \
     ..\backmatter =    \
     ..\appendix =      <[ HV ]>

    \frontmatter        :!->
    \mainmatter         :!->
    \backmatter         :!->

    \appendix           :!->
        # if chapters have been used: book, report
        if @g.counter(\chapter) > 0
            @g.setCounter \chapter 0
            @g.setCounter \section 0
            @[\chaptername] = @[\appendixname]
            @[\thechapter] = -> [ @g.Alph @g.counter \chapter ]
        # otherwise: article
        else
            @g.setCounter \section 0
            @g.setCounter \subsection 0
            @[\thesection] = -> [ @g.Alph @g.counter \section ]


    ###############
    # font macros #
    ###############

    # commands

    [ args[\text + ..]  = <[ H X g ]> for <[ rm sf tt md bf up it sl sc normal ]> ]


    \textrm             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontFamily "rm" else @g.exitGroup!; [ arg ]
    \textsf             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontFamily "sf" else @g.exitGroup!; [ arg ]
    \texttt             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontFamily "tt" else @g.exitGroup!; [ arg ]

    \textmd             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontWeight "md" else @g.exitGroup!; [ arg ]
    \textbf             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontWeight "bf" else @g.exitGroup!; [ arg ]

    \textup             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape "up" else @g.exitGroup!; [ arg ]
    \textit             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape "it" else @g.exitGroup!; [ arg ]
    \textsl             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape "sl" else @g.exitGroup!; [ arg ]
    \textsc             : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape "sc" else @g.exitGroup!; [ arg ]

    \textnormal         : (arg) ->
                                    if &length == 0
                                        @g.enterGroup!
                                        @g.setFontFamily "rm"
                                        @g.setFontWeight "md"
                                        @g.setFontShape "up"
                                    else
                                        @g.exitGroup!
                                        [ arg ]


    args.\underline     = <[ H X g ]>
    \underline          : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setTextDecoration "underline" else @g.exitGroup!; [ arg ]


    args.\emph          = <[ H g ]>
    \emph               : (arg) -> [ @g.create @g.emph, arg ]


    # declarations

    [ args[.. + "family"] = [ \HV ] for <[ rm sf tt    ]> ]
    [ args[.. + "series"] = [ \HV ] for <[ md bf       ]> ]
    [ args[.. + "shape" ] = [ \HV ] for <[ up it sl sc ]> ]
    [ args[..]            = [ \HV ] for <[ normalfont em ]> ]
    [ args[..]            = [ \HV ] for <[ tiny scriptsize footnotesize small normalsize large Large LARGE huge Huge ]> ]


    \rmfamily           :!-> @g.setFontFamily "rm"
    \sffamily           :!-> @g.setFontFamily "sf"
    \ttfamily           :!-> @g.setFontFamily "tt"

    \mdseries           :!-> @g.setFontWeight "md"
    \bfseries           :!-> @g.setFontWeight "bf"

    \upshape            :!-> @g.setFontShape "up"
    \itshape            :!-> @g.setFontShape "it"
    \slshape            :!-> @g.setFontShape "sl"
    \scshape            :!-> @g.setFontShape "sc"

    \normalfont         :!-> @g.setFontFamily "rm"; @g.setFontWeight "md"; @g.setFontShape "up"

    [ ::[..] = ((f) -> -> @g.setFontSize(f))(..) for <[ tiny scriptsize footnotesize small normalsize large Large LARGE huge Huge ]> ]

    \em                 :!-> @g.setFontShape "em"       # TODO: TOGGLE em?!



    ################
    # environments #
    ################

    # enumerate

    \theenumi           :-> [ @g.arabic @g.counter \enumi ]
    \theenumii          :-> [ @g.alph @g.counter \enumii ]
    \theenumiii         :-> [ @g.roman @g.counter \enumiii ]
    \theenumiv          :-> [ @g.Alph @g.counter \enumiv ]

    \labelenumi         :-> @theenumi! ++ "."
    \labelenumii        :-> [ "(", ...@theenumii!, ")" ]
    \labelenumiii       :-> @theenumiii! ++ "."
    \labelenumiv        :-> @theenumiv! ++ "."

    \p@enumii           :-> @theenumi!
    \p@enumiii          :-> @theenumi! ++ "(" ++ @theenumii! ++ ")"
    \p@enumiv           :-> @"p@enumiii"! ++ @theenumiii!

    # itemize

    \labelitemi         :-> [ @g.symbol \textbullet ]
    \labelitemii        :-> @normalfont!; @bfseries!; [ @g.symbol \textendash ]
    \labelitemiii       :-> [ @g.symbol \textasteriskcentered ]
    \labelitemiv        :-> [ @g.symbol \textperiodcentered ]



    # block level: alignment   TODO: LaTeX doesn't allow hyphenation, but with e.g. \RaggedRight, it does. (package ragged2e)

    args
     ..\centering =     \
     ..\raggedright =   \
     ..\raggedleft =    <[ HV ]>

    \centering          :-> @g.setAlignment "center"
    \raggedright        :-> @g.setAlignment "flushleft"
    \raggedleft         :-> @g.setAlignment "flushright"



    ##############

    # horizontal spacing
    args.\hspace =      <[ H s l ]>
    \hspace             : (s, l) -> [ @g.createHSpace l ]

    # stretch     arg_group
    # hphantom
    #
    # hfill           = \hspace{\fill}
    # dotfill         =
    # hrulefill       =



    # label, ref

    args.\label =       <[ HV k ]>
    \label              : (label) !-> @g.setLabel label

    args.\ref =         <[ H k ]>
    \ref                : (label) -> [ @g.ref label ]




    # package: hyperref

    args.\href =        <[ H o u g ]>
    \href               : (opts, url, txt) -> [ @g.create @g.link(url), txt ]

    args.\url =         <[ H u ]>
    \url                : (url) -> [ @g.create @g.link(url), @g.createText(url) ]

    args.\nolinkurl =   <[ H u ]>
    \nolinkurl          : (url) -> [ @g.create @g.link(), @g.createText(url) ]


    # TODO
    # \hyperbaseurl  HV u

    # \hyperref[label]{link text} --- like \ref{label}, but use "link text" for display
    # args.\hyperref =    <[ H o g ]>
    # \hyperref           : (label, txt) -> [ @g.ref label ]




    #########
    # boxes #
    #########

    # \mbox{text} - not broken into lines
    args.mbox = <[ H g ]>
    \mbox : (g)         ->



    ####################
    # lengths (scoped) #
    ####################


    args.\newlength = <[ HV m ]>
    \newlength          : (id) !-> @g.newLength id

    args.\setlength = <[ HV m l ]>
    \setlength          : (id, l) !-> @g.setLength id, l

    args.\addtolength = <[ HV m l ]>
    \addtolength        : (id, l) !-> @g.setLength id, @g.length(id) + l


    # settoheight     =
    # settowidth      =
    # settodepth      =


    # get the natural size of a box
    # width           =
    # height          =
    # depth           =
    # totalheight     =



    ##################################
    # LaTeX counters (always global) #
    ##################################


    # \newcounter{counter}[parent]
    args.\newcounter =  <[ HV i i? ]>
    \newcounter         : (c, p) !-> @g.newCounter c, p


    # \stepcounter{counter}
    args.\stepcounter = <[ HV i ]>
    \stepcounter        : (c) !-> @g.stepCounter c


    # \addtocounter{counter}{<expression>}
    args.\addtocounter = <[ HV i n ]>
    \addtocounter       : (c, n) !-> @g.setCounter c, @g.counter(c) + n


    # \setcounter{counter}{<expression>}
    args.\setcounter =  <[ HV i n ]>
    \setcounter         : (c, n) !-> @g.setCounter c, n


    # \refstepcounter{counter}
    #       \stepcounter{counter}, and (locally) define \@currentlabel so that the next \label
    #       will reference the correct current representation of the value; return an empty node
    #       for an <a href=...> target
    args.\refstepcounter = <[ H i ]>
    \refstepcounter     : (c) -> @g.stepCounter c; return [ @g.refCounter c ]


    # formatting counters

    args
     ..\alph =          \
     ..\Alph =          \
     ..\arabic =        \
     ..\roman =         \
     ..\Roman =         \
     ..\fnsymbol =      <[ H i ]>

    \alph               : (c) -> [ @g[\alph]     @g.counter c ]
    \Alph               : (c) -> [ @g[\Alph]     @g.counter c ]
    \arabic             : (c) -> [ @g[\arabic]   @g.counter c ]
    \roman              : (c) -> [ @g[\roman]    @g.counter c ]
    \Roman              : (c) -> [ @g[\Roman]    @g.counter c ]
    \fnsymbol           : (c) -> [ @g[\fnsymbol] @g.counter c ]



    ## not yet...

    args.\input = <[ V g ]>
    \input : (file) ->

    args.\include = <[ V g ]>
    \include : (file) ->


    ############
    # preamble #
    ############

    args.\includeonly = <[ P g ]>
    \includeonly : (filelist) ->

    args.\makeatletter = <[ P ]>
    \makeatletter   :->

    args.\makeatother = <[ P ]>
    \makeatother   :->




    ###########
    # ignored #
    ###########

    args
     ..\pagestyle =     <[ HV i ]>
    \pagestyle          : (s) !->


    args
     ..\linebreak =     <[ HV o ]>
     ..\nolinebreak =   <[ HV o ]>
     ..\fussy =         <[ HV ]>
     ..\sloppy =        <[ HV ]>


    \linebreak          : (o) !->
    \nolinebreak        : (o) !->

    \fussy              :!->
    \sloppy             :!->

    # these make no sense without pagebreaks

    args
     ..\pagebreak =     <[ HV o ]>
     ..\nopagebreak =   <[ HV o ]>
     ..\samepage =      <[ HV ]>
     ..\enlargethispage = <[ HV s l ]>
     ..\newpage =       <[ HV ]>
     ..\clearpage =     <[ HV ]>
     ..\cleardoublepage = <[ HV ]>
     ..\vfill =         <[ HV ]>
     ..\thispagestyle = <[ HV i ]>

    \pagebreak          : (o) !->
    \nopagebreak        : (o) !->
    \samepage           :!->
    \enlargethispage    : (s, l) !->
    \newpage            :!->
    \clearpage          :!->    # prints floats in LaTeX
    \cleardoublepage    :!->
    \vfill              :!->
    \thispagestyle      : (s) !->
