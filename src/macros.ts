import type { PackageOpts } from "./options.ts";

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

export interface MacroMeta
{
    mode: MacroMode;
    args?: MacroArgs;
}


/**
 * A macro takes any arguments (specified by @Args) and returns an array of Nodes or strings.
 */
export type MacroFn = (...args: any[]) => (Node|string)[]


/**
 * A class of macros: latex.ltx, a documentclass, a package, or CustomMacros.
 *
 * Every method is a macro (horizontal mode, no arguments by default), except the constructor and methods
 * starting with "_" (helpers). Mode and arguments are declared either
 *  - with the @Macro and @Args decorators, or
 *  - with a static `args` table, mapping the macro name to [mode, ...argTypes]; this is the original
 *    way, used by LiveScript and plain JavaScript classes (e.g. CustomMacros).
 *
 * A class may also define `symbols`, which become macros as well, and `css`, a stylesheet the
 * generated document needs.
 */
export interface MacroPackageClass
{
    new(generator: any, options?: PackageOpts): object
    args?: Record<string, MacroArgs>
    symbols?: Map<string, string>
    css?: string
}


/// decorators

// decorator metadata: filled by @Macro and @Args, read by macroMeta(); it is the class' own object that
// prototype-chains to the parent class' metadata
type MacroMetadata = DecoratorMetadata & { macros?: Map<string | symbol, MacroMeta> }

// the macros map of the class being decorated: created on first write, copying the inherited one, so
// that a subclass never alters its parent's declarations (the entries are shared, so they are replaced,
// not changed, by the decorators)
function macrosOf(metadata: DecoratorMetadata): Map<string | symbol, MacroMeta>
{
    const md = metadata as MacroMetadata

    if (!Object.hasOwn(md, "macros"))
        md.macros = new Map(md.macros)

    return md.macros!
}

/**
 * Mode decorator: declare the mode of a macro (default H)
 * @see MacroMode
 */
export function Macro(mode: MacroMode)
{
    return function (targetMethod: Function, context: ClassMethodDecoratorContext)
    {
        const macros = macrosOf(context.metadata)

        // never alter an entry in place: it may still be shared with the parent class
        macros.set(context.name, { ...macros.get(context.name), mode })
    }
}

/**
 * Argument decorator: declare the arguments of a macro
 * @see MacroArgs
 */
export function Args(...args: MacroArgs)
{
    return function (targetMethod: Function, context: ClassMethodDecoratorContext)
    {
        const macros = macrosOf(context.metadata)

        macros.set(context.name, { mode: "H", ...macros.get(context.name), args })
    }
}


// Node does not define Symbol.metadata yet; Babel then uses Symbol.for("Symbol.metadata")
const METADATA: typeof Symbol.metadata = Symbol.metadata ?? Symbol.for("Symbol.metadata")

/**
 * Get the metadata of a macro of the given package class:
 *  - declared by decorators,
 *  - declared by the (legacy) static `args` table,
 *  - or, by default, an H-mode macro without arguments
 */
export function macroMeta(PkgClass: MacroPackageClass, name: string): MacroMeta
{
    const declared = (PkgClass as unknown as { [METADATA]?: MacroMetadata })[METADATA]?.macros?.get(name)
    if (declared)
        return declared

    // legacy code: static args table
    const args = PkgClass.args?.[name]
    if (args) {
        const [mode, ...rest] = args
        return { mode: mode as MacroMode, args: rest as MacroArgs }
    }

    return { mode: "H" }
}
