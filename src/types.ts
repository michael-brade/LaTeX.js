import type { Generator } from "./generator/generator.ts";

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
    // zero class constant
    static readonly zero = new Length({} as Generator, 0, "sp")

    #g: Generator

    #value: number = 0
    #unit: string = ""


    // CTOR
    // TODO: if this class could throw exceptions instead of using g.error,
    // it wouldn't need the Generator, only precision for rounding
    constructor(g: Generator, value: number, unit: string)
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

    // shift the start point of the vector along its direction to shorten (l < 0) or lengthen (l > 0) the vector
    // and return another position vector that will point to the new start of the vector
    shift_start(l: Length): Vector
    {
        if (this.#x.unit !== this.#y.unit)
            throw new Error(`Vector.shift_start: incompatible lengths! (${this.#x.unit} and ${this.#y.unit})`);

        // l^2 = x^2 + y^2
        //
        // y = m*x
        // x = y/m
        // m = y/x
        //
        //  => l^2 = x^2 + x^2 * m^2   =   x^2 * (1 + m^2)
        //  => l^2 = y^2/m^2 + y^2     =   y^2 * (1 + 1/m^2)
        //
        //  => x = l/sqrt(1 + m^2)
        //  => y = l/sqrt(1 + 1/m^2)

        const x = this.#x._value;
        const y = this.#y._value;

        const msq = Math.sqrt(1 + (y * y) / (x * x));
        const imsq = Math.sqrt(1 + (x * x) / (y * y));

        const dir_x = x < 0 ? -1 : 1;
        const dir_y = y < 0 ? -1 : 1;

        let sx: Length;
        let sy: Length;

        // new start point of arrow is at l distance in direction m from origin
        if (x !== 0 && y !== 0) {
            sx = l.div(msq).mul(-dir_x);
            sy = l.div(imsq).mul(-dir_y);
        } else if (y === 0) {
            sx = l.mul(-dir_x);
            sy = this.y.mul(0);
        } else {
            sx = this.x.mul(0);
            sy = l.mul(-dir_y);
        }

        return new Vector(sx, sy);
    }

    shift_end(l: Length): Vector
    {
        if (this.#x.unit !== this.#y.unit)
            throw new Error(`Vector.shift_end: incompatible lengths! (${this.#x.unit} and ${this.#y.unit})`);

        const x = this.x._value;
        const y = this.y._value;

        // shorten vector by half the arrow head length
        const msq = Math.sqrt(1 + (y * y) / (x * x));
        const imsq = Math.sqrt(1 + (x * x) / (y * y));

        const dir_x = x < 0 ? -1 : 1;
        const dir_y = y < 0 ? -1 : 1;

        let ex: Length;
        let ey: Length;

        if (x !== 0 && y !== 0) {
            ex = this.#x.add(l.div(msq).mul(dir_x));
            ey = this.#y.add(l.div(imsq).mul(dir_y));
        } else if (y === 0) {
            ex = this.#x.add(l.mul(dir_x));
            ey = this.#y;
        } else {
            ex = this.#x;
            ey = this.#y.add(l.mul(dir_y));
        }

        return new Vector(ex, ey);
    }

    // calculate length of vector; returns an instance of Length
    norm(): Length
    {
        return this.#x.norm(this.#y);
    }
}
