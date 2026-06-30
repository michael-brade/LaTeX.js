import Stack from "../../lib/stack.ts";
import { Generator } from "../generator.ts"
import { type Constructor } from "../../lib/mixin.ts"


interface CurrentLabel {
    id: string;
    label: Node;
}

interface StackItem {
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
        #stack = new Stack<StackItem>();

        // grouping stack, keeps track of difference between opening and closing brackets
        #groups = new Stack<number>();


        constructor(...args: any[])
        {
            super(...args);
            this.reset();
        }


        reset(): void
        {
            super.reset()

            this.#stack.clear()
            this.#stack.push({
                attrs: {},
                align: null,
                currentlabel: {
                    id: "",
                    label: document.createTextNode("") // TODO. why even initialize this?
                    // TODO: move to HtmlGenerator! or use @createVerbatim - document/node must not be here
                },
                lengths: new Map()
            })

            this.#groups.clear()
            this.#groups.push(0)
        }

        // start a new group
        enterGroup(copyAttrs: boolean = false): void
        {
            // shallow copy of the contents of top is enough because we don't change the elements, only the array and the maps
            this.#stack.push({
                attrs: copyAttrs ? Object.assign({}, this.#stack.top!.attrs) : {},
                align: null,                                                 // alignment is set only per level where it was changed
                currentlabel: Object.assign({}, this.#stack.top!.currentlabel),
                lengths: new Map(this.#stack.top!.lengths)
            });

            ++this.#groups.top!;
        }

        // end the last group - throws if there was no group to end
        exitGroup(): void
        {
            if (--this.#groups.top! < 0)
                throw new Error("there is no group to end here");

            this.#stack.pop();
        }

        // start a new level of grouping
        startBalanced(): void
        {
            this.#groups.push(0);
        }

        // exit a level of grouping and return the levels of balancing still left
        endBalanced(): number
        {
            this.#groups.pop();
            return this.#groups.size;
        }

        // check if the current level of grouping is balanced
        isBalanced(): boolean
        {
            return this.#groups.top === 0;
        }
    }

    return GroupsMixin
}