import path from 'node:path';
import fs from 'node:fs';
import { EOL } from 'node:os';
import tmp from 'tmp';
import { create as cmd } from './lib/cmd.ts';

import pkg from '../package.json' with { type: 'json' };

tmp.setGracefulCleanup();

const binFile = path.resolve((pkg.bin as Record<string, string>)[pkg.name]);
const latexjs = cmd(binFile);


describe('LaTeX.js CLI test', () => {

    test('get version', () =>
        expect(latexjs.execute(['-V'])).to.eventually.deep.include({ stdout: pkg.version + EOL })
    );

    test('get help', () =>
        expect(latexjs.execute(['-h'])).to.eventually.be.fulfilled
            .and.to.have.property('stdout')
                .that.matches(new RegExp(pkg.description))
    );

    test('error on unknown option', () =>
        expect(latexjs.execute(['-x'])).to.eventually.be.rejected
            .and.to.be.an('object')
                .that.has.property('stderr')
                .that.matches(/error: unknown option/)
    );

    test('error on incorrect use', async () => {
        await expect(latexjs.execute(['-b', '-s']), "-b -s").to.eventually.be.rejected
        await expect(latexjs.execute(['-b', '-u']), "-b -u").to.eventually.be.rejected
        await expect(latexjs.execute(['-bus']), "-bus").to.eventually.be.rejected
        await expect(latexjs.execute(['-b -s style.css']), "-b -s style.css").to.eventually.be.rejected
    });

    test('default translation', () =>
        expect(latexjs.execute([], ["A paragraph."])).to.eventually.be.fulfilled
            .and.to.be.an('object')
                .that.has.property('stdout')
                .that.equals('<html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"></meta><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>A para\u00ADgraph.</p></div></body></html>' + EOL)
    );

    test('return only the body', () =>
        expect(latexjs.execute(['-b'], ["A paragraph."]))
            .to.eventually.be.fulfilled
            .and.to.be.an('object')
                .that.has.property('stdout')
                .that.equals('<div class="body"><p>A para\u00ADgraph.</p></div>' + EOL)
    );

    test('include custom macros', () =>
        expect(latexjs.execute(['-b', '-m', 'test/api/CustomMacros.ts'], ["A \\myMacro[custom] macro."]))
            .to.eventually.be.fulfilled
            .and.to.be.an('object')
                .that.has.property('stdout')
                .that.equals('<div class="body"><p>A -cus\u00ADtom- macro.</p></div>' + EOL)
    );

    test.skip('include custom package', () => {});
});
