import { createRequire } from 'node:module'

import Stack from '../lib/stack.ts';

import type { Generator } from "./generator/generator.ts";
import { Macros, OPT_ARGS, type ArgType, type MacroArgs, type MacroMeta } from "./macros.ts";
import builtinPackages from "./packages/index.ts";

type MacroPackageConstructor = {
    symbols?: Map<string, string>
    new(...args: any[]): any
};
type MacroPackage = Record<string, any> & { macros: Macros };



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
 * TODO: what about symbols? those are also just macros, but no functions
 *
 * Macro packages are: latex.ltx, documentclasses, packages, custom macros class(es).
 * All macro packages should ideally be frozen. State is held in the generator.
 */
export class MacroManager
{
    // stores package instances, last package's macro overrides first package's macro
    #packages = new Array<MacroPackage>();

    #generator!: Generator;
    #options = {CustomMacros: {}};  // TODO

    // when parsing: stack of argument declarations to handle macros as macro arguments
    #curArgs = new Stack<ParsedArgs>();


    constructor(options: any)
    {
        this.#options = options
    }

    setGenerator(generator: Generator)
    {
        this.#generator = generator
    }

    // TODO: set new options?
    reset(): void
    {
        this.#packages = []
        this.#curArgs.clear()
    }


    //// packages

    // called to load format (i.e. LaTeX.ltx), documentclass, and packages
    // loads symbols as macros first
    public loadPackage(pkg: string, path?: string)
    {
        // create a dynamic synchronous loader using Node's native ESM API
        const requireSync = createRequire(import.meta.url)

        // load and instantiate the package
        let PkgClass: MacroPackageConstructor | undefined = (builtinPackages as {[key: string]: MacroPackageConstructor})[pkg]

        try {
            if (!PkgClass) {
                const Export = requireSync(`${path ?? "./packages"}/${pkg}`)
                PkgClass = Export.default || Object.values(Export).find(v => typeof v === 'function');
            }

            if (!PkgClass || typeof PkgClass !== 'function')
                throw new Error(`No valid class constructor exported from package "${pkg}"`);

            // instantiate the package with arguments
            this.#packages.push(new PkgClass(this.#generator, this.#options))

            // Object.assign(args, PkgClass.args)
            // PkgClass.symbols?.forEach (value, key) !-> symbols.set key, value
        } catch (e) {
            // log error but continue anyway
            console.error(`error loading package \"${pkg}\":`, e);
        }
    }


    //// macros

    // look up the package that has the given macro
    #macroPkg(macro: string): MacroPackage | undefined
    {
        // search packages in reverse order (newest packages override older ones)
        for (const pkg of this.#packages.toReversed()) {
            if (pkg.macros.has(macro))
                return pkg
        }
    }

    #macroMeta(name: string): MacroMeta | undefined
    {
        const pkg = this.#macroPkg(name)
        if (!pkg) return

        // TODO
        // // read the macro metadata attached by decorators on the prototype
        // const proto = Object.getPrototypeOf(pkg)
        // const macros = proto._macros

        // the static Map<> "macros" has been attached by decorators
        return pkg.macros.get(name)
    }


    hasMacro(name: string): boolean
    {
        return !!this.#macroPkg(name)
    }


    macroFn(macro: string): (...args: any[]) => any[]
    {
        const pkg = this.#macroPkg(macro)

        if (!pkg)
            this.#generator.error(`no such macro: \\${macro}`)

        // if it's a function, bind it and return
        if (typeof pkg[macro] !== "function")
            this.#generator.error(`macro is not a function: \\${macro}`)

        return pkg[macro].bind(pkg)

        // otherwise, return the raw value -> nope, macros should now always be functions
        // return pkg[macro]
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
        const currentTop = this.#curArgs.top!;

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
        if (this.#curArgs.top?.args[0] === arg) {
            this.#curArgs.top!.args.shift();
            return true;
        }
        return false;
    }

    argError(m: string): never
    {
        this.#generator.error(`macro \\${this.#curArgs.top!.name}: ${m}`);
    }

    // add the result of a parsed argument
    //  could be DocumentFragment | boolean | string | ...
    addParsedArg(a: any[]): void
    {
        this.#curArgs.top!.parsed.push(a);
    }

    // get the parsed arguments so far
    parsedArgs(): any[]
    {
        return this.#curArgs.top!.parsed;
    }

    // execute macro with parsed arguments so far
    preExecMacro(): void
    {
        this.#generator.macro(this.#curArgs.top!.name!, this.parsedArgs());
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
}
