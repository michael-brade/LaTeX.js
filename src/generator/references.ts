import { type Constructor } from "../../lib/mixin.ts"

import type { GroupsAPI, StackItem } from "./groups.ts"


/** \@currentlabel: the id of the element to link to, and the label to display in a \ref{} */
export interface CurrentLabel {
    id: string
    label?: unknown         // output node
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
    }

    return ReferencesMixin
}
