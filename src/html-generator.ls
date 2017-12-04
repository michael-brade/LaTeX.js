require! {
    he
    katex: { default: katex }
    hypher: Hypher
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
        @_generator = generator


    # make sure only one mandatory arg was given or throw an error
    _checkOneM: (arg) !->
        return if arg.length == 1 && arg[0].mandatory
        macro = /Macros\.(\w+)/.exec(new Error().stack.split('\n')[2])[1]
        throw new Error("#{macro} expects exactly one mandatory argument!")


    # all known macros

    # inline macros

    echo: (args) ->
        @_generator.createFragment args.map (x) ~>
            if x.value
                @_generator.createFragment [
                    @_generator.createText if x.mandatory then "+" else "-"
                    x.value
                    @_generator.createText if x.mandatory then "+" else "-"
                ]

    TeX: ->
        # document.createRange().createContextualFragment('<span class="tex">T<span>e</span>X</span>')
        tex = @_generator.create @_generator.inline-block
        tex.setAttribute('class', 'tex')

        tex.appendChild @_generator.createText 'T'
        e = @_generator.create @_generator.inline-block
        e.appendChild @_generator.createText 'e'
        tex.appendChild e
        tex.appendChild @_generator.createText 'X'

        return tex

    LaTeX: ->
        # <span class="latex">L<span>a</span>T<span>e</span>X</span>
        latex = @_generator.create @_generator.inline-block
        latex.setAttribute('class', 'latex')

        latex.appendChild @_generator.createText 'L'
        a = @_generator.create @_generator.inline-block
        a.appendChild @_generator.createText 'a'
        latex.appendChild a
        latex.appendChild @_generator.createText 'T'
        e = @_generator.create @_generator.inline-block
        e.appendChild @_generator.createText 'e'
        latex.appendChild e
        latex.appendChild @_generator.createText 'X'

        return latex


    today: ->
        @_generator.createText new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })


    newline: ->
        @_generator.create @_generator.linebreak


    negthinspace: ->
        ts = @_generator.create @_generator.inline-block
        ts.setAttribute 'class', 'negthinspace'
        return ts

    mbox: (arg) ->
    fbox: (arg) ->


    ## not yet...
    pagestyle: (arg) ->

    ## ignored macros since not useful in html
    include: (arg) ->
    includeonly: (arg) ->
    input: (arg) ->


    # these make no sense without pagebreaks
    vfill: !->

    break: !->
    nobreak: !->
    allowbreak: !->
    newpage: !->
    linebreak: !->      # \linebreak[4] actually means \\
    nolinebreak: !->
    pagebreak: !->
    nopagebreak: !->

    samepage: !->
    enlargethispage: !->
    thispagestyle: !->





