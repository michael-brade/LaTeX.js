import { Generator, Elements, isElementKind, type ElementKind } from '../generator.ts';

import { HtmlElements, HtmlFactories, type HtmlElementFactory } from './elements.ts';

import type { HtmlOptions } from '../../options.ts';
import type { CurrentLabel } from '../references.ts';
import type { MarginPar } from '../floats.ts';

// import { SVG } from '@svgdotjs/svg.js';
import katex from 'katex';

import { flattenDeep, compact } from 'lodash';

import Hypher from 'hypher';
import hEn from 'hyphenation.en-us';
import { Length, type Vector } from '../../types.ts';


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



export class HtmlGenerator extends Generator<Node>
{
    #dom = document.createDocumentFragment();
    #h;

    // in this class _options is extended
    declare _options: HtmlOptions;

    // narrow marginPars to Node
    declare marginPars: MarginPar<Node>[];


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

    // plain text content of a node, e.g. for the document title
    override plainText(node: Node): string
    {
        return node?.textContent ?? "";
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

        // all URLs are absolute if a base URL is given, otherwise relative
        const url = (u: string) => baseURL ? new URL(u, baseURL).toString() : u;

        el.appendChild(createStyleSheet(url("css/katex.css")));

        // the stylesheet of the documentclass (a static property of its class)
        const documentClassCss = typeof this.documentClass === "object"
            ? (this.documentClass.constructor as { css?: string }).css
            : undefined;

        if (documentClassCss)
            el.appendChild(createStyleSheet(url(documentClassCss)));

        for (const style of this.options.styles)
            el.appendChild(createStyleSheet(url(style)));

        el.appendChild(createScript(url("js/base.js")));

        return el;
    }


