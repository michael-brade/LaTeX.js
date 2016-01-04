_ = require 'lodash'

# on the server we need to include a DOM implementation
if (typeof document == 'undefined')
    global.document = require 'domino' .createDocument!


export class HtmlGenerator

    ### public instance vars (vars beginning with "_" are meant to be private!)

    _dom:   null
    _cpar:  null    # current paragraph (TextNode)
    _cfrag: null    # current fragment stack

    # tokens translated to html
    sp:         " "
    nbsp:       "&nbsp;"
    endash:     "&ndash;"
    emdash:     "&mdash;"
    thinspace:  "&thinsp;"


    ### private static vars

    # TODO: move to separate class, use stack
    environments =
        "itemize"
        "description"

    # CTOR
    ->
        # initialize only in CTOR, otherwise the objects end up in the prototype
        @_dom = document.createDocumentFragment!
        @_cpar = document.createTextNode ""


    character: (c) ->
        c


    # get the result

    /* @return the DOM representation (DocumentFrament) for immediate use */
    dom: ->
        @_dom


    /* @return the HTML representation */
    html: ->
        # finish last paragraph - TODO: move to parser and make it call @finalize() at EOF!
        if @_cpar.length
            @processParagraphBreak!

        c = document.createElement "container"
        c.appendChild(@_dom)
        c.innerHTML


    # content processing

    processSpace: !->
        @_cpar.appendData @sp

    processNbsp: (n) !->
        @_cpar.appendData n

    processWord: (w) !->
        @_cpar.appendData w

    processPunctuation: (p) !->
        @_cpar.appendData p

    # this should also be called by a macro that is not inline but a block macro to end the previous par
    processParagraphBreak: !->
        p = document.createElement "p"
        @_cpar.data = _.trim @_cpar.data
        p.appendChild @_cpar
        @_dom.appendChild p

        # start a new paragraph
        @_cpar = document.createTextNode ""


    beginGroup: !->
    endGroup: !->

    processMacro: (name, starred, args) ->
        console.log name, ": "
        for arg, i in args
            console.log "* #{i}:", arg


    /**
     * This should process known environments
     */
    processEnvironment: (env, content) ->



    finalize: !->
        # TODO


    # utilities

    formatLocation: (location) ->
