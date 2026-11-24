import { defineConfig, defineProject } from 'vitest/config';

// Separate from vite.config.ts on purpose: the tests use the built library (dist/, bin/), so they
// need none of the library build plugins (peggy, babel, dts, checker).
//
// Two projects: "unit" (npm test) and "integration" (npm run test-int), the tests in test/integration.test.ts, which
// need network access and take minutes. Plain "vitest run" runs both.

const unit = defineProject({
    test: {
        name: 'unit',
        include: ['test/**/*.test.ts'],
        exclude: ['**/node_modules/**', 'test/integration/**', 'test/integration.test.ts'],

        setupFiles: ['test/lib/dom.ts'],

        testTimeout: 10000,
        hookTimeout: 30000      // launching chrome and firefox
    }
})

const integration = defineProject({
    test: {
        name: 'integration',
        include: ['test/integration.test.ts'],

        testTimeout: 60000      // tsc; the hooks set their own timeouts
    }
})


export default defineConfig({
    test: {
        projects: [
            unit,
            integration
        ],

        // vitest run --coverage; the VS Code extension overrides reporter and reportsDirectory
        // needs a build with source maps (npm run build, not devbuild)
        coverage: {
            provider: 'v8',

            // the tests run the bundles dist/latex.js and bin/latex.js, which source maps remap to src/
            include: ['src/**', 'dist/latex.js', 'bin/latex.js'],
            exclude: ['**/*.d.ts', '**/node_modules/**'],

            excludeAfterRemap: true,        // drop the bundled dependencies (katex, svg.js, hyphen)
            autoAttachSubprocess: true,     // the CLI and API tests spawn node

            // text: console
            // html: test/coverage/index.html
            // lcovonly: test/coverage/lcov.info (for Qlty)
            reportsDirectory: 'test/coverage',
            reporter: ['text', 'html', 'lcovonly']
        }
    }
});