export class HtmlGenerator

    ### public instance vars

    # tokens translated to html
    sp:                         ' '
    brsp:                       '\u200B '               # U+200B + ' ' breakable but non-collapsible space
    nbsp:                       he.decode "&nbsp;"      # U+00A0
    zwnj:                       he.decode "&zwnj;"      # U+200C  prevent ligatures
    shy:                        he.decode "&shy;"       # U+00AD  word break/hyphenation marker

    thinsp:                     he.decode "&thinsp;"    # U+2009

    hyphen:                     he.decode "&hyphen;"    # U+2010
    minus:                      he.decode "&minus;"     # U+2212
    endash:                     he.decode "&ndash;"     # U+2013
    emdash:                     he.decode "&mdash;"     # U+2014


    # typographic elements
    part:                       "part"
    chapter:                    "h1"
    section:                    "h2"
    subsection:                 "h3"
    subsubsection:              "h4"
    #paragraph:                  "h5"
    subparagraph:               "h6"

    paragraph:                  "p"

    unordered-list:             do -> el = document.createElement "ul"; el.setAttribute "class", "list"; return el
    ordered-list:               do -> el = document.createElement "ol"; el.setAttribute "class", "list"; return el
    listitem:                   "li"

    description-list:           do -> el = document.createElement "dl"; el.setAttribute "class", "list"; return el
    term:                       "dt"
    description:                "dd"

    quote:                      do -> el = document.createElement "div"; el.setAttribute "class", "list quote"; return el
    quotation:                  do -> el = document.createElement "div"; el.setAttribute "class", "list quotation"; return el
    verse:                      do -> el = document.createElement "div"; el.setAttribute "class", "list verse"; return el

    multicols:                  do -> el = document.createElement "div"; el.setAttribute "class", "multicols"; return (c) ->
                                                                         el.setAttribute "style", "column-count:" + c; return el

    inline-block:               "span"
    block:                      "div"

    emph:                       "em"
    linebreak:                  "br"
    link:                       do -> el = document.createElement "a"; return (u) -> el.setAttribute "href", u; return el



    # true if it is an inline element, something that makes up paragraphs
    _isPhrasingContent: (type) ->
        type in [
            @inline-block
            @emph
            @linebreak
            @link
        ]



    ### private static vars

    ligatures = new Map([
        * 'ff'  '\uFB00'
        * 'ffi' '\uFB03'
        * 'ffl' '\uFB04'
        * 'fi'  '\uFB01'
        * 'fl'  '\uFB02'
        * '!´'  '\u00A1'        # &iexcl;
        * '?´'  '\u00BF'        # &iquest;
        * '<<'  '\u00AB'        # &laquo;
        * '>>'  '\u00BB'        # &raquo;
    ])

    symbols = new Map([
        # spaces
        * \nobreakspace         he.decode '&nbsp;'      #     U+00A0
        * \thinspace            he.decode '&thinsp;'    #     U+2009
        * \enspace              he.decode '&ensp;'      #     U+2002   (en quad: U+2000)
        * \enskip               he.decode '&ensp;'
        * \quad                 he.decode '&emsp;'      #     U+2003   (em quad: U+2001)
        * \qquad                he.decode '&emsp;'*2

        * \textvisiblespace     '\u2423'                # ␣

        # basic latin
        * \ss                   'ß'
        * \slash                he.decode '&sol;'
        * \textasciicircum      '^'                     #     U+005E    \^{}
        * \textless             '<'                     #     U+003C
        * \textgreater          '>'                     #     U+003E
        * \textasciitilde       '˜'                     #     U+007E    \~{}
        * \textbackslash        '\u005C'                #     U+005C
        * \textbraceleft        '{'                     #               \{
        * \textbraceright       '}'                     #               \}
        * \textdollar           '$'                     #               \$
        * \textunderscore       '_'                     #     U+005F    \_

        # quotes
        * \textquoteleft        he.decode '&lsquo;'     # ‘   U+2018
        * \textquoteright       he.decode '&rsquo;'     # ’   U+2019
        * \textquotedbl         he.decode '&quot;'      # "   U+0022
        * \textquotedblleft     he.decode '&ldquo;'     # “   U+201C
        * \textquotedblright    he.decode '&rdquo;'     # ”   U+201D
        * \quotesinglbase       he.decode '&sbquo;'     # ‚   U+201A
        * \quotedblbase         he.decode '&bdquo;'     # „   U+201E
        * \guillemotleft        he.decode '&laquo;'     # «   U+00AB
        * \guillemotright       he.decode '&raquo;'     # »   U+00BB
        * \guilsinglleft        he.decode '&lsaquo;'    # ‹   U+2039
        * \guilsinglright       he.decode '&rsaquo;'    # ›   U+203A

        # punctuation
        * \textellipsis         he.decode '&hellip;'    # …   U+2026    \dots
        * \dots                 he.decode '&hellip;'
        * \textbullet           he.decode '&bull;'      # •   U+2022
        * \textemdash           '\u2013'                # —
        * \textendash           '\u2014'                # –
        * \textdagger           '\u2020'                # †             \dag
        * \dag                  '\u2020'
        * \textdaggerdbl        '\u2021'                # ‡             \ddag
        * \ddag                 '\u2021'
        * \textperiodcentered   he.decode '&middot;'    # ·   U+00B7
        * \textexclamdown       he.decode '&iexcl;'     # ¡   U+00A1
        * \textquestiondown     he.decode '&iquest;'    # ¿   U+00BF

        * \textsection          he.decode '&sect;'      # §   U+00A7    \S
        * \S                    he.decode '&sect;'
        * \textparagraph        he.decode '&para;'      # ¶   U+00B6    \P
        * \P                    he.decode '&para;'

        # misc
        * \checkmark            '\u2713'                # ✓
        * \textordfeminine      he.decode '&ordf;'      # ª   U+00AA
        * \textordmasculine     he.decode '&ordm;'      # º   U+00BA
        * \textbar              '\u007C'                # |
        * \textbardbl           '\u2016'                # ‖
        * \textbigcircle        '\u25CB'                # ○
        * \textcopyright        he.decode '&copy;'      # ©   U+00A9    \copyright
        * \copyright            he.decode '&copy;'
        * \textregistered       he.decode '&reg;'       # ®   U+00AE
        * \texttrademark        he.decode '&trade;'     # ™   U+2122

        * \textdegree           he.decode '&deg;'       # °   U+00B0    \degree
        * \degree               he.decode '&deg;'
        * \textcelsius          '\u2103'                # ℃  U+2103    \celsius
        * \celsius              '\u2103'

        # math symbols
        * \textperthousand      he.decode '&permil;'    # ‰   U+2030    \perthousand
        * \perthousand          he.decode '&permil;'
        * \textpertenthousand   '\u2031'                # ‱
        * \textonehalf          he.decode '&frac12;'    # ½   U+00BD
        * \textthreequarters    he.decode '&frac34;'    # ¾   U+00BE
        * \textonequarter       he.decode '&frac14;'    # ¼   U+00BC
        * \textfractionsolidus  he.decode '&frasl;'     # ⁄   U+2044
        * \textdiv              he.decode '&divide;'    # ÷   U+00F7
        * \texttimes            he.decode '&times;'     # ×   U+00D7
        * \textminus            he.decode '&minus;'     # −   U+2212
        * \textpm               he.decode '&plusmn;'    # ±   U+00B1
        * \textsurd             he.decode '&radic;'     # √   U+221A
        * \textlnot             he.decode '&not;'       # ¬   U+00AC
        * \textasteriskcentered he.decode '&lowast;'    # ∗   U+2217
        * \textonesuperior      he.decode '&sup1;'      # ¹   U+00B9
        * \texttwosuperior      he.decode '&sup2;'      # ²   U+00B2
        * \textthreesuperior    he.decode '&sup3;'      # ³   U+00B3

        # old style numerals
        * \textzerooldstyle     '\uF730'                # 
        * \textoneoldstyle      '\uF731'                # 
        * \texttwooldstyle      '\uF732'                # 
        * \textthreeoldstyle    '\uF733'                # 
        * \textfouroldstyle     '\uF734'                # 
        * \textfiveoldstyle     '\uF735'                # 
        * \textsixoldstyle      '\uF736'                # 
        * \textsevenoldstyle    '\uF737'                # 
        * \texteightoldstyle    '\uF738'                # 
        * \textnineoldstyle     '\uF739'                # 

        # currencies
        * \texteuro             he.decode '&euro;'      # €   U+20AC
        * \textcent             he.decode '&cent;'      # ¢   U+00A2
        * \textsterling         he.decode '&pound;'     # £   U+00A3    \pounds
        * \pounds               he.decode '&pound;'

        # greek letters - lower case
        * \textalpha            he.decode '&alpha;'     # α     U+03B1
        * \textbeta             he.decode '&beta;'      # β     U+03B2
        * \textgamma            he.decode '&gamma;'     # γ     U+03B3
        * \textdelta            he.decode '&delta;'     # δ     U+03B4
        * \textepsilon          he.decode '&epsilon;'   # ε     U+03B5
        * \textzeta             he.decode '&zeta;'      # ζ     U+03B6
        * \texteta              he.decode '&eta;'       # η     U+03B7
        * \texttheta            he.decode '&thetasym;'  # ϑ     U+03D1  (θ = U+03B8)
        * \textiota             he.decode '&iota;'      # ι     U+03B9
        * \textkappa            he.decode '&kappa;'     # κ     U+03BA
        * \textlambda           he.decode '&lambda;'    # λ     U+03BB
        * \textmu               he.decode '&mu;'        # μ     U+03BC
        * \textnu               he.decode '&nu;'        # ν     U+03BD
        * \textxi               he.decode '&xi;'        # ξ     U+03BE
        * \textomikron          he.decode '&omicron;'   # ο     U+03BF
        * \textpi               he.decode '&pi;'        # π     U+03C0
        * \textrho              he.decode '&rho;'       # ρ     U+03C1
        * \textsigma            he.decode '&sigma;'     # σ     U+03C3
        * \texttau              he.decode '&tau;'       # τ     U+03C4
        * \textupsilon          he.decode '&upsilon;'   # υ     U+03C5
        * \textphi              he.decode '&phi;'       # φ     U+03C6
        * \textchi              he.decode '&chi;'       # χ     U+03C7
        * \textpsi              he.decode '&psi;'       # ψ     U+03C8
        * \textomega            he.decode '&omega;'     # ω     U+03C9
        * \textAlpha            he.decode '&Alpha;'     # Α     U+0391
        * \textBeta             he.decode '&Beta;'      # Β     U+0392
        * \textGamma            he.decode '&Gamma;'     # Γ     U+0393
        * \textDelta            he.decode '&Delta;'     # Δ     U+0394
        * \textEpsilon          he.decode '&Epsilon;'   # Ε     U+0395
        * \textZeta             he.decode '&Zeta;'      # Ζ     U+0396
        * \textEta              he.decode '&Eta;'       # Η     U+0397
        * \textTheta            he.decode '&Theta;'     # Θ     U+0398
        * \textIota             he.decode '&Iota;'      # Ι     U+0399
        * \textKappa            he.decode '&Kappa;'     # Κ     U+039A
        * \textLambda           he.decode '&Lambda;'    # Λ     U+039B
        * \textMu               he.decode '&Mu;'        # Μ     U+039C
        * \textNu               he.decode '&Nu;'        # Ν     U+039D
        * \textXi               he.decode '&Xi;'        # Ξ     U+039E
        * \textOmikron          he.decode '&Omicron;'   # Ο     U+039F
        * \textPi               he.decode '&Pi;'        # Π     U+03A0
        * \textRho              he.decode '&Rho;'       # Ρ     U+03A1
        * \textSigma            he.decode '&Sigma;'     # Σ     U+03A3
        * \textTau              he.decode '&Tau;'       # Τ     U+03A4
        * \textUpsilon          he.decode '&Upsilon;'   # Υ     U+03A5
        * \textPhi              he.decode '&Phi;'       # Φ     U+03A6
        * \textChi              he.decode '&Chi;'       # Χ     U+03A7
        * \textPsi              he.decode '&Psi;'       # Ψ     U+03A8
        * \textOmega            he.decode '&Omega;'     # Ω     U+03A9
    ])


    ### public instance vars (vars beginning with "_" are meant to be private!)

    _options: null
    _macros: null

    _dom:   null
    _attrs: null        # attribute stack
    _groups: null       # grouping stack

    _continue: false


    # CTOR
    (options) ->
        @_options = options

        if @_options.hyphenate
            @_h = new Hypher(@_options.languagePatterns)

        @_macros = new Macros(this)

        @reset!


    reset: ->
        # initialize only in CTOR, otherwise the objects end up in the prototype
        @_dom = document.createDocumentFragment!

        # stack of text attributes - entering a group adds another entry, leaving a group removes the top entry
        @_attrs = [{}]
        @_groups = []



    character: (c) ->
        c

    ligature: (l) ->
        ligatures.get l

    controlSymbol: (c) ->
        switch c
        | ' ', '\n', '\r', '\t' => @brsp
        | '/'                   => @zwnj
        | ','                   => @thinsp
        | '-'                   => @shy
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
                classes += " " + el.getAttribute "class"
        else
            el = document.createElement type

        if not @_isPhrasingContent type
            classes += " " + @_blockAttributes!

        # if continue then do not add parindent or parskip, we are not supposed to start a new paragraph
        if @_continue
            classes = classes.trim! + " continue"
            @break!

        if classes.trim!
            el.setAttribute "class", classes.trim!

        @_appendChildrenTo children, el

    createText: (t) ->
        return if not t
        @_wrapWithAttributes document.createTextNode if @_options.hyphenate then @_h.hyphenateText t else t

    createFragment: (children) ->
        return if not children or !children.length
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


    hasSymbol: (name) ->
        symbols.has name

    getSymbol: (name) ->
        symbols.get name


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
        [cur.fontFamily, cur.fontWeight, cur.fontShape, cur.fontSize, cur.textDecoration].join " " .trim!

    _blockAttributes: ->
        [@_attrs.top.align].join " ".trim!


    # private helpers

    _appendChildrenTo: (children, parent) ->
        if children
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