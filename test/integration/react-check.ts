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
            const fontLoaded = await document.fonts.load(`16px "Computer Modern Serif"`)
                .then(faces => faces.length > 0);
            const hasKaTeX = !!el.shadowRoot!.querySelector('.katex');

            return { fontFamily, fontLoaded, hasKaTeX };
        });

        if ('error' in result) {
            errors.push(`${host}: ${result.error}`);
            continue;
        }
        if (!result.fontFamily.includes('Computer Modern Serif'))
            errors.push(`${host}: not styled, font-family is ${result.fontFamily}`);
        if (!result.fontLoaded)
            errors.push(`${host}: font Computer Modern Serif not loaded`);
        if (!result.hasKaTeX)
            errors.push(`${host}: no math rendered`);

        if (!errors.length)
            console.log(`ok: React app: ${host} renders styled LaTeX`);
    }
} finally {
    await browser.close();
    server.close();
}

if (errors.length) {
    console.error('FAIL: React app:\n  ' + errors.join('\n  '));
    process.exit(1);
}
