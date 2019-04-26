# This class manages lengths. A length is immutable.
# Internally, maximum precision is used by storing absolute lengths in sp.
#
# We need the Length class per generator, so scope it
export makeLengthClass = (generator) -> class
    # TODO: test: Length = generator.Length
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

    # zero class constant
    @zero = new @@(0, "sp")

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


    # compare this length to another length, return -1, 0, 1 if this is smaller, equal, greater
    cmp: (l) ->
        g.error "Length.cmp(): incompatible lengths! (#{@_unit} and #{l._unit})" if @_unit != l._unit
        return -1 if @_value < l._value
        return  0 if @_value == l._value
        return  1


    # add another length to this length and return the new length
    add: (l) ->
        g.error "Length.add(): incompatible lengths! (#{@_unit} and #{l._unit})" if @_unit != l._unit
        new g.Length @_value + l._value, @_unit

    # subtract another length from this length
    sub: (l) ->
        g.error "Length.sub: incompatible lengths! (#{@_unit} and #{l._unit})" if @_unit != l._unit
        new g.Length @_value - l._value, @_unit

    # multiply this length with a scalar
    mul: (s) ->
        new g.Length @_value * s, @_unit

    # divide this length by a scalar
    div: (s) ->
        new g.Length @_value / s, @_unit

    # return the arithmetic absolute length
    abs: ->
        new g.Length Math.abs(@_value), @_unit

    # get the ratio of this length to another length
    ratio: (l) ->
        g.error "Length.ratio: incompatible lengths! (#{@_unit} and #{l._unit})" if @_unit != l._unit
        @_value / l._value

    # calculate the L2 norm of this and another length
    norm: (l) ->
        g.error "Length.norm: incompatible lengths! (#{@_unit} and #{l._unit})" if @_unit != l._unit
        new g.Length Math.sqrt(@_value**2 + l._value**2), @_unit


    @min = ->
        Array.from(&).reduce (a, b) ->
            if a.cmp(b) < 0 then a else b

    @max = ->
        Array.from(&).reduce (a, b) ->
            if a.cmp(b) > 0 then a else b


# a position vector (from origin to point)
export class Vector

    _x: null # Length
    _y: null # Length


    # CTOR: x and y can be Lengths TODO: or unitless coordinates?
    (x, y) ->
        @_x = x
        @_y = y


    x:~ -> @_x
    y:~ -> @_y


    add: (v) ->
        new Vector @_x.add(v.x), @_y.add(v.y)

    sub: (v) ->
        new Vector @_x.sub(v.x), @_y.sub(v.y)

    mul: (s) ->
        new Vector @_x.mul(s), @_y.mul(s)

    # shift the start point of the vector along its direction to shorten (l < 0) or lengthen (l > 0) the vector
    # and return another position vector that will point to the new start of the vector
    shift_start: (l) ->
        if @_x.unit != @_y.unit
            throw new Error "Vector.shift_start: incompatible lengths! (#{@_x.unit} and #{@_y.unit})"

        # l^2 = x^2 + y^2
        #
        # y = m*x
        # x = y/m
        # m = y/x
        #
        #  => l^2 = x^2 + x^2 * m^2   =   x^2 * (1 + m^2)
        #  => l^2 = y^2/m^2 + y^2     =   y^2 * (1 + 1/m^2)
        #
        #  => x = l/sqrt(1 + m^2)
        #  => y = l/sqrt(1 + 1/m^2)

        x = @_x._value
        y = @_y._value

        msq  = Math.sqrt 1 + y*y / (x*x)
        imsq = Math.sqrt 1 + x*x / (y*y)

        dir_x = if x < 0 then -1 else 1
        dir_y = if y < 0 then -1 else 1

        # new start point of arrow is at l distance in direction m from origin
        if x != 0 and y != 0
            sx = l.div(msq).mul -dir_x
            sy = l.div(imsq).mul -dir_y
        else if y == 0
            sx = l.mul -dir_x
            sy = @_y.mul 0
        else
            sx = @_x.mul 0
            sy = l.mul -dir_y

        new Vector sx, sy


    shift_end: (l) ->
        if @_x.unit != @_y.unit
            throw new Error "Vector.shift_end: incompatible lengths! (#{@_x.unit} and #{@_y.unit})"

        x = @_x._value
        y = @_y._value

        # shorten vector by half the arrow head length
        msq  = Math.sqrt 1 + y*y / (x*x)
        imsq = Math.sqrt 1 + x*x / (y*y)

        dir_x = if x < 0 then -1 else 1
        dir_y = if y < 0 then -1 else 1

        if x != 0 and y != 0
            ex = @_x.add(l.div(msq).mul dir_x)
            ey = @_y.add(l.div(imsq).mul dir_y)
        else if y == 0
            ex = @_x.add(l.mul dir_x)
            ey = @_y
        else
            ex = @_x
            ey = @_y.add(l.mul dir_y)

        new Vector ex, ey


    # calculate length of vector; returns an instance of Length
    norm: ->
        @_x.norm @_y
