import type Stack from "../../lib/stack.ts"
import { type Constructor } from "../../lib/mixin.ts"

import { Generator } from "./generator.ts"
import type { StackItem } from "./groups.ts"
import { Length } from "../types.ts"


/**
 * Type part that the Lengths mixin needs from its base: the Generator core plus the group stack (Groups mixin)
 */
type GroupedGenerator = Generator & { _stack: Stack<StackItem> }


export function Lengths<TGenerator extends Constructor<GroupedGenerator>>(GeneratorBase: TGenerator)
{
    /**
     * This mixin is part of the generator and handles LaTeX lengths. Lengths are local to a group,
     * so they depend on the Groups mixin and are stored in the group stack.
     */
    abstract class LengthsMixin extends GeneratorBase
    {
        newLength(l: string): void
        {
            if (this.hasLength(l))
                this.error(`length ${l} already defined!`);

            this._stack.top.lengths.set(l, Length.zero);
        }

        hasLength(l: string): boolean
        {
            return this._stack.top.lengths.has(l);
        }

        setLength(id: string, length: Length): void
        {
            if (!this.hasLength(id))
                this.error(`no such length: ${id}`);

            // console.log("set length:", id, length);
            this._stack.top.lengths.set(id, length);
        }

        length(l: string): Length
        {
            if (!this.hasLength(l))
                this.error(`no such length: ${l}`);

            // console.log("get length: #{l} -> #{}");
            return this._stack.top.lengths.get(l)!;
        }
    }

    return LengthsMixin
}
