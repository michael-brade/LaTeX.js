// briefly test all exported types

import { parse, HtmlGenerator, SyntaxError, LaTeXJSComponent, defineLaTeXJSComponent } from "latex.js";
import type { HtmlOptions } from "latex.js";

const options: Partial<HtmlOptions> = { hyphenate: false };
const generator: HtmlGenerator = parse("Hi.", { generator: new HtmlGenerator(options) });

const fragment: DocumentFragment = generator.domFragment();
const html: string = generator.htmlDocument().documentElement.outerHTML;

const isError: boolean = new Error() instanceof SyntaxError;

customElements.define("latex-js", LaTeXJSComponent);
defineLaTeXJSComponent("latex-js-2");

const component: HTMLElement = new LaTeXJSComponent();

export { fragment, html, isError };
