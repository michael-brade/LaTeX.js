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
    get: -> @[@length - 1]
    set: undefined


he.decode.options.strict = true


class Macros

    # CTOR
    (generator) ->
        @g = generator


    # make sure only one mandatory arg was given or throw an error
    _checkOneM: (arg) !->
        return if arg.length == 1 && arg[0].mandatory
        macro = /Macros\.(\w+)/.exec(new Error().stack.split('\n')[2])[1]
        throw new Error("#{macro} expects exactly one mandatory argument!")


    # all known macros

    # inline macros

    echo: (args) ->
        @g.createFragment args.map (x) ~>
            if x.value
                @g.createFragment [
                    @g.createText if x.mandatory then "+" else "-"
                    x.value
                    @g.createText if x.mandatory then "+" else "-"
                ]

    TeX: ->
        # document.createRange().createContextualFragment('<span class="tex">T<span>e</span>X</span>')
        tex = @g.create @g.inline-block
        tex.setAttribute('class', 'tex')

        tex.appendChild @g.createText 'T'
        e = @g.create @g.inline-block
        e.appendChild @g.createText 'e'
        tex.appendChild e
        tex.appendChild @g.createText 'X'

        return tex

    LaTeX: ->
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

        return latex


    today: ->
        @g.createText new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })


    newline: ->
        @g.create @g.linebreak


    negthinspace: ->
        ts = @g.create @g.inline-block
        ts.setAttribute 'class', 'negthinspace'
        return ts


    # sectioning

    contentsname:           "Contents"
    listfigurename:         "List of Figures"
    listtablename:          "List of Tables"

    partname:               "Part"
    chaptername:            "Chapter"   # only book and report in LaTeX

    abstractname:           "Abstract"
    figurename:             "Figure"
    tablename:              "Table"

    appendixname:           "Appendix"
    refname:                "References"
    indexname:              "Index"


    thepart: ->             @g.createText @g.Roman @g.count "part"
    thechapter: ->          @g.createText @g.arabic @g.count "chapter"
    thesection: ->          @g.createText (if @g.count("chapter") > 0 then @thechapter!.textContent + "." else "") + @g.arabic @g.count "section"
    thesubsection: ->       @g.createText @thesection!.textContent       + "." + @g.arabic @g.count "subsection"
    thesubsubsection: ->    @g.createText @thesubsection!.textContent    + "." + @g.arabic @g.count "subsubsection"
    theparagraph: ->        @g.createText @thesubsubsection!.textContent + "." + @g.arabic @g.count "paragraph"
    thesubparagraph: ->     @g.createText @theparagraph!.textContent     + "." + @g.arabic @g.count "subparagraph"
    thefigure: ->           @g.createText (if @g.count("chapter") > 0 then @thechapter!.textContent + "." else "") + @g.arabic @g.count "figure"
    thetable: ->            @g.createText (if @g.count("chapter") > 0 then @thechapter!.textContent + "." else "") + @g.arabic @g.count "table"


    ## not yet...
    include: (arg) ->
    includeonly: (arg) ->
    input: (arg) ->





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
    create =                    (type, classes) -> el = document.createElement type; el.setAttribute "class", classes;  return el

    part:                       "part"
    chapter:                    "h1"
    section:                    "h2"
    subsection:                 "h3"
    subsubsection:              "h4"
    #paragraph:                  "h5"
    subparagraph:               "h6"

    paragraph:                  "p"

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
    _attrs: null        # attribute stack
    _groups: null       # grouping stack, keeps track of difference between opening and closing brackets

    _continue: false

    _counters: null
    _resets: null



    # CTOR
    (options) ->
        @_options = options

        if @_options.hyphenate
            @_h = new Hypher(@_options.languagePatterns)

        @_macros = {}

        @_error = (e) ->
            console.error(e)
            throw new Error(e)

        @reset!


    reset: ->
        # initialize only in CTOR, otherwise the objects end up in the prototype
        @_dom = document.createDocumentFragment!

        # stack of text attributes - entering a group adds another entry, leaving a group removes the top entry
        @_attrs = [{}]
        @_groups = []

        @_counters = new Map()
        @_resets = new Map()

        @newCount \part
        @newCount \chapter
        @newCount \section          \chapter
        @newCount \subsection       \section
        @newCount \subsubsection    \subsection
        @newCount \paragraph        \subsubsection
        @newCount \subparagraph     \paragraph
        @newCount \figure           \chapter
        @newCount \table            \chapter

        # do this after creating the sectioning counters because \thepart etc. are already predefined
        @_macros = new Macros(this)

        @newCount \secnumdepth
        @newCount \tocdepth

        @setCount \secnumdepth  3   # article (book, report: 2)
        @setCount \tocdepth     3   # article (book, report: 2)


    setErrorFn: (e) !->
        @_error = e




    character: (c) ->
        c

    textquote: (q) ->
        switch q
        | '`'   => symbols.get "textquoteleft"
        | '\''  => symbols.get "textquoteright"

    hyphen: ->
        if @_attrs.top.fontFamily == 'tt'
            '-'                                         # U+002D
        else
            he.decode "&hyphen;"                        # U+2010

    ligature: (l) ->
        # no ligatures in tt
        if @_attrs.top.fontFamily == 'tt'
            l
        else
            ligatures.get l

    hasSymbol: (name) ->
        symbols.has name

    symbol: (name) ->
        symbols.get name

    hasDiacritic: (d) ->
        diacritics.has d

    diacritic: (d, c) ->
        if not c
            diacritics.get(d)[1]
        else
            c + diacritics.get(d)[0]

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



    hasMacro: (name) ->
        typeof @_macros[name] == "function"

    processMacro: (name, starred, args) ->
        @_macros[name](args)


    ### groups

    # start a new group
    enterGroup: !->
        # shallow copy of top, then push again
        #@_attrs.push @_attrs.top.slice!
        @_attrs.push Object.assign {}, @_attrs.top
        ++@_groups[@_groups.length - 1]

    # end the last group - returns false if there was no group to end
    exitGroup: ->
        @_attrs.pop!
        --@_groups[@_groups.length - 1] >= 0


    # start a new level of grouping
    startBalanced: !->
        @_groups.push 0

    # exit a level of grouping and return true if it was balanced
    endBalanced: ->
        @_groups.pop! == 0

    # check if the current level of grouping is balanced
    isBalanced: ->
        @_groups[@_groups.length - 1] == 0


    ### attributes (CSS classes)

    continue: !->
        @_continue = true

    break: !->
        @_continue = false


    # font attributes

    setFontFamily: (family) !->
        @_attrs.top.fontFamily = family

    setFontWeight: (weight) !->
        @_attrs.top.fontWeight = weight

    setFontShape: (shape) !->
        @_attrs.top.fontShape = shape

    setFontSize: (size) !->
        @_attrs.top.fontSize = size

    setAlignment: (align) !->
        @_attrs.top.align = align

    setTextDecoration: (decoration) !->
        @_attrs.top.textDecoration = decoration


    _inlineAttributes: ->
        cur = @_attrs.top
        [cur.fontFamily, cur.fontWeight, cur.fontShape, cur.fontSize, cur.textDecoration].join(' ').replace(/\s+/g, ' ').trim!

    _blockAttributes: ->
        [@_attrs.top.align].join(' ').replace(/\s+/g, ' ').trim!


    # lengths

    setLength: (id, length) !->
        console.log "LENGTH:", id, length

    length: (id) !->
        console.log "get length: #{id}"         # TODO

    theLength: (id) ->
        l = @create @inline-block, undefined, "the"
        l.setAttribute "display-var", id
        l

    # counters

    newCount: (c, parent) !->
        @_error "counter #{c} already defined!" if @hasCount c
        if parent
            @_error "no such counter: #{parent}" if not @hasCount parent
            @_resets.get parent .push c

        @_counters.set c, 0
        @_resets.set c, []

        @_error "macro \\the#{c} already defined!" if @_macros["the" + c]
        @_macros["the" + c] = -> @g.createText @g.arabic @g.count c


    hasCount: (c) ->
        @_counters.has c

    setCount: (c, v) !->
        @_error "no such counter: #{c}" if not @hasCount c
        @_counters.set c, v

    stepCount: (c) ->
        @setCount c, @count(c) + 1
        @clearCount c

    count: (c) ->
        @_error "no such counter: #{c}" if not @hasCount c
        @_counters.get c

    # reset all descendants of c to 0
    clearCount: (c) ->
        for r in @_resets.get c
            @clearCount r
            @setCount r, 0


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
