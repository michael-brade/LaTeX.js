import fs from 'node:fs';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import serveHandler from 'serve-handler';
import puppeteer, { Browser, ConsoleMessage, Page } from 'puppeteer';
import { diff } from '@blazediff/core-native';


export let chrome: Browser;
export let firefox: Browser;

let cPage: Page,
    fPage: Page;

let server: http.Server;

// map for html pages to serve (allows for parallel tests)
const htmlRegistry = new Map<string, string>();

// DEBUG=chrome npm test
const DEBUG = process.env.DEBUG as 'chrome' | 'firefox' | undefined;


export async function launchBrowsers(): Promise<void> {
    chrome = await puppeteer.launch({
        browser: 'chrome',
        headless: DEBUG != 'chrome',
        devtools: DEBUG === 'chrome',
        dumpio: false,
        // args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
    });

    firefox = await puppeteer.launch({
        browser: 'firefox',
        headless: DEBUG != 'firefox',
        devtools: DEBUG === 'firefox',
        dumpio: false
    });

    cPage = (await chrome.pages())[0]; // there is always one page available
    cPage.setViewport({
        width: 1000,
        height: 1,
        deviceScaleFactor: 2
    });
    fPage = (await firefox.pages())[0];
    fPage.setViewport({
        width: 1000,
        height: 1,
        deviceScaleFactor: 2
    });

    const logErrors = (browserName: string) => (msg: ConsoleMessage) => {
        if (msg.type() === 'error')
            console.error(`Error in ${browserName}: `, msg.text());
    };
    cPage.on('console', logErrors('chrome'));
    fPage.on('console', logErrors('firefox'));


    const handleDisconnect = (browserName: string) => async () => {
        if (DEBUG === browserName) {
            console.log(`\n🛑 Browser [${browserName}] was closed. Shutting down server...`);

            if (server)
                server.close();

            process.exit(0);
        }
    };

    chrome.on("disconnected", handleDisconnect('chrome'));
    firefox.on("disconnected", handleDisconnect('firefox'));

    // start the webserver in the dist directory so that CSS and fonts are found
    // redirect from /dist to /
    server = http.createServer(async (request: http.IncomingMessage, response) => {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const testId = url.searchParams.get('testId');

        // if a test-ID was given and the registry has it, serve it
        if (testId && htmlRegistry.has(testId)) {
            response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            response.end(htmlRegistry.get(testId));
            return;
        }

        await serveHandler(request, response, {
            public: process.cwd() + "/dist",
            redirects: [
                { source: "/dist/:file", destination: "/:file", type: 301 },
                { source: "/dist/:dir/:file", destination: "/:dir/:file", type: 301 }
            ]
        });
    });

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen({ host: "localhost", port: 0, exclusive: true }, () => {
            resolve();
        });
    });
}

export async function closeBrowsers(): Promise<void> {
    // only close if we are not debugging
    if (DEBUG !== 'chrome')   await chrome.close();
    if (DEBUG !== 'firefox')  await firefox.close();
    if (!DEBUG)               server.close();
}

let oxipngMissing = false;

// write a screenshot and compress it losslessly with oxipng (if installed); the screenshots are compared by
// their decoded pixels, so an optimized file still compares identical to the browser's output
async function writePng(file: string, png: Uint8Array): Promise<void> {
    fs.writeFileSync(file, png);

    if (oxipngMissing)
        return;

    try {
        await promisify(execFile)('oxipng', ['-o', 'max', '--strip', 'safe', '-q', file]);
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            oxipngMissing = true;
            console.warn('oxipng is not installed, screenshots are not optimized');
        } else
            console.warn(`oxipng failed, ${file} is not optimized: ${e.message}`);
    }
}

// compare a new screenshot (PNG bytes) with the stored filename.png; if they differ, keep the new one as
// filename.new.png and the difference as filename.diff.png
async function compareScreenshots(filename: string, screenshot: Uint8Array): Promise<void> {
    const stored = filename + '.png';
    const newFile = filename + '.new.png';
    const diffFile = filename + '.diff.png';

    // if no screenshot exists yet, use this new one
    if (!fs.existsSync(stored)) {
        await writePng(stored, screenshot);
        return;
    }

    // leftovers of an earlier failed run
    fs.rmSync(newFile, { force: true });
    fs.rmSync(diffFile, { force: true });

    // the diff file is only written if the images differ; "oklab" counts like pixelmatch
    const result = await diff(stored, screenshot, {
        threshold: 0,
        metric: 'oklab',
        render: { diffColorAlt: [0, 255, 0] },     // pixels that got darker: green, lighter: red
        output: diffFile
    });

    if (result.kind === 'compared' && result.identical)
        return;

    // optimized as well, so that it can be accepted by just renaming it to filename.png
    await writePng(newFile, screenshot);

    if (result.kind === 'compared')
        throw new Error(`screenshots differ by ${result.count} pixels - see ${filename + '.*.png'}`);
    if (result.kind === 'dimension-mismatch')
        throw new Error(`screenshot size changed from ${result.a.width}x${result.a.height} to ` +
                        `${result.b.width}x${result.b.height} - see ${filename + '.*.png'}`);
    throw new Error(`comparing screenshots failed: ${result.message}`);
}

// render html and take screenshot
export async function takeScreenshot(html: string, filename: string): Promise<void>
{
    htmlRegistry.set(filename, html);

    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;

    const screenshotPage = async (page: Page) => {
        await page.goto(`http://localhost:${port}/?testId=${encodeURIComponent(filename)}`, { waitUntil: 'load' });
        await page.addStyleTag({ content: ".body { border: .4px solid; height: max-content; }" });

        // wait for fonts to be loaded
        await page.evaluate(() => document.fonts.ready);

        const bodyElement = await page.$('body');
        if (!bodyElement) throw new Error("Body element not found");

        // find the real hight of the page and adjust viewport
        // const boundingBox = await bodyElement.boundingBox();
        // if (!boundingBox) throw new Error("Could not calculate bounding box");

        // await page.setViewport({
        //     width: 1000,
        //     height: Math.ceil(boundingBox.height),
        //     deviceScaleFactor: 2
        // });

        return await bodyElement.screenshot({
            omitBackground: page.browser() == chrome
        });
    };

    // parallel screenshots for speed
    const [cScreenshot, fScreenshot] = await Promise.all([
        screenshotPage(cPage),
        screenshotPage(fPage)
    ]);

    // compare both, even if one differs, so that each browser gets its .new.png/.diff.png
    const results = await Promise.allSettled([
        compareScreenshots(`${filename}.ch`, cScreenshot),
        compareScreenshots(`${filename}.ff`, fScreenshot)
    ]);

    // only delete the page again when not debugging
    if (!DEBUG)
        htmlRegistry.delete(filename);

    const errors = results.flatMap(r => r.status === 'rejected' ? [r.reason.message] : []);
    if (errors.length)
        throw new Error(errors.join('\n'));
};