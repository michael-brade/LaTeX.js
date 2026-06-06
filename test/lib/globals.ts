import { Browser } from 'puppeteer';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

await import('puppeteer-core/lib/puppeteer/puppeteer-core.js');

chai.use(chaiAsPromised);

import { createHTMLWindow } from 'svgdom';

declare global {
    var expect: Chai.ExpectStatic;
    var test: Mocha.TestFunction;
    var chrome: Browser;
    var firefox: Browser;
    var takeScreenshot: (html: string, filename: string) => Promise<void>;
}

global.window = createHTMLWindow() as any;
global.document = (global.window as any).document;

global.expect = chai.expect;
