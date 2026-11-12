import { type Constructor } from "../../lib/mixin.ts"

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

        // "execute" (expand) a macro
        macro(name: string, ...args: any[]): any[]
        {
            const macroFn = this._manager.macroFn(name);
            if (!macroFn)
                this.error(`no such macro: \\${name}`);

            return macroFn(...args)
                // the macroFn returns an array -> filter undefined elements
                .filter((x: any) => x != undefined)
                .map((x: any) => {
                    // if an element of the macro's result is a string, create text
                    if (typeof x === 'string' || x instanceof String)
                        return this.createText(x);

                    // otherwise, add the current attributes to the node
                    return this.addAttributes(x);
                });
        }
    }

    return MacroManagementMixin
}

export type MacroManagementAPI = InstanceType<ReturnType<typeof MacroManagement>>
