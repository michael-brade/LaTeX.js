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

    test('get version', () => {
        return expect(latexjs.execute(['-V'])).to.eventually.deep.include({ stdout: pkg.version + EOL });
    });

    test('get help', () => {
        return expect(latexjs.execute(['-h'])).to.eventually.be.fulfilled
            .and.to.have.property('stdout')
                .that.matches(new RegExp(pkg.description));
    });

    test('error on unknown option', () => {
        return expect(latexjs.execute(['-x'])).to.eventually.be.rejected
            .and.to.be.an('object')
                .that.has.property('stderr')
                .that.matches(/error: unknown option/);
    });

    test('error on incorrect use', () => {
        return Promise.all([
            expect(latexjs.execute(['-b', '-s'])).to.eventually.be.rejected,
            expect(latexjs.execute(['-b', '-u'])).to.eventually.be.rejected,
            expect(latexjs.execute(['-bus'])).to.eventually.be.rejected,
            expect(latexjs.execute(['-b -s style.css'])).to.eventually.be.rejected
        ]);
    });

    test('default translation', () => {
        return expect(latexjs.execute([], ["A paragraph."])).to.eventually.be.fulfilled
            .and.to.be.an('object')
                .that.has.property('stdout')
                .that.equals('<html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"></meta><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>A para\u00ADgraph.</p></div></body></html>' + EOL);
    });

    test('return only the body', () => {
        return expect(latexjs.execute(['-b'], ["A paragraph."]))
            .to.eventually.be.fulfilled
            .and.to.be.an('object')
                .that.has.property('stdout')
                .that.equals('<div class="body"><p>A para\u00ADgraph.</p></div>' + EOL);
    });

    test('include custom macros', () => {
        const tmpfile = tmp.fileSync();
        // Keep livescript compiler if the source macro test file remains in .ls format
        const livescript = require('livescript');
        const macroCode = livescript.compile(fs.readFileSync('test/api/CustomMacros.ls', 'utf8'));
        fs.writeSync(tmpfile.fd, macroCode);

        return expect(latexjs.execute(['-b', '-m', tmpfile.name], ["A \\myMacro[custom] macro."]))
            .to.eventually.be.fulfilled
            .and.to.be.an('object')
                .that.has.property('stdout')
                .that.equals('<div class="body"><p>A -cus\u00ADtom- macro.</p></div>' + EOL);
    });

    test.skip('include custom package', () => {});
});
