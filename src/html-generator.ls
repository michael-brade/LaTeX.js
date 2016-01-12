_ = require 'lodash'

# on the server we need to include a DOM implementation
if (typeof document == 'undefined')
    global.document = require 'domino' .createDocument!



class Macros

    # CTOR
    (generator) ->
        @_generator = generator


    # all known macros

    echo: (args) ->
        for arg in args
            @_generator.processFragment arg.value




export class HtmlGenerator

    ### public instance vars (vars beginning with "_" are meant to be private!)

    _macros: null

    _dom:   null
    _cfrag: null      # current DocumentFragment stack


    # tokens translated to html
    sp:     " "
    nbsp:   "&nbsp;"
    thinsp: "&thinsp;"
    endash: "&ndash;"
    emdash: "&mdash;"


    ### private static vars

    # TODO: move to separate class, use stack
    environments =
        "itemize"
        "description"

    # CTOR
    ->
        # initialize only in CTOR, otherwise the objects end up in the prototype
        @_dom = document.createDocumentFragment!
        @_cfrag = []

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


    # get the result

    /* @return the DOM representation (DocumentFrament) for immediate use */
    dom: ->
        @_dom


    /* @return the HTML representation */
    html: ->
        @_serializeFragment @_dom


    # content processing

    processSpace: !->
        @_cfrag[@_cfrag.length - 1].appendChild document.createTextNode(@sp)

    processString: (s) !->
        @_cfrag[@_cfrag.length - 1].appendChild document.createTextNode(s)

    processLineBreak: !->
        @_cfrag[@_cfrag.length - 1].appendChild document.createElement("br")


    # this should also be called by a macro that is not inline but a block macro to end the previous par
    processParagraphBreak: !->
        if (@_cfrag.length > 1)
            throw new Error("Parsing Error: no nesting of block level stuff allowed!")

        p = document.createElement "p"
        cur = @endGroup!
        p.appendChild cur
        @_dom.appendChild p
        @beginGroup!


    beginGroup: !->
        @_cfrag.push document.createDocumentFragment!

    endGroup: ->
        @_cfrag.pop!

    processFragment: (f) !->
        @_cfrag[@_cfrag.length - 1].appendChild f


    processMacro: (name, starred, args) ->
        if typeof @_macros[name] != "function"
            console.log "Error: no such macro: #{name}!"
            return null

        console.log "processing macro #{name}..."
        @_macros[name](args)


    /**
     * This should process known environments
     */
    processEnvironment: (env, content) ->



    # utilities

    formatLocation: (location) ->
