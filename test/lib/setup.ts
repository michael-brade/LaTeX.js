import fs from 'node:fs';
import http from 'node:http';
import serveHandler from 'serve-handler';
import puppeteer, { Browser, ConsoleMessage, Page } from 'puppeteer';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

declare global {
    var expect: Chai.ExpectStatic;
    var test: Mocha.TestFunction;
    var chrome: Browser;
    var firefox: Browser;
    var takeScreenshot: (html: string, filename: string) => Promise<void>;
}

global.expect = chai.expect;
global.test = it;

let cPage: Page,
    fPage: Page;

let server: http.Server,
    testHtmlPage: string;

before(async () => {
    global.chrome = await puppeteer.launch({
        browser: 'chrome',
        devtools: false,
        dumpio: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
        defaultViewport: { width: 1000, height: 0, deviceScaleFactor: 2 }
    });

    global.firefox = await puppeteer.launch({
        browser: 'firefox',
        executablePath: '/opt/firefox/firefox',
        headless: true,
        devtools: false,
        dumpio: false,
        defaultViewport: { width: 1000, height: 0, deviceScaleFactor: 2 }
    });

    const chromePages = (await chrome.pages());
    cPage = chromePages[0]; // there is always one page available
    const firefoxPages = await firefox.pages();
    fPage = firefoxPages[0];

    cPage.on('console', (msg) => {
        if (msg.type() === 'error') {
            console.error("Error in chrome: ", msg.text());
        }
    });

    fPage.on('console', (msg: ConsoleMessage) => {
        if (msg.type() === 'error') {
            console.error("Error in firefox: ", msg.text());
        }
    });

    // start the webserver in the dist directory so that CSS and fonts are found
    // redirect from /dist to /
    server = http.createServer(async (request, response) => {
        if (request.url === "/") {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(testHtmlPage);
        } else {
            await serveHandler(request, response, {
                public: process.cwd() + "/dist",
                redirects: [
                    { source: "/dist/:file", destination: "/:file", type: 301 },
                    { source: "/dist/:dir/:file", destination: "/:dir/:file", type: 301 }
                ]
            });
        }
    });

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen({ host: "localhost", port: 0, exclusive: true }, () => {
            resolve();
        });
    });
});

after(async () => {
    await chrome.close();
    await firefox.close();
    server.close();
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
global.takeScreenshot = async (html: string, filename: string): Promise<void> => {
    testHtmlPage = html;

    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;
    await cPage.goto(`http://localhost:${port}`);
    await cPage.addStyleTag({ content: ".body { border: .4px solid; height: max-content; }" });

    await fPage.goto(`http://localhost:${port}`);
    await fPage.addStyleTag({ content: ".body { border: .4px solid; height: max-content; }" });

    const cfile = filename + ".ch";
    const ffile = filename + ".ff";

    await cPage.screenshot({
        omitBackground: true,
        fullPage: false,
        captureBeyondViewport: false,
        path: cfile + '.new.png'
    });

    await fPage.screenshot({
        // omitBackground: true
        path: ffile + '.new.png'
    });

    compareScreenshots(cfile);
    compareScreenshots(ffile);

    testHtmlPage = "";
};