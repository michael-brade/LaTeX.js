/**
 * All valid LaTeX macro types (in which mode is a macro valid?).
 */
export type MacroMode =
    | "H"   // horizontal   (default if no args declared)
    | "V"   // vertical
    | "HV"
    | "P"   // only preamble


/**
 * All valid LaTeX macro argument types.
 */
export type ArgType =
    | MandatoryArgType
    | OptionalArgType
    | "s"    // Optional star syntax variant (e.g., \macro*)

export type MandatoryArgType =
    | "g"    // <latex/> code group (possibly long, allows \par)
    | "hg"   // Restricted horizontal mode material enclosed in {}
    | "h"    // Restricted horizontal mode material without explicit delimiters
    | "i"    // Strict identifier containing letters only, wrapped in {}
    | "ie"   // Strict identifier (s.o.) or empty group
    | "k"    // Key entry containing anything except = or ,
    | "csv"  // Comma-separated values list wrapped in {}
    | "u"    // Standard URL string conforming to RFC3986
    | "c"    // Color specification (name, float value, or float triplet)
    | "c-ml" // Color_modellist_group
    | "c-ssp"// Color_set spec_group
    | "c-spl"// Color_spec list_group
    | "m"    // A macro reference name (e.g., \macro)
    | "l"    // Length dimension expression wrapped in {}
    | "cl"   // Coordinate system layout or TeX length specification
    | "n"    // Numerical value expression evaluating to an integer
    | "f"    // Float value expression computation
    | "v"    // Vector layout coordinate pair notation (float, float)
    | "is"   // Lexer directive to instruct the parser to ignore subsequent spaces
    | "X"
;

export let OPT_ARGS = [
      "o?"   // Optional argument wrapped in square brackets []
    , "i?"   // Optional identifier wrapped in []
    , "k?"   // Optional key entry wrapped in []
    , "csv?" // Optional comma-separated values list wrapped in []
    , "kv?"  // Optional key-value assignment list wrapped in []
    , "lg?"  // Optional length grouping sequence wrapped in {}
    , "l?"   // Optional length dimension expression wrapped in []
    , "c-ml?"// Optional color_modellist_group
    , "cl?"  // Optional coordinate system layout or TeX length expression
    , "n?"   // Optional numerical expression evaluating to an integer
    , "v?"   // Optional vector layout coordinate pair notation
] as const;

export type OptionalArgType = typeof OPT_ARGS[number];


 // can be ArgType types or branches of ArgType types (xcolor, for instance)
export type MacroArgs = (ArgType | ArgType[][])[];

export interface MacroMeta {
    mode: MacroMode;
    args?: MacroArgs;
}


// added to macro classes (TODO: should be internal)
export class Macros extends Map<string | symbol, MacroMeta> {}


interface HasStaticMacros {
    new(...args: any[]): any;
    macros: Macros;
}

/** @HasMacros decorator */
export function HasMacros<U extends HasStaticMacros>(constructor: U, context: ClassDecoratorContext<U>)
{
}


/// decorators

export function Macro(type: MacroMode) {
    // keep 'This' clean so ClassMethodDecoratorContext does not trigger variance errors
    return function <This, Args extends any[], Return>(
        // enforce the requirement on 'this' inside the method structure itself
        targetMethod: (this: This & { constructor: HasStaticMacros }, ...args: Args) => Return,
        context: ClassMethodDecoratorContext<This, (this: any, ...args: Args) => Return>
    ) {
        context.addInitializer(function (this: any) {
            // 'this.constructor' is safely processed at runtime
            const constructor = this.constructor as HasStaticMacros;

            constructor.macros ??= new Macros();

            if (constructor.macros.has(context.name))
                constructor.macros.get(context.name)!.mode = type;
            else
                constructor.macros.set(context.name, { mode: type });
        });
    }
}


/**
 * Argument decorator to assign expected arguments to a macro function.
 * @param argsList Array containing the argument signatures for the macro.
 */
export function Args(...argsList: MacroArgs)
{
    return function (targetMethod: Function, context: ClassMethodDecoratorContext)
    {
        // This runs during file import evaluation
        context.addInitializer(function (this: any) {
            // 'this' inside addInitializer refers to the constructor of the class
            const constructor = this.constructor as any;

            // Initialize the static 'macros' object if it doesn't exist yet
            constructor.macros ??= new Macros();

            if (!constructor.macros.has(context.name))
                constructor.macros.set(context.name, { mode: 'H' });    // if it wasn't specified (yet): H is default

            // Map the method name to its signature
            constructor.macros.get(context.name).args = argsList;
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
