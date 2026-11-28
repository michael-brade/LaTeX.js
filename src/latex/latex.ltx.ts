import type { HtmlGenerator } from "../generator/html/generator.ts"

import { Elements } from "../generator/generator.ts"
import { Args, Macro, type MacroArgs, type MacroMode } from "../macros.ts"
import type { PackageOpts } from "../options.ts"
import { Length, Vector } from "../types.ts"

import { symbols } from "./symbols.ts"


// this LaTeX implementation already covers these packages
const providedPackages = [
    "calc",
    "pspicture",
    "picture",
    "pict2e",
    "keyval",
    "comment"
];

// the formatter for \today, created once: creating an Intl formatter is slow (about a millisecond)
const todayFormat = new Intl.DateTimeFormat("en", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
});


/** an item of itemize or description: the optional label and the content */
interface Item
{
    label: unknown
    size: string | undefined
    text: unknown
}

/** an item of enumerate: the label node, with the id of its anchor if it is numbered */
interface EnumItem
{
    label: { id?: string, node: unknown }
    size: string | undefined
    text: unknown
}

/** a rectangle in picture coordinates */
interface Rect
{
    x: Length
    y: Length
    w: Length
    h: Length
}


/**
 * This is where most macros are defined. This file is like base/latex.ltx in LaTeX.
 *
 * By default, a macro takes no arguments and is a horizontal-mode macro; mode and arguments are declared with
 * the @Macro and @Args decorators (see macros.ts). A macro must return an array with elements of type Node or
 * string (text), or nothing if it only changes state.
 *
 * State is held in the generator, this class is immutable. When macros are defined/changed, those are added
 * in the generator.
 *
 * TODO: the picture and box macros depend on the HtmlGenerator (SVG, style and class attributes); the rest
 * only needs the generator interface.
 */
export class LaTeX
{
    public g: HtmlGenerator;

    public static symbols = symbols;

    // macros handled by the parser: declared here so that their mode and arguments are known
    public static args: Record<string, [MacroMode, ...MacroArgs]> = {
        par:        [ "V" ],
        item:       [ "V" ],
        dashbox:    [ "H", "cl", "v", "i?", "g" ],       // \dashbox{dashlen}(width,height)[pos]{text}  TODO
    };


    constructor(generator: HtmlGenerator, options?: PackageOpts)
    {
        this.g = generator;

        this.g.newCounter("secnumdepth");
        this.g.newCounter("tocdepth");

        this.g.newCounter("footnote");
        this.g.newCounter("mpfootnote");

        this.g.newCounter("@listdepth");
        this.g.newCounter("@itemdepth");
        this.g.newCounter("@enumdepth");

        this.g.newCounter("enumi");
        this.g.newCounter("enumii");
        this.g.newCounter("enumiii");
        this.g.newCounter("enumiv");


        this.g.newLength("@@size");         // root font size

        // picture lengths
        this.g.newLength("unitlength");
        this.g.setLength("unitlength",  new Length(this.g, 1, "pt"));

        this.g.newLength("@wholewidth");
        this.g.setLength("@wholewidth", new Length(this.g, 0.4, "pt"));

        this.g.newLength("paperheight");
        this.g.newLength("paperwidth");

        this.g.newLength("oddsidemargin");
        this.g.newLength("evensidemargin");

        this.g.newLength("textheight");
        this.g.newLength("textwidth");

        this.g.newLength("marginparwidth");
        this.g.newLength("marginparsep");
        this.g.newLength("marginparpush");

        this.g.newLength("columnwidth");
        this.g.newLength("columnsep");
        this.g.newLength("columnseprule");

        this.g.newLength("linewidth");

        this.g.newLength("leftmargin");
        this.g.newLength("rightmargin");
        this.g.newLength("listparindent");
        this.g.newLength("itemindent");
        this.g.newLength("labelwidth");
        this.g.newLength("labelsep");

        this.g.newLength("leftmargini");
        this.g.newLength("leftmarginii");
        this.g.newLength("leftmarginiii");
        this.g.newLength("leftmarginiv");
        this.g.newLength("leftmarginv");
        this.g.newLength("leftmarginvi");

        this.g.newLength("fboxrule");
        this.g.newLength("fboxsep");

        this.g.newLength("tabbingsep");
        this.g.newLength("arraycolsep");
        this.g.newLength("tabcolsep");
        this.g.newLength("arrayrulewidth");
        this.g.newLength("doublerulesep");
        this.g.newLength("footnotesep");
        this.g.newLength("topmargin");
        this.g.newLength("headheight");
        this.g.newLength("headsep");
        this.g.newLength("footskip");

        this.g.newLength("topsep");
        this.g.newLength("partopsep");
        this.g.newLength("itemsep");
        this.g.newLength("parsep");
        this.g.newLength("floatsep");
        this.g.newLength("textfloatsep");
        this.g.newLength("intextsep");
        this.g.newLength("dblfloatsep");
        this.g.newLength("dbltextfloatsep");

        Object.freeze(this);
    }


    @Macro("HV")
    empty() {}


    TeX()
    {
        // <span class="tex">T<span>e</span>X</span>
        this.g.enterGroup();    // prevent createText to add attributes, they will be added by g.macro

        const tex = this.g.create(Elements.inline);
        tex.setAttribute("class", "tex");

        tex.appendChild(this.g.createText("T"));
        tex.appendChild(this.g.create(Elements.inline, this.g.createText("e"), "e"));
        tex.appendChild(this.g.createText("X"));

        this.g.exitGroup();

        return [ tex ];
    }

    LaTeX()
    {
        // <span class="latex">L<span>a</span>T<span>e</span>X</span>
        this.g.enterGroup();

        const latex = this.g.create(Elements.inline);
        latex.setAttribute("class", "latex");

        latex.appendChild(this.g.createText("L"));
        latex.appendChild(this.g.create(Elements.inline, this.g.createText("a"), "a"));
        latex.appendChild(this.g.createText("T"));
        latex.appendChild(this.g.create(Elements.inline, this.g.createText("e"), "e"));
        latex.appendChild(this.g.createText("X"));

        this.g.exitGroup();

        return [ latex ];
    }


