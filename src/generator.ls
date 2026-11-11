import
    './latex.ltx.ls': { LaTeX }
    './types.ls': { makeLengthClass }

Macros = LaTeX


export class Generator

    # initialize only in CTOR, otherwise the objects end up in the prototype
    _options: null

    _marginpars: null


    reset: !->
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



    ### marginpar

    marginpar: (txt) ->
        id = @nextId!

        marginPar = @create @block, [@create(@inline, null, "mpbaseline"), txt]
        marginPar.id = id

        @_marginpars.push marginPar

        marginRef = @create @inline, null, "mpbaseline"
        marginRef.id = "marginref-" + id

        marginRef
