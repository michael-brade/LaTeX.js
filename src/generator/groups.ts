import Stack from "../../lib/stack.ts";
import { type Constructor } from "../../lib/mixin.ts"

import { Generator } from "./generator.ts"


interface CurrentLabel {
    id: string;
    label: Node;
}

export interface StackItem {
    attrs: Record<string, any>;
    align: string | null;
    currentlabel: CurrentLabel;
    lengths: Map<any, any>;
}


export function Groups<TGenerator extends Constructor<Generator>>(GeneratorBase: TGenerator)
{
    /**
     * This mixin is part of the generator and handles the global LaTeX group state.
     */
    abstract class GroupsMixin extends GeneratorBase
    {
        // stack for local variables and attributes - entering a group adds another entry,
        // leaving a group removes the top entry
        _stack = new Stack<StackItem>();

        // grouping stack, keeps track of difference between opening and closing brackets
        _groups = new Stack<number>();


        constructor(...args: any[])
        {
            super(...args);
            this.reset();
        }


        reset(): void
        {
            super.reset()

            this._stack.clear()
            this._stack.push({
                attrs: {},
                align: null,
                currentlabel: {
                    id: "",
                    label: document.createTextNode("") // TODO. why even initialize this?
                    // TODO: move to HtmlGenerator! or use @createVerbatim - document/node must not be here
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
                attrs: copyAttrs ? Object.assign({}, this._stack.top!.attrs) : {},
                align: null,                                                 // alignment is set only per level where it was changed
                currentlabel: Object.assign({}, this._stack.top!.currentlabel),
                lengths: new Map(this._stack.top!.lengths)
            });

            ++this._groups.top!;
        }

        // end the last group - throws if there was no group to end
        exitGroup(): void
        {
            if (--this._groups.top! < 0)
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