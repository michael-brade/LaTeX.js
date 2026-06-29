
declare global {
    interface Array<T> {
        get top(): T;
        set top(value: T);
    }
}

Object.defineProperty(Array.prototype, 'top', {
    enumerable: false,
    configurable: true,
    get: function() { return this[this.length - 1]; },
    set: function(v) { this[this.length - 1] = v; }
});


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



/**
 * This class is part of the generator and handles the global LaTeX group state.
 */
export class Groups
{
    // stack for local variables and attributes - entering a group adds another entry,
    // leaving a group removes the top entry
    #stack: StackItem[];

    // grouping stack, keeps track of difference between opening and closing brackets
    #groups: number[];

    constructor() {
        this.reset();
    }

    reset(): void
    {
        this.#stack = [{
            attrs: {},
            align: null,
            currentlabel: {
                id: "",
                label: document.createTextNode("") // TODO. why even initialize this?
                // TODO: move to HtmlGenerator! or use @createVerbatim - document/node must not be here
            },
            lengths: new Map()
        }];

        this.#groups = [0];
    }


    // start a new group
    enterGroup(copyAttrs: boolean = false): void
    {
        // shallow copy of the contents of top is enough because we don't change the elements, only the array and the maps
        this.#stack.push({
            attrs: copyAttrs ? Object.assign({}, this.#stack.top.attrs) : {},
            align: null,                                                 // alignment is set only per level where it was changed
            currentlabel: Object.assign({}, this.#stack.top.currentlabel),
            lengths: new Map(this.#stack.top.lengths)
        });

        ++this.#groups.top;
    }

    // end the last group - throws if there was no group to end
    exitGroup(): void
    {
        if (--this.#groups.top < 0)
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
        return this.#groups.length;
    }

    // check if the current level of grouping is balanced
    isBalanced(): boolean
    {
        return this.#groups.top === 0;
    }
}