require! entities
_ = require 'lodash'

# on the server we need to include a DOM implementation
if (typeof document == 'undefined')
    global.document = require 'domino' .createDocument!



class Macros

    # CTOR
    (generator) ->
        @_generator = generator


    # all known macros

    newline: !-> 
        @_generator.processLineBreak!


    echo: (args) !->
        for arg in args
            @_generator.processFragment arg.value



class Itemize

    _empty: true

    # CTOR
    (generator) ->
        @_generator = generator
        @_generator.addFragment "ul"
        
    # item should take cfrag into li, then start a new cfrag
    # OR: after item, add stuff with addChildFragment
    item: !->
        @_generator.popFragment! if not @_empty
        @_generator.addFragment "li"
        @_empty = false

    end: ->
        @_generator.popFragment! if not @_empty
        

class Enumerate



class Description




export class HtmlGenerator

    ### public instance vars (vars beginning with "_" are meant to be private!)

    _macros: null

    _dom:   null
    _cfrag: null        # current DocumentFragment stack
    _env:   null        # current environment stack

    # tokens translated to html
    sp:     " "
    nbsp:   entities.decodeHTML "&nbsp;"    # &#160;
    thinsp: entities.decodeHTML "&thinsp;"  # &#8201;
    hyphen: entities.decodeHTML "&hyphen;"  # &#8208;  U+2010
    minus:  entities.decodeHTML "&minus;"   # &#8722;  U+2212
    endash: entities.decodeHTML "&ndash;"   # &#8211;  U+2013
    emdash: entities.decodeHTML "&mdash;"   # &#8212;  U+2014


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


    environments = new Map([
        * "itemize"     Itemize
        * "enumerate"   Enumerate
        * "description" Description
        # * "comment"
        # * "center"
        # * "flushleft"
        # * "flushright"
        # * "quote"
        # * "quotation"
        # * "verse"
    ])


    # CTOR
    ->
        # initialize only in CTOR, otherwise the objects end up in the prototype
        @_dom = document.createDocumentFragment!
        @_cfrag = []
        @_env = []

        @_macros = new Macros(this)

        # the whole document is a group
        # each paragraph is a group TODO: might get us into trouble... with fonts and overlapping groups...
        @beginGroup!


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
        | ','  => @thinsp
        | _    => c


    # get the result

    /* @return the DOM representation (DocumentFrament) for immediate use */
    dom: ->
        @_dom


    /* @return the HTML representation */
    html: ->
        @_serializeFragment @_dom


    # content processing

    addFragment: (e) ->
        @_cfrag.push document.createElement(e)

    popFragment: !->
        @processFragment @_cfrag.pop!

    processFragment: (f) !->
        @_cfrag[@_cfrag.length - 1].appendChild f


    processString: (s) !->
        @processFragment document.createTextNode(s)

    processLineBreak: !->
        @processFragment document.createElement("br")


    # this should also be called by a macro that is not inline but a block macro to end the previous par
    processParagraphBreak: !->
        if (@_cfrag.length > 1)
            throw new Error("Parsing Error: no nesting of block level stuff allowed!")

        @endParagraph!
        @beginGroup!


    endParagraph: !->
        p = document.createElement "p"
        cur = @endGroup!
        p.appendChild cur
        @_dom.appendChild p


    # A group is contained in a new document fragment. endGroup() always returns the fragment.

    beginGroup: !->
        @_cfrag.push document.createDocumentFragment!

    endGroup: ->
        @_cfrag.pop!



    processMacro: (name, starred, args) ->
        # first see if the current environment provides the macro, then fall back
        if @_env.length > 0 and typeof @_env[@_env.length - 1][name] == "function"
            @_env[@_env.length - 1][name](args)
        else if typeof @_macros[name] == "function"
            @_macros[name](args)
        else
            console.error "Error: no such macro: #{name}!"



    
    # Environments

    startEnv: (name) !->
        @endParagraph!
        @_env.push new (environments.get name)(this)


    endEnv: !->
        env = @_env.pop!
        env.end!

        @_dom.appendChild @endGroup!        
        @beginGroup!
        


    # utilities

    formatLocation: (location) ->
