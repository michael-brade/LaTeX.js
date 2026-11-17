import { type Constructor } from "../util/mixin.ts"

import type { GroupsAPI, StackItem } from "./groups.ts"
import { Length } from "../types.ts"


declare module "./groups.ts" {
    interface StackItem {
        // the lengths visible in this group; shared with the parent's map until a length is set here
        lengths: Map<string, Length>
        // true once `lengths` is this group's own copy (copy-on-write)
        ownsLengths: boolean
    }
}


export function Lengths<TBase extends Constructor<GroupsAPI>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and handles LaTeX lengths. Lengths are local to a group,
     * so they depend on the Groups mixin and are stored in the group stack.
     *
     * Most groups never set a length, so a new group shares its parent's map and only copies it
     * on the first write (copy-on-write); reads are always a single lookup.
     */
    abstract class LengthsMixin extends Base
    {
        // required, @see Environments.reset() explanation
        override reset(): void
        {
            super.reset()
        }

        // lengths are local to a group: a new group starts with (a view of) the parent's lengths
        override _newGroup(parent: StackItem | undefined, copyAttrs: boolean): StackItem
        {
            const item = super._newGroup(parent, copyAttrs)
            item.lengths = parent?.lengths ?? new Map()
            item.ownsLengths = !parent
            return item
        }

        // the lengths map of the current group for writing: copies the shared map on the first write
        _writableLengths(): Map<string, Length>
        {
            const top = this._stack.top
            if (!top.ownsLengths) {
                top.lengths = new Map(top.lengths)
                top.ownsLengths = true
            }
            return top.lengths
        }

        newLength(l: string): void
        {
            if (this.hasLength(l))
                this.error(`length ${l} already defined!`);

            this._writableLengths().set(l, new Length(this, 0, "sp"));
        }

        hasLength(l: string): boolean
        {
            return this._stack.top.lengths.has(l);
        }

        setLength(id: string, length: Length): void
        {
            if (!this.hasLength(id))
                this.error(`no such length: ${id}`);

            this._writableLengths().set(id, length);
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
