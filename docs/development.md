---
title: Developing LaTeX.js
---

# Developing <latex/>.js

This page is about working on <latex/>.js itself: setting up the repository, building and testing it, the website,
and the conventions of the code. To add macros, document classes or packages, see [Extending](extending.md).

<latex/>.js is written in TypeScript. The parser is generated from a PEG grammar by [peggy](https://peggyjs.org/),
the library and the CLI are built with [Vite](https://vite.dev/), the tests run with [Vitest](https://vitest.dev/),
and the website, including the playground, is built with [VitePress](https://vitepress.dev/).


## Setup

You need Node.js 22 or newer (the CI uses Node.js 24) and `rsync`, which the build uses. Regenerating `package.json`
(see [below](#package-json)) also needs `sponge` from `moreutils`. The dev container in `.devcontainer/` has all of
this, including the libraries that Chrome and Firefox need for the screenshot tests.

```sh
git clone https://github.com/michael-brade/LaTeX.js.git
cd LaTeX.js
npm install
npx puppeteer browsers install    # once if it didn't happen automatically: Chrome/Firefox for screenshot tests
npm run build
npm test
```


## Commands

```sh
npm run build        # library → dist/ (vite.config.ts), CLI → bin/latex.js (vite.cli.config.ts), css/fonts/js → dist/
npm run devbuild     # same, unminified, no source maps
npm run typecheck    # tsc for src/, test/, and docs/ (including the .vue files)
npm test             # vitest run --project unit: all tests except the integration tests
npm run testc        # vitest run --coverage --project unit, report in test/coverage/; needs `npm run build`, not devbuild: source maps
npm run test-int     # integration tests: npm pack tarball installed into consumer projects (needs a build, network)
npm run devdocs      # `vitepress dev docs` (needs a build)
npm run docs         # build + generate the website into the gh-pages worktree ./website and commit it there
npm run clean        # remove the build output, test/coverage/, the VitePress cache and the website/ worktree
```

The tests and the website use the built library from `dist/` and `bin/`, so build first.


## Directory Structure

| Path | What |
|---|---|
| `src/index.ts` | library entry (`parse`, `HtmlGenerator`, `SyntaxError`, …) |
| `src/parser/latex-parser.pegjs` | the peggy grammar, compiled by `lib/vite-plugin-peggy.ts`; its types are hand-written in `latex-parser.pegjs.d.ts` next to it (keep the two in sync) |
| `src/generator/` | the generic generator `generator.ts`, composed of the mixins in this folder, and the `HtmlGenerator` in `html/` |
| `src/macro-manager.ts`, `src/macros.ts` | macro management: loading the classes of macros, macro types and argument types, the `@Macro` and `@Args` decorators |
| `src/latex/` | the macros: `latex.ltx.ts`, `symbols.ts`, the document classes in `documentclasses/` and the packages in `packages/` |
| `src/cli.ts` | the `latex.js` command-line tool, built by `vite.cli.config.ts` into `bin/latex.js` (all bare imports stay external, including `latex.js` → `dist/`) |
| `src/latex.component.ts` | the `<latex-js>` web component |
| `src/util/` | small shared modules (`Stack`, the mixin `Constructor` type) |
| `src/css/`, `public/fonts/`, `public/js/` | stylesheets, fonts and scripts the generated HTML needs; the build copies them to `dist/css/`, `dist/fonts/` and `dist/js/` |
| `lib/` | build tooling only (Vite and peggy plugins, the KaTeX CSS generator, the vue-tsc wrapper), never imported by `src/` |
| `test/` | the vitest tests (`*.test.ts`, configured in `vitest.config.ts`, which is separate from `vite.config.ts`), with their own `tsconfig.json`; `test/lib/` holds helpers (the puppeteer browsers for the screenshots, the svgdom DOM setup) |
| `test/fixtures/` | <latex/> sources and their expected HTML, see [Fixtures](#fixtures) |
| `test/screenshots/` | the stored screenshots of the fixtures and of the web component |
| `test/api/` | API examples run by `test/api.test.ts`, and included in the [usage](usage.md) docs |
| `test/integration/` | files for the integration tests in `test/integration.test.ts`, see [below](#integration-tests) |
| `docs/` | the website: the pages are Markdown; config and theme in `docs/.vitepress/`, the playground in `docs/components/` (`LtxPlayground.vue`, `LaTeX.ts`); `docs/tsconfig.json` covers both |
| `dist/`, `bin/` | build output (not in git) |
| `website/` | the generated website, a worktree of the `gh-pages` branch (not in git) |

The generator and the macros use TC39 decorators; Babel transpiles them in the Vite build.


## Tests

`npm test` runs all tests except the [integration tests](#integration-tests). To run only some of them, pass files
or a filter, e.g. `npx vitest run test/cli.test.ts`; the Vitest extension for VS Code runs and debugs single tests.
`DEBUG=chrome npm test` (or `DEBUG=firefox`) shows that browser with its devtools instead of running it headless.

- `test/fixtures.test.ts` translates the [fixtures](#fixtures) and compares the HTML,
- `test/cli.test.ts` runs `bin/latex.js`,
- `test/api.test.ts` runs the examples in `test/api/`: the Node examples with `node`, the browser example in Chrome,
  and it takes [screenshots](#screenshots) of the web component examples.

### Fixtures

The files in `test/fixtures/` (and its subdirectories) contain fixtures: a title, the <latex/> source and the expected
HTML, each followed by a line with a single `.`:

```
paragraphs and newlines
.
first line\\second line\newline third line\par and then a new paragraph as well
.
<div class="body">
<p>ﬁrst line<br>second line<br>third line</p>
<p>and then a new paragraph as well</p>
</div>
.
```

A line with attributes may come before the title: `!` skips the fixture, `+` runs only the fixtures that have it, and
`#` also takes screenshots of it. The fixtures are translated without hyphenation; line breaks in the HTML are ignored.
When a fixture fails, its actual HTML is written to `test/html/`.

### Screenshots

The fixtures with `#` and the web component examples are rendered in Chrome and Firefox (with puppeteer) and compared
with the screenshots in `test/screenshots/` (`.ch.png` for Chrome, `.ff.png` for Firefox) using BlazeDiff. If there
is no stored screenshot yet, the new one is stored. If they differ, the new screenshot is written next to the stored
one as `.new.png`, and the difference as `.diff.png` (pixels that got darker are green, lighter ones red). If the change
is intended, replace the `.png` with the `.new.png`; don't commit the `.new.png` and `.diff.png` files.

### Coverage

`npm run testc` writes a coverage report to `test/coverage/` (open `index.html`). It needs `npm run build`: the tests
run the bundles in `dist/` and `bin/`, and only their source maps lead back to `src/`. After a `devbuild`, the coverage
is 0%.

The CI workflow (`.github/workflows/node.js.yml`) uploads `test/coverage/lcov.info` to [Qlty](https://qlty.sh/gh/michael-brade/projects/LaTeX.js),
which shows the coverage (and maintainability) in the README badges and on pull requests, and to SonarQube Cloud. The
workflow has five jobs:

- `build` type-checks and builds,
- `test` runs the unit tests with coverage on that build,
- `test-integration` runs the integration tests on that build,
- `upload` sends the coverage report to Qlty, and
- `sonar` analyzes the code with SonarQube and sends it the coverage report.

Only `upload` and `sonar` may request an OIDC token, and they run no project code. Both are skipped for pull requests
from forks, which get no OIDC token.

### Integration Tests

`npm run test-int` runs `test/integration.test.ts`, the vitest project `integration` (`npm test` runs the project
`unit`, plain `npx vitest` both, see `vitest.config.ts`). It needs a build and network access, and tests the package
the way consumers get it:

- first, `test/integration/pack.sh` creates the tarball `test/integration/tmp/latex.js.tgz` with `npm pack`,
- `consumer` installs it into a new project in `test/integration/tmp/consumer/` and runs the Node API examples and
  the CLI there; it also type-checks a consumer with `strict` and without `skipLibCheck`: an ES module consumer with
  the module resolutions `bundler`, `node16` and `nodenext`, and a CommonJS consumer with `node16` and `nodenext`,
- `React app` builds a Vite + React app that uses the package (its `App.tsx` is `test/integration/react-App.tsx`) and
  checks in Chrome that it renders with the LaTeX styles and fonts, and again when React changes its content. The app
  stays in `test/integration/react-app/`, so you can try it with `npm run dev` there.

Run them when you change the build or the public API: `npm run build && npm run test-int`.


## Website and Playground

`npm run devdocs` starts the VitePress dev server; the playground is at `/playground` and compiles <latex/> live into
an iframe. In the pages, `<latex/>` and `<tex/>` render the logos, and the library examples in [Usage](usage.md) are
included from `test/api/` (with `<<<`), so they are tested.

`vitepress build` pre-renders the pages in Node (`vitepress dev` doesn't), but the playground is client-only
(`defineClientComponent` in `playground.md`), so its code can use `window` and `document` freely and stays out of the
server bundle. Test playground changes with a built site too (`vitepress build` and `vitepress preview`), not only
with `devdocs`.

The website uses the library from `dist/`: `"latex.js"` resolves through `exports`, and
`docs/public/latexjs/{css,fonts,js}` are committed symlinks to `dist/{css,fonts,js}` (the playground loads them from
`/latexjs/`; `vitepress build` copies the real files). After changes in `src/`, rebuild (`npm run devbuild` is faster)
and restart `devdocs`; for changes of the CSS, fonts or scripts, a rebuild is enough.

`npm run docs` builds the library and then the website into `website/`, a worktree of the `gh-pages` branch (created
if it doesn't exist), and commits it there. It doesn't push.


## package.json

`package.json` is generated, so never edit it by hand. The source of truth is the YAML in `package.yaml.sh`: edit that
file, then run `./package.yaml.sh` (it pipes the YAML through `npx js-yaml` into `package.json`), then `npm i`. Commit
`package.yaml.sh`, the regenerated `package.json` and `package-lock.json` together.

- The YAML in `package.yaml.sh` is a quoted heredoc (`<<'EOF'`), so it is passed to js-yaml verbatim: `$` in scripts
  needs no escaping.
- Chain script steps with `&&`, not `;`, so a failing step stops the script.
- **Every script must end with ` ;`** (a lone `;` after the last command). npm appends the arguments of
  `npm run <script> <args>` to the script's command line. Without the `;` they would extend the last command:
  `npm run clean /` would run `rimraf … /`. With it, they become a separate command, which fails harmlessly. Keep the
  `;` when adding or editing scripts, including one-liners (`test: vitest run;`).
- `prepare` runs `patch-package` (the patches are in `patches/`). It is `prepare`, not `postinstall`: `prepare` runs on
  `npm install`/`npm ci` in this repository, but not when latex.js is installed as a dependency, where `postinstall`
  would run and fail (it needs devDependencies).

### Dependencies

- The libraries that Vite bundles into `dist/` (katex, @svgdotjs/svg.js) are only needed at build time, so they are
  devDependencies.
- `dependencies` is meant for the Node CLI (`src/cli.ts`). `hyphen` is a dependency because the CLI loads the patterns
  of languages other than English at runtime (`require("hyphen/<lang>")`); only `hyphen/en` is bundled.


## TypeScript

- All tsconfigs use `module: EsNext` and `moduleResolution: Bundler`, which the `hyphen/en`-style subpath imports
  need. Vite does the transpiling; `tsc` is only used for type checking (`noEmit`).
- Relative imports in the source include the `.ts` extension.
- Self-imports of `"latex.js"` (from `cli.ts`, the tests and the docs) resolve like this:
  - **type checking:** `customConditions: ["latex.js-source"]` maps them to `src/index.ts`. This is set in the root
    tsconfig and inherited by `test/` and `docs/`.
  - **runtime** (Node, tsx, Vite/VitePress): they resolve through `exports` to `dist/`, so a build is needed.
- Editors use the nearest `tsconfig.json` in a file's parent folders. That's why the docs' tsconfig is
  `docs/tsconfig.json`, not in `docs/.vitepress/`: it has to be a parent of `docs/components/` too. Otherwise the
  editor would check those files against the root tsconfig, which only includes `src/`, without the declarations for
  `?raw`/`?inline` imports (`docs/.vitepress/vite-env.d.ts`), unless another docs file was opened first.
- Two TypeScript versions are installed:
  - `typescript` 7.x: the compiler (`tsc`) for type checking, also run by vite-plugin-checker during `vite build`.
  - `@typescript/typescript6` 6.x: TypeScript 7 has no JavaScript compiler API, so the tools that need it
    (unplugin-dts, vue-tsc) use this one. It depends on `@typescript/old` (a real `typescript@6`), whose own `tsc`
    bin collides with the one of TypeScript 7; the `prepare` script re-links `node_modules/.bin/tsc` to TypeScript 7.
    If `npx tsc -v` doesn't print 7.x, run `npm run prepare`.
- `.vue` files are type-checked by `node lib/vue-tsc.cjs` (part of `npm run typecheck`), which runs vue-tsc with
  TypeScript 6. Plain `npx vue-tsc` crashes, and plain `tsc` ignores `.vue` files.

### Published Types

- unplugin-dts emits `src/**/*.ts` to `dist/types/**/*.d.ts` (`entryRoot: "src"`), plus a CommonJS copy as `*.d.cts`
  next to them. `exports` in `package.json` references them directly: `import` → `dist/types/index.d.ts`,
  `require` → `dist/types/index.d.cts`. The package is `"type": "module"`, so a CommonJS consumer can't use the
  `.d.ts` files (TS1479 under `node16`).
- Published types must not reference devDependencies (peggy, svg.js, …): consumers don't have them. Mark internal
  members that would leak such types with `/** @internal */` (`stripInternal` is on).
- Mixins in `src/generator/` that are constrained by an intersection of mixin APIs must declare `override reset()`,
  even if trivially. Otherwise the emitted `.d.ts` declares `reset` as a property, and `Generator`'s
  `override reset()` fails with TS2425.
- When you change the build or the public API, run `npm run build && npm run test-int`, see
  [Integration Tests](#integration-tests).


## Conventions

- 4-space indentation (see `.editorconfig`). Match the style of the code around your change.
- The KaTeX stylesheets are generated by `lib/katex-css.mjs` (part of the build) from the installed `katex`:
  `dist/fonts/katex.css` holds only the `@font-face` rules, and `dist/css/katex.css` the rest, importing them. Don't
  add a `src/css/katex.css`. `@font-face` is ignored in a shadow DOM, so pages that show the output in one (like
  `<latex-js>`) load `fonts/cmu.css` and `fonts/katex.css` into the page itself.
- When updating `katex`, check `src/css/base.css` against KaTeX's class names (e.g. `.mathnormal`, which used to be
  `.mathdefault`), and look at the math screenshots.
- When you change the behavior or the API, update the documentation in `docs/` and the `README.md`.
- Don't commit anything from `dist/`, `website/` or `docs/.vitepress/cache/`.
