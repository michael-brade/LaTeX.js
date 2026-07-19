import { Generator } from '../generator.ts';
import { Counters } from "../counters.ts";
import { Groups } from "../groups.ts";

import { HtmlElements } from './elements.ts';

import { MacroManager } from '../../macro-manager.ts';

import type { HtmlOptions } from '../../options.ts';
import { ligatures, diacritics } from '../../latex/symbols.ts';

// import { SVG } from '@svgdotjs/svg.js';
import katex from 'katex';

import { flattenDeep, compact } from 'lodash';

import Hypher from 'hypher';
import hEn from 'hyphenation.en-us';
import he from 'he';
import type { Length, Vector } from '../../types.ts';

// Configure he library options
he.decode.options = { strict: true };




function isBlockLevel(el: HTMLElement): boolean
{
    const blockRegex = /^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes|noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$/i;
    return blockRegex.test(el.nodeName);
}




// in case more than one level is required:
// type NestedNodes = Node | NestedNodes[];

function appendChildren(parent: Node, children: Node | Node[] | undefined | null): Node
{
    // always transform children into a flat array
    const normalizedChildren = [children ?? []].flat(Infinity) as Node[];

    for (const child of normalizedChildren)
        if (child instanceof Node)
            parent.appendChild(child);

    return parent;
}



export class HtmlGenerator extends Groups(Counters(Generator))
{
    #dom = document.createDocumentFragment();
    #h;

    // in this class _options is extended
    declare _options: HtmlOptions;


    // CTOR
    constructor(options?: HtmlOptions)
    {
        const finalizedOptions = Object.assign({
            documentClass: "article",
            styles: [],
            hyphenate: true,
            languagePatterns: hEn,
            precision: 3
        }, options);

        // super() must be called before using `this` properties
        super(finalizedOptions);

        if (finalizedOptions.hyphenate)
            this.#h = new Hypher(finalizedOptions.languagePatterns);

        this.reset();
    }

    override reset(): void
    {
        super.reset();
        this.#dom = document.createDocumentFragment();
    }

    override get options(): HtmlOptions
    {
        return this._options;
    }

    ///// character/text creation

    character(c: string): string
    {
        return c;
    }

    textquote(q: string): any
    {
        switch (q) {
            case '`':
                return this.symbol('textquoteleft');
            case '\'':
                return this.symbol('textquoteright');
            default:
                return undefined;
        }
   }

    hyphen(): string
    {
        if (this._activeAttributeValue('fontFamily') === 'tt') {
            return '-'; // U+002D
        } else {
            return he.decode("&hyphen;"); // U+2010
        }
    }

    ligature(l: string): any
    {
        // no ligatures in tt
        if (this._activeAttributeValue('fontFamily') === 'tt') {
            return l;
        } else {
            return ligatures.get(l);
        }
    }

    hasDiacritic(d: string): boolean
    {
        return diacritics.has(d);
    }

    // diacritic d for char c
    diacritic(d: string, c?: string): string
    {
        if (!c)
            return diacritics.get(d)[1]; // if only d is given, use the standalone version

        return c + diacritics.get(d)[0]; // otherwise add it to the character c
    }

    controlSymbol(c: string): string
    {
        switch (c) {
            case '/':
                return this.zwnj;
            case ',':
                return this.thinsp;
            case '-':
                return this.shy;
            case '@':
                return '\u200B'; // nothing, just prevent spaces from collapsing
            default:
                return this.character(c);
        }
    }

   /// get the result

    /**
     * @return the HTMLDocument for use as a standalone webpage
     * @param baseURL the base URL to use to build an absolute URL
     */
    htmlDocument(baseURL?: string): HTMLDocument
    {
        const doc = document.implementation.createHTMLDocument(this.documentTitle);

        /// head

        const charset = document.createElement("meta");
        charset.setAttribute("charset", "UTF-8");
        doc.head.appendChild(charset);

        if (!baseURL) {
            // when used in a browser context, always insert all assets with absolute URLs;
            // this is also useful when using a Blob in iframe.src (see also #12)
            baseURL = window.location?.href;
        }

        if (baseURL) {
            const base = document.createElement("base"); // TODO: is the base element still needed??
            base.href = baseURL; // TODO: not in svgdom
            doc.head.appendChild(base);


            doc.head.appendChild(this.stylesAndScripts(baseURL));
        } else {
            doc.head.appendChild(this.stylesAndScripts());
        }

        /// body

        doc.body.appendChild(this.domFragment());
        this.applyLengthsAndGeometryToDom(doc.documentElement);

        return doc;
    }

