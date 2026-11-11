import { type Constructor } from "../../lib/mixin.ts"

import type { GroupsAPI, StackItem } from "./groups.ts"
import { Length } from "../types.ts"


declare module "./groups.ts" {
    interface StackItem {
        lengths: Map<string, Length>
    }
}


export function Lengths<TBase extends Constructor<GroupsAPI>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and handles LaTeX lengths. Lengths are local to a group,
     * so they depend on the Groups mixin and are stored in the group stack.
     */
    abstract class LengthsMixin extends Base
    {
        // lengths are local to a group: a new group starts with a copy of the parent's lengths
        override _newGroup(parent: StackItem | undefined, copyAttrs: boolean): StackItem
        {
            const item = super._newGroup(parent, copyAttrs)
            item.lengths = new Map(parent?.lengths)
            return item
        }

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
