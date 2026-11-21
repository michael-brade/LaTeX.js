import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

import { decode } from 'he'; // TODO: switch to html-entities (?)
import slugify from 'slugify';
import { parse, HtmlGenerator, resetSvgIds } from 'latex.js';
// import beautify from 'js-beautify';
import { load as loadFixture, type Fixture } from './lib/load-fixtures.ts';
import { takeScreenshot, launchBrowsers, closeBrowsers } from './lib/browsers.ts';


const dirname = import.meta.dirname;
const subdirs: string[] = [];


describe('LaTeX.js fixtures', () => {
    beforeAll(launchBrowsers);
    afterAll(closeBrowsers);

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
    // "!": run all tests except those with attribute "!"
    // "+": run only those tests with attribute "+"
    const _test = fixture.attrs.has("!") ? test.skip
                : fixture.attrs.has("+") ? test.only
                : test;

    const title = fixture.header || 'fixture number ' + fixture.id;

    // make a screenshot by adding the attribute "#": then the fixture is a suite with
    // the tests "html" and "screenshot", otherwise just the html test
    if (fixture.attrs.has("#")) {
        describe(title, () => {
            _test('html', () => htmlTest(fixture, name));
            _test('screenshot', () => screenshotTest(fixture, name));
        });
    } else {
        _test(title, () => htmlTest(fixture, name));
    }
}


// compare the generated html with the fixture's result
function htmlTest(fixture: Fixture, name: string): void {
    resetSvgIds();

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

    htmlIs = decode(htmlIs.replace(/\r\n|\n|\r/g, ""));
    htmlShould = decode(htmlShould.replace(/\r\n|\n|\r/g, ""));

    // if the test failed, write its actual html output to test/html/
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
    expect(htmlIs).toBe(htmlShould);
}


// render the fixture in chrome and firefox and compare with the stored screenshots
async function screenshotTest(fixture: Fixture, name: string): Promise<void> {
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
