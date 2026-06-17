import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.config.truncateThreshold = 0;

import { Browser } from 'puppeteer';
import { createHTMLWindow } from 'svgdom';

declare global {
    var expect: Chai.ExpectStatic;
    var test: Mocha.TestFunction;
    var chrome: Browser;
    var firefox: Browser;
}

global.window = createHTMLWindow() as any;
global.document = (global.window as any).document;

global.expect = chai.expect;
