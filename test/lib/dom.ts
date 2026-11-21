// vitest setup file (setupFiles in vitest.config.ts): a DOM for the generator, provided by svgdom
import { createHTMLWindow } from 'svgdom';

global.window = createHTMLWindow() as any;
global.document = (global.window as any).document;

import { registerWindow } from '@svgdotjs/svg.js';
registerWindow(global.window, global.document);
