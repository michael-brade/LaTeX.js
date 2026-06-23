import type { Config, ParserBuildOptions, Plugin } from 'peggy';

export default {
    use: (config: Config, options: ParserBuildOptions): void => {
        // Find the index of the reportInfiniteRepetition pass safely
        const checkPasses = config.passes.check;
        const index = checkPasses.findIndex(pass => pass.name === "reportInfiniteRepetition");

        if (index === -1) {
            throw new Error("Could not find check function: reportInfiniteRepetition");
        }

        // Remove the specific pass from the check list without disrupting other hooks
        checkPasses.splice(index, 1);
    }
} satisfies Plugin