import
    './latex.ltx.ls': { LaTeX }
    './types.ls': { makeLengthClass }

Macros = LaTeX


export class Generator

    ### public instance vars (vars beginning with "_" are meant to be private!)

    documentClass: null     # name of the default document class until \documentclass{}, then the actual class instance
    documentTitle: null

    # initialize only in CTOR, otherwise the objects end up in the prototype
    _options: null
    _macros: null

    _labels: null
    _refs: null

    _marginpars: null

    _title: null
    _author: null
    _date: null


    reset: !->
        @documentClass = @_options.documentClass
        @documentTitle = "untitled"

        @_uid = 1

        @_macros = {}
        @_curArgs = []  # stack of argument declarations

        @_labels = new Map()
        @_refs = new Map()

        @_marginpars = []

        @_title = null
        @_author = null
        @_date = null

        @newCounter \enumi
        @newCounter \enumii
        @newCounter \enumiii
        @newCounter \enumiv

        # do this after creating the sectioning counters because \thepart etc. are already predefined
        @_macros = new Macros @, @_options.CustomMacros


    # helpers

    nextId: ->
        @_uid++

    round: (num) ->
        const factor = Math.pow 10, @_options.precision
        Math.round(num * factor) / factor
    # private static for easy access - but it means no parallel generator usage!
    error = (e) !->
        console.error e
        throw new Error e

    error: (e) !-> error e

    setErrorFn: (e) !->
        error := e


    location: !-> error "location function not set!"



    # set the title of the document, usually called by the \maketitle macro
    setTitle: (title) ->
        @documentTitle = title.textContent




    ### macros

    hasMacro: (name) ->
        # block core JavaScript keywords from being treated as LaTeX macros
        return false if name in <[ constructor toString valueOf hasOwnProperty ]>

        return typeof @_macros[name] == "function"


    isHmode:    (marco) -> Macros.args[marco]?.0 == \H  or not Macros.args[marco]
    isVmode:    (marco) -> Macros.args[marco]?.0 == \V
    isHVmode:   (marco) -> Macros.args[marco]?.0 == \HV
    isPreamble: (marco) -> Macros.args[marco]?.0 == \P

    macro: (name, args) ->
        if symbols.has name
            return [ @createText symbols.get name ]

        @_macros[name]
            .apply @_macros, args
            ?.filter (x) -> x !~= undefined
            .map (x) ~> if typeof x == 'string' or x instanceof String then @createText x else @addAttributes x


    # macro arguments

    beginArgs: (macro) !->
        @_curArgs.push if Macros.args[macro]
            then {
                name: macro
                args: that.slice(1)
                parsed: []
            } else {
                args: []
                parsed: []
            }

    # if next char matches the next arg of a branch, choose that branch
    # return true if there was a matched branch, false otherwise
    selectArgsBranch: (nextChar) ->
        optArgs = <[ o? i? k? kv? n? l? c-ml? cl? ]>

        if Array.isArray @_curArgs.top.args.0
            # check which alternative branch to choose, discard the others only if it was a match
            branches = @_curArgs.top.args.0
            for b in branches
                if (nextChar == '[' and b.0 in optArgs) or (nextChar == '{' and b.0 not in optArgs)
                    @_curArgs.top.args.shift!           # remove all branches
                    @_curArgs.top.args.unshift ...b     # prepend remaining args

                    return true


    # check the next argument type to parse, returns true if arg is the next expected argument
    # if the next expected argument is an array, it is treated as a list of alternative next arguments
    nextArg: (arg) ->
        if @_curArgs.top.args.0 == arg
            @_curArgs.top.args.shift!
            true

    argError: (m) ->
        error "macro \\#{@_curArgs.top.name}: #{m}"

    # add the result of a parsed argument
    addParsedArg: (a) !->
        @_curArgs.top.parsed.push a

    # get the parsed arguments so far
    parsedArgs: ->
        @_curArgs.top.parsed

    # execute macro with parsed arguments so far
    preExecMacro: !->
        @macro @_curArgs.top.name, @parsedArgs!

    # remove arguments of a completely parsed macro from the stack
    endArgs: !->
        @_curArgs.pop!
            ..args.length == 0 || error "grammar error: arguments for #{..name} have not been parsed: #{..args}"
            return ..parsed


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




    theLength: (id) ->
        l = @create @inline, undefined, "the"
        l.setAttribute "display-var", id
        l





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



    # formatting counters

    alph: (num) -> String.fromCharCode(96 + num)

    Alph: (num) -> String.fromCharCode(64 + num)

    arabic: (num) -> String(num)

    roman: (num) ->
        lookup =
            * \m,  1000
            * \cm, 900
            * \d,  500
            * \cd, 400
            * \c,  100
            * \xc, 90
            * \l,  50
            * \xl, 40
            * \x,  10
            * \ix, 9
            * \v,  5
            * \iv, 4
            * \i,  1

        _roman num, lookup

    Roman: (num) ->
        lookup =
            * \M,  1000
            * \CM, 900
            * \D,  500
            * \CD, 400
            * \C,  100
            * \XC, 90
            * \L,  50
            * \XL, 40
            * \X,  10
            * \IX, 9
            * \V,  5
            * \IV, 4
            * \I,  1

        _roman num, lookup


    _roman = (num, lookup) ->
        roman = ""

        for i in lookup
            while num >= i[1]
                roman += i[0]
                num -= i[1]

        return roman

    fnsymbol: (num) ->
        switch num
        |   1   => @symbol \textasteriskcentered
        |   2   => @symbol \textdagger
        |   3   => @symbol \textdaggerdbl
        |   4   => @symbol \textsection
        |   5   => @symbol \textparagraph
        |   6   => @symbol \textbardbl
        |   7   => @symbol(\textasteriskcentered) + @symbol \textasteriskcentered
        |   8   => @symbol(\textdagger) + @symbol \textdagger
        |   9   => @symbol(\textdaggerdbl) + @symbol \textdaggerdbl
        |   _   => error "fnsymbol value must be between 1 and 9"


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
