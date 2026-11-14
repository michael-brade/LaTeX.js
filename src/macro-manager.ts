import Stack from '../lib/stack.ts';

import type { Generator } from "./generator/generator.ts";
import type { PackageOpts } from './options.ts';
import type { ArgType, MacroArgs, MacroFn, MacroMeta, MacroPackageClass } from "./macros.ts";
import { OPT_ARGS, macroMeta } from "./macros.ts";

import builtin from "./latex/index.ts";



/** a macro definition: the function, bound to its package instance, and the macro's metadata */
interface MacroDef {
    fn: MacroFn
    meta: MacroMeta
}


interface ParsedArgs {
    // if macro has no args, the name is not recorded
    name?: string;

    /**
     * array with ArgTypes; as they are parsed, they get removed here one by one
     * and the parsed result added to parsed below, one by one
     */
    args: MacroArgs;

    /** array with parsed content for the respective arg */
    parsed: (DocumentFragment | boolean | string | any)[];
}


/**
 * This class is used by the parser and the generator. The parser needs to know what arguments to parse for a
 * macro it encountered, and the MacroManager keeps track with state in #curArgs. The parser then executes the
 * macro with parsed arguments using the generator's macro(), which asks the MacroManager for the macro function.
 *
 * MacroManager knows about the Generator to pass it on to instantiated macro packages. Macros need the generator
 * to create output.
 *
 * Macro packages are: latex.ltx, documentclasses, packages, custom macros class(es).
 * All macro packages should ideally be frozen. State is held in the generator.
 *
 * Macro definitions live in three layers; within a layer, a later definition replaces an earlier one:
 *  - format: latex.ltx, then the documentclass, then the packages, in load order
 *  - custom: the CustomMacros given in the options; they override the format
 *  - document: definitions made in the document (\newcommand etc.); they override everything
 */
export class MacroManager
{
    #format = new Map<string, MacroDef>();
    #custom = new Map<string, MacroDef>();
    #document = new Map<string, MacroDef>();

    // the classes loaded into the format layer, for their stylesheets
    #loaded = new Array<MacroPackageClass>();

    #generator!: Generator;

    // when parsing: stack of argument declarations to handle macros as macro arguments
    #curArgs = new Stack<ParsedArgs>();


    constructor()
    {
        this.reset()
    }

    setGenerator(generator: Generator)
    {
        this.#generator = generator
    }

    // forget all packages and definitions
    reset(): void
    {
        this.#format.clear()
        this.#custom.clear()
        this.#document.clear()
        this.#loaded.length = 0
        this.#curArgs.clear()
    }


    //// packages

    // load the format (latex.ltx), the first package
    loadFormat(): void
    {
        this.#instantiate(this.#format, builtin["latex.ltx"], undefined, "latex.ltx")
    }

    // returns false if the documentclass could not be loaded
    loadDocumentClass(name: string, options?: PackageOpts): boolean
    {
        return this.#load(name, options, builtin.documentclasses, "./documentclasses")
    }

    // returns false if the package could not be loaded
    loadPackage(name: string, options?: PackageOpts): boolean
    {
        return this.#load(name, options, builtin.packages, "./packages")
    }

    // sets custom macros; only one CustomMacros package can be used, it overwrites
    // a previously set one if there was one
    setCustomMacros(CustomMacros: MacroPackageClass): void
    {
        this.#custom = new Map()
        this.#instantiate(this.#custom, CustomMacros, undefined, CustomMacros.name || "CustomMacros")
    }

    // the stylesheets needed by the loaded documentclass and packages
    stylesheets(): string[]
    {
        return this.#loaded.flatMap(PkgClass => PkgClass.css ?? [])
    }


    // documentclasses and packages are looked up among the builtins first,
    // then (only in Node) loaded as external modules
    //
    // returns false if the package could not be loaded
    #load(name: string, options: PackageOpts | undefined, builtins: Record<string, MacroPackageClass>, dir: string): boolean
    {
        const PkgClass = builtins[name] ?? this.#require(name, dir)
        if (!PkgClass)
            return false

        return this.#instantiate(this.#format, PkgClass, options, name)
    }


