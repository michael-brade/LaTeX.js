import { createHTMLWindow } from 'svgdom';

global.window = createHTMLWindow() as any;
global.document = (global.window as any).document;

import { registerWindow, resetDid } from '@svgdotjs/svg.js';
registerWindow(global.window, global.document);

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

import he from 'he'; // TODO: switch to html-entities (?)
import slugify from 'slugify';
import { parse, HtmlGenerator } from 'latex.js';
// import beautify from 'js-beautify';
import { load as loadFixture, type Fixture } from './lib/load-fixtures.ts';


const dirname = fileURLToPath(new URL('.', import.meta.url));
const subdirs: string[] = [];


describe('LaTeX.js fixtures', () => {
    const fixturesPath = path.join(dirname, 'fixtures');

    fs.readdirSync(fixturesPath).forEach((name: string) => {
        const fixtureFile = path.join(fixturesPath, name);
        const stat = fs.statSync(fixtureFile);
        if (stat.isDirectory()) {
            subdirs.push(name);
            return;
        }

        describe(name, () => {
            loadFixture(fixtureFile).fixtures.forEach((fixture: Fixture) => {
                runFixture(fixture, name);
            });
        });
    });

    // now do the subdirs
    subdirs.forEach((dir) => {
        describe(dir, () => {
            fs.readdirSync(path.join(fixturesPath, dir)).forEach((name) => {
                describe(name, () => {
                    const fixtureFile = path.join(fixturesPath, dir, name);
                    loadFixture(fixtureFile).fixtures.forEach((fixture: Fixture) => {
                        runFixture(fixture, dir + " - " + name);
                    });
                });
            });
        });
    });
});


function runFixture(fixture: Fixture, name: string): void {
    let _test: (title: string, fn?: Mocha.Func | Mocha.AsyncFunc) => Mocha.Test;
    _test = it;

    // "!": run all tests except those with attribute "!"
    // "+": run only those tests with attribute "+"

    if (fixture.attrs.has("!"))
        _test = it.skip;
    else if (fixture.attrs.has("+"))
        _test = it.only;

    // make a screenshot by adding the attribute "#"
    let screenshot = false;
    if (fixture.attrs.has("#"))
        screenshot = true;


    // create syntax test
    _test(fixture.header || 'fixture number ' + fixture.id, () => {
        resetDid();

        let htmlIs: string;
        let htmlShould: string;

        try {
            const generator = parse(fixture.source, {
                generator: new HtmlGenerator({ hyphenate: false })
            });
            const div = document.createElement('div');
            div.appendChild(generator.domFragment().cloneNode(true));
            htmlIs = div.innerHTML;
            htmlShould = fixture.result;
        } catch (e: any) {
            if (e.location) {
                const lines = fixture.source.split(/\r\n|\n|\r/);
                e.message = `${e.message} at line ${e.location.start.line} (column ${e.location.start.column}): ${
                    lines[e.location.start.line - 1]
                }`;
            }
            throw e;
        }

        htmlIs = he.decode(htmlIs.replace(/\r\n|\n|\r/g, ""));
        htmlShould = he.decode(htmlShould.replace(/\r\n|\n|\r/g, ""));

        if (htmlIs !== htmlShould) {
            const filename = path.join(dirname, 'html', slugify(name + ' ' + fixture.header, {
                remove: /[*+~()'"!:@,{}\\]/g
            }));
            try {
                fs.mkdirSync(path.dirname(filename), { recursive: true });
            } catch {}
            fs.writeFileSync(filename, htmlIs);
        }

        // htmlIs = beautify.html(htmlIs);
        // htmlShould = beautify.html(htmlShould);
        expect(htmlIs).to.equal(htmlShould);
    });

    // create screenshot test
    if (screenshot) {
        _test('   - screenshot', async () => {
            resetDid();

            const htmlDoc = parse(fixture.source, {
                generator: new HtmlGenerator({ hyphenate: false })
            }).htmlDocument();

            // create null favicon to make the browser stop looking for one
            const favicon = document.createElement("link");
            favicon.rel = "icon";
            favicon.href = ";base64,iVBORw0KGgo=";

            htmlDoc.head.appendChild(favicon);

            const filename = path.join(dirname, 'screenshots', slugify(name + ' ' + fixture.header, {
                remove: /[*+~()'"!:@,{}\\]/g
            }));

            await takeScreenshot(htmlDoc.documentElement.outerHTML, filename);

            // update native LaTeX screenshot
            // latexScreenshot(fixture.source, filename);
        });
    }
}


function latexScreenshot(source: string, filename: string): void {
    const process = spawn(path.join(dirname, 'latex2png.sh'), [filename + ".latex.png"]);

    let stdout = "";
    let stderr = "";

    process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
    });

    process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
    });

    process.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
        if (code !== 0) {
            console.warn("latex screenshot failed: " + code);
            console.log("#### std err output: " + stderr);
        }
    });

    process.on('error', (err: Error) => {
        process.removeAllListeners('exit');
        console.warn("latex screenshot failed: " + err);
    });

    process.stdin.write(source);
    process.stdin.end();
}