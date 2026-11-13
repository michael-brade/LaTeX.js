import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.config.truncateThreshold = 0;

declare global {
    var expect: Chai.ExpectStatic;
    var test: Mocha.TestFunction;
}

global.test = it
global.expect = chai.expect;


import { createHTMLWindow } from 'svgdom';

global.window = createHTMLWindow() as any;
global.document = (global.window as any).document;

import { registerWindow } from '@svgdotjs/svg.js';
registerWindow(global.window, global.document);
