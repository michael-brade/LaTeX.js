import
    './latex.ltx': { LaTeX }
    './symbols': { diacritics, symbols }
    './types': { makeLengthClass }

Macros = LaTeX

Object.defineProperty Array.prototype, 'top',
    enumerable: false
    configurable: true
    get: -> @[* - 1]
    set: (v) !-> @[* - 1] = v


export class Generator

    ### public instance vars (vars beginning with "_" are meant to be private!)

    documentClass: null     # name of the default document class until \documentclass{}, then the actual class instance
    documentTitle: null

    # initialize only in CTOR, otherwise the objects end up in the prototype
    _options: null
    _macros: null

    _stack: null
    _groups: null

    _continue: false

    _labels: null
    _refs: null

    _counters: null
    _resets: null

    _marginpars: null

    Length: null

    reset: !->
        @Length = makeLengthClass @

        @documentClass = @_options.documentClass
        @documentTitle = "untitled"

        @_uid = 1

        @_macros = {}
        @_curArgs = []  # stack of argument declarations

        # stack for local variables and attributes - entering a group adds another entry,
        # leaving a group removes the top entry
        @_stack = [
            attrs: {}
            align: null
            currentlabel:
                id: ""
                label: document.createTextNode ""
            lengths: new Map()
        ]

        # grouping stack, keeps track of difference between opening and closing brackets
        @_groups = [ 0 ]

        @_labels = new Map()
        @_refs = new Map()

        @_marginpars = []

        @_counters = new Map()
        @_resets = new Map()

        @_continue = false

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



    ### characters

    hasSymbol: (name) ->
        Macros.symbols.has name

    symbol: (name) ->
        @error "no such symbol: #{name}" if not @hasSymbol name
        Macros.symbols.get name



    ### macros

    hasMacro: (name) ->
        typeof @_macros[name] == "function"
        and name !== "constructor"
        and (@_macros.hasOwnProperty name or Macros.prototype.hasOwnProperty name)


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

    # if next char matches arg of branch, choose that branch
    selectArgsBranch: (nextChar) !->
        optArgs = <[ o? i? k? kv? n? l? c-ml? cl? ]>

        if Array.isArray @_curArgs.top.args.0
            # check which alternative branch to choose, discard the others only if it was a match
            branches = @_curArgs.top.args.0
            for b in branches
                if (nextChar == '[' and b.0 in optArgs) or (nextChar == '{' and b.0 not in optArgs)
                    @_curArgs.top.args.shift!           # remove all branches
                    @_curArgs.top.args.unshift ...b     # prepend remaining args


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



    ### groups

    # start a new group
    enterGroup: (copyAttrs = false) !->
        # shallow copy of the contents of top is enough because we don't change the elements, only the array and the maps
        @_stack.push {
            attrs: if copyAttrs then Object.assign {}, @_stack.top.attrs else {}
            align: null                                                 # alignment is set only per level where it was changed
            currentlabel: Object.assign {}, @_stack.top.currentlabel
            lengths: new Map(@_stack.top.lengths)
        }
        ++@_groups.top

    # end the last group - throws if there was no group to end
    exitGroup: !->
        --@_groups.top >= 0 || error "there is no group to end here"
        @_stack.pop!

    # start a new level of grouping
    startBalanced: !->
        @_groups.push 0

    # exit a level of grouping and return the levels of balancing still left
    endBalanced: ->
        @_groups.pop!
        @_groups.length

    # check if the current level of grouping is balanced
    isBalanced: ->
        @_groups.top == 0


    ### attributes - in HTML, those are CSS classes

    continue: !->
        @_continue = @location!.end.offset

    break: !->
        # only record the break if it came from a position AFTER the continue
        if @location!.end.offset > @_continue
            @_continue = false


    # alignment

    setAlignment: (align) !->
        @_stack.top.align = align

    alignment: ->
        @_stack.top.align


    # font attributes

    setFontFamily: (family) !->
        @_stack.top.attrs.fontFamily = family

    setFontWeight: (weight) !->
        @_stack.top.attrs.fontWeight = weight

    setFontShape: (shape) !->
        if shape == "em"
            if @_activeAttributeValue("fontShape") == "it"
                shape = "up"
            else
                shape = "it"

        @_stack.top.attrs.fontShape = shape

    setFontSize: (size) !->
        @_stack.top.attrs.fontSize = size

    setTextDecoration: (decoration) !->
        @_stack.top.attrs.textDecoration = decoration


    # get all inline attributes of the current group
    _inlineAttributes: ->
        cur = @_stack.top.attrs
        [cur.fontFamily, cur.fontWeight, cur.fontShape, cur.fontSize, cur.textDecoration].join(' ').replace(/\s+/g, ' ').trim!

    # get the currently active value for a specific attribute, also taking into account inheritance from parent groups
    # return the empty string if the attribute was never set
    _activeAttributeValue: (attr) ->
        # from top to bottom until the first value is found
        for level from @_stack.length-1 to 0 by -1
            if @_stack[level].attrs[attr]
                return that




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



    ### lengths


    newLength: (l) !->
        error "length #{l} already defined!" if @hasLength l
        @_stack.top.lengths.set l, @Length.zero

    hasLength: (l) ->
        @_stack.top.lengths.has l

    setLength: (id, length) !->
        error "no such length: #{id}" if not @hasLength id
        # console.log "set length:", id, length
        @_stack.top.lengths.set id, length

    length: (l) ->
        error "no such length: #{l}" if not @hasLength l
        # console.log "get length: #{l} -> #{}"
        @_stack.top.lengths.get l

    theLength: (id) ->
        l = @create @inline, undefined, "the"
        l.setAttribute "display-var", id
        l





    ### LaTeX counters (global)

    newCounter: (c, parent) !->
        error "counter #{c} already defined!" if @hasCounter c

        @_counters.set c, 0
        @_resets.set c, []

        if parent
            @addToReset c, parent

        error "macro \\the#{c} already defined!" if @hasMacro(\the + c)
        @_macros[\the + c] = -> [ @g.arabic @g.counter c ]


    hasCounter: (c) ->
        @_counters.has c

    setCounter: (c, v) !->
        error "no such counter: #{c}" if not @hasCounter c
        @_counters.set c, v

    stepCounter: (c) !->
        @setCounter c, @counter(c) + 1
        @clearCounter c

    counter: (c) ->
        error "no such counter: #{c}" if not @hasCounter c
        @_counters.get c

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


    addToReset: (c, parent) !->
        error "no such counter: #{parent}" if not @hasCounter parent
        error "no such counter: #{c}" if not @hasCounter c
        @_resets.get parent .push c

    # reset all descendants of c to 0
    clearCounter: (c) !->
        for r in @_resets.get c
            @clearCounter r
            @setCounter r, 0


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
