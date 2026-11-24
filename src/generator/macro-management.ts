import { type Constructor } from "../util/mixin.ts"

import { Core } from "./core.ts"
import { MacroManager } from "../macro-manager.ts"
import type { MacroFn } from "../macros.ts"


export function MacroManagement<TBase extends Constructor<Core>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and gives access to the macros: it owns the MacroManager
     * and expands macros into output.
     */
    abstract class MacroManagementMixin extends Base
    {
        // the MacroManager will be connected to the complete generator in the Generator constructor
        _manager = new MacroManager()


        override reset(): void
        {
            super.reset()
            // the MacroManager is reset by the Generator, after all other mixins have reset their state
        }


        get macroManager(): MacroManager
        {
            return this._manager
        }


        // output-specific, implemented by the concrete generator
        // TODO: looks ugly here, but needed by macro()
        abstract createText(text: string | String): unknown
        abstract addAttributes(node: unknown): unknown


        hasMacro(name: string): boolean
        {
            return !!this._manager.hasMacro(name)
        }

        /**
         * "execute" (expand) a macro with the given (parsed) arguments
         * @param name the macro's name to expand
         * @param [args=[]] macro's parsed arguments as array
         * @param [addAttributes=true] add the current attributes to the nodes of the result;
         *    environments don't: the text inside is created in the environment's group
         *    and gets its attributes there
         */
        macro(name: string, args: unknown[] = [], addAttributes: boolean = true): any[]
        {
            const macroFn = this._manager.macroFn(name);
            if (!macroFn)
                this.error(`no such macro: \\${name}`);

            // a macro returns an array, or nothing if it only changes state
            return (macroFn(...args) ?? [])
                // filter undefined/null elements
                .filter((x: any) => x != undefined)
                .map((x: any) => {
                    // if an element of the macro's result is a string, create text
                    if (typeof x === 'string' || x instanceof String)
                        return this.createText(x);

                    // otherwise, check if we have to add the current attributes to the node
                    return addAttributes ? this.addAttributes(x) : x;
                });
        }

        // define a macro in the document (currently only without arguments); it overrides all packages
        newcommand(name: string, func: MacroFn): void
        {
            this._manager.define(name, func);
        }
    }

    return MacroManagementMixin
}

export type MacroManagementAPI = InstanceType<ReturnType<typeof MacroManagement>>
