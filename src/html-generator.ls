require! entities
_ = require 'lodash'

# on the server we need to include a DOM implementation
if (typeof document == 'undefined')
    global.document = require 'domino' .createDocument!



class Macros

    # CTOR
    (generator) ->
        @_generator = generator


    # make sure only one mandatory arg was given or throw an error
    _checkOneM: (arg) ->
        macro = /Macros\.(\w+)/.exec(new Error().stack.split('\n')[2])[1]
        arg.length == 1 && arg[0].mandatory || throw new Error("#{macro} expects exactly one mandatory argument!")


    # all known macros

    # inline macros

    newline: -> 
        @_generator.create @_generator.linebreak


    echo: (args) ->
        @_generator.createFragment args.map (x) -> x.value

    TeX: ->
        # document.createRange().createContextualFragment('<span class="tex">T<sub>e</sub>X</span>')
        tex = document.createElement 'span'
        tex.setAttribute('class', 'tex')

        tex.appendChild document.createTextNode 'T'
        sub = document.createElement 'sub'
        sub.appendChild document.createTextNode 'e'
        tex.appendChild sub
        tex.appendChild document.createTextNode 'X'

        return tex

    LaTeX: -> 
        # <span class="latex">L<sup>a</sup>T<sub>e</sub>X</span>
        latex = document.createElement 'span'
        latex.setAttribute('class', 'latex')

        latex.appendChild document.createTextNode 'L'
        sup = document.createElement 'sup'
        sup.appendChild document.createTextNode 'a'
        latex.appendChild sup
        latex.appendChild document.createTextNode 'T'
        sub = document.createElement 'sub'
        sub.appendChild document.createTextNode 'e'
        latex.appendChild sub
        latex.appendChild document.createTextNode 'X'

        return latex


    textbackslash: -> 
        @_generator.createText '\\'


    today: ->
        @_generator.createText new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })


    mbox: (arg) ->
    fbox: (arg) ->

    ## alignment

    centering: !->
        @_generator.addClass "center"

    raggedright: !->
        @_generator.addClass "raggedright"

    raggedleft: !->
        @_generator.addClass "raggedleft"



    ## fonts

    # commands

    textnormal: (arg) ->
        @_checkOneM arg

    textrm: (arg) ->
        @_checkOneM arg
    textsf: (arg) ->
        @_checkOneM arg
    texttt: (arg) ->
        @_checkOneM arg

    textmd: (arg) ->
        @_checkOneM arg
    textbf: (arg) ->
        @_checkOneM arg

    textup: (arg) ->
        @_checkOneM arg
    textit: (arg) ->
        @_checkOneM arg
    textsl: (arg) ->
        @_checkOneM arg
    textsc: (arg) ->
        @_checkOneM arg

    emph: (arg) ->
        @_checkOneM arg
        @_generator.create @_generator.emph, arg.map (x) -> x.value

    underline: (arg) ->

    # declarations

    normalfont: ->

    rmfamily: ->
    sffamily: ->
    ttfamily: ->

    mdseries: ->
    bfseries: ->

    upshape: ->
    itshape: ->
    slshape: ->
    scshape: ->

    em: ->


    # size

    tiny: ->
    scriptsize: ->
    footnotesize: ->
    small: ->
    normalsize: ->
    large: ->
    Large: ->
    LARGE: ->
    huge: ->
    Huge: ->


    ## not yet...

    pagestyle: (arg) ->
    thispagestyle: (arg) ->

    ## ignored macros since not useful in html
    include: (arg) ->
    includeonly: (arg) ->
    input: (arg) ->

    newpage: !->
    linebreak: !->
    nolinebreak: !->
    pagebreak: !->
    nopagebreak: !->
    enlargethispage: !->



export class HtmlGenerator

    ### public instance vars (vars beginning with "_" are meant to be private!)

    _macros: null

    _dom:   null
    _attrs: null        # attribute stack

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
        @_attrs = []

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


    # helper

    appendChildrenTo: (children, parent) ->
        for i to children?.length
            parent.appendChild children[i] if children[i]?

        return parent


    # content creation

    createDocument: (fs) !->
        @appendChildrenTo fs, @_dom


    create: (type, children) ->
        el = document.createElement type
        if @_continue
            el.setAttribute("class", "continue")
            @_continue = false
        @appendChildrenTo children, el

    createText: (t) ->
        document.createTextNode t

    createFragment: (children) ->
        f = document.createDocumentFragment!
        @appendChildrenTo children, f


    hasMacro: (name) ->
        typeof @_macros[name] == "function"

    processMacro: (name, starred, args) ->
        if @hasMacro name
            @_macros[name](args)
        else
            console.error "Error: no such macro: #{name}!"


    continue: !->
        @_continue = true

    break: !->
        @_continue = false


    # utilities

    formatLocation: (location) ->
