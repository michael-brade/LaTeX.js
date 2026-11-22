// Integration tests: test the package the way consumers get it. Needs a build and network access, run with
// "npm run test-int" (vitest run --project integration, see vitest.config.ts).
//
//  - integration/pack.sh packs the build into integration/tmp/latex.js.tgz,
//  - consumer: installs it into a fresh project and checks that it works at runtime (the node API examples in
//    api/, CommonJS and ESM, and the CLI) and that its types work: strict, without skipLibCheck, for ESM (bundler,
//    node16, nodenext) and CommonJS (node16, nodenext),
//  - React app: creates a Vite + React (TypeScript) app in integration/react-app/ that uses latex.js, builds it
//    (type check + bundle) and checks in headless Chrome that it renders with the LaTeX styles and fonts. Run
//    "npm run dev" in react-app/ afterwards to try it in the browser.

import path from 'node:path';
import fs from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { spawn } from 'node:child_process';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import serveHandler from 'serve-handler';
import puppeteer, { type Browser, type Page, type Protocol } from 'puppeteer';


const rootDir = path.resolve(import.meta.dirname, '..');
const integrationDir = path.join(rootDir, 'test/integration');
const tarball = path.join(integrationDir, 'tmp/latex.js.tgz');
const tsc = path.join(rootDir, 'node_modules/.bin/tsc');

const MINUTE = 60_000;


// runs a command, resolves with its stdout; rejects with all of its output that shows why it failed
function run(cmd: string, args: string[], cwd: string, input?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
        let stdout = '', output = '';
        child.stdout.on('data', data => { stdout += data; output += data; });
        child.stderr.on('data', data => { output += data; });
        child.on('error', reject);
        child.on('close', code => code === 0
            ? resolve(stdout)
            : reject(new Error(`${cmd} ${args.join(' ')} (in ${path.relative(rootDir, cwd)}) exited with ${code}:\n${output}`)));
        child.stdin.end(input);
    });
}

const npmInstall = (cwd: string, ...packages: string[]) =>
    run('npm', ['install', '--silent', '--no-audit', '--no-fund', ...packages], cwd);


beforeAll(() => run(path.join(integrationDir, 'pack.sh'), [], integrationDir), 2 * MINUTE);


describe('consumer', () => {
    const consumer = path.join(integrationDir, 'tmp/consumer');
    const latexjs = (args: string[], input: string) =>
        run(path.join(consumer, 'node_modules/.bin/latex.js'), args, consumer, input);

    beforeAll(async () => {
        await fs.rm(consumer, { recursive: true, force: true });
        await fs.mkdir(consumer, { recursive: true });
        await fs.cp(path.join(rootDir, 'test/api/node.cjs'), path.join(consumer, 'node.cjs'));
        await fs.cp(path.join(rootDir, 'test/api/node.mjs'), path.join(consumer, 'node.mjs'));
        await fs.writeFile(path.join(consumer, 'package.json'),
            JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 4));
        await npmInstall(consumer, tarball);
    }, 5 * MINUTE);


    describe('runtime', () => {
        test.each(['node.cjs', 'node.mjs'])('%s', async script => {
            await expect(run('node', [script], consumer)).resolves.toContain('<p>Hi, this is a line of text.</p>');
        });

        test('CLI', async () => {
            await expect(latexjs(['-b'], 'A \\textbf{bold} text.')).resolves
                .toContain('<p>A <span class="bf">bold</span> text.</p>');
        });

        // svg.js needs the DOM globals when latex.js is loaded; -b: body only, which must not clone the SVG
        // (TODO: add \multiput once svgdom can clone an svg's plain xmlns attribute, see patches/svgdom+*.patch)
        test.each([{ args: [] }, { args: ['-b'] }])('CLI $args: picture', async ({ args }) => {
            const picture = String.raw`\setlength{\unitlength}{1cm}\begin{picture}(2,2)\put(0,0){\line(1,1){2}}\put(1,0){\circle{1}}\end{picture}`;
            const out = await latexjs(args, picture);
            expect(out).toContain('<line x1="0" y1="0" x2="75.591" y2="75.591"');
            expect(out).toContain('<circle r="18.8975px"');
        });
    });


    describe('types', () => {
        const typesSourceFile = path.join(integrationDir, 'latexjs-types.ts')
        // .mts is always ESM, .cts always CommonJS, regardless of "type" in package.json
        beforeAll(async () => {
            await fs.cp(typesSourceFile, path.join(consumer, 'esm.mts'));
            await fs.cp(typesSourceFile, path.join(consumer, 'cjs.cts'));
        });

        test.each([
            ['esm.mts', 'esnext',   'bundler'],
            ['esm.mts', 'node16',   'node16'],
            ['esm.mts', 'nodenext', 'nodenext'],
            ['cjs.cts', 'node16',   'node16'],
            ['cjs.cts', 'nodenext', 'nodenext'],
        ])('%s with module %s, moduleResolution %s', async (file, module, moduleResolution) => {
            const tsconfig = `tsconfig.${module}.${file}.json`;
            await fs.writeFile(path.join(consumer, tsconfig), JSON.stringify({
                compilerOptions: {
                    module,
                    moduleResolution,
                    target: 'es2022',
                    lib: ['es2022', 'dom'],
                    types: [],
                    strict: true,
                    skipLibCheck: false,
                    noEmit: true
                },
                files: [file]
            }, null, 4));

            await run(tsc, ['-p', tsconfig], consumer);
        });
    });
});


