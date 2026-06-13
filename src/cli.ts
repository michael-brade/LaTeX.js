// on the server we need to include a DOM implementation - BEFORE requiring HtmlGenerator below
import { createHTMLWindow } from 'svgdom';

global.window = createHTMLWindow() as any;
global.document = (global.window as any).document;

import util from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import stdin from 'stdin';
import { program } from 'commander';
import beautify from 'js-beautify';
import { he, parse, HtmlGenerator } from 'latex.js';
import en from 'hyphenation.en-us';
import de from 'hyphenation.de';
import info from '../package.json' with { type: 'json' };

he.encode.options.strict = true;
he.encode.options.useNamedReferences = true;

const binPath = fileURLToPath(new URL('.', import.meta.url));

const addStyle = (url: string, styles?: string[]): string[] => {
    if (!styles)
        return [url];
    else
        return [...styles, url];
};

program
    .name(info.name)
    .version(info.version)
    .description(info.description as string)
    .usage('[options] [files...]')
    .option('-o, --output <file>', 'specify output file, otherwise STDOUT will be used')
    .option('-a, --assets [dir]', 'copy CSS and fonts to the directory of the output file, unless dir is given (default: no assets are copied)')
    .option('-u, --url <base URL>', 'set the base URL to use for the assets (default: use relative URLs)')
    // options affecting the HTML output
    .option('-b, --body', 'don\'t include HTML boilerplate and CSS, only output the contents of body')
    .option('-e, --entities', 'encode HTML entities in the output instead of using UTF-8 characters')
    .option('-p, --pretty', 'beautify the html (this may add/remove spaces unintentionally)')
    // options about LaTeX and style
    .option('-c, --class <class>', 'set a default documentclass for documents without a preamble', 'article')
    .option('-m, --macros <file>', 'load a JavaScript file with additional custom macros')
    .option('-s, --stylesheet <url>', 'specify an additional style sheet to use (can be repeated)', addStyle)
    .option('-n, --no-hyphenation', 'don\'t insert soft hyphens (disables automatic hyphenation in the browser)')
    .option('-l, --language <lang>', 'set hyphenation language', 'en')
    .on('--help', () => console.log('\nIf no input files are given, STDIN is read.'))
    .parse(process.argv);

interface ProgramOptions {
    output?: string;
    assets?: boolean | string;
    url?: string;
    body?: boolean;
    entities?: boolean;
    pretty?: boolean;
    class: string;
    macros?: string;
    stylesheet?: string[];
    hyphenation: boolean;
    language: string;
}

const options = program.opts<ProgramOptions>();

let CustomMacros: any;
if (options.macros) {
    const macros = path.resolve(process.cwd(), options.macros);
    const CustomMacrosModule = await import(macros);
    if (CustomMacrosModule.default) {
        // class is the default export
        CustomMacros = CustomMacrosModule.default;
    } else {
        // class is a named export
        const macroName = path.parse(macros).name;
        CustomMacros = CustomMacrosModule[macroName];
    }
}
if (options.body && (options.stylesheet || options.url)) {
    console.error("error: conflicting options: 'url' and 'stylesheet' cannot be used with 'body'!");
    process.exit(1);
}

const htmlOptions = {
    hyphenate: options.hyphenation,
    languagePatterns: (() => {
        switch (options.language) {
            case 'en': return en;
            case 'de': return de;
            default:
                console.error(`error: language '${options.language}' is not supported yet`);
                process.exit(1);
        }
    })(),
    documentClass: options.class,
    CustomMacros: CustomMacros,
    styles: options.stylesheet || []
};
const readFile = util.promisify(fs.readFile);
// number of args not consumed by the program options
let input: Promise<string | Buffer[]>;
if (program.args.length) {
    input = Promise.all(program.args.map((file: string) => readFile(file)));
} else {
    input = new Promise<string>((resolve, reject) => {
        stdin((str: string) => resolve(str));
    });
}
input.then((text: string | Buffer[]) => {
    let textStr: string;
    if (Array.isArray(text)) {
        textStr = text.map(buf => buf.toString()).join("\n\n");
    } else {
        textStr = text;
    }
    const generator = parse(textStr, { generator: new HtmlGenerator(htmlOptions) });
    let html: string;
    if (options.body) {
        const div = document.createElement('div');
        div.appendChild(generator.domFragment().cloneNode(true));
        html = div.innerHTML;
    } else {
        html = generator.htmlDocument(options.url).documentElement.outerHTML;
    }
    if (options.entities)
        html = he.encode(html, { 'allowUnsafeSymbols': true });

    if (options.pretty) {
        html = beautify.html(html, {
            'end_with_newline': true,
            'wrap_line_length': 120,
            'wrap_attributes': 'auto',
            'unformatted': ['span']
        });
    }

    if (options.output)
        fs.writeFileSync(options.output, html);
    else
        process.stdout.write(html + '\n');
}).catch((err: Error) => {
    console.error(err.toString());
    process.exit(1);
});

// assets
let dir = typeof options.assets === 'string' ? options.assets : undefined;

if (options.assets === true) {
    if (!options.output) {
        console.error("assets error: either a directory has to be given, or -o");
        process.exit(1);
    } else {
        dir = path.posix.dirname(path.resolve(options.output));
    }
} else if (dir && fs.existsSync(dir) && !fs.statSync(dir).isDirectory()) {
    console.error("assets error: the given path exists but is not a directory: ", dir);
    process.exit(1);
}

if (dir) {
    const css = path.join(dir, 'css');
    const fonts = path.join(dir, 'fonts');
    const js = path.join(dir, 'js');
    fs.mkdirpSync(css);
    fs.mkdirpSync(fonts);
    fs.mkdirpSync(js);

    fs.copySync(path.join(binPath, '../dist/css'), css);
    fs.copySync(path.join(binPath, '../dist/fonts'), fonts);
    fs.copySync(path.join(binPath, '../dist/js'), js);
}