# This class manages lengths. A length is immutable.
# Internally, maximum precision is used by storing absolute lengths in sp.
#
# We need the Length class per generator, so scope it
export Length = (generator) -> class
    g = generator

    # conceptually private
    _value: 0
    _unit: ""

    # all units in TeX sp
    unitsSp = new Map([
        * "sp"  1
        * "pt"  65536
        * "bp"  65536 * 72.27/72        # 1 bp is the non-traditional pt
        * "pc"  65536 * 12
        * "dd"  65536 * 1238/1157
        * "cc"  65536 * 1238/1157 * 12
        * "in"  65536 * 72.27
        * "px"  65536 * 72.27/96        # 1 px is 1/96 in
        * "mm"  65536 * 7227/2540
        * "cm"  65536 * 7227/254
    ])


    # CTOR
    (value, unit) ->
        g.error "Length CTOR: value needs to be a number!" if not typeof value == "number"

        @_value = value
        @_unit = unit

        # if not relative/unknown unit, convert to sp
        if unitsSp.has unit
            @_value = value * unitsSp.get unit
            @_unit = "sp"


    # length as string (converted to px if not relative), rounded to global precision
    value:~ ->
        if @_unit == "sp"
            (g.round @_value / unitsSp.get "px") + "px"
        else
            g.round(@_value) + @_unit

    # value in px (throw error if relative), rounded to global precision
    px:~ ->
        if @_unit == "sp"
            g.round @_value / unitsSp.get "px"
        else
            g.error "Length.px() called on relative length!"

    # unitless value, unless relative/unknown unit
    pxpct:~ ->
        if @_unit == "sp"
            g.round @_value / unitsSp.get "px"
        else
            g.round(@_value) + @_unit


    unit:~ -> @_unit


    # get length in the given unit, rounded to global precision
    # toUnit: (unit) ->
    #     error "no such unit: #{unit}" if not unitsPx.has unit
    #     @@g.round @_value / unitsSp.get unit

    # compare this length to another length, return -1, 0, 1 if this is smaller, equal, greater
    cmp: (l) ->
        g.error "Length.cmp(): incompatible lengths!" if @_unit != l._unit
        return -1 if @_value < l._value
        return  0 if @_value == l._value
        return  1


    # add another length to this length and return the new length
    add: (l) ->
        g.error "Length.add(): incompatible lengths!" if @_unit != l._unit
        new g.Length @_value + l._value, "sp"

    # subtract another length from this length
    sub: (l) ->
        g.error "Length.sub: incompatible lengths!" if @_unit != l._unit
        new g.Length @_value - l._value, "sp"

    # multiply this length with a scalar
    mul: (s) ->
        new g.Length @_value * s, "sp"

    # divide this length by a scalar
    div: (s) ->
        new g.Length @_value / s, "sp"

    # return the arithmetic absolute length
    abs: ->
        new g.Length Math.abs(@_value), "sp"

    # get the ratio of this length to another length
    ratio: (l) ->
        g.error "Length.ratio: incompatible lengths!" if @_unit != l._unit
        @_value / l._value
