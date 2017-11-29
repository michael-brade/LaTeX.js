# on the server we need to include a DOM implementation
if typeof document == 'undefined'
    global.document = require 'domino' .createDocument!

require! [entities, katex]
_ = require 'lodash'



Object.defineProperty Array.prototype, 'top',
    enumerable: false
    configurable: true
    get: -> @[@length - 1]
    set: undefined



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
    brsp:                       '\u200B '                       # breakable but non-collapsible space: &#8203; U+200B
    nbsp:                       entities.decodeHTML "&nbsp;"    # U+00A0
    thinsp:                     entities.decodeHTML "&thinsp;"  # U+2009

    hyphen:                     entities.decodeHTML "&hyphen;"  # U+2010
    minus:                      entities.decodeHTML "&minus;"   # U+2212
    endash:                     entities.decodeHTML "&ndash;"   # U+2013
    emdash:                     entities.decodeHTML "&mdash;"   # U+2014


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

    emph:                       "em"

    linebreak:                  "br"

    inline-block:               "span"
    block:                      "div"


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
        * \nobreakspace         entities.decodeHTML '&nbsp;'    #     U+00A0
        * \thinspace            entities.decodeHTML '&thinsp;'  #     U+2009
        * \enspace              entities.decodeHTML '&ensp;'    #     U+2002   (en quad: U+2000)
        * \enskip               entities.decodeHTML '&ensp;'
        * \quad                 entities.decodeHTML '&emsp;'    #     U+2003   (em quad: U+2001)
        * \qquad                entities.decodeHTML '&emsp;'*2

        * \textvisiblespace     '\u2423'                        # ␣

        # basic latin
        * \slash                '/'
        * \textasciicircum      '^'                             #     U+005E    \^{}
        * \textless             '<'                             #     U+003C
        * \textgreater          '>'                             #     U+003E
        * \textasciitilde       '˜'                             #     U+007E    \~{}
        * \textbackslash        '∖'                             #     U+005C
        * \textbraceleft        '{'                             #               \{
        * \textbraceright       '}'                             #               \}
        * \textdollar           '$'                             #               \$
        * \textunderscore       '_'                             #     U+005F    \_

        # quotes
        * \textquoteleft        entities.decodeHTML '&lsquo;'   # ‘   U+2018
        * \textquoteright       entities.decodeHTML '&rsquo;'   # ’   U+2019
        * \textquotedbl         entities.decodeHTML '&quot;'    # "   U+0022
        * \textquotedblleft     entities.decodeHTML '&ldquo;'   # “   U+201C
        * \textquotedblright    entities.decodeHTML '&rdquo;'   # ”   U+201D
        * \quotesinglbase       entities.decodeHTML '&sbquo;'   # ‚   U+201A
        * \quotedblbase         entities.decodeHTML '&bdquo;'   # „   U+201E
        * \guillemotleft        entities.decodeHTML '&laquo;'   # «   U+00AB
        * \guillemotright       entities.decodeHTML '&raquo;'   # »   U+00BB
        * \guilsinglleft        entities.decodeHTML '&lsaquo;'  # ‹   U+2039
        * \guilsinglright       entities.decodeHTML '&rsaquo;'  # ›   U+203A

        # punctuation
        * \textellipsis         entities.decodeHTML '&hellip;'  # …   U+2026    \dots
        * \dots                 entities.decodeHTML '&hellip;'
        * \textbullet           entities.decodeHTML '&bull;'    # •   U+2022
        * \textemdash           '\u2013'                        # —
        * \textendash           '\u2014'                        # –
        * \textdagger           '\u2020'                        # †             \dag
        * \dag                  '\u2020'
        * \textdaggerdbl        '\u2021'                        # ‡             \ddag
        * \ddag                 '\u2021'
        * \textperiodcentered   entities.decodeHTML '&middot;'  # ·   U+00B7
        * \textexclamdown       entities.decodeHTML '&iexcl;'   # ¡   U+00A1
        * \textquestiondown     entities.decodeHTML '&iquest;'  # ¿   U+00BF

        * \textsection          entities.decodeHTML '&sect;'    # §   U+00A7    \S
        * \S                    entities.decodeHTML '&sect;'
        * \textparagraph        entities.decodeHTML '&para;'    # ¶   U+00B6    \P
        * \P                    entities.decodeHTML '&para;'

        # misc
        * \checkmark            '\u2713'                        # ✓
        * \textordfeminine      entities.decodeHTML '&ordf;'    # ª   U+00AA
        * \textordmasculine     entities.decodeHTML '&ordm;'    # º   U+00BA
        * \textbar              '\u007C'                        # |
        * \textbardbl           '\u2016'                        # ‖
        * \textbigcircle        '\u25CB'                        # ○
        * \textcopyright        entities.decodeHTML '&copy;'    # ©   U+00A9    \copyright
        * \copyright            entities.decodeHTML '&copy;'
        * \textregistered       entities.decodeHTML '&reg;'     # ®   U+00AE
        * \texttrademark        entities.decodeHTML '&trade;'   # ™   U+2122

        * \textdegree           entities.decodeHTML '&deg;'     # °   U+00B0    \degree
        * \degree               entities.decodeHTML '&deg;'
        * \textcelsius          '\u2103'                        # ℃  U+2103    \celsius
        * \celsius              '\u2103'

        # math symbols
        * \textperthousand      entities.decodeHTML '&permil;'  # ‰   U+2030    \perthousand
        * \perthousand          entities.decodeHTML '&permil;'
        * \textpertenthousand   '\u2031'                        # ‱
        * \textonehalf          entities.decodeHTML '&frac12;'  # ½   U+00BD
        * \textthreequarters    entities.decodeHTML '&frac34;'  # ¾   U+00BE
        * \textonequarter       entities.decodeHTML '&frac14;'  # ¼   U+00BC
        * \textfractionsolidus  entities.decodeHTML '&frasl;'   # ⁄   U+2044
        * \textdiv              entities.decodeHTML '&divide;'  # ÷   U+00F7
        * \texttimes            entities.decodeHTML '&times;'   # ×   U+00D7
        * \textminus            entities.decodeHTML '&minus;'   # −   U+2212
        * \textpm               entities.decodeHTML '&plusmn;'  # ±   U+00B1
        * \textsurd             entities.decodeHTML '&radic;'   # √   U+221A
        * \textlnot             entities.decodeHTML '&not;'     # ¬   U+00AC
        * \textasteriskcentered entities.decodeHTML '&lowast;'  # ∗   U+2217
        * \textonesuperior      entities.decodeHTML '&sup1;'    # ¹   U+00B9
        * \texttwosuperior      entities.decodeHTML '&sup2;'    # ²   U+00B2
        * \textthreesuperior    entities.decodeHTML '&sup3;'    # ³   U+00B3

        # old style numerals
        * \textzerooldstyle     '\uF730'                        # 
        * \textoneoldstyle      '\uF731'                        # 
        * \texttwooldstyle      '\uF732'                        # 
        * \textthreeoldstyle    '\uF733'                        # 
        * \textfouroldstyle     '\uF734'                        # 
        * \textfiveoldstyle     '\uF735'                        # 
        * \textsixoldstyle      '\uF736'                        # 
        * \textsevenoldstyle    '\uF737'                        # 
        * \texteightoldstyle    '\uF738'                        # 
        * \textnineoldstyle     '\uF739'                        # 

        # currencies
        * \texteuro             entities.decodeHTML '&euro;'    # €   U+20AC
        * \textcent             entities.decodeHTML '&cent;'    # ¢   U+00A2
        * \textsterling         entities.decodeHTML '&pound;'   # £   U+00A3    \pounds
        * \pounds               entities.decodeHTML '&pound;'

        # greek letters - lower case
        * \textalpha            entities.decodeHTML '&alpha;'   # α     U+03B1
        * \textbeta             entities.decodeHTML '&beta;'    # β     U+03B2
        * \textgamma            entities.decodeHTML '&gamma;'   # γ     U+03B3
        * \textdelta            entities.decodeHTML '&delta;'   # δ     U+03B4
        * \textepsilon          entities.decodeHTML '&epsilon;' # ε     U+03B5
        * \textzeta             entities.decodeHTML '&zeta;'    # ζ     U+03B6
        * \texteta              entities.decodeHTML '&eta;'     # η     U+03B7
        * \texttheta            entities.decodeHTML '&thetasym;'# ϑ     U+03D1  (θ = U+03B8)
        * \textiota             entities.decodeHTML '&iota;'    # ι     U+03B9
        * \textkappa            entities.decodeHTML '&kappa;'   # κ     U+03BA
        * \textlambda           entities.decodeHTML '&lambda;'  # λ     U+03BB
        * \textmu               entities.decodeHTML '&mu;'      # μ     U+03BC
        * \textnu               entities.decodeHTML '&nu;'      # ν     U+03BD
        * \textxi               entities.decodeHTML '&xi;'      # ξ     U+03BE
        * \textomikron          entities.decodeHTML '&omicron;' # ο     U+03BF
        * \textpi               entities.decodeHTML '&pi;'      # π     U+03C0
        * \textrho              entities.decodeHTML '&rho;'     # ρ     U+03C1
        * \textsigma            entities.decodeHTML '&sigma;'   # σ     U+03C3
        * \texttau              entities.decodeHTML '&tau;'     # τ     U+03C4
        * \textupsilon          entities.decodeHTML '&upsilon;' # υ     U+03C5
        * \textphi              entities.decodeHTML '&phi;'     # φ     U+03C6
        * \textchi              entities.decodeHTML '&chi;'     # χ     U+03C7
        * \textpsi              entities.decodeHTML '&psi;'     # ψ     U+03C8
        * \textomega            entities.decodeHTML '&omega;'   # ω     U+03C9
        * \textAlpha            entities.decodeHTML '&Alpha;'   # Α     U+0391
        * \textBeta             entities.decodeHTML '&Beta;'    # Β     U+0392
        * \textGamma            entities.decodeHTML '&Gamma;'   # Γ     U+0393
        * \textDelta            entities.decodeHTML '&Delta;'   # Δ     U+0394
        * \textEpsilon          entities.decodeHTML '&Epsilon;' # Ε     U+0395
        * \textZeta             entities.decodeHTML '&Zeta;'    # Ζ     U+0396
        * \textEta              entities.decodeHTML '&Eta;'     # Η     U+0397
        * \textTheta            entities.decodeHTML '&Theta;'   # Θ     U+0398
        * \textIota             entities.decodeHTML '&Iota;'    # Ι     U+0399
        * \textKappa            entities.decodeHTML '&Kappa;'   # Κ     U+039A
        * \textLambda           entities.decodeHTML '&Lambda;'  # Λ     U+039B
        * \textMu               entities.decodeHTML '&Mu;'      # Μ     U+039C
        * \textNu               entities.decodeHTML '&Nu;'      # Ν     U+039D
        * \textXi               entities.decodeHTML '&Xi;'      # Ξ     U+039E
        * \textOmikron          entities.decodeHTML '&Omicron;' # Ο     U+039F
        * \textPi               entities.decodeHTML '&Pi;'      # Π     U+03A0
        * \textRho              entities.decodeHTML '&Rho;'     # Ρ     U+03A1
        * \textSigma            entities.decodeHTML '&Sigma;'   # Σ     U+03A3
        * \textTau              entities.decodeHTML '&Tau;'     # Τ     U+03A4
        * \textUpsilon          entities.decodeHTML '&Upsilon;' # Υ     U+03A5
        * \textPhi              entities.decodeHTML '&Phi;'     # Φ     U+03A6
        * \textChi              entities.decodeHTML '&Chi;'     # Χ     U+03A7
        * \textPsi              entities.decodeHTML '&Psi;'     # Ψ     U+03A8
        * \textOmega            entities.decodeHTML '&Omega;'   # Ω     U+03A9
    ])


    ### public instance vars (vars beginning with "_" are meant to be private!)

    _macros: null

    _dom:   null
    _attrs: null        # attribute stack
    _groups: null       # grouping stack

    _continue: false


    # CTOR
    ->
        # initialize only in CTOR, otherwise the objects end up in the prototype
        @_dom = document.createDocumentFragment!

        # stack of text attributes - entering a group adds another entry, leaving a group removes the top entry
        @_attrs = [{}]
        @_groups = []

        @_macros = new Macros(this)


    _serializeFragment: (f) ->
        c = document.createElement "container"
        # c.appendChild(f.cloneNode(true))
        c.appendChild(f)    # for speed; however: if this fragment is to be serialized more often -> cloneNode(true) !!
        c.innerHTML


    character: (c) ->
        c

    ligature: (l) ->
        ligatures.get l

    controlSymbol: (c) ->
        switch c
        | ' ', '\n', '\r', '\t' => @brsp
        | ','                   => @thinsp
        | '-'                   =>               # nothing, just a word break marker
        | _                     => @character c


    # get the result

    /* @return the DOM representation (DocumentFrament) for immediate use */
    dom: ->
        @_dom


    /* @return the HTML representation */
    html: ->
        @_serializeFragment @_dom



    ### content creation

    createDocument: (fs) !->
        @_appendChildrenTo fs, @_dom


    create: (type, children, classes = "") ->
        if type == @paragraph or type == @block # TODO if @_isPhrasingContent type, TODO: also for multicols?
            classes += " " + @_blockAttributes!

        if typeof type == "object"
            el = type.cloneNode true
            if el.hasAttribute "class"
                classes += " " + el.getAttribute "class"
        else
            el = document.createElement type

        # if continue then do not add parindent or parskip, we are not supposed to start a new paragraph
        if @_continue
            classes += " continue"
            @_continue = false

        if classes.trim!
            el.setAttribute "class", classes.trim!

        @_appendChildrenTo children, el

    createText: (t) ->
        return if not t
        @_wrapWithAttributes document.createTextNode t

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
        katex.default.render math, f,
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


    # utilities

    debugDOM: (oParent, oCallback) !->
        if oParent.hasChildNodes()
            oNode = oParent.firstChild
            while oNode, oNode = oNode.nextSibling
                DOMComb(oNode, oCallback)

        oCallback.call(oParent)


    debugNode: (n) !->
        return if not n
        if typeof n.nodeName != "undefined"
            console.log n.nodeName, ": ", n.textContent
        else
            console.log "not a node: ", n

    debugNodes: (l) !->
        for n in l
            @debugNode n

    debugNodeContent: !->
        if @nodeValue
            console.log @nodeValue