import fs from 'node:fs';
import http from 'node:http';
import serveHandler from 'serve-handler';
import puppeteer, { Browser, ConsoleMessage, Page } from 'puppeteer';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';


export let chrome: Browser;
export let firefox: Browser;

let cPage: Page,
    fPage: Page;

let server: http.Server;

// map for html pages to serve (allows for parallel tests)
const htmlRegistry = new Map<string, string>();

// DEBUG=chrome npm test
const DEBUG = process.env.DEBUG as 'chrome' | 'firefox' | undefined;


before(async () => {
    chrome = await puppeteer.launch({
        browser: 'chrome',
        headless: DEBUG != 'chrome',
        devtools: DEBUG === 'chrome',
        dumpio: false,
        // args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
    });

    firefox = await puppeteer.launch({
        browser: 'firefox',
        executablePath: '/opt/firefox/firefox',
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
});

after(async () => {
    // only close if we are not debugging
    if (DEBUG !== 'chrome')   await chrome.close();
    if (DEBUG !== 'firefox')  await firefox.close();
    if (!DEBUG)               server.close();
});

function compareScreenshots(filename: string): void {
    if (fs.existsSync(filename + '.png')) {
        // now compare the screenshots and delete the new one if they match
        const png1 = PNG.sync.read(fs.readFileSync(filename + '.png'));
        const png2 = PNG.sync.read(fs.readFileSync(filename + '.new.png'));

        const diff = new PNG({ width: png1.width, height: png1.height });

        const dfpx = pixelmatch(
            png1.data,
            png2.data,
            diff.data,
            png1.width,
            png1.height,
            {
                threshold: 0,
                diffColorAlt: [0, 255, 0]
            }
        );

        fs.writeFileSync(filename + '.diff.png', PNG.sync.write(diff));

        if (dfpx > 0) {
            throw new Error(`screenshots differ by ${dfpx} pixels - see ${filename + '.*.png'}`);
        } else {
            fs.unlinkSync(filename + '.new.png');
            fs.unlinkSync(filename + '.diff.png');
        }
    } else {
        // if no screenshot exists yet, use this new one
        fs.renameSync(filename + '.new.png', filename + '.png');
    }
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

    const cfile = `${filename}.ch`;
    const ffile = `${filename}.ff`;

    fs.writeFileSync(`${cfile}.new.png`, cScreenshot);
    fs.writeFileSync(`${ffile}.new.png`, fScreenshot);

    compareScreenshots(cfile);
    compareScreenshots(ffile);

    // only delete the page again when not debugging
    if (!DEBUG)
        htmlRegistry.delete(filename);
};