describe('React app', () => {
    const app = path.join(integrationDir, 'react-app');

    let server: http.Server;
    let browser: Browser;
    let page: Page;

    // errors while loading and rendering the page; while typing (see below), <latex-js> logs parse errors for the
    // incomplete LaTeX: ignore those
    const errors: string[] = [];
    let typing = false;

    beforeAll(async () => {
        await fs.rm(app, { recursive: true, force: true });
        await run('npm', ['create', '--yes', 'vite@9.3.4', 'react-app', '--',
            '--template', 'react-ts', '--no-interactive', '--no-immediate'], integrationDir);
        await npmInstall(app);
        await npmInstall(app, tarball);

        // latex.js references its stylesheets, fonts and scripts by URL: serve them from public/latexjs/
        for (const assets of ['css', 'fonts', 'js']) {
            await fs.cp(
                path.join(app, 'node_modules/latex.js/dist', assets),
                path.join(app, 'public/latexjs', assets),
                { recursive: true }
            );
        }

        // the template's page styles (centered, gray text, dark mode) would get in the way of the LaTeX look
        const main = path.join(app, 'src/main.tsx');
        await fs.writeFile(main, (await fs.readFile(main, 'utf8')).replace(/^import '\.\/index\.css'.*\n/m, ''));

        await fs.cp(path.join(integrationDir, 'react-App.tsx'), path.join(app, 'src/App.tsx'));

        await run('npm', ['run', 'build'], app);


        server = http.createServer((req, res) => serveHandler(req, res, { public: path.join(app, 'dist') }));
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));

        browser = await puppeteer.launch();
        page = await browser.newPage();

        page.on('pageerror', err => errors.push(`page error: ${err}`));
        page.on('console', msg => {
            if (msg.type() === 'error' && !(typing && msg.text().startsWith('<latex-js>:')))
                errors.push(`console: ${msg.text()}`);
        });
        page.on('requestfailed', req => errors.push(`request failed: ${req.url()}`));
        page.on('response', res => { if (res.status() >= 400) errors.push(`HTTP ${res.status()}: ${res.url()}`); });

        await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`, { waitUntil: 'networkidle0' });
    }, 10 * MINUTE);

    afterAll(async () => {
        await browser?.close();
        server?.close();
    });


    test('<latex-js> renders styled LaTeX', async () => {
        const result = await page.$eval('latex-js', async (el: Element) => {
            const body = el.shadowRoot?.querySelector('.body p');
            const mathnormal = el.shadowRoot?.querySelector('.katex .mathnormal');

            // load() resolves to the matching @font-face rules of the page: none if they aren't there
            // (no named helper function here: it could get wrapped in __name(), which doesn't exist in the browser)
            const [cm, katex] = await Promise.all(['16px "Computer Modern Serif"', '16px KaTeX_AMS']
                .map(font => document.fonts.load(font)));

            return {
                fontFamily: body ? getComputedStyle(body).fontFamily : null,
                mathFontFamily: mathnormal ? getComputedStyle(mathnormal).fontFamily : null,
                cmLoaded: cm.length > 0,
                katexLoaded: katex.length > 0
            };
        });

        expect(result.fontFamily, 'font of .body p in the shadow DOM').toContain('Computer Modern Serif');
        expect(result.mathFontFamily, 'font of the math').toContain('Computer Modern Serif');
        expect(result.cmLoaded, 'font Computer Modern Serif loaded').toBe(true);
        expect(result.katexLoaded, 'KaTeX fonts loaded (KaTeX_AMS)').toBe(true);
    });

    // the fonts that actually rendered the glyphs (a font-family can fall back for single glyphs):
    // everything inside the shadow roots must be CMU or KaTeX, no system font
    test('all glyphs are rendered in CMU or KaTeX fonts', async () => {
        const cdp = await page.createCDPSession();
        await cdp.send('DOM.enable');
        await cdp.send('CSS.enable');
        const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });

        const inShadow: number[] = [];
        const collect = (node: Protocol.DOM.Node, shadow: boolean) => {
            // skip KaTeX's MathML copy for screen readers: it is visually hidden
            const attrs = node.attributes ?? [];
            if (attrs.some((value, i) => i % 2 === 1 && attrs[i - 1] === 'class' && value.split(' ').includes('katex-mathml')))
                return;
            // the browser's own shadow roots (e.g. inside <textarea>) aren't LaTeX output
            if (node.shadowRootType === 'user-agent')
                return;
            if (shadow && node.nodeType === 1)
                inShadow.push(node.nodeId);
            node.children?.forEach(child => collect(child, shadow));
            node.shadowRoots?.forEach(child => collect(child, true));
        };
        collect(root, false);

        expect(inShadow, 'elements in the shadow DOM').not.toHaveLength(0);

        const systemFonts = new Map<string, string>();
        for (const nodeId of inShadow) {
            const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
            for (const { familyName } of fonts) {
                if (!/^(CMU |KaTeX_)/.test(familyName)) {
                    const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId });
                    systemFonts.set(familyName, outerHTML.slice(0, 120));
                }
            }
        }

        expect(Object.fromEntries(systemFonts), 'system fonts and where they are used').toEqual({});
    });

    // edit the source in the textarea: React updates the content of <latex-js>, which has to render again (it renders
    // after every keystroke, the incomplete LaTeX in between gives parse errors, which keep the previous rendering)
    test('<latex-js> renders again when its content changes', async () => {
        await page.focus('textarea');
        await page.keyboard.press('End');
        typing = true;
        await page.keyboard.type(' Updated: $\\alpha$.');
        await page.waitForFunction(
            'document.querySelector("latex-js").shadowRoot.querySelector(".body").textContent.includes("Updated: α")',
            { timeout: 5000 });
    });

    test('no errors while loading and rendering', () => {
        expect(errors).toEqual([]);
    });
});