    today()             { return [ todayFormat.format(new Date()) ]; }

    newline()           { return [ this.g.create(Elements.linebreak) ]; }

    negthinspace()      { return [ this.g.create(Elements.inline, undefined, "negthinspace") ]; }


    // switch to onecolumn layout from now on
    @Macro("V")
    onecolumn() {}

    // switch to twocolumn layout from now on
    @Macro("V")
    @Args("o?")
    twocolumn(_opt?: unknown) {}


    // spacing

    @Macro("V")
    smallbreak()        { return [ this.g.createVSpaceSkip("smallskip") ]; }

    @Macro("V")
    medbreak()          { return [ this.g.createVSpaceSkip("medskip") ]; }

    @Macro("V")
    bigbreak()          { return [ this.g.createVSpaceSkip("bigskip") ]; }

    @Macro("V")
    @Args("l")
    addvspace(l: Length) { return [ this.g.createVSpace(l) ]; }       // TODO not correct?


    @Macro("H")
    @Args("g")
    marginpar(txt: unknown) { return [ this.g.marginpar(txt) ]; }


    ///////////
    // titling
    ///////////

    abstractname()      { return [ "Abstract" ]; }


    @Macro("HV")
    @Args("g")
    title(t: unknown)   { this.g._title = t; }

    @Macro("HV")
    @Args("g")
    author(a: unknown)  { this.g._author = a; }

    @Macro("HV")
    @Args("g")
    date(d: unknown)    { this.g._date = d; }

    @Macro("H")
    and()               { return this.g.macro("quad"); }

    @Macro("HV")
    @Args("g")
    thanks(_text: unknown) { this.g.error("\\thanks is not implemented yet (it needs \\footnote)"); }       // TODO



    ///////////////
    // font macros
    ///////////////

    // commands

    /**
     * A font command \textXX{text} is declared "X g", so it is called twice: first without arguments, before
     * the text is parsed; then it opens a group and sets the font. Then with the parsed text; then it wraps
     * the text with the attributes of the group and closes the group.
     */
    private _fontCommand(args: unknown[], setFont: () => void)
    {
        if (args.length === 0) {
            this.g.enterGroup();
            setFont();
            return;
        }

        const text = this.g.addAttributes(args[0] as Node);
        this.g.exitGroup();
        return [ text ];
    }

