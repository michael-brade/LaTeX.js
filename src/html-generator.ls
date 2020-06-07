import
    './generator': { Generator }
    './symbols': { ligatures, diacritics }
    '@svgdotjs/svg.js': { SVG }
    'katex/dist/katex.mjs': katex

    'hypher': Hypher
    'hyphenation.en-us': h-en
    'he'

    'lodash/flattenDeep'
    'lodash/compact'


he.decode.options.strict = true



export class HtmlGenerator extends Generator

    ### public instance vars

    # tokens translated to html
    sp:                 ' '
    brsp:               '\u200B '               # U+200B + ' ' breakable but non-collapsible space
    nbsp:               he.decode "&nbsp;"      # U+00A0
    visp:               he.decode "&blank;"     # U+2423  visible space
    zwnj:               he.decode "&zwnj;"      # U+200C  prevent ligatures
    shy:                he.decode "&shy;"       # U+00AD  word break/hyphenation marker
    thinsp:             he.decode "&thinsp;"    # U+2009


    ### private static vars
    create =            (type, classes) -> el = document.createElement type; el.setAttribute "class", classes; return el

    blockRegex =        //^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes
                           |noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$//i

    isBlockLevel =      (el) -> blockRegex.test el.nodeName


    # generic elements

    inline:             "span"
    block:              "div"


    # typographic elements

    titlepage:          ~> create @block, "titlepage"
    title:              ~> create @block, "title"
    author:             ~> create @block, "author"
    date:               ~> create @block, "date"

    abstract:           ~> create @block, "abstract"

    part:               "part"
    chapter:            "h1"
    section:            "h2"
    subsection:         "h3"
    subsubsection:      "h4"
    paragraph:          "h5"
    subparagraph:       "h6"

    linebreak:          "br"

    par:                "p"

    list:               ~> create @block, "list"

    unordered-list:     ~> create "ul",   "list"
    ordered-list:       ~> create "ol",   "list"
    description-list:   ~> create "dl",   "list"

    listitem:           "li"
    term:               "dt"
    description:        "dd"

    itemlabel:          ~> create @inline, "itemlabel"

    quote:              ~> create @block, "list quote"
    quotation:          ~> create @block, "list quotation"
    verse:              ~> create @block, "list verse"

    multicols:          (c) ~> ~>
                            el = create @block, "multicols"
                            el.setAttribute "style", "column-count:" + c
                            return el


    anchor:             (id) ~> ->
                            el = document.createElement "a"
                            el.id? = id
                            return el

    link:               (url) ~> ->
                            el = document.createElement "a"
                            el.setAttribute "href", url if url
                            return el

    verb:               ~> create "code", "tt"
    verbatim:           "pre"

    picture:            ~> create @inline, "picture"
    picture-canvas:     ~> create @inline, "picture-canvas"



    ### public instance vars (vars beginning with "_" are meant to be private!)

    SVG: SVG
    KaTeX: katex

    _dom:   null



    # CTOR
    #
    # options:
    #  - documentClass: the default document class if a document without preamble is parsed
    #  - CustomMacros: a constructor (class/function) with additional custom macros
    #  - hyphenate: boolean, enable or disable automatic hyphenation
    #  - languagePatterns: language patterns object to use for hyphenation if it is enabled (default en)
    #    TODO: infer language from LaTeX preamble and load hypenation patterns automatically
    #  - styles: array with additional CSS stylesheets
    #  - precision: precision of numbers in CSS and SVG
    (options) ->
        @_options = Object.assign {
            documentClass: "article"
            styles: []
            hyphenate: true
            languagePatterns: h-en
            precision: 3
        }, options

        if @_options.hyphenate
            @_h = new Hypher(@_options.languagePatterns)

        @reset!


    reset: !->
        super!

        @_dom = document.createDocumentFragment!



    ### character/text creation

    character: (c) ->
        c

    textquote: (q) ->
        switch q
        | '`'   => @symbol \textquoteleft
        | '\''  => @symbol \textquoteright

    hyphen: ->
        if @_activeAttributeValue('fontFamily') == 'tt'
            '-'                                         # U+002D
        else
            he.decode "&hyphen;"                        # U+2010

    ligature: (l) ->
        # no ligatures in tt
        if @_activeAttributeValue('fontFamily') == 'tt'
            l
        else
            ligatures.get l


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


    /* @return the HTMLDocument for use as a standalone webpage
     * @param baseURL the base URL to use to build an absolute URL
     */
    htmlDocument: (baseURL) ->
        doc = document.implementation.createHTMLDocument @documentTitle

        ### head

        charset = document.createElement "meta"
        charset.setAttribute "charset", "UTF-8"
        doc.head.appendChild charset

        if not baseURL
            # when used in a browser context, always insert all assets with absolute URLs;
            # this is also useful when using a Blob in iframe.src (see also #12)
            baseURL = window.location?.href

        if baseURL
            base = document.createElement "base"    # TODO: is the base element still needed??
            base.href = baseURL                     # TODO: not in svgdom
            doc.head.appendChild base

            doc.head.appendChild @stylesAndScripts baseURL
        else
            doc.head.appendChild @stylesAndScripts!


        ### body

        doc.body.appendChild @domFragment!
        @applyLengthsAndGeometryToDom doc.documentElement

        return doc




    /* @return a DocumentFragment consisting of stylesheets and scripts */
    stylesAndScripts: (baseURL) ->
        el = document.createDocumentFragment!

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

        if baseURL
            el.appendChild createStyleSheet new URL("css/katex.css", baseURL).toString!
            el.appendChild createStyleSheet new URL(@documentClass@@css, baseURL).toString!

            for style in @_options.styles
                el.appendChild createStyleSheet new URL(style, baseURL).toString!

            el.appendChild createScript new URL("js/base.js", baseURL).toString!
        else
            el.appendChild createStyleSheet "css/katex.css"
            el.appendChild createStyleSheet @documentClass@@css

            for style in @_options.styles
                el.appendChild createStyleSheet style

            el.appendChild createScript "js/base.js"

        return el



    /* @return DocumentFragment, the full page without stylesheets or scripts */
    domFragment: ->
        el = document.createDocumentFragment!

        # text body
        el.appendChild @create @block, @_dom, "body"

        if @_marginpars.length
            # marginpar on the right - TODO: is there any configuration possible to select which margin?
            #el.appendChild @create @block, null, "margin-left"
            el.appendChild @create @block, @create(@block, @_marginpars, "marginpar"), "margin-right"

        return el


    /* write the TeX lengths and page geometry to the DOM */
    applyLengthsAndGeometryToDom: (el) !->

        # root font size
        el.style.setProperty '--size', @length(\@@size).value

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
        #el.style.setProperty '--paperwidth', @length \paperwidth).value

        twp =  100 * (@length \textwidth).ratio(@length \paperwidth)
        mlwp = 100 * (@length(\oddsidemargin).add new @Length 1, "in").ratio(@length \paperwidth)
        mrwp = Math.max(100 - twp - mlwp, 0)

        el.style.setProperty '--textwidth', @round(twp) + "%"
        el.style.setProperty '--marginleftwidth', @round(mlwp) + "%"
        el.style.setProperty '--marginrightwidth', @round(mrwp) + "%"

        if mrwp > 0
            # marginparwidth percentage relative to parent, which is marginrightwidth!
            mpwp = 100 * 100 * (@length \marginparwidth).ratio(@length \paperwidth) / mrwp
            el.style.setProperty '--marginparwidth', @round(mpwp) + "%"
        else
            el.style.setProperty '--marginparwidth', "0px"

        # set the rest of the lengths (TODO: write all defined lengths to CSS, for each group)
        el.style.setProperty '--marginparsep', @length(\marginparsep).value
        el.style.setProperty '--marginparpush', @length(\marginparpush).value




    ### document creation

    createDocument: (fs) !->
        appendChildren @_dom, fs



    ### element creation

    # type: string or function/element factory
    # children: an Element or an array of Element
    create: (type, children, classes = "") ->
        if typeof type == "function"
            el = type!
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
        @addAttributes document.createTextNode if @_options.hyphenate then @_h.hyphenateText t else t

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

        # offset sets the coordinates of the lower left corner, so shift negatively
        if offset
            canvas.setAttribute "style", "left:#{offset.x.mul(-1).value};bottom:#{offset.y.mul(-1).value}"

        # picture
        pic = @create @picture
        pic.appendChild canvas
        pic.setAttribute "style", "width:#{size.x.value};height:#{size.y.value}"

        pic





    # for skip == smallskip, medskip, bigskip
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
        span.setAttribute "style", "margin-bottom:" + length.value
        return span

    createVSpaceInline: (length) ->
        span = document.createElement "span"
        span.setAttribute "class", "vspace-inline"
        span.setAttribute "style", "margin-bottom:" + length.value
        return span

    # create a linebreak with a given vspace between the lines
    createBreakSpace: (length) ->
        span = document.createElement "span"
        span.setAttribute "class", "breakspace"
        span.setAttribute "style", "margin-bottom:" + length.value
        # we need to add the current font in case it uses a relative length (e.g. em)
        return @addAttributes span

    createHSpace: (length) ->
        span = document.createElement "span"
        span.setAttribute "style", "margin-right:" + length.value
        return span




    parseMath: (math, display) ->
        f = document.createDocumentFragment!
        katex.render math, f,
            displayMode: !!display
            throwOnError: false
        f



    ## attributes and nodes/elements

    # add the given attribute(s) to a single element
    addAttribute: (el, attrs) !->
        if el.hasAttribute "class"
            attrs = el.getAttribute("class") + " " + attrs
        el.setAttribute "class", attrs

    hasAttribute: (el, attr) ->
        el.hasAttribute "class" and //\b#{attr}\b//.test el.getAttribute "class"


    # this wraps the current attribute values around the given element or array of elements
    addAttributes: (nodes) ->
        attrs = @_inlineAttributes!
        return nodes if not attrs

        if nodes instanceof window.Element
            if isBlockLevel nodes
                return @create @block, nodes, attrs
            else
                return @create @inline, nodes, attrs
        else if nodes instanceof window.Text or nodes instanceof window.DocumentFragment
            return @create @inline, nodes, attrs
        else if Array.isArray nodes
            return nodes.map (node) -> @create @inline, node, attrs
        else
            console.warn "addAttributes got an unknown/unsupported argument:", nodes

        return nodes




    ### private helpers

    appendChildren = (parent, children) ->
        if children
            if Array.isArray children
                for i to children.length
                    parent.appendChild children[i] if children[i]?
            else
                parent.appendChild children

        return parent



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
