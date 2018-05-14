'use strict'

require! {
    './symbols': { ligatures, diacritics, symbols }
    './macros': { LaTeXBase: Macros }
    katex
    hypher: Hypher
    'svg.js': SVG
    he

    'lodash/flattenDeep'
    'lodash/compact'
}


Object.defineProperty Array.prototype, 'top',
    enumerable: false
    configurable: true
    get: -> @[* - 1]
    set: (v) !-> @[* - 1] = v


he.decode.options.strict = true



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

    # generic elements

    inline-block:               "span"
    block:                      "div"


    # typographic elements

    titlepage:                  do -> create ::block, "titlepage"
    title:                      do -> create ::block, "title"
    author:                     do -> create ::block, "author"
    date:                       do -> create ::block, "date"

    abstract:                   do -> create ::block, "abstract"

    part:                       "part"
    chapter:                    "h1"
    section:                    "h2"
    subsection:                 "h3"
    subsubsection:              "h4"
    paragraph:                  "h5"
    subparagraph:               "h6"

    linebreak:                  "br"

    par:                        "p"

    list:                       do -> create ::block, "list"

    unordered-list:             do -> create "ul",  "list"
    ordered-list:               do -> create "ol",  "list"
    description-list:           do -> create "dl",  "list"

    listitem:                   "li"
    term:                       "dt"
    description:                "dd"

    itemlabel:                  do -> create ::inline-block, "itemlabel"

    quote:                      do -> create ::block, "list quote"
    quotation:                  do -> create ::block, "list quotation"
    verse:                      do -> create ::block, "list verse"

    multicols:                  do ->
                                    el = create ::block, "multicols"
                                    return (c) ->
                                        el.setAttribute "style", "column-count:" + c
                                        return el


    anchor:                     do ->
                                    el = document.createElement "a"
                                    return (id) ->
                                        el.id? = id
                                        return el

    link:                       do ->
                                    el = document.createElement "a"
                                    return (u) ->
                                        if u
                                            el.setAttribute "href", u
                                        else
                                            el.removeAttribute "href"
                                        return el

    verb:                       do -> create "code", "tt"
    verbatim:                   "pre"

    picture:                    do -> create ::inline-block, "picture"
    picture-canvas:             do -> create ::inline-block, "picture-canvas"



    ### public instance vars (vars beginning with "_" are meant to be private!)

    SVG: SVG
    documentClass: null     # name of the default document class until \documentclass{}, then the actual class
    documentTitle: null

    # initialize only in CTOR, otherwise the objects end up in the prototype
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

    _marginpars: null


    # CTOR
    #
    # options:
    #  - documentClass: the default document class if a document without preamble is parsed
    #  - CustomMacros: a constructor (class/function) with additional custom macros
    #  - hyphenate: boolean, enable or disable automatic hyphenation
    #  - languagePatterns: language patterns object to use for hyphenation if it is enabled
    #  - bare: if true, only output the contents of body
    #  - styles: array with additional CSS stylesheets
    (options) ->
        @_options = Object.assign {
            documentClass: "article"
            styles: []
            bare: false
            hyphenate: true
        }, options

        if @_options.hyphenate
            @_h = new Hypher(@_options.languagePatterns)

        @reset!


    reset: !->
        @documentClass = @_options.documentClass
        @documentTitle = "untitled"

        @_uid = 1

        @_dom = document.createDocumentFragment!

        @_macros = {}
        @_curArgs = []  # stack of argument declarations

        # stack for local variables and attributes - entering a group adds another entry,
        # leaving a group removes the top entry
        @_stack = [
            attrs: {}
            align: null
            currentlabel:
                id: ""
                label: document.createTextNode ""
            lengths: new Map()
        ]

        # grouping stack, keeps track of difference between opening and closing brackets
        @_groups = [ 0 ]

        @_labels = new Map()
        @_refs = new Map()

        @_marginpars = []

        @_counters = new Map()
        @_resets = new Map()

        @_continue = false

        @newCounter \enumi
        @newCounter \enumii
        @newCounter \enumiii
        @newCounter \enumiv

        # do this after creating the sectioning counters because \thepart etc. are already predefined
        @_macros = new Macros @, @_options.CustomMacros



    # private static for easy access - but it means no parallel generator usage!
    error = (e) !->
        console.error e
        throw new Error e

    error: (e) !-> error e

    setErrorFn: (e) !->
        error := e


    location: !-> error "location function not set!"



    ### character/text creation

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
        error "no such symbol: #{name}" if not @hasSymbol name
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


    ### get the result

    /* set the title of the document, usually called by the \maketitle macro */
    setTitle: (title) ->
        @documentTitle = title.textContent


    /* @return the DOM representation (DocumentFrament or HTMLDocument) for immediate use */
    dom: ->
        if @_options.bare
            return @_dom

        createStyleSheet = (url) ->
            link = document.createElement "link"
            link.type = "text/css"
            link.rel = "stylesheet"
            link.href = url
            link

        createScript = (url) ->
            script = document.createElement "script"
            script.src = url
            script


        doc = document.implementation.createHTMLDocument @documentTitle

        ### head

        doc.head.appendChild createStyleSheet "css/katex.css"
        doc.head.appendChild createStyleSheet @documentClass.css

        for style in @_options.styles
            doc.head.appendChild createStyleSheet style


        doc.head.appendChild createScript "js/base.js"


        ### body

        doc.body.appendChild @create @block, @_dom, "body"

        ### calculate page geometry
        #
        # set body's and margins' width to percentage of viewport (= paperwidth)
        #
        # we cannot distinguish between even/oddsidemargin - currently, only oddsidemargin is used
        #
        # textwidth percent  = textwidth px/paperwidth px
        # marginleftwidth  % = (oddsidemargin px + toPx(1in))/paperwidth px
        # marginrightwidth % = 100% - (textwidth + marginleftwidth), if there is no room left, the margin is 0% width

        # do this if a static, non-responsive page is desired (TODO: make configurable!)
        #doc.body.style.setProperty '--paperwidth', (@length \paperwidth).value + (@length \paperwidth).unit


        twp =  Math.round 100 * (@length \textwidth).value / (@length \paperwidth).value, 1
        mlwp = Math.round 100 * ((@length \oddsidemargin).value + @toPx { value: 1, unit: "in" } .value) / (@length \paperwidth).value, 1
        mrwp = Math.max(100 - twp - mlwp, 0)

        doc.body.style.setProperty '--textwidth', twp + "%"
        doc.body.style.setProperty '--marginleftwidth', mlwp + "%"
        doc.body.style.setProperty '--marginrightwidth', mrwp + "%"

        if mrwp > 0
            # marginparwidth percentage relative to parent, which is marginrightwidth!
            doc.body.style.setProperty '--marginparwidth', 100 * 100 * (@length \marginparwidth).value / (@length \paperwidth).value / mrwp + "%"
        else
            doc.body.style.setProperty '--marginparwidth', "0px"

        # set the rest of the lengths (TODO: write all defined lengths to CSS, for each group)
        doc.body.style.setProperty '--marginparsep', (@length \marginparsep).value + (@length \marginparsep).unit
        doc.body.style.setProperty '--marginparpush', (@length \marginparpush).value + (@length \marginparpush).unit


        # doc.documentElement.style.setProperty '--root-color', 'red'

        # marginpar on the right
        doc.body.appendChild @create @block, null, "margin-left"
        doc.body.appendChild @create @block, @create(@block, @_marginpars, "marginpar"), "margin-right"

        doc


    /* @return the HTML representation */
    html: ->
        @dom!.outerHTML



    ### element creation

    createDocument: (fs) !->
        appendChildren @_dom, fs


    nextId: ->
        @_uid++

    create: (type, children, classes = "") ->
        if typeof type == "object"
            el = type.cloneNode true
            if el.hasAttribute "class"
                classes = el.getAttribute("class") + " " + classes
        else
            el = document.createElement type

        if @alignment!
            classes += " " + @alignment!


        # if continue then do not add parindent or parskip, we are not supposed to start a new paragraph
        if @_continue and @location!.end.offset > @_continue
            classes = classes + " continue"
            @break!

        if classes.trim!
            el.setAttribute "class", classes.replace(/\s+/g, ' ').trim!

        appendChildren el, children

    # create a text node that has font attributes set and allows for hyphenation
    createText: (t) ->
        return if not t
        @_wrapWithAttributes document.createTextNode if @_options.hyphenate then @_h.hyphenateText t else t

    # create a pure text node without font attributes and no hyphenation
    createVerbatim: (t) ->
        return if not t
        document.createTextNode t

    # create a fragment; arguments may be Node(s) and/or arrays of Node(s)
    createFragment: ->
        children = compact flattenDeep arguments

        # only create an empty fragment if explicitely requested: no arguments given
        return if arguments.length > 0 and (not children or !children.length)

        # don't wrap a single node
        return children.0 if children.length == 1 and children.0.nodeType

        f = document.createDocumentFragment!
        appendChildren f, children


    createPicture: (size, offset, content) ->
        # canvas
        canvas = @create @picture-canvas            # TODO: this might add CSS classes... ok?
        appendChildren canvas, content

        if offset
            canvas.setAttribute "style", "left:#{offset.x.value + offset.x.unit};
                                        bottom:#{offset.y.value + offset.y.unit}"

        # picture
        pic = @create @picture
        pic.appendChild canvas
        pic.setAttribute "style", "width:#{size.x.value + size.x.unit};
                                   height:#{size.y.value + size.y.unit}"

        pic



    # add attributes to an element - in HTML, those are CSS classes
    addAttribute: (el, c) !->
        if el.hasAttribute "class"
            c = el.getAttribute("class") + " " + c
        el.setAttribute "class", c

    hasAttribute: (el, c) ->
        el.hasAttribute "class" and new RegExp("\\b#{c}\\b").test el.getAttribute "class"




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
        span.setAttribute "style", "margin-bottom:" + length.value + length.unit
        return span

    createVSpaceInline: (length) ->
        span = document.createElement "span"
        span.setAttribute "class", "vspace-inline"
        span.setAttribute "style", "margin-bottom:" + length.value + length.unit
        return span

    # create a linebreak with a given vspace between the lines
    createBreakSpace: (length) ->
        span = document.createElement "span"
        span.setAttribute "class", "breakspace"
        span.setAttribute "style", "margin-bottom:" + length.value + length.unit
        return span

    createHSpace: (length) ->
        span = document.createElement "span"
        span.setAttribute "style", "margin-right:" + length.value + length.unit
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


    isHmode:    (marco) -> Macros.args[marco]?.0 == \H  or not Macros.args[marco]
    isVmode:    (marco) -> Macros.args[marco]?.0 == \V
    isHVmode:   (marco) -> Macros.args[marco]?.0 == \HV
    isPreamble: (marco) -> Macros.args[marco]?.0 == \P

    macro: (name, args) ->
        if symbols.has name
            return [ @createText symbols.get name ]

        @_macros[name]
            .apply @_macros, args
            ?.filter (x) -> x !~= undefined
            .map (x) ~> if not x.nodeType? then @createText x else x


    # macro arguments

    beginArgs: (macro) !->
        @_curArgs.push if Macros.args[macro]
            then {
                name: macro
                args: that.slice(1)
                parsed: []
            } else {
                args: []
                parsed: []
            }

    # check the next argument type to parse
    nextArg: (arg) ->
        if @_curArgs.top.args.0 == arg
            @_curArgs.top.args.shift!
            true

    argError: (m) ->
        error "macro \\#{@_curArgs.top.name}: #{m}"

    # add the result of a parsed argument
    addParsedArg: (a) !->
        @_curArgs.top.parsed.push a

    # get the parsed arguments so far
    parsedArgs: ->
        @_curArgs.top.parsed

    # execute macro with parsed arguments so far
    preExecMacro: !->
        @macro @_curArgs.top.name, @parsedArgs!

    # remove arguments of a completely parsed macro from the stack
    endArgs: !->
        @_curArgs.pop!
            ..args.length == 0 || error "grammar error: arguments for #{..name} have not been parsed: #{..args}"
            return ..parsed


    ### environments

    begin: (env_id) !->
        if not @hasMacro env_id
            error "unknown environment: #{env_id}"

        @startBalanced!
        @enterGroup!
        @beginArgs env_id


    end: (id, end_id) ->
        if id != end_id
            error "environment '#{id}' is missing its end, found '#{end_id}' instead"

        if @hasMacro "end" + id
            end = @macro "end" + id

        @exitGroup!
        @isBalanced! or error "#{id}: groups need to be balanced in environments!"
        @endBalanced!

        end



    ### groups

    # start a new group
    enterGroup: !->
        # shallow copy of the contents of top is enough because we don't change the elements, only the array and the maps
        @_stack.push {
            attrs: Object.assign {}, @_stack.top.attrs
            align: null                                                 # alignment is set only per level where it was changed
            currentlabel: Object.assign {}, @_stack.top.currentlabel
            lengths: new Map(@_stack.top.lengths)
        }
        ++@_groups.top

    # end the last group - throws if there was no group to end
    exitGroup: !->
        --@_groups.top >= 0 || error "there is no group to end here"
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
        @_continue = @location!.end.offset

    break: !->
        # only record the break if it came from a position AFTER the continue
        if @location!.end.offset > @_continue
            @_continue = false


    # alignment

    setAlignment: (align) !->
        @_stack.top.align = align

    alignment: ->
        @_stack.top.align


    # font attributes

    setFontFamily: (family) !->
        @_stack.top.attrs.fontFamily = family

    setFontWeight: (weight) !->
        @_stack.top.attrs.fontWeight = weight

    setFontShape: (shape) !->
        if shape == "em"
            if @_stack.top.attrs.fontShape == "it"
                shape = "up"
            else
                shape = "it"

        @_stack.top.attrs.fontShape = shape

    setFontSize: (size) !->
        @_stack.top.attrs.fontSize = size

    setTextDecoration: (decoration) !->
        @_stack.top.attrs.textDecoration = decoration


    _inlineAttributes: ->
        cur = @_stack.top.attrs
        [cur.fontFamily, cur.fontWeight, cur.fontShape, cur.fontSize, cur.textDecoration].join(' ').replace(/\s+/g, ' ').trim!



    ### sectioning

    startsection: (sec, level, star, toc, ttl) ->
        # call before the arguments are parsed to refstep the counter
        if toc ~= ttl ~= undefined
            if not star and @counter("secnumdepth") >= level
                @stepCounter sec
                @refCounter sec, "sec-" + @nextId!

            return

        # number the section?
        if not star and @counter("secnumdepth") >= level
            if sec == \chapter
                chaphead = @create @block, @macro(\chaptername) ++ (@createText @symbol \space) ++ @macro(\the + sec)
                el = @create @[sec], [chaphead, ttl]
            else
                el = @create @[sec], @macro(\the + sec) ++ (@createText @symbol \quad) ++ ttl   # in LaTeX: \@seccntformat

            # take the id from currentlabel.id
            el.id? = @_stack.top.currentlabel.id
        else
            el = @create @[sec], ttl

        # entry in the TOC required?
        # if not star and @counter("tocdepth")
        #     TODO

        el

    ### lists

    startlist: ->
        @stepCounter \@listdepth
        if @counter(\@listdepth) > 6
            error "too deeply nested"

        true

    endlist: !->
        @setCounter \@listdepth, @counter(\@listdepth) - 1
        @continue!



    ### lengths

    newLength: (l) !->
        error "length #{l} already defined!" if @hasLength l
        @_stack.top.lengths.set l, { value: 0; unit: "px" }

    hasLength: (l) ->
        @_stack.top.lengths.has l

    setLength: (id, length) !->
        error "no such length: #{id}" if not @hasLength id
        # console.log "set length:", id, length
        @_stack.top.lengths.set id, @toPx length

    length: (l) ->
        error "no such length: #{l}" if not @hasLength l
        # console.log "get length: #{l} -> #{}"
        @_stack.top.lengths.get l

    theLength: (id) ->
        l = @create @inline-block, undefined, "the"
        l.setAttribute "display-var", id
        l


    # in TeX pt
    unitsPt = new Map([
        * 'sp'  0.000015259     # 1sp = 1/65536pt = 0.000015259pt
        * 'dd'  1.07
        * 'mm'  2.84527559
        * 'pc'  12
        * 'cc'  12.84           # 1cc = 12dd
        * 'cm'  28.4527559
        * 'in'  72.27
    ])

    # TeX unit to Browser px (assuming 96dpi)
    unitsPx = new Map([
        * 'sp'  0.000020345     # 1sp = 1/65536pt
        * 'pt'  1.333333
        * 'dd'  1.420875
        * 'mm'  3.779528
        * 'pc'  16
        * 'cc'  17.0505         # 1cc = 12dd
        * 'cm'  37.79528
        * 'in'  96
    ])

    # convert to px if possible
    toPx: (l) ->
        return l if not unitsPx.has l.unit

        value: l.value * unitsPx.get l.unit
        unit: 'px'



    ### LaTeX counters (global)

    newCounter: (c, parent) !->
        error "counter #{c} already defined!" if @hasCounter c

        @_counters.set c, 0
        @_resets.set c, []

        if parent
            @addToReset c, parent

        error "macro \\the#{c} already defined!" if @hasMacro(\the + c)
        @_macros[\the + c] = -> [ @g.arabic @g.counter c ]


    hasCounter: (c) ->
        @_counters.has c

    setCounter: (c, v) !->
        error "no such counter: #{c}" if not @hasCounter c
        @_counters.set c, v

    stepCounter: (c) !->
        @setCounter c, @counter(c) + 1
        @clearCounter c

    counter: (c) ->
        error "no such counter: #{c}" if not @hasCounter c
        @_counters.get c

    refCounter: (c, id) ->
        # currentlabel is local, the counter is global
        # we need to store the id of the element as well as the counter (\@currentlabel)
        # if no id is given, create a new element to link to
        if not id
            id = c + "-" + @nextId!
            el = @create @anchor id

        # currentlabel stores the id of the anchor to link to, as well as the label to display in a \ref{}
        @_stack.top.currentlabel =
            id: id
            label: @createFragment [
                ...if @hasMacro(\p@ + c) then @macro(\p@ + c) else []
                ...@macro(\the + c)
            ]

        return el


    addToReset: (c, parent) !->
        error "no such counter: #{parent}" if not @hasCounter parent
        error "no such counter: #{c}" if not @hasCounter c
        @_resets.get parent .push c

    # reset all descendants of c to 0
    clearCounter: (c) !->
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
        |   _   => error "fnsymbol value must be between 1 and 9"


    ### label, ref

    # labels are possible for: parts, chapters, all sections, \items, footnotes, minipage-footnotes, tables, figures
    setLabel: (label) !->
        error "label #{label} already defined!" if @_labels.has label

        if not @_stack.top.currentlabel.id
            console.warn "warning: no \\@currentlabel available for label #{label}!"

        @_labels.set label, @_stack.top.currentlabel

        # fill forward references
        if @_refs.has label
            for r in @_refs.get label
                while r.firstChild
                    r.removeChild r.firstChild

                r.appendChild @_stack.top.currentlabel.label.cloneNode true
                r.setAttribute "href", "#" + @_stack.top.currentlabel.id

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


    logUndefinedRefs: !->
        return if @_refs.size == 0

        keys = @_refs.keys!
        while not (ref = keys.next!).done
            console.warn "warning: reference '#{ref.value}' undefined"

        console.warn "There were undefined references."


    ### marginpar

    marginpar: (txt) ->
        id = @nextId!

        marginPar = @create @block, txt
        marginPar.id = id

        @_marginpars.push marginPar

        marginRef = @create @inline-block
        marginRef.id = "marginref-" + id

        marginRef


    ### private helpers

    appendChildren = (parent, children) ->
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

    debugDOM = (oParent, oCallback) !->
        if oParent.hasChildNodes()
            oNode = oParent.firstChild
            while oNode, oNode = oNode.nextSibling
                debugDOM(oNode, oCallback)

        oCallback.call(oParent)


    debugNode = (n) !->
        return if not n
        if typeof n.nodeName !~= "undefined"
            console.log n.nodeName + ":", n.textContent
        else
            console.log "not a node:", n

    debugNodes = (l) !->
        for n in l
            debugNode n

    debugNodeContent = !->
        if @nodeValue
            console.log @nodeValue
