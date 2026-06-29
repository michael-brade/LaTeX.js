/**
 * All valid LaTeX macro types (in which mode is a macro valid?).
 */
export type MacroMode =
    | "H"   // horizontal   (default if no args declared)
    | "V"   // vertical
    | "HV"
    | "P"   // only preamble
    | "X"


/**
 * All valid LaTeX macro argument types.
 */
export type ArgType =
    MandatoryArgType | OptionalArgType;

export type MandatoryArgType =
    | "g"    /** <latex/> code group (possibly long, allows `\par`). */
    | "hg"   /** Restricted horizontal mode material enclosed in `{}`. */
    | "h"    /** Restricted horizontal mode material without explicit delimiters. */
    | "i"    /** Strict identifier containing letters only, wrapped in `{}`. */
    | "k"    /** Key entry containing anything except `=` or `,`. */
    | "csv"  /** Comma-separated values list wrapped in `{}`. */
    | "u"    /** Standard URL string conforming to RFC3986. */
    | "c"    /** Color specification (name, float value, or float triplet). */
    | "m"    /** A macro reference name (e.g., `\macro`). */
    | "l"    /** Length dimension expression wrapped in `{}`. */
    | "cl"   /** Coordinate system layout or TeX length specification. */
    | "n"    /** Numerical value expression evaluating to an integer. */
    | "f"    /** Float value expression computation. */
    | "v"    /** Vector layout coordinate pair notation `(float, float)`. */
    | "is"   /** Lexer directive to instruct the parser to ignore subsequent spaces. */
;

export type OptionalArgType =
    | "s"    /** Optional star syntax variant (e.g., `\macro*`). */
    | "o?"   /** Optional argument wrapped in square brackets `[]`. */
    | "i?"   /** Optional identifier wrapped in `[]`. */
    | "k?"   /** Optional key entry wrapped in `[]`. */
    | "csv?" /** Optional comma-separated values list wrapped in `[]`. */
    | "kv?"  /** Optional key-value assignment list wrapped in `[]`. */
    | "lg?"  /** Optional length grouping sequence wrapped in `{}`. */
    | "l?"   /** Optional length dimension expression wrapped in `[]`. */
    | "cl?"  /** Optional coordinate system layout or TeX length expression. */
    | "n?"   /** Optional numerical expression evaluating to an integer. */
    | "v?"   /** Optional vector layout coordinate pair notation. */
;

export interface MacroMeta {
    mode: MacroMode;
    args?: ArgType[];
}


export interface HasMacros {
    constructor: {
        macros: Record<string | symbol, MacroMeta>  // static macros in class implementing HasMacros
    };
}


/// decorators

export function Macro<T extends HasMacros>(type: MacroMode)
{
    // Typing the second argument explicitly as ClassMethodDecoratorContext
    // forces the TypeScript compiler to reject placement anywhere except on methods.
    return function (targetMethod: Function, context: ClassMethodDecoratorContext<T>)
    {
        context.addInitializer(function (this: T) {
            const constructor = this.constructor;

            // Initialize the static 'macros' object if it doesn't exist yet
            constructor.macros ??= {};
            constructor.macros[context.name] ??= { mode: type };
            constructor.macros[context.name].mode = type;
        });
    }
}


/**
 * Argument decorator to assign expected arguments to a macro function.
 * @param argsList Array containing the argument signatures for the macro.
 */
export function Args<T extends HasMacros>(...argsList: ArgType[])
{
    return function (targetMethod: Function, context: ClassMethodDecoratorContext<T>)
    {
        // This runs during file import evaluation
        context.addInitializer(function (this: T) {
            // 'this' inside addInitializer refers to the constructor of the class
            const constructor = this.constructor;

            // Initialize the static 'macros' object if it doesn't exist yet
            constructor.macros ??= {};

            // Map the method name to its signature
            constructor.macros[context.name] ??= { mode: 'H' }; // if it wasn't specified (yet): H is default
            constructor.macros[context.name].args = argsList;
        });
    }
}


/*
// Factory to quickly spawn layout mode decorators
function createModeDecorator(mode: MacroMode) {
    return function (targetMethod: Function, context: ClassMethodDecoratorContext) {
        const methodName = String(context.name);
        const meta = getOrCreateMeta(methodName);
        meta.mode = mode;
    };
}

export const Horizontal = createModeDecorator("H");
export const Vertical   = createModeDecorator("V");
export const HVMode     = createModeDecorator("HV");
export const Preamble   = createModeDecorator("P");
*/
