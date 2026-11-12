import { type Constructor } from "../../lib/mixin.ts"

import { Core } from "./core.ts"


/**
 * A margin paragraph.
 *
 * It holds its content, and the id that links it to its position in the text
 */
export interface MarginPar<TNode = unknown>
{
    id: number
    content: TNode
}


export function Floats<TBase extends Constructor<Core>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and collects the material that is not output where it
     * appears in the text, but placed by the concrete generator elsewhere: margin paragraphs (and
     * later footnotes, figures, tables).
     */
    abstract class FloatsMixin extends Base
    {
        marginPars: MarginPar[] = []


        override reset(): void
        {
            super.reset()
            this.marginPars = []
        }


        //// output-specific, implemented by the concrete generator

        // create the (empty) node that marks the position of the margin paragraph with the given id
        abstract createMarginParRef(id: number): unknown


        // store the content, return the node marking its position in the text
        marginpar(content: unknown): unknown
        {
            const id = this.nextId()
            this.marginPars.push({ id, content })
            return this.createMarginParRef(id)
        }
    }

    return FloatsMixin
}
