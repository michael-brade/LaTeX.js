import { type Constructor } from "../../lib/mixin.ts"

import type { GroupsAPI, StackItem } from "./groups.ts"
import type { MacroManagementAPI } from "./macro-management.ts"


/**
 * \@currentlabel:
 * the id of the element to link to,
 * and the label to display in a \ref{}
 */
export interface CurrentLabel {
    id: string
    label?: unknown         // output node
}


// extend/augment StackItem with currentlabel
declare module "./groups.ts" {
    interface StackItem {
        currentlabel: CurrentLabel
    }
}


export function References<TBase extends Constructor<GroupsAPI & MacroManagementAPI>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and handles labels and references.
     *
     * Labels are possible for: parts, chapters, all sections, \items, footnotes, minipage-footnotes,
     * tables, figures.
     *
     * The bookkeeping (\@currentlabel, defined labels, pending forward references) is format-independent;
     * creating and filling the actual anchor and link nodes is done by the concrete generator.
     */
    abstract class ReferencesMixin extends Base
    {
        // label name -> \@currentlabel at the time \label was called
        _labels = new Map<string, CurrentLabel>()

        // label name -> reference nodes created by \ref before the label was known
        _refs = new Map<string, unknown[]>()


        override reset(): void
        {
            super.reset()

            this._labels.clear()
            this._refs.clear()
        }


        // \@currentlabel is local to a group
        override _newGroup(parent: StackItem | undefined, copyAttrs: boolean): StackItem
        {
            const item = super._newGroup(parent, copyAttrs)
            item.currentlabel = parent ? { ...parent.currentlabel } : { id: "" }
            return item
        }


        //// output-specific, implemented by the concrete generator

        // create a fragment; arguments may be node(s) and/or arrays of node(s)
        abstract createFragment(...args: unknown[]): unknown

        // create an (empty) anchor node that can be linked to by the given id
        abstract createAnchor(id: string): unknown

        // create a reference node linking to the given label; if the label is not known yet,
        // create a placeholder (displaying "??") that is later passed to fillReference()
        abstract createReference(label?: CurrentLabel): unknown

        // fill a placeholder reference created by createReference() with the now known label
        abstract fillReference(ref: unknown, label: CurrentLabel): void


        // \@currentlabel: what the next \label refers to
        currentLabel(): CurrentLabel
        {
            return this._stack.top.currentlabel
        }


        /**
         * Make counter c the one referred to by the next \label, i.e. set `\@currentlabel`.
         *
         * `\@currentlabel` is local, the counter is global;
         * we need to store the id of the element to link to as well as the formatted counter value (\p@c\thec).
         *
         * @param c the counter
         * @param id the id of an existing element to link to; if not given, a new anchor is created
         * @return the newly created anchor, or undefined if an id was given
         */
        refCounter(c: string, id?: string): unknown
        {
            let anchor: unknown

            if (!id) {
                id = c + "-" + this.nextId()
                anchor = this.createAnchor(id)
            }

            this._stack.top.currentlabel = {
                id,
                label: this.createFragment([
                    ...(this.hasMacro("p@" + c) ? this.macro("p@" + c) : []),
                    ...this.macro("the" + c)
                ])
            }

            return anchor
        }


        // remember \@currentlabel under the given name, and fill all forward references to it
        setLabel(label: string): void
        {
            if (this._labels.has(label))
                this.error(`label ${label} already defined!`)

            const currentlabel = this._stack.top.currentlabel

            if (!currentlabel.id)
                console.warn(`warning: no \\@currentlabel available for label ${label}!`)

            this._labels.set(label, currentlabel)

            // fill forward references
            const refs = this._refs.get(label)
            if (refs) {
                for (const r of refs)
                    this.fillReference(r, currentlabel)

                this._refs.delete(label)
            }
        }


        // if the label is not known yet, keep the reference node so that it can be filled
        // once the label is set
        ref(label: string): unknown
        {
            const known = this._labels.get(label)
            if (known)
                return this.createReference(known)

            const el = this.createReference()

            const refs = this._refs.get(label)
            if (refs)
                refs.push(el)
            else
                this._refs.set(label, [el])

            return el
        }


        // to be called at the end of the document: warn about all references whose label was never set
        logUndefinedRefs(): void
        {
            if (this._refs.size === 0)
                return

            for (const label of this._refs.keys())
                console.warn(`warning: reference '${label}' undefined`)

            console.warn("There were undefined references.")
        }
    }

    return ReferencesMixin
}

export type ReferencesAPI = InstanceType<ReturnType<typeof References>>
