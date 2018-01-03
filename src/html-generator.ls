require! {
    './symbols': { ligatures, diacritics, symbols }
    he
    katex: { default: katex }
    hypher: Hypher
    'svg.js': SVG
}


Object.defineProperty Array.prototype, 'top',
    enumerable: false
    configurable: true
    get: -> @[* - 1]
    set: (v) !-> @[* - 1] = v


he.decode.options.strict = true

# This is where (custom) macros are defined.
#
# By default, a macro takes no arguments and is a horizontal-mode macro.
# See below for the description of how to declare arguments.
#
# This class should be independent of HtmlGenerator and just work with the generator interface.
#
# A macro must return an array with elements of type Node or String (text).
class Macros

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


    args.echoO = <[ o ]>

    \echoO : (o) ->
        [ "-", o, "-" ]


    args.echoOGO = <[ o g o ]>

    \echoOGO : (o1, g, o2) ->
        []
            ..push "-", o1, "-" if o1
            ..push "+", g,  "+"
            ..push "-", o2, "-" if o2


    args.echoGOG = <[ g o g ]>

    \echoGOG : (g1, o, g2) ->
        [ "+", g1, "+" ]
            ..push "-", o,  "-" if o
            ..push "+", g2, "+"


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


    # sectioning

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

    \thepart            :-> [ @g.Roman @g.counter \part ]
    \thechapter         :-> [ @g.arabic @g.counter \chapter ]
    \thesection         :-> (if @g.counter(\chapter) > 0 then @thechapter! ++ "." else []) ++ @g.arabic @g.counter \section
    \thesubsection      :-> @thesection!       ++ "." + @g.arabic @g.counter \subsection
    \thesubsubsection   :-> @thesubsection!    ++ "." + @g.arabic @g.counter \subsubsection
    \theparagraph       :-> @thesubsubsection! ++ "." + @g.arabic @g.counter \paragraph
    \thesubparagraph    :-> @theparagraph!     ++ "." + @g.arabic @g.counter \subparagraph
    \thefigure          :-> (if @g.counter(\chapter) > 0 then @thechapter! ++ "." else []) ++ @g.arabic @g.counter \figure
    \thetable           :-> (if @g.counter(\chapter) > 0 then @thechapter! ++ "." else []) ++ @g.arabic @g.counter \table

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
    \labelitemii        :-> [ @g.symbol \textendash ]
    #\labelitemii        :-> \normalfont\bfseries + @g.symbol \textendash   # TODO
    \labelitemiii       :-> [ @g.symbol \textasteriskcentered ]
    \labelitemiv        :-> [ @g.symbol \textperiodcentered ]



    # boxes

    args.mbox = <[ g ]>
    \mbox : (g)         ->


    ## not yet...

    args.include = <[ g ]>
    \include : (arg) ->

    args.includeonly = <[ g ]>
    \includeonly : (arg) ->

    args.input = <[ g ]>
    \input : (arg) ->





