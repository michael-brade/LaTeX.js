export default class Stack<T> implements Iterable<T>
{
    // Private array to hold elements of type T
    #items: T[] = [];

    /**
     * Adds an element to the top of the stack.
     * Time Complexity: O(1)
     */
    push(element: T): void
    {
        this.#items.push(element);
    }

    /**
     * Removes and returns the top element of the stack.
     * Returns undefined if the stack is empty.
     * Time Complexity: O(1)
     */
    pop(): T | undefined
    {
        return this.#items.pop();
    }

    /**
     * Returns the top element without removing it.
     * Time Complexity: O(1)
     */
    get top(): T | undefined
    {
        return this.#items.at(-1);
    }

    /**
     * Alias for top(). Added for compatibility.
     */
    get peek(): T | undefined
    {
        return this.top;
    }

    /**
     * Returns the total number of elements in the stack.
     * Time Complexity: O(1)
     */
    get size(): number
    {
        return this.#items.length;
    }

    /**
     * Checks if the stack has no elements.
     * Time Complexity: O(1)
     */
    get isEmpty(): boolean
    {
        return this.#items.length === 0;
    }

    /**
     * Removes all elements from the stack.
     * Time Complexity: O(1)
     */
    clear(): void
    {
        this.#items = [];
    }

    *[Symbol.iterator](): Iterator<T>
    {
        for (let i = this.#items.length - 1; i >= 0; i--)
            yield this.#items[i];
    }
}
