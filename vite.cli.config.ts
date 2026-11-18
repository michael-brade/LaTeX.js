import { chmodSync } from 'node:fs'
import { join } from 'node:path'

import { defineConfig } from 'vite'


// Builds the command-line tool src/cli.ts into bin/latex.js.
// Run after the library build (vite.config.ts): the CLI imports "latex.js", which is kept external
// and resolves to dist/ at runtime through the package's own "exports".
export default defineConfig(env => ({
    appType: "custom",

    logLevel: "info",

    plugins: [{
        name: "chmod-bin",
        writeBundle(options, bundle) {
            for (const file of Object.keys(bundle))
                chmodSync(join(options.dir!, file), 0o755)
        }
    }],

    build: {
        ssr: "src/cli.ts",          // Node target: no browser resolution or polyfills
        target: "node22",

        outDir: "bin",
        emptyOutDir: true,
        copyPublicDir: false,

        sourcemap: false,
        minify: false,

        rolldownOptions: {
            // keep all bare imports external: node builtins, the CLI dependencies, and "latex.js" itself
            external: [/^[^./]/],

            output: {
                format: "es",
                entryFileNames: "latex.js",
                banner: "#!/usr/bin/env node"
            }
        }
    }
}))
