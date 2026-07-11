declare module 'hypher'
{
    namespace Hypher
    {
        /**
         * Recursive trie node representation.
         * Maps character codes (numbers) to nested TrieNodes, while containing the evaluation points array.
         */
        export interface TrieNode
        {
            _points: number[];
            [codePoint: number]: TrieNode | undefined;
        }

        /**
         * Shape of the language pattern configuration file required to initialize Hypher.
         */
        export interface LanguageDefinition
        {
            patterns: Record<string, string>;
            leftmin: number;
            rightmin: number;
            exceptions?: string;
        }
    }

    /**
     * Hypher hyphenation engine class.
     */
    class Hypher
    {
        trie: Hypher.TrieNode;
        leftMin: number;
        rightMin: number;
        exceptions: Record<string, RegExp>;

        /**
         * Initializes the Hypher instances with language pattern rules.
         * @param language The language pattern object configuration.
         */
        constructor(language: Hypher.LanguageDefinition);

        /**
         * Splits a text string into words and introduces soft hyphens into valid positions.
         * @param str The text string to process.
         * @param minLength Minimum word length threshold before trying to apply hyphenation rules. Defaults to 4.
         */
        hyphenateText(str: string, minLength?: number): string;

        /**
         * Processes a single word block against the compiled trie structures.
         * @param word The solitary word to evaluate.
         * @returns An array of string fragments showing verified split points.
         */
        hyphenate(word: string): string[];

        /**
         * Evaluates language patterns string rules into a nested numeric Trie character lookup tree.
         * @private
         */
        private createTrie(patternObject: Record<string, string>): Hypher.TrieNode;
    }

    export default Hypher
}