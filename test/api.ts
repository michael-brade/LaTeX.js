import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import { EOL } from 'node:os';
import { takeScreenshot } from './lib/setup.ts';


const dirname = fileURLToPath(new URL('.', import.meta.url));

describe('LaTeX.js API test', () => {

    test('node legacy module API', () => {
        const node = spawn('node', [path.join(dirname, 'api/node.js')], { env: { PATH: process.env.PATH } });

        expect(new Promise<string>((resolve, reject) => {
            let stdout = "";
            let stderr = "";

            node.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            node.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            node.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(stderr);
                }
            });

            node.on('error', (err: Error) => {
                node.removeAllListeners('exit');
                reject(err);
            });
        }))
        .to.eventually.equal('<html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"></meta><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>Hi, this is a line of text.</p></div></body></html>' + EOL);
    });

    test('node ES6 module API', () => {
        const node = spawn('node', [path.join(dirname, 'api/node.mjs')], { env: { PATH: process.env.PATH } });

        expect(new Promise<string>((resolve, reject) => {
            let stdout = "";
            let stderr = "";

            node.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            node.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            node.on('exit', (code: number | null, signal: string | null) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(stderr);
                }
            });

            node.on('error', (err: Error) => {
                node.removeAllListeners('exit');
                reject(err);
            });
        }))
        .to.eventually.equal('<html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"></meta><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>Hi, this is a line of text.</p></div></body></html>' + EOL);
    });

    test('browser API', async () => {
        const page = await chrome.newPage();
        await page.goto('file://' + path.join(dirname, 'api/browser.html'));
        expect(await page.$eval('.body', (node: Element) => node.outerHTML))
            .to.equal('<div class="body"><p>Hi, this is a line of text.</p></div>');
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