export class HtmlGenerator

    ### public instance vars

    # tokens translated to html
    sp:                         ' '
    brsp:                       '\u200B '               # U+200B + ' ' breakable but non-collapsible space
    nbsp:                       he.decode "&nbsp;"      # U+00A0
    visp:                       he.decode "&blank;"     # U+2423  visible space
    zwnj:                       he.decode "&zwnj;"      # U+200C  prevent ligatures
    shy:                        he.decode "&shy;"       # U+00AD  word break/hyphenation marker
    thinsp:                     he.decode "&thinsp;"    # U+2009


    ### private static vars
    create =                    (type, classes) -> el = document.createElement type; el.setAttribute "class", classes;  return el

    # typographic elements
    part:                       "part"
    chapter:                    "h1"
    section:                    "h2"
    subsection:                 "h3"
    subsubsection:              "h4"
    paragraph:                  "h5"
    subparagraph:               "h6"

    par:                        "p"

    list:                       do -> create "div", "list"

    unordered-list:             do -> create "ul",  "list"
    ordered-list:               do -> create "ol",  "list"
    description-list:           do -> create "dl",  "list"

    listitem:                   "li"
    term:                       "dt"
    description:                "dd"

    itemlabel:                  do -> create "span", "itemlabel"

    quote:                      do -> create "div", "list quote"
    quotation:                  do -> create "div", "list quotation"
    verse:                      do -> create "div", "list verse"

    multicols:                  do ->
                                    el = create "div", "multicols"
                                    return (c) ->
                                        el.setAttribute "style", "column-count:" + c
                                        return el

    inline-block:               "span"
    block:                      "div"

    emph:                       "em"
    linebreak:                  "br"

    anchor:                     do ->
                                    el = document.createElement "a"
                                    return (id) ->
                                        el.id? = id
                                        return el

    link:                       do ->
                                    el = document.createElement "a"
                                    return (u) ->
                                        el.setAttribute "href", u
                                        return el

    verb:                       "code"
    verbatim:                   "pre"



    # true if it is an inline element, something that makes up paragraphs
    _isPhrasingContent: (type) ->
        type in [
            @inline-block
            @emph
            @verb
            @linebreak
            @link
        ]



    ### public instance vars (vars beginning with "_" are meant to be private!)

    SVG: SVG

    _options: null
    _macros: null

    _dom:   null

    _stack: null
    _groups: null

    _continue: false

    _labels: null
    _refs: null

    _counters: null
    _resets: null



    # CTOR
    (options) ->
        @_options = options

        if @_options.hyphenate
            @_h = new Hypher(@_options.languagePatterns)

        @reset!


    reset: ->
        @_uid = 1

        # initialize only in CTOR, otherwise the objects end up in the prototype
        @_dom = document.createDocumentFragment!

        @_macros = {}
        @_curArgs = []  # stack of argument declarations

        # stack for local variables and attributes - entering a group adds another entry,
        # leaving a group removes the top entry
        @_stack = [{
            attrs: {}
            lengths: new Map()
        }]

        # grouping stack, keeps track of difference between opening and closing brackets
        @_groups = []

        @_labels = new Map()
        @_refs = new Map()

        @_counters = new Map()
        @_resets = new Map()

        @newCounter \part
        @newCounter \chapter
        @newCounter \section          \chapter
        @newCounter \subsection       \section
        @newCounter \subsubsection    \subsection
        @newCounter \paragraph        \subsubsection
        @newCounter \subparagraph     \paragraph
        @newCounter \figure           \chapter
        @newCounter \table            \chapter

        @newCounter \enumi
        @newCounter \enumii
        @newCounter \enumiii
        @newCounter \enumiv

        # do this after creating the sectioning counters because \thepart etc. are already predefined
        @_macros = new Macros(this)

        @newCounter \secnumdepth
        @newCounter \tocdepth

        @setCounter \secnumdepth  3   # article (book, report: 2)
        @setCounter \tocdepth     3   # article (book, report: 2)

        @newCounter \footnote
        @newCounter \mpfootnote

        @newCounter \@listdepth
        @newCounter \@itemdepth
        @newCounter \@enumdepth



    _error: (e) ->
        console.error e
        throw new Error e

    setErrorFn: (e) !->
        @_error = e




    character: (c) ->
        c

    textquote: (q) ->
        switch q
        | '`'   => @symbol \textquoteleft
        | '\''  => @symbol \textquoteright

    hyphen: ->
        if @_stack.top.attrs.fontFamily == 'tt'
            '-'                                         # U+002D
        else
            he.decode "&hyphen;"                        # U+2010

    ligature: (l) ->
        # no ligatures in tt
        if @_stack.top.attrs.fontFamily == 'tt'
            l
        else
            ligatures.get l

    hasSymbol: (name) ->
        symbols.has name

    symbol: (name) ->
        @_error "no such symbol: #{name}" if not @hasSymbol name
        symbols.get name

    hasDiacritic: (d) ->
        diacritics.has d

    # diacritic d for char c
    diacritic: (d, c) ->
        if not c
            diacritics.get(d)[1]        # if only d is given, use the standalone version of the diacritic
        else
            c + diacritics.get(d)[0]    # otherwise add it to the character c

    controlSymbol: (c) ->
        switch c
        | '/'                   => @zwnj
        | ','                   => @thinsp
        | '-'                   => @shy
        | '@'                   => '\u200B'       # nothing, just prevent spaces from collapsing
        | _                     => @character c


    # get the result

    /* @return the DOM representation (DocumentFrament) for immediate use */
    dom: ->
        @_dom


    /* @return the HTML representation */
    html: ->
        serializeFragment @_dom



    ### content creation

    createDocument: (fs) !->
        @_appendChildrenTo fs, @_dom


    nextId: ->
        @_uid++

    create: (type, children, classes = "") ->
        if typeof type == "object"
            el = type.cloneNode true
            if el.hasAttribute "class"
                classes = el.getAttribute("class") + " " + classes
        else
            el = document.createElement type

        if not @_isPhrasingContent type
            classes += " " + @_blockAttributes!

        # if continue then do not add parindent or parskip, we are not supposed to start a new paragraph
        if @_continue
            classes = classes + " continue"
            @break!

        if classes.trim!
            el.setAttribute "class", classes.replace(/\s+/g, ' ').trim!

        @_appendChildrenTo children, el

    # create a text node that has font attributes set and allows for hyphenation
    createText: (t) ->
        return if not t
        @_wrapWithAttributes document.createTextNode if @_options.hyphenate then @_h.hyphenateText t else t

    # create a pure text node without font attributes and no hyphenation
    createVerbatim: (t) ->
        return if not t
        document.createTextNode t

    createFragment: (children) ->
        # only create an empty fragment if explicitely requested: no arguments given
        return if arguments.length > 0 and (not children or !children.length)
        f = document.createDocumentFragment!
        @_appendChildrenTo children, f


    # for smallskip, medskip, bigskip
    createVSpaceSkip: (skip) ->
        span = document.createElement "span"
        span.setAttribute "class", "vspace " + skip
        return span

    createVSpaceSkipInline: (skip) ->
        span = document.createElement "span"
        span.setAttribute "class", "vspace-inline " + skip
        return span

    createVSpace: (length) ->
        span = document.createElement "span"
        span.setAttribute "class", "vspace"
        span.setAttribute "style", "margin-bottom:" + length
        return span

    createVSpaceInline: (length) ->
        span = document.createElement "span"
        span.setAttribute "class", "vspace-inline"
        span.setAttribute "style", "margin-bottom:" + length
        return span

    # create a linebreak with a given vspace between the lines
    createBreakSpace: (length) ->
        span = document.createElement "span"
        span.setAttribute "class", "breakspace"
        span.setAttribute "style", "margin-bottom:" + length
        return span

    createHSpace: (length) ->
        span = document.createElement "span"
        span.setAttribute "style", "margin-right:" + length
        return span




    parseMath: (math, display) ->
        f = document.createDocumentFragment!
        katex.render math, f,
            displayMode: !!display
            throwOnError: false
        f



    ### macros

    hasMacro: (name) ->
        typeof @_macros[name] == "function"
        and name !== "constructor"
        and (@_macros.hasOwnProperty name or Macros.prototype.hasOwnProperty name)


    beginArgs: (macro) ->
        @_curArgs.push if @_macros.args[macro] then that.slice! else []

    nextArg: (arg) ->
        if @_curArgs.top[0] == arg
            @_curArgs.top.shift!
            true
        else
            false

    endArgs: !->
        @_curArgs.pop!.length == 0 || error("not all mandatory arguments haven been given")


    macro: (name, args) ->
        @_macros[name]
            .apply @_macros, args
            ?.filter (x) -> x != undefined
            .map (x) ~> if not x.nodeType? then @createText x else x






    ### groups

    # start a new group
    enterGroup: !->
        # shallow copy of the contents of top is enough because we don't change the elements, only the array and the maps
        @_stack.push {
            attrs: Object.assign {}, @_stack.top.attrs
            lengths: new Map(@_stack.top.lengths)
        }
        ++@_groups.top

    # end the last group - throws if there was no group to end
    exitGroup: !->
        --@_groups.top >= 0 || @_error "there is no group to end here"
        @_stack.pop!


    # start a new level of grouping
    startBalanced: !->
        @_groups.push 0

    # exit a level of grouping and return the levels of balancing still left
    endBalanced: ->
        @_groups.pop!
        @_groups.length

    # check if the current level of grouping is balanced
    isBalanced: ->
        @_groups.top == 0


    ### attributes (CSS classes)

    continue: !->
        @_continue = true

    break: !->
        @_continue = false


    # font attributes

    setFontFamily: (family) !->
        @_stack.top.attrs.fontFamily = family

    setFontWeight: (weight) !->
        @_stack.top.attrs.fontWeight = weight

    setFontShape: (shape) !->
        @_stack.top.attrs.fontShape = shape

    setFontSize: (size) !->
        @_stack.top.attrs.fontSize = size

    setAlignment: (align) !->
        @_stack.top.attrs.align = align

    setTextDecoration: (decoration) !->
        @_stack.top.attrs.textDecoration = decoration


    _inlineAttributes: ->
        cur = @_stack.top.attrs
        [cur.fontFamily, cur.fontWeight, cur.fontShape, cur.fontSize, cur.textDecoration].join(' ').replace(/\s+/g, ' ').trim!

    _blockAttributes: ->
        [@_stack.top.attrs.align].join(' ').replace(/\s+/g, ' ').trim!


    # sectioning

    startsection: (sec, star, toc, ttl) ->
        # number the section?
        if not star and @counter("secnumdepth") >= 0
            @stepCounter sec
            el = @create @[sec], @macro(\the + sec) ++ (@createText @symbol \quad) ++ ttl   # in LaTeX: \@seccntformat
            el.id = "sec-" + @nextId!
            @refCounter sec, el.id
        else
            el = @create @[sec], ttl

        # entry in the TOC required?
        # if not star and @counter("tocdepth")
        #     TODO

        el

    # lists

    startlist: ->
        @stepCounter \@listdepth
        if @counter(\@listdepth) > 6
            @_error "too deeply nested"

        true

    endlist: !->
        @setCounter \@listdepth, @counter(\@listdepth) - 1




    # lengths

    setLength: (id, length) !->
        console.log "LENGTH:", id, length

    length: (id) !->
        console.log "get length: #{id}"         # TODO

    theLength: (id) ->
        l = @create @inline-block, undefined, "the"
        l.setAttribute "display-var", id
        l


    # LaTeX counters (global)

    newCounter: (c, parent) !->
        @_error "counter #{c} already defined!" if @hasCounter c
        if parent
            @_error "no such counter: #{parent}" if not @hasCounter parent
            @_resets.get parent .push c

        @_counters.set c, 0
        @_resets.set c, []

        @_error "macro \\the#{c} already defined!" if @hasMacro(\the + c)
        @_macros[\the + c] = -> [ @g.arabic @g.counter c ]


    hasCounter: (c) ->
        @_counters.has c

    setCounter: (c, v) !->
        @_error "no such counter: #{c}" if not @hasCounter c
        @_counters.set c, v

    stepCounter: (c) ->
        @setCounter c, @counter(c) + 1
        @clearCounter c

    counter: (c) ->
        @_error "no such counter: #{c}" if not @hasCounter c
        @_counters.get c

    refCounter: (c, id) ->
        # currentlabel is local, the counter is global
        # we need to store the id of the element as well as the counter (\@currentlabel)
        # if no id is given, create a new element to link to
        if not id
            id = c + "-" + @nextId!
            el = @create @anchor id

        # currentlabel stores the id of the anchor to link to, as well as the label to display in a \ref{}
        @_stack.top.attrs.currentlabel =
            id: id
            label: @createFragment [
                ...if @hasMacro(\p@ + c) then @macro(\p@ + c) else []
                ...@macro(\the + c)
            ]

        return el


    # reset all descendants of c to 0
    clearCounter: (c) ->
        for r in @_resets.get c
            @clearCounter r
            @setCounter r, 0


    # formatting counters

    alph: (num) -> String.fromCharCode(96 + num)

    Alph: (num) -> String.fromCharCode(64 + num)

    arabic: (num) -> String(num)

    roman: (num) ->
        lookup =
            * \m,  1000
            * \cm, 900
            * \d,  500
            * \cd, 400
            * \c,  100
            * \xc, 90
            * \l,  50
            * \xl, 40
            * \x,  10
            * \ix, 9
            * \v,  5
            * \iv, 4
            * \i,  1

        _roman num, lookup

    Roman: (num) ->
        lookup =
            * \M,  1000
            * \CM, 900
            * \D,  500
            * \CD, 400
            * \C,  100
            * \XC, 90
            * \L,  50
            * \XL, 40
            * \X,  10
            * \IX, 9
            * \V,  5
            * \IV, 4
            * \I,  1

        _roman num, lookup


    _roman = (num, lookup) ->
        roman = ""

        for i in lookup
            while num >= i[1]
                roman += i[0]
                num -= i[1]

        return roman

    fnsymbol: (num) ->
        switch num
        |   1   => @symbol \textasteriskcentered
        |   2   => @symbol \textdagger
        |   3   => @symbol \textdaggerdbl
        |   4   => @symbol \textsection
        |   5   => @symbol \textparagraph
        |   6   => @symbol \textbardbl
        |   7   => @symbol(\textasteriskcentered) + @symbol \textasteriskcentered
        |   8   => @symbol(\textdagger) + @symbol \textdagger
        |   9   => @symbol(\textdaggerdbl) + @symbol \textdaggerdbl
        |   _   => @_error "fnsymbol value must be between 1 and 9"


    # label, ref

    # labels are possible for: parts, chapters, all sections, \items, footnotes, minipage-footnotes, tables, figures
    setLabel: (label) !->
        @_error "label #{label} already defined!" if @_labels.has label
        @_labels.set label, @_stack.top.attrs.currentlabel

        # fill forward references
        if @_refs.has label
            for r in @_refs.get label
                while r.firstChild
                    r.removeChild r.firstChild

                r.appendChild @_stack.top.attrs.currentlabel.label.cloneNode true
                r.setAttribute "href", "#" + @_stack.top.attrs.currentlabel.id

            @_refs.delete label

    # keep a reference to each ref element if no label is known yet, then as we go along, fill it with labels
    ref: (label) ->
        # href is the element id, content is \the<counter>
        if @_labels.get label
            return @create @link("#" + that.id), that.label.cloneNode true

        el = @create (@link "#"), @createText "??"

        if not @_refs.has label
            @_refs.set label, [el]
        else
            @_refs.get label .push el

        el


    # private helpers

    _appendChildrenTo: (children, parent) ->
        if children
            if Array.isArray children
                for i to children.length
                    parent.appendChild children[i] if children[i]?
            else
                parent.appendChild children

        return parent


    _wrapWithAttributes: (el, attrs) ->
        if not attrs
            attrs = @_inlineAttributes!

        if attrs
            span = document.createElement "span"
            span.setAttribute "class", attrs
            span.appendChild el
            return span

        return el


    # private utilities

    serializeFragment = (f) ->
        c = document.createElement "container"
        c.appendChild f.cloneNode(true)
        # c.appendChild f     # for speed; however: if this fragment is to be serialized more often -> cloneNode(true) !!
        c.innerHTML



    debugDOM = (oParent, oCallback) !->
        if oParent.hasChildNodes()
            oNode = oParent.firstChild
            while oNode, oNode = oNode.nextSibling
                debugDOM(oNode, oCallback)

        oCallback.call(oParent)


    debugNode = (n) !->
        return if not n
        if typeof n.nodeName != "undefined"
            console.log n.nodeName + ":", n.textContent
        else
            console.log "not a node:", n

    debugNodes = (l) !->
        for n in l
            debugNode n

    debugNodeContent = !->
        if @nodeValue
            console.log @nodeValue
