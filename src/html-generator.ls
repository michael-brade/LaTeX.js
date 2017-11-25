require! entities
_ = require 'lodash'

# on the server we need to include a DOM implementation
if typeof document == 'undefined'
    global.document = require 'domino' .createDocument!


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

    newline: ->
        @_generator.create @_generator.linebreak


    echo: (args) ->
        @_generator.createFragment args.map (x) ~>
            if x.value
                @_generator.createFragment [
                    @_generator.createText if x.mandatory then "+" else "-"
                    x.value
                    @_generator.createText if x.mandatory then "+" else "-"
                ]

    TeX: ->
        # document.createRange().createContextualFragment('<span class="tex">T<sub>e</sub>X</span>')
        tex = @_generator.create @_generator.inline-block
        tex.setAttribute('class', 'tex')

        tex.appendChild @_generator.createText 'T'
        sub = document.createElement 'sub'
        sub.appendChild @_generator.createText 'e'
        tex.appendChild sub
        tex.appendChild @_generator.createText 'X'

        return tex

    LaTeX: ->
        # <span class="latex">L<sup>a</sup>T<sub>e</sub>X</span>
        latex = @_generator.create @_generator.inline-block
        latex.setAttribute('class', 'latex')

        latex.appendChild @_generator.createText 'L'
        sup = document.createElement 'sup'
        sup.appendChild @_generator.createText 'a'
        latex.appendChild sup
        latex.appendChild @_generator.createText 'T'
        sub = document.createElement 'sub'
        sub.appendChild @_generator.createText 'e'
        latex.appendChild sub
        latex.appendChild @_generator.createText 'X'

        return latex


    textbackslash: ->
        @_generator.createText '\\'


    today: ->
        @_generator.createText new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })


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

    ### public instance vars (vars beginning with "_" are meant to be private!)

    _macros: null

    _dom:   null
    _attrs: null        # attribute stack
    _groups: null       # grouping stack

    _continue: false

    # tokens translated to html
    sp:     ' '
    brsp:   '\u200B '                       # breakable but non-collapsible space: &#8203; U+200B
    nbsp:   entities.decodeHTML "&nbsp;"    # &#160;   U+00A0
    thinsp: entities.decodeHTML "&thinsp;"  # &#8201;
    hyphen: entities.decodeHTML "&hyphen;"  # &#8208;  U+2010
    minus:  entities.decodeHTML "&minus;"   # &#8722;  U+2212
    endash: entities.decodeHTML "&ndash;"   # &#8211;  U+2013
    emdash: entities.decodeHTML "&mdash;"   # &#8212;  U+2014


    # typographic elements
    paragraph:              "p"
    linebreak:              "br"

    unordered-list:         "ul"
    ordered-list:           "ol"
    listitem:               "li"

    description-list:       "dl"
    term:                   "dt"
    description:            "dd"

    emph:                   "em"

    inline-block:           "span"
    block:                  "div"


    ### private static vars

    ligatures = new Map([
        * 'ff'  '\uFB00'
        * 'ffi' '\uFB03'
        * 'ffl' '\uFB04'
        * 'fi'  '\uFB01'
        * 'fl'  '\uFB02'
        * '!´'  '\u00A1'      # &iexcl;
        * '?´'  '\u00BF'      # &iquest;
        * '<<'  '\u00AB'      # &laquo;
        * '>>'  '\u00BB'      # &raquo;
    ])



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
        | ' '  => @brsp
        | ','  => @thinsp
        | '-'  =>               # nothing, just a word break marker
        | _    => @character c


    # get the result

    /* @return the DOM representation (DocumentFrament) for immediate use */
    dom: ->
        @_dom


    /* @return the HTML representation */
    html: ->
        @_serializeFragment @_dom



    # content creation

    createDocument: (fs) !->
        @_appendChildrenTo fs, @_dom


    create: (type, children) ->
        el = document.createElement type
        if @_continue
            el.setAttribute("class", "continue")
            @_continue = false
        @_appendChildrenTo children, el

    createText: (t) ->
        return if not t
        @_wrapWithAttributes document.createTextNode t

    createFragment: (children) ->
        return if not children or !children.length
        f = document.createDocumentFragment!
        @_appendChildrenTo children, f


    hasMacro: (name) ->
        typeof @_macros[name] == "function"

    processMacro: (name, starred, args) ->
        @_macros[name](args)


    # groups

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


    # attributes (CSS classes)

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


    _attributes: ->
        cur = @_attrs.top
        [cur.fontFamily, cur.fontWeight, cur.fontShape, cur.fontSize, cur.align].join " " .trim!


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
            attrs = @_attributes!

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