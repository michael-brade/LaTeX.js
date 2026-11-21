import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts on purpose: the tests use the built library (dist/, bin/), so they
// need none of the library build plugins (peggy, babel, dts, checker).
export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        exclude: ['**/node_modules/**', 'test/integration/**'],

        setupFiles: ['test/lib/dom.ts'],

        testTimeout: 10000,
        hookTimeout: 30000,     // launching chrome and firefox

        // vitest run --coverage; the VS Code extension overrides reporter and reportsDirectory
        // needs a build with source maps (npm run build, not devbuild)
        coverage: {
            provider: 'v8',

            // the tests run the bundles dist/latex.js and bin/latex.js, which source maps remap to src/
            include: ['src/**', 'dist/latex.js', 'bin/latex.js'],
            exclude: ['**/*.d.ts', '**/node_modules/**'],

            excludeAfterRemap: true,        // drop the bundled dependencies (katex, svg.js, hyphen)
            autoAttachSubprocess: true,     // the CLI and API tests spawn node

            reportsDirectory: 'test/coverage',
            reporter: ['text', 'html']      // test/coverage/index.html
        }
    }
});
