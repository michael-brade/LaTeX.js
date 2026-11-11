import
    './latex.ltx.ls': { LaTeX }
    './types.ls': { makeLengthClass }

Macros = LaTeX


export class Generator

    ### public instance vars (vars beginning with "_" are meant to be private!)

    documentClass: null     # name of the default document class until \documentclass{}, then the actual class instance

    # initialize only in CTOR, otherwise the objects end up in the prototype
    _options: null

    _labels: null
    _refs: null

    _marginpars: null


    reset: !->
        @documentClass = @_options.documentClass

        @_labels = new Map()
        @_refs = new Map()

        @_marginpars = []

        @newCounter \enumi
        @newCounter \enumii
        @newCounter \enumiii
        @newCounter \enumiv

        # do this after creating the sectioning counters because \thepart etc. are already predefined
        @_macros = new Macros @, @_options.CustomMacros


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



    ### LaTeX counters (global)

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

        marginPar = @create @block, [@create(@inline, null, "mpbaseline"), txt]
        marginPar.id = id

        @_marginpars.push marginPar

        marginRef = @create @inline, null, "mpbaseline"
        marginRef.id = "marginref-" + id

        marginRef
