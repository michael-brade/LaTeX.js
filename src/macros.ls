


# This is where (custom) macros are defined.
#
# By default, a macro takes no arguments and is a horizontal-mode macro.
# See below for the description of how to declare arguments.
#
# A macro must return an array with elements of type Node or String (text).
#
# This class should be independent of HtmlGenerator and just work with the generator interface.
#
# State is held that is relevant to the particular macros and/or documentclass.
export class MacrosBase

    _title: null
    _author: null
    _date: null
    _thanks: null


    # CTOR
    (generator) ->
        @g = generator

        @[\@mainmatter] = true  # book


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
    #  i?: optional id (optgroup)
    #   k: key (group)
    #  kv: key-value list (optgroup)
    #   u: url (group)
    #   c: color specification (group), that is: <name> or <float> or <float,float,float>
    #   m: macro (group)
    #   l: length (group)
    #  l?: optional length (optgroup)
    #  cl: coordinate/length (group)
    #   n: num expression (group)
    #   f: float expression (group)
    #   v: vector, a pair of coordinates: (float/length, float/length)
    #  v?: optional vector
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

    # title

    args.\title =       <[ HV g ]>
    args.\author =      <[ HV g ]>
    args.\and =         <[ H ]>
    args.\date =        <[ HV g ]>
    args.\thanks =      <[ HV g ]>

    args.\maketitle =   <[ V ]>

    \title              : (t) !-> @_title = t
    \author             : (a) !-> @_author = a
    \date               : (d) !-> @_date = d
    \thanks             : @\footnote

    \maketitle          :->
        title = @g.create @g.title

        # reset footnote back to 0
        @g.setCounter \footnote 0

        # reset - maketitle can only be used once
        @_title = null
        @_author = null
        @_date = null
        @_thanks = null

        @\title = @\author = @\date = @\thanks = @\and = @\maketitle = !->

        [ title ]

    # toc

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
    \chapter            : (s, toc, ttl) -> [ @g.startsection \chapter,        0, s or not @"@mainmatter", toc, ttl ]

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
     ..\appendix =      <[ V ]>

    \frontmatter        :!-> @[\@mainmatter] = false    # book; TODO: in frontmatter, sections should be named 0.1, 0.2,...
    \mainmatter         :!-> @[\@mainmatter] = true
    \backmatter         :!-> @[\@mainmatter] = false

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



    args.\emph          = <[ H X g ]>
    \emph               : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape "em" else @g.exitGroup!; [ arg ]


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

    \em                 :!-> @g.setFontShape "em"



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

    ### hboxes

    # TODO: \par, \\ etc. should not do anything in those hboxes directly!
    #       create special argument?
    #       or check if argument txt is already a box then and create span or div accordingly??

    # lowlevel macros...
    args
     ..\llap =          \
     ..\rlap =          \
     ..\clap =          \
     ..\smash =         \
     ..\hphantom =      \
     ..\vphantom =      \
     ..\phantom =       <[ H g ]>   # TODO: not true, these should be usable in V-mode as well, they don't \leavevmode :(

    \llap               : (txt) -> [ @g.create @g.inline-block, txt, "hbox llap" ]
    \rlap               : (txt) -> [ @g.create @g.inline-block, txt, "hbox rlap" ]
    \clap               : (txt) -> [ @g.create @g.inline-block, txt, "hbox clap" ]
    \smash              : (txt) -> [ @g.create @g.inline-block, txt, "hbox smash" ]

    \hphantom           : (txt) -> [ @g.create @g.inline-block, txt, "phantom hbox smash" ]
    \vphantom           : (txt) -> [ @g.create @g.inline-block, txt, "phantom hbox rlap" ]
    \phantom            : (txt) -> [ @g.create @g.inline-block, txt, "phantom hbox" ]


    # LaTeX

    args.\underline     = <[ H g ]>
    \underline          : (txt) -> [ @g.create @g.inline-block, txt, "hbox underline" ]


    # \mbox{text} - not broken into lines
    args.\mbox =        <[ H g ]>
    \mbox               : (txt) -> @makebox undefined, undefined, undefined, txt


    # \makebox[0pt][r]{...} behaves like \leavevmode\llap{...}
    # \makebox[0pt][l]{...} behaves like \leavevmode\rlap{...}
    # \makebox[0pt][c]{...} behaves like \leavevmode\clap{...}

    # \makebox[width][position]{text}
    #   position: c,l,r,s
    # \makebox(width,height)[position]{text}
    #   position: t,b,l,r (one or two)
    args.\makebox =     <[ H v? l? i? g ]>
    \makebox            : (vec, width, pos, txt) ->
        if vec
            # picture version
            @g._error "expected \\makebox(width,height)[position]{text} but got two optional arguments!" if width and pos
            pos = width

            [ txt ]
        else
            # normal makebox
            @_box width, pos, txt, "hbox"


    # \fbox{text}
    # \framebox[width][position]{text}
    #
    # these add \fboxsep (default ‘3pt’) padding to "text" and draw a frame with linewidth \fboxrule (default ‘.4pt’)
    args.\fbox =        <[ H g ]>
    args.\framebox =    <[ H l? i? g ]>

    \fbox               : (txt) -> @framebox undefined, undefined, txt
    \framebox           : (width, pos, txt) -> @_box width, pos, txt, "hbox frame"



    # helper for mbox, fbox, makebox, framebox
    _box: (width, pos, txt, classes) ->
        if width
            pos = "c" if not pos

            switch pos
            | "s" => classes += " stretch"           # @g._error "position 's' (stretch) is not supported for text!"
            | "c" => classes += " clap"
            | "l" => classes += " rlap"
            | "r" => classes += " llap"
            |  _  => @g._error "unknown position: #{pos}"

        content = @g.create @g.inline-block, txt
        box = @g.create @g.inline-block, content, classes

        if width
            box.setAttribute "style", "width:" + width.value + width.unit

        [ box ]



    # \raisebox{distance}[height][depth]{text}

    # \rule[raise]{width}{height}


    # \newsavebox{\name}
    # \savebox{\boxcmd}[width][pos]{text}
    # \sbox{\boxcmd}{text}
    # \usebox{\boxcmd}

    # \begin{lrbox}{\boxcmd}
    #   text
    # \end{lrbox}



    ### parboxes

    /*

    \parbox[pos][height][inner-pos]{width}{text}

    \shortstack[pos]{...\\...\\...}, pos: r,l,c (horizontal alignment)


    \begin{minipage}[pos][height][inner-pos]{width}

    */



    ############
    # graphics #
    ############


    # graphicx


    # TODO: restrict to just one path?
    # { {path1/} {path2/} }
    args.\graphicspath = <[ HV gl ]>
    \graphicspath       : (paths) !->

    # \includegraphics*[key-val list]{file}
    args.\includegraphics = <[ H s kv g ]>


    # color

    # \definecolor{name}{model}{color specification}
    args.\definecolor = <[ HV i? c ]>


    # {name} or [model]{color specification}
    args.\color =       <[ HV i? c ]>

    # {name}{text} or [model]{color specification}{text}
    args.\textcolor =   <[ H i? c g ]>


    args.\colorbox =    <[ H i? c g ]>
    args.\fcolorbox =   <[ H i? c c g ]>


    # rotation

    # \rotatebox[key-val list]{angle}{text}
    args.\rotatebox =   <[ H kv f g ]>


    # scaling

    # \scalebox{h-scale}[v-scale]{text}
    # \reflectbox{text}
    # \resizebox*{h-length}{v-length}{text}


    # xcolor


    ### picture environment (pspicture, calc, picture and pict2e packages)

    # line thickness and arrowlength in a picture (not multiplied by \unitlength)

    args
     ..\thicklines =    <[ HV ]>
     ..\thinlines =     <[ HV ]>
     ..\linethickness = <[ HV l ]>
     ..\arrowlength =   <[ HV l ]>

    \thinlines          :!->        @g.setLength \@wholewidth { value: 0.4, unit: "pt" }
    \thicklines         :!->        @g.setLength \@wholewidth { value: 0.8, unit: "pt" }
    \linethickness      : (l) !->
        @g._error "relative units for \\linethickness not supported!" if l.unit != "px"
        @g.setLength \@wholewidth l

    \arrowlength        : (l) !->   @g.setLength \@arrowlength l


    # picture commands

    # \put(x,y){obj}
    args.\put =         <[ H v g ]>

    # \multiput(x,y)(delta_x,delta_y){n}{obj}
    args.\multiput =    <[ H v v n g ]>

    # \qbezier[N](x1, y1)(x, y)(x2, y2)
    args.\qbezier =     <[ H n? v v v ]>

    # \cbezier[N](x1, y1)(x, y)(x2, y2)(x3, y3)
    args.\cbezier =     <[ H n? v v v v ]>

    #args.\graphpaper =  <[  ]>


    # picture objects

    # \circle[*]{diameter}
    args.\circle =      <[ H s cl ]>

    # \line(xslope,yslope){length}
    #   if xslope != 0 then length is horizontal, else it is vertical
    #   if xslope == yslope == 0 then error
    args.\line =        <[ H v cl ]>
    \line               : (v, l) ->
        @g._error "illegal slope (0,0)" if v.x.value == v.y.value == 0
        @g._error "relative units not allowed for slope" if v.x.unit != v.y.unit or v.x.unit != "px"

        linethickness = @g.length \@wholewidth

        if v.x.value == 0
            x = 0
            y = l.value

            sx = linethickness.value
            sy = Math.abs y
        else
            x = l.value
            y = x * v.y.value / v.x.value

            sx = Math.abs x
            sy = Math.max linethickness.value, Math.abs y

        svg = @g.create @g.inline-block, undefined, "picture-object"
        svg.setAttribute "style", "left:#{Math.min(0, x)}px;bottom:#{Math.min(0, y)}px"

        draw = @g.SVG(svg).size sx, sy

        draw.viewbox Math.min(0, x), Math.min(0, y), sx, sy

        draw.line(0, 0, x, y).stroke { width: linethickness.value + linethickness.unit }

        # last, put the origin into the lower left
        draw.flip 'y', 0

        [ @g.create @g.inline-block, svg, "picture" ]


    # \vector(xslope,yslope){length}
    args.\vector =      <[ H v cl ]>

    # \line(x2,y2)
    args.\Line =        <[ H v ]>
    args.\Vector =      <[ H v ]>

    # \oval[radius](width,height)[portion]
    #   uses circular arcs of radius min(radius, width/2, heigth/2)
    args.\oval =        <[ H f? v i? ]>

    # \dashbox{dashlen}(width,height)[pos]{text}
    args.\dashbox =     <[ H cl v i? g ]>

    # \frame{text} - frame without padding, line width given by picture linethickness
    args.\frame =       <[ H g ]>
    \frame              : (txt) ->
        el = @g.create @g.inline-block, txt, "hbox pframe"
        w = @g.length \@wholewidth
        el.setAttribute "style" "border-width:" + w.value + w.unit
        [ el ]


    ####################
    # lengths (scoped) #
    ####################


    args.\newlength =   <[ HV m ]>
    \newlength          : (id) !-> @g.newLength id

    args.\setlength =   <[ HV m l ]>
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

    args.\input =       <[ V g ]>
    \input              : (file) ->

    args.\include =     <[ V g ]>
    \include            : (file) ->


    ############
    # preamble #
    ############

    args.\documentclass =  <[ P o g o ]>
    \documentclass      : (opts, documentclass, version) !->

    args.\usepackage    =  <[ P o g o ]>
    \usepackage         : (opts, packages, version) !->


    args.\includeonly   = <[ P g ]>
    \includeonly        : (filelist) !->


    args.\makeatletter  = <[ P ]>
    \makeatletter       :!->

    args.\makeatother   = <[ P ]>
    \makeatother        :!->




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
