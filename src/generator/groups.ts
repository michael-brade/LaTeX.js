import Stack from "../../lib/stack.ts";
import { type Constructor } from "../../lib/mixin.ts"

import { Core } from "./core.ts"
import type { Length } from "../types.ts"
import type { TextAttributes, Alignment } from "./attributes.ts"


interface CurrentLabel {
    id: string;
    label: Node;
}

// TODO: move StackItem type definition out of Groups mixin? Needed by Groups, Lengths, Attributes
export interface StackItem {
    attrs: TextAttributes;
    align: Alignment;
    currentlabel: CurrentLabel;
    lengths: Map<string, Length>;
}


export function Groups<TBase extends Constructor<Core>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and handles the LaTeX group state.
     */
    abstract class GroupsMixin extends Base
    {
        // stack for local variables and attributes - entering a group adds another entry,
        // leaving a group removes the top entry
        _stack = new Stack<StackItem>();

        // grouping stack, keeps track of difference between opening and closing brackets
        _groups = new Stack<number>();


        override reset(): void
        {
            super.reset()

            this._stack.clear()
            this._stack.push({
                attrs: {},
                align: null,
                currentlabel: {
                    id: "",
                    label: document.createTextNode("") // TODO. why even initialize this?
                    // TODO: move to HtmlGenerator! or use this.createVerbatim - document/node must not be here
                },
                lengths: new Map()
            })

            this._groups.clear()
            this._groups.push(0)
        }

        // start a new group
        enterGroup(copyAttrs: boolean = false): void
        {
            // shallow copy of the contents of top is enough because we don't change the elements, only the array and the maps
            this._stack.push({
                attrs: copyAttrs ? Object.assign({}, this._stack.top.attrs) : {},
                // alignment is set only per level where it was changed
                align: null,
                currentlabel: Object.assign({}, this._stack.top.currentlabel),
                lengths: new Map(this._stack.top.lengths)
            })

            ++this._groups.top
        }

        // end the last group - throws if there was no group to end
        exitGroup(): void
        {
            if (--this._groups.top < 0)
                this.error("there is no group to end here");

            this._stack.pop();
        }

        // start a new level of grouping
        startBalanced(): void
        {
            this._groups.push(0);
        }

        // exit a level of grouping and return the levels of balancing still left
        endBalanced(): number
        {
            this._groups.pop();
            return this._groups.size;
        }

        // check if the current level of grouping is balanced
        isBalanced(): boolean
        {
            return this._groups.top === 0;
        }
    }

    return GroupsMixin
}

export type GroupsAPI = InstanceType<ReturnType<typeof Groups>>
