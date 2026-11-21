// Serves the built React app (react.sh) and checks in headless Chrome that both LaTeX renderings are there and
// styled: all stylesheets, fonts and scripts load, and the text is set in Computer Modern.
//
// usage: npx tsx react-check.ts <dist dir>

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
    page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
    page.on('requestfailed', req => errors.push(`request failed: ${req.url()}`));
    page.on('response', res => { if (res.status() >= 400) errors.push(`HTTP ${res.status()}: ${res.url()}`); });

    await page.goto(url, { waitUntil: 'networkidle0' });

    for (const host of ['.latex-api', 'latex-js']) {
        const result = await page.$eval(host, async (el: Element) => {
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

        if ('error' in result) {
            errors.push(`${host}: ${result.error}`);
            continue;
        }
        if (!result.fontFamily.includes('Computer Modern Serif'))
            errors.push(`${host}: not styled, font-family is ${result.fontFamily}`);
        if (!result.mathFontFamily)
            errors.push(`${host}: no math rendered`);
        else if (!result.mathFontFamily.includes('Computer Modern Serif'))
            errors.push(`${host}: math not set in Computer Modern, font-family is ${result.mathFontFamily}`);
        if (!result.cmLoaded)
            errors.push(`${host}: font Computer Modern Serif not loaded`);
        if (!result.katexLoaded)
            errors.push(`${host}: KaTeX fonts not loaded (KaTeX_AMS)`);

        if (!errors.length)
            console.log(`ok: React app: ${host} renders styled LaTeX`);
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
} finally {
    await browser.close();
    server.close();
}

if (errors.length) {
    console.error('FAIL: React app:\n  ' + errors.join('\n  '));
    process.exit(1);
}
