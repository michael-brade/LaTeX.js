import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts on purpose: the tests use the built library (dist/, bin/), so they
// need none of the library build plugins (peggy, babel, dts, checker).
export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        exclude: ['**/node_modules/**', 'test/integration/**'],
        testTimeout: 10000
    }
});
