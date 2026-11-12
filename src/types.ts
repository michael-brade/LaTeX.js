import { Core } from "./generator/core.ts"


// all units in TeX sp
const unitsSp = new Map<string, number>([
    ["sp", 1],
    ["pt", 65536],
    ["bp", 65536 * 72.27 / 72],        // 1 bp is the non-traditional pt
    ["pc", 65536 * 12],
    ["dd", 65536 * 1238 / 1157],
    ["cc", 65536 * 1238 / 1157 * 12],
    ["in", 65536 * 72.27],
    ["px", 65536 * 72.27 / 96],        // 1 px is 1/96 in
    ["mm", 65536 * 7227 / 2540],
    ["cm", 65536 * 7227 / 254]
]);


// This class manages lengths. A length is immutable.
// Internally, maximum precision is used by storing absolute lengths in sp.
export class Length
{
    #g: Core

    #value: number = 0
    #unit: string = ""


    // CTOR
    // TODO: if this class could throw exceptions instead of using g.error,
    // it wouldn't need the Generator, only precision for rounding
    constructor(g: Core, value: number, unit: string)
    {
        this.#g = g

        if (typeof value !== "number")
            g.error("Length CTOR: value needs to be a number!");

        // if not a relative or unknown unit, convert to sp
        if (unitsSp.has(unit)) {
            value = value * unitsSp.get(unit)!;
            unit = "sp";
        }

        this.#value = value;
        this.#unit = unit;
    }

    // length as string (converted to px if not relative), rounded to global precision
    get value(): string
    {
        if (this.#unit === "sp")
            return this.#g.round(this.#value / unitsSp.get("px")!) + "px";

        return this.#g.round(this.#value) + this.#unit;
    }

    // value in px (throw error if relative), rounded to global precision
    get px(): number
    {
        if (this.#unit === "sp")
            return this.#g.round(this.#value / unitsSp.get("px")!);

        return this.#g.error("Length.px() called on relative length!");
    }

    // unitless value, unless relative/unknown unit
    get pxpct(): string | number
    {
        if (this.#unit === "sp")
            return this.#g.round(this.#value / unitsSp.get("px")!);

        return this.#g.round(this.#value) + this.#unit;
    }

    get _value(): number
    {
        return this.#value
    }

    get unit(): string
    {
        return this.#unit;
    }


    // compare this length to another length, return -1, 0, 1 if this is smaller, equal, greater
    cmp(l: Length): number
    {
        if (this.#unit !== l.unit)
            this.#g.error(`Length.cmp(): incompatible lengths! (${this.#unit} and ${l.unit})`);

        if (this.#value < l.#value) return -1;
        if (this.#value === l.#value) return 0;
        return 1;
    }

    // add another length to this length and return the new length
    add(l: Length): Length
    {
        if (this.#unit !== l.unit)
            this.#g.error(`Length.add(): incompatible lengths! (${this.#unit} and ${l.unit})`);

        return new Length(this.#g, this.#value + l.#value, this.#unit);
    }

    // subtract another length from this length and return the new length
    sub(l: Length): Length
    {
        if (this.#unit !== l.unit)
            this.#g.error(`Length.sub: incompatible lengths! (${this.#unit} and ${l.unit})`);

        return new Length(this.#g, this.#value - l.#value, this.#unit);
    }

    // multiply this length with a scalar
    mul(s: number): Length
    {
        return new Length(this.#g, this.#value * s, this.#unit);
    }

    // divide this length by a scalar
    div(s: number): Length
    {
        return new Length(this.#g, this.#value / s, this.#unit);
    }

    // return the arithmetic absolute length
    abs(): Length
    {
        return new Length(this.#g, Math.abs(this.#value), this.#unit);
    }

    // get the ratio of this length to another length
    ratio(l: Length): number
    {
        if (this.#unit !== l.unit)
            this.#g.error(`Length.ratio: incompatible lengths! (${this.#unit} and ${l.unit})`);

        return this.#value / l.#value;
    }

    // calculate the L2 norm of this and another length
    norm(l: Length): Length
    {
        if (this.#unit !== l.unit)
            this.#g.error(`Length.norm: incompatible lengths! (${this.#unit} and ${l.unit})`);

        return new Length(this.#g, Math.sqrt(this.#value ** 2 + l.#value ** 2), this.#unit);
    }

    static min(...args: Length[]): Length
    {
        return args.reduce((a, b) => (a.cmp(b) < 0 ? a : b));
    }

    static max(...args: Length[]): Length
    {
        return args.reduce((a, b) => (a.cmp(b) > 0 ? a : b));
    }
}

/**
 * A position vector (from origin to point)
 */
export class Vector
{
    #x: Length;
    #y: Length;

    // CTOR: x and y can be Lengths TODO: or unitless coordinates?
    constructor(x: Length, y: Length)
    {
        this.#x = x;
        this.#y = y;
    }

    get x(): Length
    {
        return this.#x;
    }

    get y(): Length
    {
        return this.#y;
    }

    add(v: Vector): Vector
    {
        return new Vector(this.#x.add(v.#x), this.#y.add(v.#y));
    }

    sub(v: Vector): Vector
    {
        return new Vector(this.#x.sub(v.#x), this.#y.sub(v.#y));
    }

    mul(s: number): Vector
    {
        return new Vector(this.#x.mul(s), this.#y.mul(s));
    }

    // calculate length of vector; returns an instance of Length
    norm(): Length
    {
        return this.#x.norm(this.#y);
    }

    // shift the start point of the vector along its direction to shorten (l < 0) or lengthen (l > 0) the vector
    // and return another position vector that will point to the new start of the vector
    shift_start(l: Length): Vector
    {
        if (this.#x.unit !== this.#y.unit)
            throw new Error(`Vector.shift_start: incompatible lengths! (${this.#x.unit} and ${this.#y.unit})`);

        const totalLength = this.norm()._value;

        // if the vector is a dot at the origin (0,0), it has no direction to shift along
        if (totalLength === 0)
            return new Vector(this.#x.mul(0), this.#y.mul(0));

        // find the unit step ratios (the direction components of a length-1 vector)
        const unitX = this.#x._value / totalLength;
        const unitY = this.#y._value / totalLength;

        // scale the target shifting length 'l' by these ratios
        const sx = l.mul(-unitX);
        const sy = l.mul(-unitY);

        return new Vector(sx, sy);
    }

    shift_end(l: Length): Vector
    {
        if (this.#x.unit !== this.#y.unit)
            throw new Error(`Vector.shift_end: incompatible lengths! (${this.#x.unit} and ${this.#y.unit})`);

        const totalLength = this.norm()._value;

        if (totalLength === 0)
            return this;

        // find the unit step ratios
        const unitX = this.#x._value / totalLength;
        const unitY = this.#y._value / totalLength;

        // add the scaled shift directly onto the existing endpoint coordinates
        const ex = this.#x.add(l.mul(unitX));
        const ey = this.#y.add(l.mul(unitY));

        return new Vector(ex, ey);
    }
}