    // instantiate the package class and define all its macros in the given layer: first the symbols, then
    // the methods of the instance (walking up its prototype chain), so that methods override symbols and
    // a subclass' method overrides its parent's
    #instantiate(layer: Map<string, MacroDef>, PkgClass: MacroPackageClass, options: PackageOpts | undefined, name: string): boolean
    {
        let instance: object
        try {
            instance = new PkgClass(this.#generator, options)
        } catch (e) {
            // log error but continue anyway
            console.error(`error loading package "${name}": error instantiating it:`, e)
            return false
        }

        // a symbol is an H-mode macro without arguments: macro() creates a new text node with the current
        // attributes on each call
        for (const [symbol, value] of PkgClass.symbols ?? [])
            layer.set(symbol, { fn: () => [value], meta: { mode: "H" } })

        const defined = new Set<string>()

        for (let proto = Object.getPrototypeOf(instance); proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
            for (const macro of Object.getOwnPropertyNames(proto)) {
                if (macro === "constructor" || macro.startsWith("_") || defined.has(macro))
                    continue

                const fn = Object.getOwnPropertyDescriptor(proto, macro)?.value
                if (typeof fn !== "function")
                    continue

                defined.add(macro)
                layer.set(macro, { fn: (fn as MacroFn).bind(instance), meta: macroMeta(PkgClass, macro) })
            }
        }

        // macros declared in the args table without a method are handled by the parser (\par, \item)
        for (const macro of Object.keys(PkgClass.args ?? {})) {
            if (!defined.has(macro))
                layer.set(macro, {
                    fn: () => this.#generator.error(`macro \\${macro} is handled by the parser`),
                    meta: macroMeta(PkgClass, macro)
                })
        }

        if (layer === this.#format)
            this.#loaded.push(PkgClass)

        return true
    }



    //// macros

    // look up a macro: document-local definitions first, then the custom macros, then the format
    #lookup(macro: string): MacroDef | undefined
    {
        return this.#document.get(macro) ?? this.#custom.get(macro) ?? this.#format.get(macro)
    }

    #macroMeta(name: string): MacroMeta | undefined
    {
        return this.#lookup(name)?.meta
    }


    hasMacro(name: string): boolean
    {
        return !!this.#lookup(name)
    }


    macroFn(name: string): MacroFn
    {
        const macro = this.#lookup(name)

        if (!macro)
            this.#generator.error(`no such macro: \\${name}`)

        return macro.fn
    }


    // define a macro in the document (\newcommand etc.): it overrides the packages and the custom macros
    define(name: string, fn: MacroFn, meta: MacroMeta = { mode: "H" }): void
    {
        this.#document.set(name, { fn, meta })
    }


    // macro mode

    isHmode(macro: string): boolean
    {
        // H-mode is the default without a declaration
        return this.#macroMeta(macro)?.mode === 'H' || !this.#macroMeta(macro);
    }

    isVmode(macro: string): boolean
    {
        return this.#macroMeta(macro)?.mode === 'V';
    }

    isHVmode(macro: string): boolean
    {
        return this.#macroMeta(macro)?.mode === 'HV';
    }

    isPreamble(macro: string): boolean
    {
        return this.#macroMeta(macro)?.mode === 'P';
    }


    // macro arguments

    beginArgs(macro: string): void
    {
        const macroArgs = this.#macroMeta(macro)?.args;

        if (macroArgs)
            this.#curArgs.push({
                name: macro,
                args: macroArgs.slice(),
                parsed: []
            });
        else
            this.#curArgs.push({
                args: [],
                parsed: []
            });
    }


    // if next char matches the next arg of a branch, choose that branch
    // return true if there was a matched branch, false otherwise
    selectArgsBranch(nextChar: string): boolean | undefined
    {
        const currentTop = this.#curArgs.top

        if (Array.isArray(currentTop.args[0])) {
            // check which alternative branch to choose, discard the others only if it was a match
            const branches = currentTop.args[0];
            for (const b of branches) {
                if ((nextChar === '[' && OPT_ARGS.includes(b[0] as any))
                    || (nextChar === '{' && !OPT_ARGS.includes(b[0] as any))) {
                    currentTop.args.shift();             // remove all branches
                    currentTop.args.unshift(...b);       // prepend remaining args

                    return true;
                }
            }
        }
    }



    // check the next argument type to parse, returns true if arg is the next expected argument
    // if the next expected argument is an array, it is treated as a list of alternative next arguments
    nextArg(arg: ArgType): boolean
    {
        if (this.#curArgs.top.args[0] === arg) {
            this.#curArgs.top.args.shift();
            return true;
        }
        return false;
    }

    argError(m: string): never
    {
        this.#generator.error(`macro \\${this.#curArgs.top.name}: ${m}`);
    }

    // add the result of a parsed argument
    //  could be DocumentFragment | boolean | string | ...
    //  a missing value (optional argument not given, empty "ie" group) is passed as undefined, not null
    //  (peggy yields null), so that default parameters work
    addParsedArg(a: any): void
    {
        this.#curArgs.top.parsed.push(a ?? undefined);
    }

    // get the parsed arguments so far
    parsedArgs(): any[]
    {
        return this.#curArgs.top.parsed;
    }

    // execute macro with parsed arguments so far
    preExecMacro(): void
    {
        this.#generator.macro(this.#curArgs.top.name!, this.parsedArgs());
    }

    // remove arguments of a completely parsed macro from the stack
    endArgs(): any[]
    {
        const last = this.#curArgs.pop();

        if (!last)
            this.#generator.error("grammar error: endArgs called on empty arguments stack");

        if (last.args.length !== 0)
            this.#generator.error(`grammar error: arguments for ${last.name} have not been parsed: ${last.args}`);

        return last.parsed;
    }


    //// for NodeJS only: load external packages ////

    /**
     * A synchronous loader for external packages, resolving paths relative to the bundle (i.e., dist/packages/
     * and dist/documentclasses/); undefined outside of Node.
     *
     * node:module is not imported statically: the bundle also has to run in the browser, and aliasing it to a
     * mock would replace it in the Node builds as well. In the CJS build, import.meta.url is undefined.
     */
    #nodeRequire(): NodeJS.Require | undefined
    {
        const nodeModule = globalThis.process?.getBuiltinModule?.("node:module")
        const base = import.meta.url ?? (typeof __filename === "string" ? __filename : undefined)

        return nodeModule && base ? nodeModule.createRequire(base) : undefined
    }


    /**
     * #require looks for the macro package/class in the directory `dir`.
     * If it can't be found, it just logs an error and returns undefined.
     */
    #require(name: string, dir: string): MacroPackageClass | undefined
    {
        const requireSync = this.#nodeRequire()
        if (!requireSync) {
            console.error(`error loading package "${name}": not found (external packages can only be loaded in Node)`)
            return
        }

        // resolve first: only then can "not found" be told apart from errors inside the package
        // (requiring a package that itself imports a missing module throws MODULE_NOT_FOUND, too)
        let resolved: string
        try {
            resolved = requireSync.resolve(`${dir}/${name}`)
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== "MODULE_NOT_FOUND")
                throw e

            console.error(`error loading package "${name}": not found`)
            return
        }

        let Export: Record<string, unknown>
        try {
            Export = requireSync(resolved)
        } catch (e) {
            console.error(`error loading package "${name}": error in ${resolved}:`, e)
            return
        }

        const Candidate = Export.default ?? Object.values(Export).find(v => typeof v === "function")
        if (typeof Candidate !== "function") {
            console.error(`error loading package "${name}": ${resolved} exports no valid class constructor`)
            return
        }

        return Candidate as MacroPackageClass
    }
}