    /* @return DocumentFragment, the full page without stylesheets or scripts */
    domFragment(): DocumentFragment
    {
        const f = document.createDocumentFragment();

        // text body
        f.append(this.create(Elements.block, this.#dom, "body"));


        if (this.marginPars && this.marginPars.length) {
            const marginPars = this.marginPars.map(mp => {
                const el = this.create(Elements.block, [
                    this.create(Elements.inline, null, "mpbaseline"),
                    mp.content
                ])
                el.id = mp.id.toString()
                return el
            });

            // marginpar on the right - TODO: is there any configuration possible to select which margin?
            // HtmlFactories.marginPar("margin-left")
            f.append(this.createElement(HtmlFactories.marginPar("margin-right"),
                                        this.create(Elements.block, marginPars, "marginpar")));
        }

        return f;
    }


    /* write the TeX lengths and page geometry to the DOM */
    applyLengthsAndGeometryToDom(el: HTMLElement): void
    {
        // root font size
        el.style.setProperty('--size', this.length("@@size").value);

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
        const mlwp = 100 * this.length('oddsidemargin').add(new Length(this, 1, "in")).ratio(this.length('paperwidth'));
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
    override createDocument(fs: any): void
    {
        if (this.#dom)
            appendChildren(this.#dom, fs);
    }

    ////// element creation

    // create an element of the given generic kind
    override create(kind: ElementKind, children?: Node | Node[] | null, classes: string = ""): HTMLElement
    {
        // callers in untyped code (grammar, LiveScript macros) are not checked at compile time
        if (!isElementKind(kind))
            this.error(`unknown element kind: ${String(kind)}`);

        return this.createElement(HtmlElements[kind], children, classes);
    }

    override setId(node: HTMLElement, id: string): void
    {
        node.id = id;
    }

    // create an element using a tag name or an element factory
    // adds the current alignment and continuation classes
    // children: a Node or an array of Nodes
    protected createElement(type: HtmlElementFactory,
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
    override createText(t: string): any
    {
        if (!t) return;
        return this.addAttributes(document.createTextNode(this.#h ? this.#h.hyphenateText(t) : t));
    }

    // create a pure text node without font attributes and no hyphenation
    override createVerbatim(t: string): Text | undefined
    {
        if (!t) return;
        return document.createTextNode(t);
    }

    // create a fragment; arguments may be Node(s) and/or arrays of Node(s)
    override createFragment(...args: (Node|Node[])[]): DocumentFragment | Node | undefined
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

    override createImage(width: number, height: number, url: string): HTMLElement
    {
        return this.createElement(HtmlFactories.image(width, height, url));
    }

    override createLink(url?: string, children?: Node | Node[] | null): HTMLElement
    {
        return this.createElement(HtmlFactories.link(url), children);
    }

    override createMulticols(cols: number): HTMLElement
    {
        return this.createElement(HtmlFactories.multicols(cols));
    }


    override createPicture(size: Vector, content: any, offset?: Vector): HTMLElement
    {
        // canvas
        const canvas = this.createElement(HtmlFactories.pictureCanvas); // TODO: this might add CSS classes... ok?
        appendChildren(canvas, content);

        // offset sets the coordinates of the lower left corner, so shift negatively
        if (offset)
            canvas.setAttribute("style", `left:${offset.x.mul(-1).value};bottom:${offset.y.mul(-1).value}`);

        // picture
        const pic = this.createElement(HtmlFactories.picture);
        pic.appendChild(canvas);
        pic.setAttribute("style", `width:${size.x.value};height:${size.y.value}`);

        return pic;
    }

    override createVSpaceSkip(skip: "smallskip"|"medskip"|"bigskip"): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("class", "vspace " + skip);
        return span;
    }

    override createVSpaceSkipInline(skip: "smallskip"|"medskip"|"bigskip"): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("class", "vspace-inline " + skip);
        return span;
    }

    override createVSpace(length: Length): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("class", "vspace");
        span.setAttribute("style", "margin-bottom:" + length.value);
        return span;
    }

    override createVSpaceInline(length: Length): HTMLElement
    {
        const span = document.createElement("span");
        span.setAttribute("class", "vspace-inline");
        span.setAttribute("style", "margin-bottom:" + length.value);
        return span;
    }


    // create a linebreak with a given vspace between the lines
    override createBreakSpace(length: Length): Node
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
    override parseMath(math: string, display: boolean): DocumentFragment
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

    override theLength(id: string): HTMLElement
    {
        let l = this.create(Elements.inline, undefined, "the");
        l.setAttribute("display-var", id);
        return l
    }

    //// references

    override createAnchor(id: string): HTMLElement
    {
        return this.createElement(HtmlFactories.anchor(id));
    }

    override createReference(label?: CurrentLabel): HTMLElement
    {
        if (label)
            return this.createLink("#" + label.id, (label.label as Node).cloneNode(true));

        return this.createLink("#", this.createText("??"));
    }

    override fillReference(ref: HTMLElement, label: CurrentLabel): void
    {
        ref.replaceChildren((label.label as Node).cloneNode(true));
        ref.setAttribute("href", "#" + label.id);
    }


    //// floats

    override createMarginParRef(id: number): HTMLElement
    {
        const el = this.create(Elements.inline, null, "mpbaseline");
        el.id = "marginref-" + id;
        return el;
    }


    //// attributes and nodes/elements

    // add the given attribute(s) to a single element
    // TODO: unused
    addAttribute(el: HTMLElement, attrs: string): void
    {
        if (el.hasAttribute("class"))
            attrs = el.getAttribute("class") + " " + attrs;

        el.setAttribute("class", attrs);
    }

    // TODO: unused
    hasAttribute(el: HTMLElement, attr: string): boolean
    {
        const classAttr = el.getAttribute("class");
        if (!el.hasAttribute("class") || !classAttr)
            return false;

        const regex = new RegExp(`\\b${attr}\\b`);
        return regex.test(classAttr);
    }


    // This wraps the current attribute values around the given element or array of elements
    override addAttributes(node: Node): Node
    override addAttributes(nodes: Node[]): Node[]
    override addAttributes(nodes: Node|Node[]): Node|Node[]
    {
        const attrs = this._inlineAttributes();
        if (!attrs)
            return nodes;

        if (nodes instanceof window.Element) {
            // Must reference the static method through the Class name
            if (isBlockLevel(nodes as HTMLElement))
                return this.create(Elements.block, nodes, attrs);

            return this.create(Elements.inline, nodes, attrs);
        } else if (nodes instanceof window.Text || nodes instanceof window.DocumentFragment) {
            return this.create(Elements.inline, nodes, attrs);
        } else if (Array.isArray(nodes)) {
            // Using an arrow function here safely binds 'this' context lexically
            return nodes.map((node) => this.create(Elements.inline, node, attrs));
        } else {
            console.warn("addAttributes got an unknown/unsupported argument:", nodes);
        }

        return nodes;
    }
}