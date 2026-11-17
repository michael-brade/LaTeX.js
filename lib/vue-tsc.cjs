#!/usr/bin/env node
// vue-tsc, run with TypeScript 6.
//
// vue-tsc hooks into the JavaScript compiler API, which TypeScript 7 (our "typescript" package) no longer
// has, so plain `vue-tsc` crashes. @typescript/typescript6 provides that API; given its tsc path, vue-tsc
// uses the real TypeScript 6 tsc from its @typescript/old dependency.
//
// Usage: node lib/vue-tsc.cjs [tsc options], e.g. node lib/vue-tsc.cjs --noEmit -p docs/.vitepress

require('vue-tsc').run(require.resolve('@typescript/typescript6/lib/tsc.js'))
