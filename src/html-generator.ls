_ = require 'lodash'

export class HtmlGenerator
    
    # public instance vars
    
    _html: ""   # maybe use jQuery and build a DOM
                # alternatively: build a class-hierarchy of Paragraphs, Headings, Figures, References

    _cpar: ""   # current paragraph
    
    
    # private static
    
    # tokens
    sp = nl = " "
    nbsp = "&nbsp;"

    environments =
        "itemize"
        "description"


    sp: ->
        sp
    
    nbsp: ->
        nbsp

    nl: ->
        nl

    character: (c) ->
        c

    escapedCharacter: (c) ->
        c
        # TODO: this is quite wrong, use html entities


    # get the result

    html: ->
        # finish last paragraph
        if @_cpar
            @processParagraphBreak!
            
        @_html


    # content processing

    processSpace: !->
        @_cpar += sp

    processNbsp: (n) !->
        @_cpar += n

    processWord: (w) !->
        @_cpar += w

    processPunctuation: (p) !->
        @_cpar += p
        
    processParagraphBreak: !->
        @_html += "<p>" + _.trim(@_cpar) + "</p>\n"
        @_cpar = ""
        
        

    processCommand: (command, args) ->
        

    /**
     * This should process known environments
     */
    processEnvironment: (env, content) ->


    # utilities

    formatLocation: (location) ->
