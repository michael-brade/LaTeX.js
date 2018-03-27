
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
export class LaTeXBase

    _title: null
    _author: null
    _date: null
    _thanks: null


    # CTOR
    (generator, CustomMacros) ->
        if CustomMacros
            import all new CustomMacros(generator)
            args import CustomMacros.args

        @g = generator

        @g.newCounter \secnumdepth
        @g.newCounter \tocdepth

        @g.newCounter \footnote
        @g.newCounter \mpfootnote

        @g.newCounter \@listdepth
        @g.newCounter \@itemdepth
        @g.newCounter \@enumdepth

        @g.newLength \hsize
        @g.setLength \hsize         { value: 100, unit: "%" }

        @g.newLength \textwidth
        @g.setLength \textwidth     { value: 100, unit: "%" }

        # picture lengths
        @g.newLength \unitlength
        @g.setLength \unitlength    { value: 1, unit: "pt" }

        @g.newLength \@wholewidth
        @g.setLength \@wholewidth   { value: 0.4, unit: "pt" }



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
    #      this is needed when things should be done before the next arguments are parsed - no value
    #      should be returned by the macro in this case, for it will just be ignored
    #
    # rest of the list declares the arguments:
    #   s: optional star
    #
    #   i: id (group)
    #  i?: optional id (optgroup)
    #   k: key (group)
    #  k?: optional key (optgroup)
    #  kv: key-value list (optgroup)
    #   u: url (group)
    #   c: color specification (group), that is: <name> or <float> or <float,float,float>
    #   m: macro (group)
    #   l: length (group)
    # lg?: optional length (group)
    #  l?: optional length (optgroup)
    #  cl: coordinate/length (group)
    # cl?: optional coordinate/length (optgroup)
    #   n: num expression (group)
    #  n?: num expression (optgroup)
    #   f: float expression (group)
    #   v: vector, a pair of coordinates: (float/length, float/length)
    #  v?: optional vector
    #
    #   g: group (possibly long - TeX allows \endgraf, but not \par... so allow \par as well)
    #  hg: group in restricted horizontal mode
    #  o?: optional arg (optgroup)
    #
    #   h: restricted horizontal material
    #
    #  is: ignore (following) spaces

    args = @args = {}


    # echo macros just for testing
    args.echoO = <[ H o? ]>

    \echoO : (o) ->
        [ "-", o, "-" ]


    args.echoOGO = <[ H o? g o? ]>

    \echoOGO : (o1, g, o2) ->
        []
            ..push "-", o1, "-" if o1
            ..push "+", g,  "+"
            ..push "-", o2, "-" if o2


    args.echoGOG = <[ H g o? g ]>

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
        e = @g.create @g.inline-block, (@g.createText 'e'), 'e'
        tex.appendChild e
        tex.appendChild @g.createText 'X'

        return [tex]

    \LaTeX :->
        # <span class="latex">L<span>a</span>T<span>e</span>X</span>
        latex = @g.create @g.inline-block
        latex.setAttribute('class', 'latex')

        latex.appendChild @g.createText 'L'
        a = @g.create @g.inline-block, (@g.createText 'a'), 'a'
        latex.appendChild a
        latex.appendChild @g.createText 'T'
        e = @g.create @g.inline-block, (@g.createText 'e'), 'e'
        latex.appendChild e
        latex.appendChild @g.createText 'X'

        return [latex]


    \today              :-> [ new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) ]

    \newline            :-> [ @g.create @g.linebreak ]

    \negthinspace       :-> [ @g.create @g.inline-block, undefined, 'negthinspace' ]



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
            # label: null means no opt_group was given (\item ...), undefined is an empty one (\item[] ...)

            makelabel = @g.create @g.itemlabel, @\llap (if item.label != null then item.label else @g.macro label)
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
            label = @g.create @g.inlineBlock, item.label.node
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



    # multicolumns

    # \begin{multicols}{number}[pretext][premulticols size]
    args.\multicols =   <[ V n o? o? ]>

    \multicols          : (cols, pre) -> [ pre, @g.create @g.multicols cols ]


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

    args.\label =       <[ HV k ]>
    \label              : (label) !-> @g.setLabel label

    args.\ref =         <[ H k ]>
    \ref                : (label) -> [ @g.ref label ]




    # package: hyperref

    args.\href =        <[ H o? u g ]>
    \href               : (opts, url, txt) -> [ @g.create @g.link(url), txt ]

    args.\url =         <[ H u ]>
    \url                : (url) -> [ @g.create @g.link(url), @g.createText(url) ]

    args.\nolinkurl =   <[ H u ]>
    \nolinkurl          : (url) -> [ @g.create @g.link(), @g.createText(url) ]


    # TODO
    # \hyperbaseurl  HV u

    # \hyperref[label]{link text} --- like \ref{label}, but use "link text" for display
    # args.\hyperref =    <[ H o? g ]>
    # \hyperref           : (label, txt) -> [ @g.ref label ]




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

    \llap               : (txt) -> [ @g.create @g.inline-block, txt, "hbox llap" ]
    \rlap               : (txt) -> [ @g.create @g.inline-block, txt, "hbox rlap" ]
    \clap               : (txt) -> [ @g.create @g.inline-block, txt, "hbox clap" ]
    \smash              : (txt) -> [ @g.create @g.inline-block, txt, "hbox smash" ]

    \hphantom           : (txt) -> [ @g.create @g.inline-block, txt, "phantom hbox smash" ]
    \vphantom           : (txt) -> [ @g.create @g.inline-block, txt, "phantom hbox rlap" ]
    \phantom            : (txt) -> [ @g.create @g.inline-block, txt, "phantom hbox" ]


    # LaTeX

    args.\underline     = <[ H hg ]>
    \underline          : (txt) -> [ @g.create @g.inline-block, txt, "hbox underline" ]


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

    # \parbox[pos][height][inner-pos]{width}{text}
    #  pos: c,t,b
    #  inner-pos: t,c,b,s (or pos if not given)
    args.\parbox =      <[ H i? l? i? l g ]>
    \parbox             : (pos, height, inner-pos, width, txt) ->
        pos = "c" if not pos
        inner-pos = pos if not inner-pos
        classes = "parbox"
        style = "width:#{width.value + width.unit};"

        if height
            classes += " pbh"
            style += "height:#{height.value + height.unit};"

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

        content = @g.create @g.inline-block, txt
        box = @g.create @g.inline-block, content, classes

        box.setAttribute "style", style

        [ box ]



    /*
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
    args.\includegraphics = <[ H s kv k ]>


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
        @g.error "relative units for \\linethickness not supported!" if l.unit != "px"
        @g.setLength \@wholewidth l

    \arrowlength        : (l) !->   @g.setLength \@arrowlength l

    \maxovalrad         :-> "20pt"


    # frames

    # \dashbox{dashlen}(width,height)[pos]{text}
    args.\dashbox =     <[ H cl v i? g ]>

    # \frame{text} - frame without padding, line width given by picture linethickness
    args.\frame =       <[ H g ]>
    \frame              : (txt) ->
        el = @g.create @g.inline-block, txt, "hbox pframe"
        w = @g.length \@wholewidth
        el.setAttribute "style" "border-width:" + w.value + w.unit
        [ el ]


    ## picture commands

    # these commands create a box with width 0 and height abs(y) + height of {obj} if y positive

    # \put(x,y){obj}
    args.\put =         <[ H v g ]>
    \put                : (v, obj) ->
        x = v.x.value
        y = v.y.value

        wrapper = @g.create @g.inline-block, obj, "put-obj"
        wrapper.setAttribute "style", "left:#{x + v.x.unit}"

        strut = @g.create @g.inline-block, undefined, "strut"
        strut.setAttribute "style", "height:#{Math.abs(y) + v.y.unit}"

        @rlap @g.create @g.inline-block, [wrapper, strut], "picture"


    # \multiput(x,y)(delta_x,delta_y){n}{obj}
    args.\multiput =    <[ H v v n g ]>

    # \qbezier[N](x1, y1)(x, y)(x2, y2)
    args.\qbezier =     <[ H n? v v v ]>
    \qbezier            : (n, v1, v, v2) ->
        # for path, v MUST be unitless - so v is always in pt (and just to be safe, set size = viewbox in @_path)
        [ @_path "M#{v1.x.value},#{v1.y.value} Q#{v.x.value},#{v.y.value} #{v2.x.value},#{v2.y.value}", v1.x.unit ]


    # SVG path.length()
    # https://github.com/Pomax/bezierjs for calculating N bezier points
    #   or use sth like  .stroke({ dasharray: "10, 5" })

    # \cbezier[N](x1, y1)(x, y)(x2, y2)(x3, y3)
    args.\cbezier =     <[ H n? v v v v ]>
    \cbezier            : (n, v1, v, v2, v3) ->
        [ @_path "M#{v1.x.value},#{v1.y.value} C#{v.x.value},#{v.y.value} #{v2.x.value},#{v2.y.value} #{v3.x.value},#{v3.y.value}", v1.x.unit ]

    #args.\graphpaper =  <[  ]>


    # typeset an SVG path
    _path: (p, unit) ->
        linethickness = @g.length \@wholewidth

        svg = @g.create @g.inline-block, undefined, "picture-object"
        draw = @g.SVG(svg)

        bbox = draw.path p
                   .stroke { width: linethickness.value + linethickness.unit }
                   .fill 'none'
                   .bbox!

        bbox.x -= linethickness.value
        bbox.y -= linethickness.value
        bbox.width += linethickness.value * 2
        bbox.height += linethickness.value * 2

        # size and position
        svg.setAttribute "style", "left:#{Math.min(0, bbox.x)}#{unit};bottom:#{Math.min(0, bbox.y)}#{unit}"

        draw.size "#{bbox.width}#{unit}", "#{bbox.height}#{unit}"
            .viewbox bbox.x, bbox.y, bbox.width, bbox.height

        # last, put the origin into the lower left
        draw.flip 'y', 0

        @g.create @g.inline-block, svg, "picture"



    ## picture objects

    # the boxes created by picture objects do not have a height or width

    # \circle[*]{diameter}
    args.\circle =      <[ H s cl ]>
    \circle             : (s, d) ->
        # increase border by linewidth
        linethickness = @g.length \@wholewidth
        lw = linethickness.value

        svg = @g.create @g.inline-block, undefined, "picture-object"
        svg.setAttribute "style", "left:#{-d.value/2 - lw}px;bottom:#{-d.value/2 - lw}px"

        draw = @g.SVG(svg).size (d.value + lw*2) + d.unit, (d.value + lw*2) + d.unit

        draw.circle(d.value + d.unit)
            .cx((d.value/2 + lw) + d.unit)
            .cy((d.value/2 + lw) + d.unit)
            .stroke { width: linethickness.value + linethickness.unit }
            .fill(if s then "" else "none")

        # last, put the origin into the lower left
        draw.flip 'y', 0

        [ @g.create @g.inline-block, svg, "picture" ]


    # \line(xslope,yslope){length}
    #   if xslope != 0 then length is horizontal, else it is vertical
    #   if xslope == yslope == 0 then error
    args.\line =        <[ H v cl ]>
    \line               : (v, l) ->
        [ x, y ] = @_slopeLengthToCoords v, l
        [ @_line x, y, l.unit ]


    # \vector(xslope,yslope){length}
    args.\vector =      <[ H v cl ]>
    \vector             : (v, l) ->
        [ x, y ] = @_slopeLengthToCoords v, l
        [ @_vector x, y, l.unit ]


    # \Line(x2,y2)
    args.\Line =        <[ H v ]>
    \Line               : (v) ->
        linethickness = @g.length \@wholewidth
        x = v.x.value
        y = v.y.value

        [ @_line x, y, v.x.unit ]


    args.\Vector =      <[ H v ]>
    \Vector             : (v) ->
        linethickness = @g.length \@wholewidth
        x = v.x.value
        y = v.y.value

        [ @_vector x, y, v.x.unit ]


    _slopeLengthToCoords: (v, l) ->
        @g.error "illegal slope (0,0)" if v.x.value == v.y.value == 0
        @g.error "relative units not allowed for slope" if v.x.unit != v.y.unit or v.x.unit != "px"

        linethickness = @g.length \@wholewidth

        if v.x.value == 0
            x = 0
            y = l.value
        else
            x = l.value
            y = x * Math.abs v.y.value / v.x.value

        if v.x.value < 0
            x *= -1
        if v.y.value < 0
            y *= -1

        [ x, y ]


    # helper: draw line to x, y
    _line: (x, y, unit) ->
        svg = @g.create @g.inline-block, undefined, "picture-object"
        draw = @g.SVG(svg)

        linethickness = @g.length \@wholewidth
        bbox = draw.line(0, 0, x, y)
                   .stroke { width: linethickness.value + linethickness.unit }
                   .bbox!

        bbox.x -= linethickness.value
        bbox.y -= linethickness.value
        bbox.width += linethickness.value * 2
        bbox.height += linethickness.value * 2

        # size and position
        svg.setAttribute "style", "left:#{Math.min(0, bbox.x)}#{unit};bottom:#{Math.min(0, bbox.y)}#{unit}"

        draw.size "#{bbox.width}#{unit}", "#{bbox.height}#{unit}"
            .viewbox bbox.x, bbox.y, bbox.width, bbox.height

        # last, put the origin into the lower left
        draw.flip 'y', 0

        @g.create @g.inline-block, svg, "picture"


    # helper: draw arrow to x, y
    _vector: (x, y, unit) ->
        linethickness = @g.length \@wholewidth

        svg = @g.create @g.inline-block, undefined, "picture-object"
        draw = @g.SVG(svg)

        # arrow head length and width
        hl = 5
        hw = 3

        # start point of arrow
        sx = 0
        sy = 0

        # l^2 = x^2 + y^2
        #
        # y = m*x
        # x = y/m
        # m = y/x
        #
        #  => l^2 = x^2 + x^2 * m^2   =   x^2 * (1 + m^2)
        #  => l^2 = y^2/m^2 + y^2     =   y^2 * (1 + 1/m^2)
        #
        #  => x = l/sqrt(1 + m^2)
        #  => y = l/sqrt(1 + 1/m^2)

        hl_px = hl/2 * linethickness.value  # half the head length (the marker scales with stroke width)
        al_px = Math.sqrt x*x + y*y         # arrow length

        msq  = Math.sqrt 1 + y*y / (x*x)
        imsq = Math.sqrt 1 + x*x / (y*y)

        dir_x = if x < 0 then -1 else 1
        dir_y = if y < 0 then -1 else 1

        # if arrow head is longer than the arrow, shift start of the arrow
        if al_px < hl_px
            if x != 0 and y != 0
                sx = hl_px /  msq * -dir_x
                sy = hl_px / imsq * -dir_y
            else if y == 0
                sx = hl_px * -dir_x
            else
                sy = hl_px * -dir_y

        # shorten vector by half the arrow head length
        if x != 0 and y != 0
            x -= hl_px /  msq * dir_x
            y -= hl_px / imsq * dir_y
        else if y == 0
            x -= hl_px * dir_x
        else
            y -= hl_px * dir_y


        bbox = draw.line(sx, sy, x, y)
                   .stroke { width: linethickness.value + linethickness.unit }
                   # marker width and height
                   .marker 'end', hl, hw, (add) -> add.polyline [[0, 0], [hl, hw/2], [0, hw]]
                   .bbox!

        bbox.x -= linethickness.value + hl_px
        bbox.y -= linethickness.value + hl_px
        bbox.width += linethickness.value + hl_px * 2
        bbox.height += linethickness.value + hl_px * 2

        # size and position
        svg.setAttribute "style", "left:#{Math.min(0, bbox.x)}#{unit};bottom:#{Math.min(0, bbox.y)}#{unit}"

        draw.size "#{bbox.width}#{unit}", "#{bbox.height}#{unit}"
            .viewbox bbox.x, bbox.y, bbox.width, bbox.height

        # last, put the origin into the lower left
        draw.flip 'y', 0

        @g.create @g.inline-block, svg, "picture"



    # \oval[radius](width,height)[portion]
    #   uses circular arcs of radius min(radius, width/2, height/2)
    args.\oval =        <[ H cl? v i? ]>
    \oval               : (rad, size, part) ->
        linethickness = @g.length \@wholewidth

        if not rad
            rad = { value: 20, unit: "px" } # TODO: use \maxovalrad, parse the length

        if not part
            part = ""

        svg = @g.create @g.inline-block, undefined, "picture-object"
        draw = @g.SVG(svg)

        oval = draw.rect "#{size.x.value}#{size.x.unit}", "#{size.y.value}#{size.y.unit}"
                   .radius rad.value + rad.unit
                   .move "-#{size.x.value/2}#{size.x.unit}", "-#{size.y.value/2}#{size.y.unit}"
                   .stroke { width: linethickness.value + linethickness.unit }
                   .fill "none"

        bbox = oval.bbox!


        # initial rect
        rect =
            x: -size.x.value/2 - linethickness.value,
            y: -size.y.value/2 - linethickness.value,
            w: size.x.value + linethickness.value * 2,
            h: size.y.value + linethickness.value * 2


        if part.includes 'l'
            rect = @_intersect rect,
                x: -size.x.value/2 - linethickness.value,
                y: -size.y.value/2 - linethickness.value,
                w: size.x.value/2 + linethickness.value,
                h: size.y.value + linethickness.value * 2


        if part.includes 't'
            rect = @_intersect rect,
                x: -size.x.value/2 - linethickness.value,
                y: -size.y.value/2 - linethickness.value,
                w: size.x.value + linethickness.value * 2,
                h: size.y.value/2 + linethickness.value


        if part.includes 'r'
            rect = @_intersect rect,
                x: 0,
                y: -size.y.value/2 - linethickness.value,
                w: size.x.value/2 + linethickness.value,
                h: size.y.value + linethickness.value * 2


        if part.includes 'b'
            rect = @_intersect rect,
                x: -size.x.value/2 - linethickness.value,
                y: 0,
                w: size.x.value + linethickness.value * 2,
                h: size.y.value/2 + linethickness.value



        clip = draw.clip!.add (draw.rect "#{rect.w}#{size.x.unit}", "#{rect.h}#{size.y.unit}"
                                   .move rect.x, rect.y)
        clip.flip 'y', 0

        oval.clipWith clip

        bbox.x -= linethickness.value
        bbox.y -= linethickness.value
        bbox.width += linethickness.value * 2
        bbox.height += linethickness.value * 2

        # size and position
        svg.setAttribute "style", "left:#{Math.min(0, bbox.x)}#{size.x.unit};bottom:#{Math.min(0, bbox.y)}#{size.y.unit}"

        draw.size "#{bbox.width}#{size.x.unit}", "#{bbox.height}#{size.y.unit}"
            .viewbox bbox.x, bbox.y, bbox.width, bbox.height

        # last, put the origin into the lower left
        draw.flip 'y', 0

        [ @g.create @g.inline-block, svg, "picture" ]


    # return a new rectangle that is the result of intersecting the given two rectangles
    _intersect: (r1, r2) ->
        x: Math.max(r1.x, r2.x),
        y: Math.max(r1.y, r2.y),
        w: Math.max(0, Math.min(r1.x + r1.w, r2.x + r2.w) - Math.max(r1.x, r2.x)),
        h: Math.max(0, Math.min(r1.y + r1.h, r2.y + r2.h) - Math.max(r1.y, r2.y))


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

    args.\documentclass =  <[ P k? k k? ]>
    \documentclass      : (opts, documentclass, version) !->
        @\documentclass = !-> @g.error "Two \\documentclass commands. The document may only declare one class."

        ClassName = documentclass.charAt(0).toUpperCase() + documentclass.slice(1)
        Class = (require "./documentclasses/" + documentclass)[ClassName]

        import all new Class(@g)
        args import Class.args

        @g.documentClass = Class

        if opts
            for opt in opts.split ','
                opt = opt.trim!

                # check if a point size was given
                value = parseFloat opt
                if value != NaN and opt.endsWith "pt"
                    len = String(value).length
                    if String(value) == opt.substring 0, opt.length - 2
                        console.log opt




    args.\usepackage    =  <[ P k? k k? ]>
    \usepackage         : (opts, packages, version) !->


    args.\includeonly   = <[ P k ]>
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
