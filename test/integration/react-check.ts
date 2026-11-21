// Serves the built React app (react.sh) and checks in headless Chrome that <latex-js> renders styled LaTeX: all
// stylesheets, fonts and scripts load, all glyphs are set in CMU or KaTeX fonts, and that it renders again when
// React changes its content.
//
// usage: npx tsx react-check.ts <dist dir>
//
// TODO: mostly AI written, looks ugly, refactor.

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import serveHandler from 'serve-handler';
import puppeteer from 'puppeteer';

const dir = process.argv[2];
if (!dir) {
    console.error('usage: react-check.ts <dist dir>');
    process.exit(2);
}

const server = http.createServer((req, res) => serveHandler(req, res, { public: dir }));
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;

const browser = await puppeteer.launch();
const errors: string[] = [];

try {
    const page = await browser.newPage();

    page.on('pageerror', err => errors.push(`page error: ${err}`));
    // while typing (see below), <latex-js> logs parse errors for the incomplete LaTeX: ignore those
    let typing = false;
    page.on('console', msg => {
        if (msg.type() === 'error' && !(typing && msg.text().startsWith('<latex-js>:')))
            errors.push(`console: ${msg.text()}`);
    });
    page.on('requestfailed', req => errors.push(`request failed: ${req.url()}`));
    page.on('response', res => { if (res.status() >= 400) errors.push(`HTTP ${res.status()}: ${res.url()}`); });

    await page.goto(url, { waitUntil: 'networkidle0' });

    const selector = 'latex-js'
    const result = await page.$eval(selector, async (el: Element) => {
        const body = el.shadowRoot?.querySelector('.body p');
        if (!body)
            return { error: 'no .body p in the shadow DOM' };

        const fontFamily = getComputedStyle(body).fontFamily;
        const mathnormal = el.shadowRoot!.querySelector('.katex .mathnormal');
        const mathFontFamily = mathnormal ? getComputedStyle(mathnormal).fontFamily : null;

        // load() resolves to the matching @font-face rules of the page: none if they aren't there
        // (no named helper function here: tsx would wrap it in __name(), which doesn't exist in the browser)
        const [cm, katex] = await Promise.all(['16px "Computer Modern Serif"', '16px KaTeX_AMS']
            .map(font => document.fonts.load(font)));

        return { fontFamily, mathFontFamily, cmLoaded: cm.length > 0, katexLoaded: katex.length > 0 };
    });

    if ('error' in result)
        errors.push(`${selector}: ${result.error}`);
    else {
        if (!result.fontFamily.includes('Computer Modern Serif'))
            errors.push(`${selector}: not styled, font-family is ${result.fontFamily}`);
        if (!result.mathFontFamily)
            errors.push(`${selector}: no math rendered`);
        else if (!result.mathFontFamily.includes('Computer Modern Serif'))
            errors.push(`${selector}: math not set in Computer Modern, font-family is ${result.mathFontFamily}`);
        if (!result.cmLoaded)
            errors.push(`${selector}: font Computer Modern Serif not loaded`);
        if (!result.katexLoaded)
            errors.push(`${selector}: KaTeX fonts not loaded (KaTeX_AMS)`);

        if (!errors.length)
            console.log(`ok: React app: ${selector} renders styled LaTeX`);
    }

    // the fonts that actually rendered the glyphs (a font-family can fall back for single glyphs):
    // everything inside the shadow roots must be CMU or KaTeX, no system font
    const cdp = await page.createCDPSession();
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });

    type DomNode = typeof root;
    const inShadow: number[] = [];
    const collect = (node: DomNode, shadow: boolean) => {
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
    for (const [font, html] of systemFonts)
        errors.push(`system font ${font} used in ${html}`);

    if (inShadow.length && !systemFonts.size)
        console.log(`ok: React app: all glyphs rendered in CMU or KaTeX fonts`);

    // edit the source in the textarea: React updates the content of <latex-js>, which has to render again
    // (it renders after every keystroke, the incomplete LaTeX in between gives parse errors, which keep the
    // previous rendering)
    await page.focus('textarea');
    await page.keyboard.press('End');
    typing = true;
    await page.keyboard.type(' Updated: $\\alpha$.');
    try {
        await page.waitForFunction(
            'document.querySelector("latex-js").shadowRoot.querySelector(".body").textContent.includes("Updated: α")',
            { timeout: 5000 });
        console.log('ok: React app: <latex-js> renders again when its content changes');
    } catch {
        errors.push('<latex-js> did not render the changed content');
    }
} finally {
    await browser.close();
    server.close();
}

if (errors.length) {
    console.error('FAIL: React app:\n  ' + errors.join('\n  '));
    process.exit(1);
}
