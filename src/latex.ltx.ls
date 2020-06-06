import
    './symbols': { symbols }
    './types': { Vector }

    './documentclasses': builtin-documentclasses
    './packages': builtin-packages

    'lodash/assign'
    'lodash/assignIn'


# This is where most macros are defined. This file is like base/latex.ltx in LaTeX.
#
# By default, a macro takes no arguments and is a horizontal-mode macro.
# See below for the description of how to declare arguments.
#
# A macro must return an array with elements of type Node or String (text).
#
# This class should be independent of HtmlGenerator and just work with the generator interface.
#
# State is held that is relevant to the particular macros and/or documentclass.
export class LaTeX

    # this LaTeX implementation already covers these packages
    providedPackages = <[ calc pspicture picture pict2e keyval comment ]>

    _title: null
    _author: null
    _date: null
    _thanks: null


    # CTOR
    (generator, CustomMacros) ->
        if CustomMacros
            assignIn this, new CustomMacros(generator)
            assign args, CustomMacros.args
            CustomMacros.symbols?.forEach (value, key) -> symbols.set key, value

        @g = generator

        @g.newCounter \secnumdepth
        @g.newCounter \tocdepth

        @g.newCounter \footnote
        @g.newCounter \mpfootnote

        @g.newCounter \@listdepth
        @g.newCounter \@itemdepth
        @g.newCounter \@enumdepth


        @g.newLength \@@size         # root font size

        # picture lengths
        @g.newLength \unitlength
        @g.setLength \unitlength    new @g.Length 1, "pt"

        @g.newLength \@wholewidth
        @g.setLength \@wholewidth   new @g.Length 0.4, "pt"

        @g.newLength \paperheight
        @g.newLength \paperwidth

        @g.newLength \oddsidemargin
        @g.newLength \evensidemargin

        @g.newLength \textheight
        @g.newLength \textwidth

        @g.newLength \marginparwidth
        @g.newLength \marginparsep
        @g.newLength \marginparpush

        @g.newLength \columnwidth
        @g.newLength \columnsep
        @g.newLength \columnseprule

        @g.newLength \linewidth

        @g.newLength \leftmargin
        @g.newLength \rightmargin
        @g.newLength \listparindent
        @g.newLength \itemindent
        @g.newLength \labelwidth
        @g.newLength \labelsep

        @g.newLength \leftmargini
        @g.newLength \leftmarginii
        @g.newLength \leftmarginiii
        @g.newLength \leftmarginiv
        @g.newLength \leftmarginv
        @g.newLength \leftmarginvi

        @g.newLength \fboxrule
        @g.newLength \fboxsep

        @g.newLength \tabbingsep
        @g.newLength \arraycolsep
        @g.newLength \tabcolsep
        @g.newLength \arrayrulewidth
        @g.newLength \doublerulesep
        @g.newLength \footnotesep
        @g.newLength \topmargin
        @g.newLength \headheight
        @g.newLength \headsep
        @g.newLength \footskip

        @g.newLength \topsep
        @g.newLength \partopsep
        @g.newLength \itemsep
        @g.newLength \parsep
        @g.newLength \floatsep
        @g.newLength \textfloatsep
        @g.newLength \intextsep
        @g.newLength \dblfloatsep
        @g.newLength \dbltextfloatsep


    @symbols = symbols

    # args: declaring arguments for a macro. If a macro doesn't take arguments and is a
    #       horizontal-mode macro, args can be left undefined for it.
    #
    # syntax: see README.md

    args = @args = {}


    args.\empty = <[ HV ]>
    \empty :!->


    \TeX :->
        # document.createRange().createContextualFragment('<span class="tex">T<span>e</span>X</span>')
        @g.enterGroup! # prevent createText to add attributes, they will be added by @g.macro

        tex = @g.create @g.inline
        tex.setAttribute('class', 'tex')

        tex.appendChild @g.createText 'T'
        e = @g.create @g.inline, (@g.createText 'e'), 'e'
        tex.appendChild e
        tex.appendChild @g.createText 'X'

        @g.exitGroup!

        return [tex]

    \LaTeX :->
        # <span class="latex">L<span>a</span>T<span>e</span>X</span>
        @g.enterGroup!

        latex = @g.create @g.inline
        latex.setAttribute('class', 'latex')

        latex.appendChild @g.createText 'L'
        a = @g.create @g.inline, (@g.createText 'a'), 'a'
        latex.appendChild a
        latex.appendChild @g.createText 'T'
        e = @g.create @g.inline, (@g.createText 'e'), 'e'
        latex.appendChild e
        latex.appendChild @g.createText 'X'

        @g.exitGroup!

        return [latex]


    \today              :-> [ new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) ]

    \newline            :-> [ @g.create @g.linebreak ]

    \negthinspace       :-> [ @g.create @g.inline, undefined, 'negthinspace' ]



    # vertical mode declarations
    args.\par           = <[ V ]>
    args.\item          = <[ V ]>


    # switch to onecolumn layout from now on
    args.\onecolumn     = <[ V ]>
    \onecolumn :->

    # switch to twocolumn layout from now on
    args.\twocolumn     = <[ V o? ]>
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



    args.\marginpar     = <[ H g ]>
    \marginpar          : (txt) -> [ @g.marginpar txt ]


    ###########
    # titling #
    ###########

    \abstractname       :-> [ "Abstract" ]


    args.\title =       <[ HV g ]>
    args.\author =      <[ HV g ]>
    args.\and =         <[ H ]>
    args.\date =        <[ HV g ]>
    args.\thanks =      <[ HV g ]>

    \title              : (t) !-> @_title = t
    \author             : (a) !-> @_author = a
    \date               : (d) !-> @_date = d

    \and                :-> @g.macro \quad
    \thanks             : @\footnote



    ###############
    # font macros #
    ###############

    # commands

    [ args[\text + ..]  = <[ H X g ]> for <[ rm sf tt md bf up it sl sc normal ]> ]


    \textrm         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontFamily "rm" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]
    \textsf         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontFamily "sf" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]
    \texttt         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontFamily "tt" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]

    \textmd         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontWeight "md" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]
    \textbf         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontWeight "bf" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]

    \textup         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape  "up" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]
    \textit         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape  "it" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]
    \textsl         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape  "sl" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]
    \textsc         : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape  "sc" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]

    \textnormal     : (arg) ->
                        if &length == 0
                            @g.enterGroup!
                            @g.setFontFamily "rm"
                            @g.setFontWeight "md"
                            @g.setFontShape "up"
                        else
                            arg = @g.addAttributes arg
                            @g.exitGroup!
                            [ arg ]



    args.\emph      = <[ H X g ]>
    \emph           : (arg) ->  if &length == 0 then @g.enterGroup!; @g.setFontShape "em" else arg = @g.addAttributes arg; @g.exitGroup!; [ arg ]


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



    # TODO: LaTeX doesn't allow hyphenation in alignment, but with e.g. \RaggedRight, it does. (package ragged2e)

    # alignment

    args
     ..\centering =     \
     ..\raggedright =   \
     ..\raggedleft =    <[ HV ]>

    \centering          :!-> @g.setAlignment "centering"
    \raggedright        :!-> @g.setAlignment "raggedright"
    \raggedleft         :!-> @g.setAlignment "raggedleft"


    # alignment environments using a list:  flushleft, flushright, center

    args
     ..\center =        \
     ..\flushleft =     \
     ..\flushright =    <[ V ]>

    \center             :->  @g.startlist!; [ @g.create @g.list, null, "center" ]
    \endcenter          :!-> @g.endlist!

    \flushleft          :->  @g.startlist!; [ @g.create @g.list, null, "flushleft" ]
    \endflushleft       :!-> @g.endlist!

    \flushright         :->  @g.startlist!; [ @g.create @g.list, null, "flushright" ]
    \endflushright      :!-> @g.endlist!



    # titling

    args
     ..\titlepage =     <[ V ]>

    \titlepage          :-> [ @g.create @g.titlepage ]


    # quote, quotation, verse

    args
     ..\quote =         \
     ..\quotation =     \
     ..\verse =         <[ V ]>

    \quote              :->  @g.startlist!; [ @g.create @g.quote ]
    \endquote           :!-> @g.endlist!

    \quotation          :->  @g.startlist!; [ @g.create @g.quotation ]
    \endquotation       :!-> @g.endlist!

    \verse              :->  @g.startlist!; [ @g.create @g.verse ]
    \endverse           :!-> @g.endlist!


    # lists: itemize, enumerate, description

    args.\itemize =     <[ V X items ]>
    \itemize            : (items) ->
        if &length == 0
            @g.startlist!
            @g.stepCounter \@itemdepth
            @g.error "too deeply nested" if @g.counter(\@itemdepth) > 4
            return

        label = "labelitem" + @g.roman @g.counter \@itemdepth

        [
        @g.create @g.unorderedList, items.map (item) ~>
            @g.enterGroup!
            # label: null means no opt_group was given (\item ...), undefined is an empty one (\item[] ...)
            makelabel = @g.create @g.itemlabel, @\llap (if item.label != null then item.label else @g.macro label)
            @g.exitGroup!

            @g.create @g.listitem, [ makelabel, item.text ]
        ]


    \enditemize         :!->
        @g.endlist!
        @g.setCounter \@itemdepth, @g.counter(\@itemdepth) - 1



    args.\enumerate =   <[ V X enumitems ]>
    \enumerate          : (items) ->
        if &length == 0
            @g.startlist!
            @g.stepCounter \@enumdepth
            @g.error "too deeply nested" if @g.counter(\@enumdepth) > 4
            return

        itemCounter = "enum" + @g.roman @g.counter \@enumdepth
        @g.setCounter itemCounter, 0

        [
        @g.create @g.orderedList, items.map (item) ~>
            label = @g.create @g.inline, item.label.node
            if item.label.id
                label.id = item.label.id

            makelabel = @g.create @g.itemlabel, @\llap label
            @g.create @g.listitem, [ makelabel, item.text ]
        ]


    \endenumerate       :!->
        @g.endlist!
        @g.setCounter \@enumdepth, @g.counter(\@enumdepth) - 1


    args.\description = <[ V X items ]>
    \description        : (items) ->
        if &length == 0
            @g.startlist!
            return

        [
        @g.create @g.descriptionList, items.map (item) ~>
            dt = @g.create @g.term, item.label
            dd = @g.create @g.description, item.text
            @g.createFragment [dt, dd]
        ]

    \enddescription     :!-> @g.endlist!



    # picture

    # \begin{picture}(width,height)(xoffset,yoffset)
    args.\picture =     <[ H v v? h ]>

    \picture            : (size, offset, content) ->
        # TODO: rule for picture content??? LaTeX allows anything, Lamport says: HV macros and picture commands
        # content:text*
        [ @g.createPicture(size, offset, content) ]




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

    args.\label =       <[ HV g ]>
    \label              : (label) !-> @g.setLabel label.textContent

    args.\ref =         <[ H g ]>
    \ref                : (label) -> [ @g.ref label.textContent ]



    #########
    # boxes #
    #########

    ### hboxes

    # lowlevel macros...
    args
     ..\llap =          \
     ..\rlap =          \
     ..\clap =          \
     ..\smash =         \
     ..\hphantom =      \
     ..\vphantom =      \
     ..\phantom =       <[ H hg ]>   # TODO: not true, these should be usable in V-mode as well, they don't \leavevmode :(

    \llap               : (txt) -> [ @g.create @g.inline, txt, "hbox llap" ]
    \rlap               : (txt) -> [ @g.create @g.inline, txt, "hbox rlap" ]
    \clap               : (txt) -> [ @g.create @g.inline, txt, "hbox clap" ]
    \smash              : (txt) -> [ @g.create @g.inline, txt, "hbox smash" ]

    \hphantom           : (txt) -> [ @g.create @g.inline, txt, "phantom hbox smash" ]
    \vphantom           : (txt) -> [ @g.create @g.inline, txt, "phantom hbox rlap" ]
    \phantom            : (txt) -> [ @g.create @g.inline, txt, "phantom hbox" ]


    # LaTeX

    args.\underline     = <[ H hg ]>
    \underline          : (txt) -> [ @g.create @g.inline, txt, "hbox underline" ]


    # \mbox{text} - not broken into lines
    args.\mbox =        <[ H hg ]>
    \mbox               : (txt) -> @makebox undefined, undefined, undefined, txt


    # \makebox[0pt][r]{...} behaves like \leavevmode\llap{...}
    # \makebox[0pt][l]{...} behaves like \leavevmode\rlap{...}
    # \makebox[0pt][c]{...} behaves like \leavevmode\clap{...}

    # \makebox[width][position]{text}
    #   position: c,l,r,s (default = c)
    # \makebox(width,height)[position]{text}
    #   position: c,l,r,s (default = c) and t,b or combinations of the two
    args.\makebox =     <[ H v? l? i? hg ]>
    \makebox            : (vec, width, pos, txt) ->
        if vec
            # picture version TODO
            @g.error "expected \\makebox(width,height)[position]{text} but got two optional arguments!" if width and pos
            pos = width

            [ txt ]
        else
            # normal makebox
            @_box width, pos, txt, "hbox"


    # \fbox{text}
    # \framebox[width][position]{text}
    #   position: c,l,r,s
    #
    # these add \fboxsep (default ‘3pt’) padding to "text" and draw a frame with linewidth \fboxrule (default ‘.4pt’)
    #
    # \framebox(width,height)[position]{text}
    #   position: t,b,l,r (one or two)
    # this one uses the picture line thickness
    args.\fbox =        <[ H hg ]>
    args.\framebox =    <[ H v? l? i? hg ]>

    \fbox               : (txt) ->
        @framebox undefined, undefined, undefined, txt

    \framebox           : (vec, width, pos, txt) ->
        if vec
            # picture version TODO
            @g.error "expected \\framebox(width,height)[position]{text} but got two optional arguments!" if width and pos
        else
            # normal framebox
            # add the frame if it is a simple node, otherwise create a new box
            if txt.hasAttribute? and not width and not pos and not @g.hasAttribute txt, "frame"
                @g.addAttribute txt, "frame"
                [ txt ]
            else
                @_box width, pos, txt, "hbox frame"



    # helper for mbox, fbox, makebox, framebox
    _box: (width, pos, txt, classes) ->
        if width
            pos = "c" if not pos

            switch pos
            | "s" => classes += " stretch"           # @g.error "position 's' (stretch) is not supported for text!"
            | "c" => classes += " clap"
            | "l" => classes += " rlap"
            | "r" => classes += " llap"
            |  _  => @g.error "unknown position: #{pos}"

        content = @g.create @g.inline, txt
        box = @g.create @g.inline, content, classes

        if width
            box.setAttribute "style", "width:#{width.value}"

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

    # \parbox[pos][height][inner-pos]{width}{text}
    #  pos: c,t,b
    #  inner-pos: t,c,b,s (or pos if not given)
    args.\parbox =      <[ H i? l? i? l g ]>
    \parbox             : (pos, height, inner-pos, width, txt) ->
        pos = "c" if not pos
        inner-pos = pos if not inner-pos
        classes = "parbox"
        style = "width:#{width.value};"

        if height
            classes += " pbh"
            style += "height:#{height.value};"

        switch pos
        | "c" => classes += " p-c"
        | "t" => classes += " p-t"
        | "b" => classes += " p-b"
        |  _  => @g.error "unknown position: #{pos}"

        switch inner-pos
        | "s" => classes += " stretch"
        | "c" => classes += " p-cc"
        | "t" => classes += " p-ct"
        | "b" => classes += " p-cb"
        |  _  => @g.error "unknown inner-pos: #{inner-pos}"

        content = @g.create @g.inline, txt
        box = @g.create @g.inline, content, classes

        box.setAttribute "style", style

        [ box ]



    /*
    \shortstack[pos]{...\\...\\...}, pos: r,l,c (horizontal alignment)


    \begin{minipage}[pos][height][inner-pos]{width}
    */



    ############
    # graphics #
    ############



    ### picture environment (pspicture, calc, picture and pict2e packages)

    # line thickness and arrowlength in a picture (not multiplied by \unitlength)

    args
     ..\thicklines =    <[ HV ]>
     ..\thinlines =     <[ HV ]>
     ..\linethickness = <[ HV l ]>
     ..\arrowlength =   <[ HV l ]>

    \thinlines          :!->        @g.setLength \@wholewidth new @g.Length 0.4, "pt"
    \thicklines         :!->        @g.setLength \@wholewidth new @g.Length 0.8, "pt"
    \linethickness      : (l) !->
        @g.error "relative units for \\linethickness not supported!" if l.unit != "sp"
        @g.setLength \@wholewidth l

    \arrowlength        : (l) !->   @g.setLength \@arrowlength l

    \maxovalrad         :-> "20pt"

    \qbeziermax         :-> 500


    # frames

    # \dashbox{dashlen}(width,height)[pos]{text}
    args.\dashbox =     <[ H cl v i? g ]>

    # \frame{text} - frame without padding, linewidth given by picture linethickness
    args.\frame =       <[ H hg ]>
    \frame              : (txt) ->
        el = @g.create @g.inline, txt, "hbox pframe"
        w = @g.length \@wholewidth
        el.setAttribute "style" "border-width:#{w.value}"
        [ el ]


    ## picture commands

    # these commands create a box with width 0 and height abs(y) + height of {obj} if y positive

    # \put(x,y){obj}
    args.\put =         <[ H v g is ]>
    \put                : (v, obj) ->
        wrapper = @g.create @g.inline, obj, "put-obj"

        if v.y.cmp(@g.Length.zero) >= 0
            wrapper.setAttribute "style", "left:#{v.x.value}"
            # only add the strut if y > 0
            if v.y.cmp(@g.Length.zero) > 0
                strut = @g.create @g.inline, undefined, "strut"
                strut.setAttribute "style", "height:#{v.y.value}"
        else
            wrapper.setAttribute "style", "left:#{v.x.value};bottom:#{v.y.value}"

        @rlap @g.create @g.inline, [wrapper, strut], "picture"


    # \multiput(x,y)(delta_x,delta_y){n}{obj}
    args.\multiput =    <[ H v v n g ]>
    \multiput           : (v, dv, n, obj) ->
        res = []
        for i til n
            res = res ++ @\put v.add(dv.mul i), obj.cloneNode true

        res


    # \qbezier[N](x1, y1)(x, y)(x2, y2)
    args.\qbezier =     <[ H n? v v v ]>
    \qbezier            : (N, v1, v, v2) ->
        # for path, v MUST be unitless - so v is always in user coordinate system, or relative
        # (and just to be safe, set size = viewbox in @_path)
        [ @_path "M#{v1.x.pxpct},#{v1.y.pxpct} Q#{v.x.pxpct},#{v.y.pxpct} #{v2.x.pxpct},#{v2.y.pxpct}", N ]


    # \cbezier[N](x1, y1)(x, y)(x2, y2)(x3, y3)
    args.\cbezier =     <[ H n? v v v v ]>
    \cbezier            : (N, v1, v, v2, v3) ->
        [ @_path "M#{v1.x.pxpct},#{v1.y.pxpct} C#{v.x.pxpct},#{v.y.pxpct} #{v2.x.pxpct},#{v2.y.pxpct} #{v3.x.pxpct},#{v3.y.pxpct}", N ]


    # typeset an SVG path, optionally with N+1 points instead of smooth
    # (https://github.com/Pomax/bezierjs for calculating bezier points manually)
    _path: (p, N) ->
        linethickness = @g.length \@wholewidth

        svg = @g.create @g.inline, undefined, "picture-object"
        draw = @g.SVG!.addTo svg

        path = draw.path p
                   .stroke {
                       color: "#000"
                       width: linethickness.value
                   }
                   .fill 'none'

        if N > 0
            N = Math.min N, @\qbeziermax () - 1

            pw = linethickness.px                           # width of a point
            len-section = (path.length! - (N+1)*pw) / N     # N sections for N+1 points
            if len-section > 0
                path.stroke { dasharray: "#{pw} #{@g.round len-section}" }

        bbox = path.bbox!

        bbox.x -= linethickness.px
        bbox.y -= linethickness.px
        bbox.width += linethickness.px * 2
        bbox.height += linethickness.px * 2

        # size and position
        svg.setAttribute "style", "left:#{@g.round bbox.x}px;bottom:#{@g.round bbox.y}px"

        draw.size "#{@g.round bbox.width}px", "#{@g.round bbox.height}px"
            .viewbox @g.round(bbox.x), @g.round(bbox.y), @g.round(bbox.width), @g.round(bbox.height)

        # last, put the origin into the lower left
        draw.flip 'y', 0

        @g.create @g.inline, svg, "picture"



    ## picture objects

    # the boxes created by picture objects do not have a height or width

    # \circle[*]{diameter}
    args.\circle =      <[ H s cl ]>
    \circle             : (s, d) ->
        # no negative diameters
        d = d.abs!

        svg = @g.create @g.inline, undefined, "picture-object"

        linethickness = @g.length \@wholewidth

        draw = @g.SVG!.addTo svg

        # if the circle is filled, then linewidth must not influence the diameter
        if s
            offset = d.div(2).mul(-1).value

            draw.size d.value, d.value
                .stroke {
                    color: "#000"
                    width: "0"
                }
                .circle(d.value)
                .cx(d.div(2).value)
                .cy(d.div(2).value)
                .fill("")
        else
            # increase border by linewidth; multiply by -1 to shift left/down
            offset = d.div(2).add(linethickness).mul(-1).value

            draw.size d.add(linethickness.mul(2)).value, d.add(linethickness.mul(2)).value
                .stroke {
                    color: "#000"
                    width: linethickness.value
                }
                .circle(d.value)
                .cx(d.div(2).add(linethickness).value)
                .cy(d.div(2).add(linethickness).value)
                .fill("none")

        svg.setAttribute "style", "left:#{offset};bottom:#{offset}"

        # last, put the origin into the lower left
        draw.flip 'y', 0

        [ @g.create @g.inline, svg, "picture" ]


    # \line(xslope,yslope){length}
    #   if xslope != 0 then length is horizontal, else it is vertical
    #   if xslope == yslope == 0 then error
    args.\line =        <[ H v cl ]>
    \line               : (v, l) ->
        [ @_line ...@_slopeLengthToCoords v, l ]


    # \vector(xslope,yslope){length}
    args.\vector =      <[ H v cl ]>
    \vector             : (v, l) ->
        [ @_vector ...@_slopeLengthToCoords v, l ]


    # \Line(x1,y1)(x2,y2)
    args.\Line =        <[ H v v ]>
    \Line               : (vs, ve) ->
        [ @_line vs, ve ]


    # extension - not in LaTeX (pict2e)
    # \Vector(x1,y1)(x2,y2)
    args.\Vector =      <[ H v v ]>
    \Vector             : (vs, ve) ->
        [ @_vector vs, ve ]


    # convert slope/length pair to a vector (x/y coordinates)
    _slopeLengthToCoords: (v, l) ->
        @g.error "illegal slope (0,0)" if v.x.value == v.y.value == 0
        @g.error "relative units not allowed for slope" if v.x.unit != v.y.unit or v.x.unit != "sp"

        linethickness = @g.length \@wholewidth

        zero = new @g.Length 0, l.unit

        if v.x.px == 0
            x = zero
            y = l
        else
            x = l
            y = x.mul Math.abs(v.y.ratio(v.x))

        if v.x.cmp(zero) < 0
            x = x.mul -1
        if v.y.cmp(zero) < 0
            y = y.mul -1

        [ new Vector(zero, zero), new Vector(x, y) ]


    # helper: draw line from vs to ve
    # TODO: if vs is negative and ve positive, style/size/viewbox needs to be adapted!
    _line: (vs, ve) ->
        # TODO: em/ex should be supported!
        @g.error "relative units not allowed for line" if vs.x.unit != vs.y.unit or vs.x.unit != "sp"
        @g.error "relative units not allowed for line" if ve.x.unit != ve.y.unit or ve.x.unit != "sp"

        svg = @g.create @g.inline, undefined, "picture-object"
        draw = @g.SVG!.addTo svg

        linethickness = @g.length \@wholewidth
        bbox = draw.line(vs.x.px, vs.y.px, ve.x.px, ve.y.px)
                   .stroke {
                       color: "#000"
                       width: linethickness.value
                   }
                   .bbox!

        bbox.x -= linethickness.px
        bbox.y -= linethickness.px
        bbox.width += linethickness.px * 2
        bbox.height += linethickness.px * 2

        if bbox.x > 0 or bbox.y > 0
            console.error "line: bbox.x/y > 0!!", bbox.x, bbox.y

        # size and position
        svg.setAttribute "style", "left:#{@g.round bbox.x}px;bottom:#{@g.round bbox.y}px"

        draw.size "#{@g.round bbox.width}px", "#{@g.round bbox.height}px"
            .viewbox @g.round(bbox.x), @g.round(bbox.y), @g.round(bbox.width), @g.round(bbox.height)

        # last, put the origin into the lower left
        draw.flip 'y', 0

        @g.create @g.inline, svg, "picture"


    # helper: draw arrow from vs to ve
    _vector: (vs, ve) ->
        # TODO: vs not implemented! always 0
        # TODO: em/ex should be supported!
        @g.error "relative units not allowed for vector" if vs.x.unit != vs.y.unit or vs.x.unit != "sp"
        @g.error "relative units not allowed for vector" if ve.x.unit != ve.y.unit or ve.x.unit != "sp"

        linethickness = @g.length \@wholewidth

        svg = @g.create @g.inline, undefined, "picture-object"
        draw = @g.SVG!

        # arrow head length and width
        hl = 6.5
        hw = 3.9

        # if the linethickness is less than 0.6pt, don't shrink the arrow head any further
        max = new @g.Length 0.6, "pt"

        if linethickness.cmp(max) < 0
            hl = @g.round(hl * max.ratio linethickness)
            hw = @g.round(hw * max.ratio linethickness)

        hhl = linethickness.mul(hl/2)       # half the head length (the marker scales with stroke width)
        al = ve.sub(vs).norm!               # arrow length

        # if arrow head is longer than the arrow, shift start of the arrow
        if al.cmp(hhl) < 0
            s = ve.shift_start hhl
        else
            s = new Vector @g.Length.zero, @g.Length.zero

        # shorten vector by half the arrow head length
        ve = ve.shift_end hhl.mul -1

        bbox = draw.line(s.x.px, s.y.px, ve.x.px, ve.y.px)
                   .stroke {
                       color: "#000"
                       width: linethickness.value
                   }
                   # marker width and height
                   .marker 'end', hl, hw, (marker) ~>
                        marker.path "M0,0 \
                                     Q#{@g.round(2*hl/3)},#{@g.round(hw/2)} #{hl},#{@g.round(hw/2)} \
                                     Q#{@g.round(2*hl/3)},#{@g.round(hw/2)} 0,#{hw} \
                                     z" #.fill ""
                   .bbox!

        bbox.x -= linethickness.px + hhl.px
        bbox.y -= linethickness.px + hhl.px
        bbox.width += linethickness.px + hhl.px * 2
        bbox.height += linethickness.px + hhl.px * 2

        if bbox.x > 0 or bbox.y > 0
            console.error "vector: bbox.x/y > 0!!", bbox.x, bbox.y

        # size and position
        svg.setAttribute "style", "left:#{@g.round bbox.x}px;bottom:#{@g.round bbox.y}px"

        draw.size "#{@g.round bbox.width}px", "#{@g.round bbox.height}px"
            .viewbox @g.round(bbox.x), @g.round(bbox.y), @g.round(bbox.width), @g.round(bbox.height)

        # last, put the origin into the lower left
        draw.flip 'y', 0

        draw.addTo svg
        @g.create @g.inline, svg, "picture"



    # \oval[radius](width,height)[portion]
    #   uses circular arcs of radius min(radius, width/2, height/2)
    args.\oval =        <[ H cl? v i? ]>
    \oval               : (maxrad, size, part) ->
        linethickness = @g.length \@wholewidth

        if not maxrad
            maxrad = new @g.Length 20, "px" # TODO: use \maxovalrad, parse the length (if unitless, multiply with \unitlength)

        if not part
            part = ""

        # determine radius
        if size.x.cmp(size.y) < 0
            rad = size.x.div 2
        else
            rad = size.y.div 2

        if maxrad.cmp(rad) < 0
            rad = maxrad

        draw = @g.SVG!
        oval = draw.rect size.x.value, size.y.value
                   .radius rad.value
                   .move size.x.div(-2).value, size.y.div(-2).value
                   .stroke {
                       color: "#000"
                       width: linethickness.value
                   }
                   .fill "none"


        # initial rect
        rect =
            x: size.x.div(-2).sub linethickness
            y: size.y.div(-2).sub linethickness
            w: size.x.add linethickness.mul 2
            h: size.y.add linethickness.mul 2


        if part.includes 'l'
            rect = @_intersect rect,
                x: size.x.div(-2).sub linethickness
                y: size.y.div(-2).sub linethickness
                w: size.x.div(2).add linethickness
                h: size.y.add linethickness.mul 2


        if part.includes 't'
            rect = @_intersect rect,
                x: size.x.div(-2).sub linethickness
                y: size.y.div(-2).sub linethickness
                w: size.x.add linethickness.mul 2
                h: size.y.div(2).add linethickness


        if part.includes 'r'
            rect = @_intersect rect,
                x: @g.Length.zero
                y: size.y.div(-2).sub linethickness
                w: size.x.div(2).add linethickness
                h: size.y.add linethickness.mul 2


        if part.includes 'b'
            rect = @_intersect rect,
                x: size.x.div(-2).sub linethickness
                y: @g.Length.zero
                w: size.x.add linethickness.mul 2
                h: size.y.div(2).add linethickness


        bbox = oval.bbox!

        bbox.x -= linethickness.px
        bbox.y -= linethickness.px
        bbox.width += linethickness.px * 2
        bbox.height += linethickness.px * 2

        if bbox.x > 0 or bbox.y > 0
            console.error "oval: bbox.x/y > 0!!", bbox.x, bbox.y


        clip = draw.clip!.add (draw.rect rect.w.value, rect.h.value
                                   .move rect.x.value, rect.y.value)
        clip.flip 'y', 0

        oval.clipWith clip

        # size and position
        svg = @g.create @g.inline, undefined, "picture-object"
        svg.setAttribute "style", "left:#{@g.round bbox.x}px;bottom:#{@g.round bbox.y}px"

        draw.size "#{@g.round bbox.width}px", "#{@g.round bbox.height}px"
            .viewbox @g.round(bbox.x), @g.round(bbox.y), @g.round(bbox.width), @g.round(bbox.height)

        # last, put the origin into the lower left
        draw.flip 'y', 0

        draw.addTo svg

        [ @g.create @g.inline, svg, "picture" ]


    # return a new rectangle that is the result of intersecting the given two rectangles
    _intersect: (r1, r2) ->
        x: @g.Length.max(r1.x, r2.x)
        y: @g.Length.max(r1.y, r2.y)
        w: @g.Length.max(@g.Length.zero, @g.Length.min(r1.x.add(r1.w), r2.x.add(r2.w)).sub @g.Length.max(r1.x, r2.x))
        h: @g.Length.max(@g.Length.zero, @g.Length.min(r1.y.add(r1.h), r2.y.add(r2.h)).sub @g.Length.max(r1.y, r2.y))


    ####################
    # lengths (scoped) #
    ####################


    args.\newlength =   <[ HV m ]>
    \newlength          : (id) !-> @g.newLength id

    args.\setlength =   <[ HV m l ]>
    \setlength          : (id, l) !-> @g.setLength id, l

    args.\addtolength = <[ HV m l ]>
    \addtolength        : (id, l) !-> @g.setLength id, @g.length(id).add l


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

    args.\documentclass =  <[ P kv? k k? ]>
    \documentclass      : (options, documentclass, version) !->
        @\documentclass = !-> @g.error "Two \\documentclass commands. The document may only declare one class."

        # load and instantiate the documentclass
        Class = builtin-documentclasses[documentclass]

        importDocumentclass = !~>
            @g.documentClass = new Class @g, options
            assignIn this, @g.documentClass
            assign args, Class.args



        if not Class
            # Export = require "./documentclasses/#{documentclass}"
            ``import("./documentclasses/" + documentclass)`` .then (Export) !->
                Class := Export.default || Export[Object.getOwnPropertyNames(Export).0]

                importDocumentclass!

            .catch (e) ->
                console.error "error loading documentclass \"#{documentclass}\": #{e}"
        else
            importDocumentclass!


    args.\usepackage    =  <[ P kv? csv k? ]>
    \usepackage         : (opts, packages, version) !->
        options = Object.assign {}, @g.documentClass.options, opts

        for pkg in packages
            continue if providedPackages.includes pkg

            # load and instantiate the package
            try
                Package = builtin-packages[pkg]

                importPackage = !~>
                    assignIn this, new Package @g, options
                    assign args, Package.args
                    Package.symbols?.forEach (value, key) -> symbols.set key, value

                if not Package
                    # Export = require "./packages/#{pkg}"
                    ``import("./packages/" + pkg)`` .then (Export) !->
                        Package := Export.default || Export[Object.getOwnPropertyNames(Export).0]

                        importPackage!
                    .catch (e) ->
                        throw e
                else
                    importPackage!
            catch
                # log error but continue anyway
                console.error "error loading package \"#{pkg}\": #{e}"


    args.\includeonly   = <[ P csv ]>
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
     ..\linebreak =     <[ HV n? ]>
     ..\nolinebreak =   <[ HV n? ]>
     ..\fussy =         <[ HV ]>
     ..\sloppy =        <[ HV ]>


    \linebreak          : (o) !->
    \nolinebreak        : (o) !->

    \fussy              :!->
    \sloppy             :!->

    # these make no sense without pagebreaks

    args
     ..\pagebreak =     <[ HV n? ]>
     ..\nopagebreak =   <[ HV n? ]>
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
