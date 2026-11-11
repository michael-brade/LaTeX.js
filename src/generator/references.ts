import { type Constructor } from "../../lib/mixin.ts"

import type { GroupsAPI, StackItem } from "./groups.ts"


/** \@currentlabel: the id of the element to link to, and the label to display in a \ref{} */
export interface CurrentLabel {
    id: string
    label?: unknown         // output node
}

declare module "./groups.ts" {
    interface StackItem {
        currentlabel: CurrentLabel
    }
}


export function References<TBase extends Constructor<GroupsAPI>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and handles labels and references.
     *
     * TODO: port refCounter, setLabel, ref, logUndefinedRefs from generator.ls
     */
    abstract class ReferencesMixin extends Base
    {
        // \@currentlabel is local to a group
        override _newGroup(parent: StackItem | undefined, copyAttrs: boolean): StackItem
        {
            const item = super._newGroup(parent, copyAttrs)
            item.currentlabel = parent ? { ...parent.currentlabel } : { id: "" }
            return item
        }
    }

    return ReferencesMixin
}
