import path from 'node:path';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { EOL } from 'node:os';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { chrome, takeScreenshot, launchBrowsers, closeBrowsers } from './lib/browsers.ts';


const dirname = import.meta.dirname;
const exec = promisify(execFile);

const html = '<html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>Hi, this is a line of text.</p></div></body></html>' + EOL;

// run a node API example, resolves with its stdout
const runNode = async (file: string) =>
    (await exec('node', [path.join(dirname, file)], { env: { PATH: process.env.PATH } })).stdout;


describe('LaTeX.js API test', () => {

    beforeAll(launchBrowsers);
    afterAll(closeBrowsers);

    test('node legacy module API', async () => {
        await expect(runNode('api/node.cjs')).resolves.toBe(html);
    });

    test('node ES6 module API', async () => {
        await expect(runNode('api/node.mjs')).resolves.toBe(html);
    });

    test('browser API', async () => {
        const page = await chrome.newPage();
        await page.goto('file://' + path.join(dirname, 'api/browser.html'));
        expect(await page.$eval('.body', (node: Element) => node.outerHTML))
            .toBe('<div class="body"><p>Hi, this is a line of text.</p></div>');
        await page.close();
    });

    test('web component API', async () => {
        const data = await fs.readFile(path.join(dirname, 'api/webcomponent.html'), 'utf8');
        await takeScreenshot(data, path.join(dirname, 'screenshots/webcomponent'));
    });

    test('web component module API', async () => {
        const data = await fs.readFile(path.join(dirname, 'api/webcomponent.module.html'), 'utf8');
        await takeScreenshot(data, path.join(dirname, 'screenshots/webcomponent'));
    });
});
