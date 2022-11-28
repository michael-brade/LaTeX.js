export default {
    use: (config, options) => {
        // disable reportInfiniteRepetition, which is the last element
        const name = config.passes.check.pop().name
        if (name !== "reportInfiniteRepetition")
            throw new Error("wrong check function removed: " + name)
    }
}
