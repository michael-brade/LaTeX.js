import { LaTeX } from '../latex.ltx.ts';

import Stack from '../../lib/stack.ts';
import type { ArgType, MacroMeta } from "../macros.ts";
import { HasMacros, OPT_ARGS } from "../macros.ts";


// declare const symbols: Map<string, string> & { has(key: string): boolean };



interface MacroArgs {
    // if macro has no args, the name is not recorded
    name?: string;

    /**
     * array with ArgTypes; as they are parsed, they get removed here one by one
     * and the parsed result added to parsed below, one by one
     */
    args: (ArgType | ArgType[])[]; // Can be string types or branches of string types (xcolor, for instance)

    /** array with parsed content for the respective arg */
    parsed: (DocumentFragment | boolean | string | any)[];
}




// a utility type that extracts only the method names from a class
type MethodNamesOf<T> = {
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T] & string;


/**
 * Macro and macro argument handling.
 */
export class Arguments
{
    #options = {CustomMacros: {}};
    #macros: LaTeX & Record<string, any> = new LaTeX(this, this.#options.CustomMacros);

    // stack of argument declarations
    #curArgs = new Stack<MacroArgs>();


    reset(): void
    {
        // do this after creating the sectioning counters because \thepart etc. are already predefined
        // not necessary if LaTeX doesn't story any state (is frozen)
        this.#macros = new LaTeX(this, this.#options.CustomMacros);

        this.#curArgs.clear()
    }


    ////// macros

    isHmode(macro: string): boolean
    {
        // H-mode is the default without a declaration
        return LaTeX.macros[macro]?.mode === 'H' || !LaTeX.macros[macro];
    }

    isVmode(macro: string): boolean
    {
        return LaTeX.macros[macro]?.mode === 'V';
    }

    isHVmode(macro: string): boolean
    {
        return LaTeX.macros[macro]?.mode === 'HV';
    }

    isPreamble(macro: string): boolean
    {
        return LaTeX.macros[macro]?.mode === 'P';
    }

    // TODO move hasMacro and macro?
    //
    private createText(text: string | String): any {}
    private addAttributes(attr: any): any {}

    hasMacro(name: MethodNamesOf<LaTeX>): boolean
    {
        // block core JavaScript keywords from being treated as LaTeX macros
        const blocked = ["constructor", "toString", "valueOf", "hasOwnProperty"];
        if (blocked.includes(name))
            return false;

        return typeof this.#macros[name] === "function";
    }



    // "execute" (expand) a macro
    macro(name: string, args: any[]): any[] | undefined
    {
        // TODO symbols static element
        if (symbols.has(name))
            return [this.createText(symbols.get(name)!)];


        const macroFunc = this.#macros[name];
        if (!macroFunc)
            return undefined;

        const result = macroFunc.apply(this.#macros, args);

        return result
            ?.filter((x: any) => x != undefined)
            .map((x: any) => {
                if (typeof x === 'string' || x instanceof String) {
                    return this.createText(x);
                } else {
                    return this.addAttributes(x);
                }
            });
    }

    // macro arguments

    beginArgs(macro: string): void
    {
        const macroArgs = LaTeX.macros[macro].args;

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
                if ((nextChar === '[' && OPT_ARGS.includes(b[0])) || (nextChar === '{' && !OPT_ARGS.includes(b[0]))) {
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
        throw new Error(`macro \\${this.#curArgs.top!.name}: ${m}`);
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
        this.macro(this.#curArgs.top!.name!, this.parsedArgs());
    }

    // remove arguments of a completely parsed macro from the stack
    endArgs(): any[]
    {
        const last = this.#curArgs.pop();

        if (!last)
            throw new Error("grammar error: endArgs called on empty arguments stack");

        if (last.args.length !== 0)
            throw new Error(`grammar error: arguments for ${last.name} have not been parsed: ${last.args}`);

        return last.parsed;
    }
}