    @Macro("H") @Args("X", "g")
    textrm(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontFamily("rm")); }

    @Macro("H") @Args("X", "g")
    textsf(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontFamily("sf")); }

    @Macro("H") @Args("X", "g")
    texttt(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontFamily("tt")); }

    @Macro("H") @Args("X", "g")
    textmd(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontWeight("md")); }

    @Macro("H") @Args("X", "g")
    textbf(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontWeight("bf")); }

    @Macro("H") @Args("X", "g")
    textup(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontShape("up")); }

    @Macro("H") @Args("X", "g")
    textit(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontShape("it")); }

    @Macro("H") @Args("X", "g")
    textsl(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontShape("sl")); }

    @Macro("H") @Args("X", "g")
    textsc(...args: unknown[])      { return this._fontCommand(args, () => this.g.setFontShape("sc")); }

    @Macro("H") @Args("X", "g")
    textnormal(...args: unknown[])  { return this._fontCommand(args, () => this.normalfont()); }

    @Macro("H") @Args("X", "g")
    emph(...args: unknown[])        { return this._fontCommand(args, () => this.g.setFontShape("em")); }


    // declarations

    @Macro("HV") rmfamily()         { this.g.setFontFamily("rm"); }
    @Macro("HV") sffamily()         { this.g.setFontFamily("sf"); }
    @Macro("HV") ttfamily()         { this.g.setFontFamily("tt"); }

    @Macro("HV") mdseries()         { this.g.setFontWeight("md"); }
    @Macro("HV") bfseries()         { this.g.setFontWeight("bf"); }

    @Macro("HV") upshape()          { this.g.setFontShape("up"); }
    @Macro("HV") itshape()          { this.g.setFontShape("it"); }
    @Macro("HV") slshape()          { this.g.setFontShape("sl"); }
    @Macro("HV") scshape()          { this.g.setFontShape("sc"); }

    @Macro("HV") normalfont()       { this.g.setFontFamily("rm"); this.g.setFontWeight("md"); this.g.setFontShape("up"); }

    @Macro("HV") em()               { this.g.setFontShape("em"); }

    @Macro("HV") tiny()             { this.g.setFontSize("tiny"); }
    @Macro("HV") scriptsize()       { this.g.setFontSize("scriptsize"); }
    @Macro("HV") footnotesize()     { this.g.setFontSize("footnotesize"); }
    @Macro("HV") small()            { this.g.setFontSize("small"); }
    @Macro("HV") normalsize()       { this.g.setFontSize("normalsize"); }
    @Macro("HV") large()            { this.g.setFontSize("large"); }
    @Macro("HV") Large()            { this.g.setFontSize("Large"); }
    @Macro("HV") LARGE()            { this.g.setFontSize("LARGE"); }
    @Macro("HV") huge()             { this.g.setFontSize("huge"); }
    @Macro("HV") Huge()             { this.g.setFontSize("Huge"); }



    ////////////////
    // environments
    ////////////////

    // enumerate

    theenumi()          { return [ this.g.arabic(this.g.counter("enumi")) ]; }
    theenumii()         { return [ this.g.alph(this.g.counter("enumii")) ]; }
    theenumiii()        { return [ this.g.roman(this.g.counter("enumiii")) ]; }
    theenumiv()         { return [ this.g.Alph(this.g.counter("enumiv")) ]; }

    labelenumi()        { return [ ...this.theenumi(), "." ]; }
    labelenumii()       { return [ "(", ...this.theenumii(), ")" ]; }
    labelenumiii()      { return [ ...this.theenumiii(), "." ]; }
    labelenumiv()       { return [ ...this.theenumiv(), "." ]; }

    "p@enumii"()        { return this.theenumi(); }
    "p@enumiii"()       { return [ ...this.theenumi(), "(", ...this.theenumii(), ")" ]; }
    "p@enumiv"()        { return [ ...this["p@enumiii"](), ...this.theenumiii() ]; }

    // itemize

    labelitemi()        { return [ this.g.symbol("textbullet") ]; }
    labelitemii()       { this.normalfont(); this.bfseries(); return [ this.g.symbol("textendash") ]; }
    labelitemiii()      { return [ this.g.symbol("textasteriskcentered") ]; }
    labelitemiv()       { return [ this.g.symbol("textperiodcentered") ]; }



    // TODO: LaTeX doesn't allow hyphenation in alignment, but with e.g. \RaggedRight, it does. (package ragged2e)

    // alignment

    @Macro("HV") centering()        { this.g.setAlignment("centering"); }
    @Macro("HV") raggedright()      { this.g.setAlignment("raggedright"); }
    @Macro("HV") raggedleft()       { this.g.setAlignment("raggedleft"); }


    // list helpers (not macros): every list environment starts and ends with these

    private _startlist()
    {
        this.g.stepCounter("@listdepth");
        if (this.g.counter("@listdepth") > 6)
            this.g.error("too deeply nested");
    }

    private _endlist()
    {
        this.g.setCounter("@listdepth", this.g.counter("@listdepth") - 1);
        this.g.continue();
    }


    // alignment environments using a list:  flushleft, flushright, center

    @Macro("V") center()        { this._startlist(); return [ this.g.create(Elements.list, null, "center") ]; }
    endcenter()                 { this._endlist(); }

    @Macro("V") flushleft()     { this._startlist(); return [ this.g.create(Elements.list, null, "flushleft") ]; }
    endflushleft()              { this._endlist(); }

    @Macro("V") flushright()    { this._startlist(); return [ this.g.create(Elements.list, null, "flushright") ]; }
    endflushright()             { this._endlist(); }


    // titling

    @Macro("V") titlepage()     { return [ this.g.create(Elements.titlepage) ]; }


    // quote, quotation, verse

    @Macro("V") quote()         { this._startlist(); return [ this.g.create(Elements.quote) ]; }
    endquote()                  { this._endlist(); }

    @Macro("V") quotation()     { this._startlist(); return [ this.g.create(Elements.quotation) ]; }
    endquotation()              { this._endlist(); }

    @Macro("V") verse()         { this._startlist(); return [ this.g.create(Elements.verse) ]; }
    endverse()                  { this._endlist(); }


    // lists: itemize, enumerate, description

    // declared "X items": called first before the items are parsed (to start the list), then with the items
    @Macro("V")
    @Args("X", "items")
    itemize(...args: [Item[]] | [])
    {
        if (args.length === 0) {
            this._startlist();
            this.g.stepCounter("@itemdepth");
            if (this.g.counter("@itemdepth") > 4)
                this.g.error("too deeply nested");
            return;
        }

        const label = "labelitem" + this.g.roman(this.g.counter("@itemdepth"));

        return [
            this.g.create(Elements.unorderedList, args[0].map(item => {
                this.g.enterGroup();
                // label: null means no opt_group was given (\item ...), undefined is an empty one (\item[] ...)
                const makelabel = this.g.create(Elements.itemlabel,
                                                this.llap(item.label !== null ? item.label : this.g.macro(label)),
                                                item.size);
                this.g.exitGroup();

                return this.g.create(Elements.listitem, [ makelabel, item.text as Node ]);
            }))
        ];
    }

    enditemize()
    {
        this._endlist();
        this.g.setCounter("@itemdepth", this.g.counter("@itemdepth") - 1);
    }


    @Macro("V")
    @Args("X", "enumitems")
    enumerate(...args: [EnumItem[]] | [])
    {
        if (args.length === 0) {
            this._startlist();
            this.g.stepCounter("@enumdepth");
            if (this.g.counter("@enumdepth") > 4)
                this.g.error("too deeply nested");
            return;
        }

        const itemCounter = "enum" + this.g.roman(this.g.counter("@enumdepth"));
        this.g.setCounter(itemCounter, 0);

        return [
            this.g.create(Elements.orderedList, args[0].map(item => {
                const label = this.g.create(Elements.inline, item.label.node as Node);
                if (item.label.id)
                    this.g.setId(label, item.label.id);

                const makelabel = this.g.create(Elements.itemlabel, this.llap(label), item.size);
                return this.g.create(Elements.listitem, [ makelabel, item.text as Node ]);
            }))
        ];
    }

    endenumerate()
    {
        this._endlist();
        this.g.setCounter("@enumdepth", this.g.counter("@enumdepth") - 1);
    }


    @Macro("V")
    @Args("X", "items")
    description(...args: [Item[]] | [])
    {
        if (args.length === 0) {
            this._startlist();
            return;
        }

        return [
            this.g.create(Elements.descriptionList, args[0].map(item => {
                const dt = this.g.create(Elements.term, item.label as Node, item.size);
                const dd = this.g.create(Elements.description, item.text as Node);
                return this.g.createFragment([ dt, dd ]) as Node;
            }))
        ];
    }

    enddescription()            { this._endlist(); }


    // picture

    // \begin{picture}(width,height)(xoffset,yoffset)
    @Macro("H")
    @Args("v", "v?", "h")
    picture(size: Vector, offset: Vector | undefined, content: unknown)
    {
        // TODO: rule for picture content??? LaTeX allows anything, Lamport says: HV macros and picture commands
        return [ this.g.createPicture(size, content, offset) ];
    }



    ///////////////

    // horizontal spacing
    @Macro("H")
    @Args("s", "l")
    hspace(_s: boolean, l: Length)  { return [ this.g.createHSpace(l) ]; }

    // stretch     arg_group
    //
    // hfill           = \hspace{\fill}
    // dotfill         =
    // hrulefill       =


    // label, ref

    @Macro("HV")
    @Args("r")
    label(label: string)    { this.g.setLabel(label); }

    @Macro("H")
    @Args("r")
    ref(label: string)      { return [ this.g.ref(label) ]; }



    /////////
    // boxes
    /////////

    //// hboxes

    // lowlevel macros...  TODO: not true, these should be usable in V-mode as well, they don't \leavevmode :(

    @Macro("H") @Args("hg")
    llap(txt: unknown)      { return [ this.g.create(Elements.inline, txt as Node, "hbox llap") ]; }

    @Macro("H") @Args("hg")
    rlap(txt: unknown)      { return [ this.g.create(Elements.inline, txt as Node, "hbox rlap") ]; }

    @Macro("H") @Args("hg")
    clap(txt: unknown)      { return [ this.g.create(Elements.inline, txt as Node, "hbox clap") ]; }

    @Macro("H") @Args("hg")
    smash(txt: unknown)     { return [ this.g.create(Elements.inline, txt as Node, "hbox smash") ]; }

    @Macro("H") @Args("hg")
    hphantom(txt: unknown)  { return [ this.g.create(Elements.inline, txt as Node, "phantom hbox smash") ]; }

    @Macro("H") @Args("hg")
    vphantom(txt: unknown)  { return [ this.g.create(Elements.inline, txt as Node, "phantom hbox rlap") ]; }

    @Macro("H") @Args("hg")
    phantom(txt: unknown)   { return [ this.g.create(Elements.inline, txt as Node, "phantom hbox") ]; }


    // LaTeX

    @Macro("H") @Args("hg")
    underline(txt: unknown) { return [ this.g.create(Elements.inline, txt as Node, "hbox underline") ]; }


    // \mbox{text} - not broken into lines
    @Macro("H")
    @Args("hg")
    mbox(txt: unknown)      { return this.makebox(undefined, undefined, undefined, txt); }


    // \makebox[0pt][r]{...} behaves like \leavevmode\llap{...}
    // \makebox[0pt][l]{...} behaves like \leavevmode\rlap{...}
    // \makebox[0pt][c]{...} behaves like \leavevmode\clap{...}

    // \makebox[width][position]{text}
    //   position: c,l,r,s (default = c)
    // \makebox(width,height)[position]{text}
    //   position: c,l,r,s (default = c) and t,b or combinations of the two
    @Macro("H")
    @Args("v?", "l?", "i?", "hg")
    makebox(vec: Vector | undefined, width: Length | undefined, pos: string | undefined, txt: unknown)
    {
        if (vec) {
            // picture version TODO
            if (width && pos)
                this.g.error("expected \\makebox(width,height)[position]{text} but got two optional arguments!");

            return [ txt ];
        }

        // normal makebox
        return this._box(width, pos, txt, "hbox");
    }


    // \fbox{text}
    // \framebox[width][position]{text}
    //   position: c,l,r,s
    //
    // these add \fboxsep (default ‘3pt’) padding to "text" and draw a frame with linewidth \fboxrule (default ‘.4pt’)
    //
    // \framebox(width,height)[position]{text}
    //   position: t,b,l,r (one or two)
    // this one uses the picture line thickness
    @Macro("H")
    @Args("hg")
    fbox(txt: unknown)      { return this.framebox(undefined, undefined, undefined, txt); }

    @Macro("H")
    @Args("v?", "l?", "i?", "hg")
    framebox(vec: Vector | undefined, width: Length | undefined, pos: string | undefined, txt: unknown)
    {
        if (vec) {
            // picture version TODO
            if (width && pos)
                this.g.error("expected \\framebox(width,height)[position]{text} but got two optional arguments!");

            return;
        }

        // normal framebox
        // add the frame if it is a simple node, otherwise create a new box
        const el = txt as HTMLElement;
        if (typeof el?.hasAttribute === "function" && !width && !pos && !this.g.hasAttribute(el, "frame")) {
            this.g.addAttribute(el, "frame");
            return [ el ];
        }

        return this._box(width, pos, txt, "hbox frame");
    }


    // helper for mbox, fbox, makebox, framebox
    private _box(width: Length | undefined, pos: string | undefined, txt: unknown, classes: string)
    {
        if (width) {
            switch (pos ?? "c") {
                case "s": classes += " stretch"; break;        // this.g.error("position 's' (stretch) is not supported for text!")
                case "c": classes += " clap"; break;
                case "l": classes += " rlap"; break;
                case "r": classes += " llap"; break;
                default:  this.g.error(`unknown position: ${pos}`);
            }
        }

        const content = this.g.create(Elements.inline, txt as Node);
        const box = this.g.create(Elements.inline, content, classes);

        if (width)
            box.setAttribute("style", `width:${width.value}`);

        return [ box ];
    }



    // \raisebox{distance}[height][depth]{text}

    // \rule[raise]{width}{height}


    // \newsavebox{\name}
    // \savebox{\boxcmd}[width][pos]{text}
    // \sbox{\boxcmd}{text}
    // \usebox{\boxcmd}

    // \begin{lrbox}{\boxcmd}
    //   text
    // \end{lrbox}



    //// parboxes

    // \parbox[pos][height][inner-pos]{width}{text}
    //  pos: c,t,b
    //  inner-pos: t,c,b,s (or pos if not given)
    @Macro("H")
    @Args("i?", "l?", "i?", "l", "g")
    parbox(pos: string | undefined, height: Length | undefined, innerPos: string | undefined, width: Length, txt: unknown)
    {
        pos ??= "c";
        innerPos ??= pos;

        let classes = "parbox";
        let style = `width:${width.value};`;

        if (height) {
            classes += " pbh";
            style += `height:${height.value};`;
        }

        switch (pos) {
            case "c": classes += " p-c"; break;
            case "t": classes += " p-t"; break;
            case "b": classes += " p-b"; break;
            default:  this.g.error(`unknown position: ${pos}`);
        }

        switch (innerPos) {
            case "s": classes += " stretch"; break;
            case "c": classes += " p-cc"; break;
            case "t": classes += " p-ct"; break;
            case "b": classes += " p-cb"; break;
            default:  this.g.error(`unknown inner-pos: ${innerPos}`);
        }

        const content = this.g.create(Elements.inline, txt as Node);
        const box = this.g.create(Elements.inline, content, classes);

        box.setAttribute("style", style);

        return [ box ];
    }



    /*
    \shortstack[pos]{...\\...\\...}, pos: r,l,c (horizontal alignment)


    \begin{minipage}[pos][height][inner-pos]{width}
    */



    ////////////
    // graphics
    ////////////


    //// picture environment (pspicture, calc, picture and pict2e packages)

    // line thickness and arrowlength in a picture (not multiplied by \unitlength)

    @Macro("HV") thinlines()    { this.g.setLength("@wholewidth", new Length(this.g, 0.4, "pt")); }
    @Macro("HV") thicklines()   { this.g.setLength("@wholewidth", new Length(this.g, 0.8, "pt")); }

    @Macro("HV")
    @Args("l")
    linethickness(l: Length)
    {
        if (l.unit !== "sp")
            this.g.error("relative units for \\linethickness not supported!");

        this.g.setLength("@wholewidth", l);
    }

    @Macro("HV")
    @Args("l")
    arrowlength(l: Length)      { this.g.setLength("@arrowlength", l); }

    maxovalrad()                { return [ "20pt" ]; }

    // the maximum number of points for \qbezier and \cbezier
    qbeziermax()                { return 500; }


    // frames

    // \frame{text} - frame without padding, linewidth given by picture linethickness
    @Macro("H")
    @Args("hg")
    frame(txt: unknown)
    {
        const el = this.g.create(Elements.inline, txt as Node, "hbox pframe");
        const w = this.g.length("@wholewidth");
        el.setAttribute("style", `border-width:${w.value}`);
        return [ el ];
    }


    // the stroke of a picture object: black, with the given width (default: none); svg.js writes the
    // length with its unit as given
    private _stroke(width?: Length)
    {
        return { color: "#000", width: width ? width.value : "0" };
    }


    //// picture commands

    // these commands create a box with width 0 and height abs(y) + height of {obj} if y positive

    // \put(x,y){obj}
    @Macro("H")
    @Args("v", "g", "is")
    put(v: Vector, obj: unknown)
    {
        const wrapper = this.g.create(Elements.inline, obj as Node, "put-obj");
        const zero = new Length(this.g, 0, "sp");

        let strut: HTMLElement | undefined;

        if (v.y.cmp(zero) >= 0) {
            // TODO: CSS: this case should align the text (put-obj) on baseline... otherwise, strut is too high
            //       (see mixing math, text and lines unit test)
            wrapper.setAttribute("style", `left:${v.x.value}`);
            // only add the strut if y > 0
            if (v.y.cmp(zero) > 0) {
                strut = this.g.create(Elements.inline, undefined, "strut");
                strut.setAttribute("style", `height:${v.y.value}`);
            }
        } else {
            wrapper.setAttribute("style", `left:${v.x.value};bottom:${v.y.value}`);
        }

        return this.rlap(this.g.create(Elements.inline, strut ? [ wrapper, strut ] : [ wrapper ], "picture"));
    }


    // \multiput(x,y)(delta_x,delta_y){n}{obj}
    @Macro("H")
    @Args("v", "v", "n", "g")
    multiput(v: Vector, dv: Vector, n: number, obj: unknown)
    {
        const res: Node[] = [];
        for (let i = 0; i < n; i++)
            res.push(...this.put(v.add(dv.mul(i)), (obj as Node).cloneNode(true)));

        return res;
    }


    // \qbezier[N](x1, y1)(x, y)(x2, y2)
    @Macro("H")
    @Args("n?", "v", "v", "v")
    qbezier(N: number | undefined, v1: Vector, v: Vector, v2: Vector)
    {
        // for path, v MUST be unitless - so v is always in user coordinate system, or relative
        // (and just to be safe, set size = viewbox in _path)
        return [ this._path(`M${v1.x.pxpct},${v1.y.pxpct} Q${v.x.pxpct},${v.y.pxpct} ${v2.x.pxpct},${v2.y.pxpct}`, N) ];
    }


    // \cbezier[N](x1, y1)(x, y)(x2, y2)(x3, y3)
    @Macro("H")
    @Args("n?", "v", "v", "v", "v")
    cbezier(N: number | undefined, v1: Vector, v: Vector, v2: Vector, v3: Vector)
    {
        return [ this._path(`M${v1.x.pxpct},${v1.y.pxpct} C${v.x.pxpct},${v.y.pxpct} ${v2.x.pxpct},${v2.y.pxpct} ${v3.x.pxpct},${v3.y.pxpct}`, N) ];
    }


    // typeset an SVG path, optionally with N+1 points instead of smooth
    // (https://github.com/Pomax/bezierjs for calculating bezier points manually)
    private _path(p: string, N?: number)
    {
        const linethickness = this.g.length("@wholewidth");

        const svg = this.g.create(Elements.inline, undefined, "picture-object");
        const draw = this.g.SVG().addTo(svg);

        const path = draw.path(p)
                         .stroke(this._stroke(linethickness))
                         .fill("none");

        if (N && N > 0) {
            N = Math.min(N, this.qbeziermax() - 1);

            const pw = linethickness.px;                            // width of a point
            const lenSection = (path.length() - (N + 1) * pw) / N;  // N sections for N+1 points
            if (lenSection > 0)
                path.stroke({ dasharray: `${pw} ${this.g.round(lenSection)}` });
        }

        const bbox = path.bbox();

        bbox.x -= linethickness.px;
        bbox.y -= linethickness.px;
        bbox.width += linethickness.px * 2;
        bbox.height += linethickness.px * 2;

        // size and position
        svg.setAttribute("style", `left:${this.g.round(bbox.x)}px;bottom:${this.g.round(bbox.y)}px`);

        draw.size(`${this.g.round(bbox.width)}px`, `${this.g.round(bbox.height)}px`)
            .viewbox(this.g.round(bbox.x), this.g.round(bbox.y), this.g.round(bbox.width), this.g.round(bbox.height));

        // last, put the origin into the lower left
        draw.flip("y", 0);

        return this.g.create(Elements.inline, svg, "picture");
    }



    //// picture objects

    // the boxes created by picture objects do not have a height or width

    // \circle[*]{diameter}
    @Macro("H")
    @Args("s", "cl")
    circle(s: boolean, d: Length)
    {
        // no negative diameters
        d = d.abs();

        const svg = this.g.create(Elements.inline, undefined, "picture-object");

        const linethickness = this.g.length("@wholewidth");

        const draw = this.g.SVG().addTo(svg);

        let offset: string;

        // if the circle is filled, then linewidth must not influence the diameter
        if (s) {
            offset = d.div(2).mul(-1).value;

            draw.size(d.value, d.value)
                .stroke(this._stroke())
                .circle(d.value)
                .cx(d.div(2).value)
                .cy(d.div(2).value)
                .fill("");
        } else {
            // increase border by linewidth; multiply by -1 to shift left/down
            offset = d.div(2).add(linethickness).mul(-1).value;

            draw.size(d.add(linethickness.mul(2)).value, d.add(linethickness.mul(2)).value)
                .stroke(this._stroke(linethickness))
                .circle(d.value)
                .cx(d.div(2).add(linethickness).value)
                .cy(d.div(2).add(linethickness).value)
                .fill("none");
        }

        svg.setAttribute("style", `left:${offset};bottom:${offset}`);

        // last, put the origin into the lower left
        draw.flip("y", 0);

        return [ this.g.create(Elements.inline, svg, "picture") ];
    }


    // \line(xslope,yslope){length}
    //   if xslope != 0 then length is horizontal, else it is vertical
    //   if xslope == yslope == 0 then error
    @Macro("H")
    @Args("v", "cl")
    line(v: Vector, l: Length)
    {
        return [ this._line(...this._slopeLengthToCoords(v, l)) ];
    }


    // \vector(xslope,yslope){length}
    @Macro("H")
    @Args("v", "cl")
    vector(v: Vector, l: Length)
    {
        const [ vs, ve ] = this._slopeLengthToCoords(v, l);
        // the slope gives the direction even if the length is zero (then only the arrow head is drawn)
        return [ this._vector(vs, ve, v) ];
    }


    // \Line(x1,y1)(x2,y2)
    @Macro("H")
    @Args("v", "v")
    Line(vs: Vector, ve: Vector)
    {
        return [ this._line(vs, ve) ];
    }


    // extension - not in LaTeX (pict2e)
    // \Vector(x1,y1)(x2,y2)
    @Macro("H")
    @Args("v", "v")
    Vector(vs: Vector, ve: Vector)
    {
        return [ this._vector(vs, ve) ];
    }


    // convert slope/length pair to a vector (x/y coordinates)
    private _slopeLengthToCoords(v: Vector, l: Length): [Vector, Vector]
    {
        if (v.x.value === v.y.value && v.y.value === "0px")
            this.g.error("illegal slope (0,0)");

        if (v.x.unit !== v.y.unit || v.x.unit !== "sp")
            this.g.error("relative units not allowed for slope");

        const zero = new Length(this.g, 0, l.unit);

        let x: Length, y: Length;

        if (v.x.px === 0) {
            x = zero;
            y = l;
        } else {
            x = l;
            y = x.mul(Math.abs(v.y.ratio(v.x)));
        }

        if (v.x.cmp(zero) < 0)
            x = x.mul(-1);
        if (v.y.cmp(zero) < 0)
            y = y.mul(-1);

        return [ new Vector(zero, zero), new Vector(x, y) ];
    }


    // helper: draw line from vs to ve
    // TODO: if vs is negative and ve positive, style/size/viewbox needs to be adapted!
    private _line(vs: Vector, ve: Vector)
    {
        // TODO: em/ex should be supported!
        if (vs.x.unit !== vs.y.unit || vs.x.unit !== "sp")
            this.g.error("relative units not allowed for line");
        if (ve.x.unit !== ve.y.unit || ve.x.unit !== "sp")
            this.g.error("relative units not allowed for line");

        const svg = this.g.create(Elements.inline, undefined, "picture-object");
        const draw = this.g.SVG().addTo(svg);

        const linethickness = this.g.length("@wholewidth");
        const bbox = draw.line(vs.x.px, vs.y.px, ve.x.px, ve.y.px)
                         .stroke(this._stroke(linethickness))
                         .bbox();

        bbox.x -= linethickness.px;
        bbox.y -= linethickness.px;
        bbox.width += linethickness.px * 2;
        bbox.height += linethickness.px * 2;

        if (bbox.x > 0 || bbox.y > 0)
            console.error("line: bbox.x/y > 0!!", bbox.x, bbox.y);

        // size and position
        svg.setAttribute("style", `left:${this.g.round(bbox.x)}px;bottom:${this.g.round(bbox.y)}px`);

        draw.size(`${this.g.round(bbox.width)}px`, `${this.g.round(bbox.height)}px`)
            .viewbox(this.g.round(bbox.x), this.g.round(bbox.y), this.g.round(bbox.width), this.g.round(bbox.height));

        // last, put the origin into the lower left
        draw.flip("y", 0);

        return this.g.create(Elements.inline, svg, "picture");
    }


    // helper: draw arrow from vs to ve, pointing in direction dir (default: from vs to ve)
    private _vector(vs: Vector, ve: Vector, dir: Vector = ve.sub(vs))
    {
        // TODO: vs not implemented! always 0
        // TODO: em/ex should be supported!
        if (vs.x.unit !== vs.y.unit || vs.x.unit !== "sp")
            this.g.error("relative units not allowed for vector");
        if (ve.x.unit !== ve.y.unit || ve.x.unit !== "sp")
            this.g.error("relative units not allowed for vector");
        if (dir.norm()._value === 0)
            this.g.error("vector has no direction: start and end point are the same");

        const linethickness = this.g.length("@wholewidth");

        const svg = this.g.create(Elements.inline, undefined, "picture-object");
        const draw = this.g.SVG();

        // arrow head length and width
        let hl = 6.5;
        let hw = 3.9;

        // if the linethickness is less than 0.6pt, don't shrink the arrow head any further
        const max = new Length(this.g, 0.6, "pt");

        if (linethickness.cmp(max) < 0) {
            hl = this.g.round(hl * max.ratio(linethickness));
            hw = this.g.round(hw * max.ratio(linethickness));
        }

        const hhl = linethickness.mul(hl / 2);      // half the head length (the marker scales with stroke width)
        const al = ve.sub(vs).norm();               // arrow length

        // if the arrow head is longer than the arrow, the line is just the back half of the head (hidden under it):
        // it starts a whole head length before the tip; this also gives a zero-length arrow a direction for the marker
        let s: Vector;
        if (al.cmp(hhl) < 0)
            s = ve.shift_end(hhl.mul(-2), dir);
        else
            s = new Vector(new Length(this.g, 0, "sp"), new Length(this.g, 0, "sp"));

        // shorten vector by half the arrow head length (the marker is centered on the end of the line)
        ve = ve.shift_end(hhl.mul(-1), dir);

        const bbox = draw.line(s.x.px, s.y.px, ve.x.px, ve.y.px)
                         .stroke(this._stroke(linethickness))
                         // marker width and height
                         .marker("end", hl, hw, marker => {
                             marker.path(`M0,0 ` +
                                         `Q${this.g.round(2 * hl / 3)},${this.g.round(hw / 2)} ${hl},${this.g.round(hw / 2)} ` +
                                         `Q${this.g.round(2 * hl / 3)},${this.g.round(hw / 2)} 0,${hw} ` +
                                         `z`);
                         })
                         .bbox();

        bbox.x -= linethickness.px + hhl.px;
        bbox.y -= linethickness.px + hhl.px;
        bbox.width += linethickness.px + hhl.px * 2;
        bbox.height += linethickness.px + hhl.px * 2;

        if (bbox.x > 0 || bbox.y > 0)
            console.error("vector: bbox.x/y > 0!!", bbox.x, bbox.y);

        // size and position
        svg.setAttribute("style", `left:${this.g.round(bbox.x)}px;bottom:${this.g.round(bbox.y)}px`);

        draw.size(`${this.g.round(bbox.width)}px`, `${this.g.round(bbox.height)}px`)
            .viewbox(this.g.round(bbox.x), this.g.round(bbox.y), this.g.round(bbox.width), this.g.round(bbox.height));

        // last, put the origin into the lower left
        draw.flip("y", 0);

        draw.addTo(svg);
        return this.g.create(Elements.inline, svg, "picture");
    }



    // \oval[radius](width,height)[portion]
    //   uses circular arcs of radius min(radius, width/2, height/2)
    @Macro("H")
    @Args("cl?", "v", "i?")
    oval(maxrad: Length | undefined, size: Vector, part: string | undefined)
    {
        const linethickness = this.g.length("@wholewidth");

        // TODO: use \maxovalrad, parse the length (if unitless, multiply with \unitlength)
        maxrad ??= new Length(this.g, 20, "px");
        part ??= "";

        // determine radius
        let rad = size.x.cmp(size.y) < 0 ? size.x.div(2) : size.y.div(2);

        if (maxrad.cmp(rad) < 0)
            rad = maxrad;

        const draw = this.g.SVG();
        const oval = draw.rect(size.x.value, size.y.value)
                         .radius(rad.value)
                         .move(size.x.div(-2).value, size.y.div(-2).value)
                         .stroke(this._stroke(linethickness))
                         .fill("none");


        // initial rect
        let rect: Rect = {
            x: size.x.div(-2).sub(linethickness),
            y: size.y.div(-2).sub(linethickness),
            w: size.x.add(linethickness.mul(2)),
            h: size.y.add(linethickness.mul(2))
        };

        if (part.includes("l"))
            rect = this._intersect(rect, {
                x: size.x.div(-2).sub(linethickness),
                y: size.y.div(-2).sub(linethickness),
                w: size.x.div(2).add(linethickness),
                h: size.y.add(linethickness.mul(2))
            });

        if (part.includes("t"))
            rect = this._intersect(rect, {
                x: size.x.div(-2).sub(linethickness),
                y: size.y.div(-2).sub(linethickness),
                w: size.x.add(linethickness.mul(2)),
                h: size.y.div(2).add(linethickness)
            });

        if (part.includes("r"))
            rect = this._intersect(rect, {
                x: new Length(this.g, 0, "sp"),
                y: size.y.div(-2).sub(linethickness),
                w: size.x.div(2).add(linethickness),
                h: size.y.add(linethickness.mul(2))
            });

        if (part.includes("b"))
            rect = this._intersect(rect, {
                x: size.x.div(-2).sub(linethickness),
                y: new Length(this.g, 0, "sp"),
                w: size.x.add(linethickness.mul(2)),
                h: size.y.div(2).add(linethickness)
            });


        const bbox = oval.bbox();

        bbox.x -= linethickness.px;
        bbox.y -= linethickness.px;
        bbox.width += linethickness.px * 2;
        bbox.height += linethickness.px * 2;

        if (bbox.x > 0 || bbox.y > 0)
            console.error("oval: bbox.x/y > 0!!", bbox.x, bbox.y);


        const clip = draw.clip().add(draw.rect(rect.w.value, rect.h.value)
                                         .move(rect.x.value, rect.y.value));
        clip.flip("y", 0);

        oval.clipWith(clip);

        // size and position
        const svg = this.g.create(Elements.inline, undefined, "picture-object");
        svg.setAttribute("style", `left:${this.g.round(bbox.x)}px;bottom:${this.g.round(bbox.y)}px`);

        draw.size(`${this.g.round(bbox.width)}px`, `${this.g.round(bbox.height)}px`)
            .viewbox(this.g.round(bbox.x), this.g.round(bbox.y), this.g.round(bbox.width), this.g.round(bbox.height));

        // last, put the origin into the lower left
        draw.flip("y", 0);

        draw.addTo(svg);

        return [ this.g.create(Elements.inline, svg, "picture") ];
    }


    // return a new rectangle that is the result of intersecting the given two rectangles
    private _intersect(r1: Rect, r2: Rect): Rect
    {
        const zero = new Length(this.g, 0, "sp");

        return {
            x: Length.max(r1.x, r2.x),
            y: Length.max(r1.y, r2.y),
            w: Length.max(zero, Length.min(r1.x.add(r1.w), r2.x.add(r2.w)).sub(Length.max(r1.x, r2.x))),
            h: Length.max(zero, Length.min(r1.y.add(r1.h), r2.y.add(r2.h)).sub(Length.max(r1.y, r2.y)))
        };
    }


    ////////////////////
    // lengths (scoped)
    ////////////////////

    @Macro("HV")
    @Args("m")
    newlength(id: string)               { this.g.newLength(id); }

    @Macro("HV")
    @Args("m", "l")
    setlength(id: string, l: Length)    { this.g.setLength(id, l); }

    @Macro("HV")
    @Args("m", "l")
    addtolength(id: string, l: Length)  { this.g.setLength(id, this.g.length(id).add(l)); }


    // settoheight     =
    // settowidth      =
    // settodepth      =


    // get the natural size of a box
    // width           =
    // height          =
    // depth           =
    // totalheight     =



    //////////////////////////////////
    // LaTeX counters (always global)
    //////////////////////////////////

    // \newcounter{counter}[parent]
    @Macro("HV")
    @Args("i", "i?")
    newcounter(c: string, p?: string)       { this.g.newCounter(c, p); }

    // \stepcounter{counter}
    @Macro("HV")
    @Args("i")
    stepcounter(c: string)                  { this.g.stepCounter(c); }

    // \addtocounter{counter}{<expression>}
    @Macro("HV")
    @Args("i", "n")
    addtocounter(c: string, n: number)      { this.g.setCounter(c, this.g.counter(c) + n); }

    // \setcounter{counter}{<expression>}
    @Macro("HV")
    @Args("i", "n")
    setcounter(c: string, n: number)        { this.g.setCounter(c, n); }

    // \refstepcounter{counter}
    //       \stepcounter{counter}, and (locally) define \@currentlabel so that the next \label
    //       will reference the correct current representation of the value; return an empty node
    //       for an <a href=...> target
    @Macro("H")
    @Args("i")
    refstepcounter(c: string)               { this.g.stepCounter(c); return [ this.g.refCounter(c) ]; }


    // formatting counters

    @Macro("H") @Args("i")
    alph(c: string)                         { return [ this.g.alph(this.g.counter(c)) ]; }

    @Macro("H") @Args("i")
    Alph(c: string)                         { return [ this.g.Alph(this.g.counter(c)) ]; }

    @Macro("H") @Args("i")
    arabic(c: string)                       { return [ this.g.arabic(this.g.counter(c)) ]; }

    @Macro("H") @Args("i")
    roman(c: string)                        { return [ this.g.roman(this.g.counter(c)) ]; }

    @Macro("H") @Args("i")
    Roman(c: string)                        { return [ this.g.Roman(this.g.counter(c)) ]; }

    @Macro("H") @Args("i")
    fnsymbol(c: string)                     { return [ this.g.fnsymbol(this.g.counter(c)) ]; }



    //// not yet...

    @Macro("V")
    @Args("g")
    input(_file: unknown) {}

    @Macro("V")
    @Args("g")
    include(_file: unknown) {}


    ////////////
    // preamble
    ////////////

    @Macro("P")
    @Args("kv?", "k", "k?")
    documentclass(options: PackageOpts | undefined, documentclass: string, _version?: string)
    {
        if (this.g.documentClass)
            this.g.error("Two \\documentclass commands. The document may only declare one class.");

        // keep the name and the options of the documentclass: the options are used for all packages
        this.g.documentClass = { name: documentclass, options: options ?? new Map() };
        this.g.macroManager.loadDocumentClass(documentclass, this.g.documentClass.options);
    }


    @Macro("P")
    @Args("kv?", "csv", "k?")
    usepackage(opts: PackageOpts | undefined, packages: string[], _version?: string)
    {
        if (!this.g.documentClass)
            this.g.error("\\usepackage before \\documentclass.");

        // PackageOpts are Maps: the package options override the documentclass options
        // (opts is undefined if no [] was given)
        const options: PackageOpts = new Map([ ...this.g.documentClass.options, ...(opts ?? []) ]);

        for (const pkg of packages) {
            if (providedPackages.includes(pkg))
                continue;

            this.g.macroManager.loadPackage(pkg, options);
        }
    }


    @Macro("P")
    @Args("csv")
    includeonly(_filelist: string[]) {}


    @Macro("P")
    makeatletter() {}

    @Macro("P")
    makeatother() {}



    ///////////
    // ignored
    ///////////

    @Macro("HV") @Args("i")
    pagestyle(_s: string) {}


    @Macro("HV") @Args("n?")
    linebreak(_o?: number) {}

    @Macro("HV") @Args("n?")
    nolinebreak(_o?: number) {}

    @Macro("HV") fussy() {}
    @Macro("HV") sloppy() {}

    // these make no sense without pagebreaks

    @Macro("HV") @Args("n?")
    pagebreak(_o?: number) {}

    @Macro("HV") @Args("n?")
    nopagebreak(_o?: number) {}

    @Macro("HV") samepage() {}

    @Macro("HV") @Args("s", "l")
    enlargethispage(_s: boolean, _l: Length) {}

    @Macro("HV") newpage() {}
    @Macro("HV") clearpage() {}            // prints floats in LaTeX
    @Macro("HV") cleardoublepage() {}
    @Macro("HV") vfill() {}

    @Macro("HV") @Args("i")
    thispagestyle(_s: string) {}
}


Object.freeze(LaTeX.prototype);
Object.freeze(LaTeX);