    /**
     * @return a DocumentFragment consisting of stylesheets and scripts
     */
    stylesAndScripts(baseURL?: string): DocumentFragment
    {
        const el = document.createDocumentFragment();

        const createStyleSheet = (url: string) => {
            const link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = url;
            return link;
        };

        const createScript = (url: string) => {
            const script = document.createElement("script");
            script.src = url;
            return script;
        };
        if (baseURL) {
            el.appendChild(createStyleSheet(new URL("css/katex.css", baseURL).toString()));
            // Access constructor static property via JavaScript prototype lookup structure
            const cssProp = (this.constructor as any).documentClass?.css || "";
            el.appendChild(createStyleSheet(new URL(cssProp, baseURL).toString()));

            for (const style of this.options.styles)
                el.appendChild(createStyleSheet(new URL(style, baseURL).toString()));
        }
        return el;
    }


    /* @return DocumentFragment, the full page without stylesheets or scripts */
    domFragment(): DocumentFragment
    {
        const f = document.createDocumentFragment();

        // text body
        f.append(this.create(HtmlElements.block, this.#dom, "body"));


        if (this.marginPars && this.marginPars.length) {
            const marginPars = this.marginPars.map(mp => {
                const el = this.create(HtmlElements.block, [
                    this.create(HtmlElements.inline, null, "mpbaseline"),
                    mp.content
                ])
                el.id = mp.id.toString()
                return el
            });

            // marginpar on the right - TODO: is there any configuration possible to select which margin?
            // HtmlElements.marginPar("margin-left")
            f.append(this.create(HtmlElements.marginPar("margin-right"),
                                 this.create(HtmlElements.block, marginPars, "marginpar")));
        }

        return f;
    }


    /* write the TeX lengths and page geometry to the DOM */
    applyLengthsAndGeometryToDom(el: HTMLElement): void
    {
        // root font size
        // Note: constructor access might require casting or fallback depending on base class setup
        const sizeKey = (this.constructor as any).size;
        el.style.setProperty('--size', this.length(sizeKey).value);

        ///// calculate page geometry
        //
        // set body's and margins' width to percentage of viewport (= paperwidth)
        //
        // we cannot distinguish between even/oddsidemargin - currently, only oddsidemargin is used
        //
        // textwidth percent  = textwidth px/paperwidth px
        // marginleftwidth  % = (oddsidemargin px + toPx(1in))/paperwidth px
        // marginrightwidth % = 100% - (textwidth + marginleftwidth), if there is no room left, the margin is 0% width

        // do this if a static, non-responsive page is desired (TODO: make configurable!)
        //el.style.setProperty('--paperwidth', this.length('paperwidth').value)

        const twp = 100 * this.length('textwidth').ratio(this.length('paperwidth'));
        const mlwp = 100 * this.length('oddsidemargin').add(new (this as any).Length(1, "in")).ratio(this.length('paperwidth'));
        const mrwp = Math.max(100 - twp - mlwp, 0);

        el.style.setProperty('--textwidth', this.round(twp) + "%");
        el.style.setProperty('--marginleftwidth', this.round(mlwp) + "%");
        el.style.setProperty('--marginrightwidth', this.round(mrwp) + "%");

        if (mrwp > 0) {
            // marginparwidth percentage relative to parent, which is marginrightwidth!
            const mpwp = 100 * 100 * this.length('marginparwidth').ratio(this.length('paperwidth')) / mrwp;
            el.style.setProperty('--marginparwidth', this.round(mpwp) + "%");
        } else {
            el.style.setProperty('--marginparwidth', "0px");
        }

        // set the rest of the lengths (TODO: write all defined lengths to CSS, for each group)
        el.style.setProperty('--marginparsep', this.length('marginparsep').value);
        el.style.setProperty('--marginparpush', this.length('marginparpush').value);
    }


    ////// document creation

    // TODO fs is paragraphs array
    createDocument(fs: any): void
    {
        if (this.#dom)
            appendChildren(this.#dom, fs);
    }

    ////// element creation

    // type: string or function/element factory
    // children: an Element or an array of Element
    create(type: string|(() => HTMLElement),
           children?: Node | Node[] | null,
           classes: string = ""): HTMLElement
    {
        let el: HTMLElement;
        if (typeof type === "function") {
            el = type();
            if (el.hasAttribute("class"))
                classes = el.getAttribute("class") + " " + classes;
        } else {
            el = document.createElement(type);
        }

        if (this.alignment())
            classes += " " + this.alignment();

        // if continue then do not add parindent or parskip, we are not supposed to start a new paragraph
        if (this._continue && this.location().end.offset > this._continue) {
            classes = classes + " continue";
            this.break();
        }

        if (classes.trim())
            el.setAttribute("class", classes.replace(/\s+/g, ' ').trim());

        appendChildren(el, children);
        return el;
    }


    // create a text node that has font attributes set and allows for hyphenation
    createText(t: string): any
    {
        if (!t) return;
        return this.addAttributes(document.createTextNode(this.#h ? this.#h.hyphenateText(t) : t));
    }

    // create a pure text node without font attributes and no hyphenation
    createVerbatim(t: string): Text | undefined
    {
        if (!t) return;
        return document.createTextNode(t);
    }

    // create a fragment; arguments may be Node(s) and/or arrays of Node(s)
    createFragment(...args: (Node|Node[])[]): DocumentFragment | Node | undefined
    {
        const children = compact(flattenDeep(args));

        // only create an empty fragment if explicitely requested: no arguments given
        if (args.length > 0 && (!children || !children.length))
            return;

        // don't wrap a single node
        if (children.length === 1 && children[0] && (children[0] as Node).nodeType)
            return children[0];

        const f = document.createDocumentFragment();
        appendChildren(f, children);
        return f;
    }

    createImage(width: number, height: number, url: string): HTMLElement
    {
        return this.create(HtmlElements.image(width, height, url));
    }


    createPicture(size: Vector, content: any, offset?: Vector): HTMLElement
    {
        // canvas
        const canvas = this.create(HtmlElements.pictureCanvas); // TODO: this might add CSS classes... ok?
        appendChildren(canvas, content);

        // offset sets the coordinates of the lower left corner, so shift negatively
        if (offset)
            canvas.setAttribute("style", `left:${offset.x.mul(-1).value};bottom:${offset.y.mul(-1).value}`);

        // picture
        const pic = this.create(HtmlElements.picture);
        pic.appendChild(canvas);
        pic.setAttribute("style", `width:${size.x.value};height:${size.y.value}`);

        return pic;
    }

    createVSpaceSkip(skip: "smallskip"|"medskip"|"bigskip"): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("class", "vspace " + skip);
        return span;
    }

    createVSpaceSkipInline(skip: "smallskip"|"medskip"|"bigskip"): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("class", "vspace-inline " + skip);
        return span;
    }

    createVSpace(length: Length): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("class", "vspace");
        span.setAttribute("style", "margin-bottom:" + length.value);
        return span;
    }

    createVSpaceInline(length: Length): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("class", "vspace-inline");
        span.setAttribute("style", "margin-bottom:" + length.value);
        return span;
    }


    // create a linebreak with a given vspace between the lines
    createBreakSpace(length: Length): Node
    {
        const span = document.createElement("span");
        span.setAttribute("class", "breakspace");
        span.setAttribute("style", "margin-bottom:" + length.value);
        // we need to add the current font in case it uses a relative length (e.g. em)
        return this.addAttributes(span);
    }

    createHSpace(length: Length): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("style", "margin-right:" + length.value);
        return span;
    }

    // return HTMLElement instead?
    parseMath(math: string, display: boolean): DocumentFragment
    {
        const f = document.createDocumentFragment();
        const el = document.createElement("div");
        katex.render(math, el, {
            displayMode: display,
            throwOnError: false
        });
        f.append(el);
        return f;
    }



    //// attributes and nodes/elements

    // add the given attribute(s) to a single element
    addAttribute(el: HTMLElement, attrs: string): void
    {
        if (el.hasAttribute("class"))
            attrs = el.getAttribute("class") + " " + attrs;

        el.setAttribute("class", attrs);
    }

    hasAttribute(el: HTMLElement, attr: string): boolean
    {
        const classAttr = el.getAttribute("class");
        if (!el.hasAttribute("class") || !classAttr)
            return false;

        const regex = new RegExp(`\\b${attr}\\b`);
        return regex.test(classAttr);
    }


    // This wraps the current attribute values around the given element or array of elements
    addAttributes(node: Node): Node
    addAttributes(nodes: Node[]): Node[]
    addAttributes(nodes: Node|Node[]): Node|Node[]
    {
        const attrs = this._inlineAttributes();
        if (!attrs)
            return nodes;

        if (nodes instanceof window.Element) {
            // Must reference the static method through the Class name
            if (isBlockLevel(nodes as HTMLElement))
                return this.create(HtmlElements.block, nodes, attrs);

            return this.create(HtmlElements.inline, nodes, attrs);
        } else if (nodes instanceof window.Text || nodes instanceof window.DocumentFragment) {
            return this.create(HtmlElements.inline, nodes, attrs);
        } else if (Array.isArray(nodes)) {
            // Using an arrow function here safely binds 'this' context lexically
            return nodes.map((node) => this.create(HtmlElements.inline, node, attrs));
        } else {
            console.warn("addAttributes got an unknown/unsupported argument:", nodes);
        }

        return nodes;
    }
}