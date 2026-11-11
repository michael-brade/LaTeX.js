import Stack from "../../lib/stack.ts";
import { type Constructor } from "../../lib/mixin.ts"

import { Core } from "./core.ts"


/**
 * The group-local state, one item per group level. Groups itself doesn't know its contents:
 * each mixin with group-local state adds its own slice by module augmentation, e.g.
 *
 *     declare module "./groups.ts" {
 *         interface StackItem { lengths: Map<string, Length> }
 *     }
 *
 * and initializes it by overriding _newGroup().
 */
export interface StackItem {}


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
            this._stack.push(this._newGroup(undefined, false))

            this._groups.clear()
            this._groups.push(0)
        }


        /**
         * Create the stack item for a new group. Mixins with group-local state override this,
         * call super, and initialize their slice of the item.
         *
         * @param parent the enclosing group's item, undefined for the outermost group
         * @param copyAttrs whether the new group inherits the attributes of the parent
         */
        _newGroup(parent: StackItem | undefined, copyAttrs: boolean): StackItem
        {
            // the slices are added by the overrides
            return {} as StackItem
        }


        // start a new group
        enterGroup(copyAttrs: boolean = false): void
        {
            this._stack.push(this._newGroup(this._stack.top, copyAttrs))
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
