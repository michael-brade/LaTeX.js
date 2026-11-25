import path from 'node:path';
import { EOL } from 'node:os';
import { describe, test, expect } from 'vitest';
import { create as cmd } from './lib/cmd.ts';

import pkg from '../package.json' with { type: 'json' };

const binFile = path.resolve((pkg.bin as Record<string, string>)[pkg.name]);
const latexjs = cmd(binFile);


describe('LaTeX.js CLI test', () => {

    test('get version', async () => {
        await expect(latexjs.execute(['-V'])).resolves.toMatchObject({ stdout: pkg.version + EOL });
    });

    test('get help', async () => {
        await expect(latexjs.execute(['-h'])).resolves
            .toHaveProperty('stdout', expect.stringMatching(new RegExp(pkg.description)));
    });

    test('error on unknown option', async () => {
        await expect(latexjs.execute(['-x'])).rejects
            .toHaveProperty('stderr', expect.stringMatching(/error: unknown option/));
    });

    test('error on incorrect use', async () => {
        await expect(latexjs.execute(['-b', '-s']), "-b -s").rejects.toBeDefined();
        await expect(latexjs.execute(['-b', '-u']), "-b -u").rejects.toBeDefined();
        await expect(latexjs.execute(['-bus']), "-bus").rejects.toBeDefined();
        await expect(latexjs.execute(['-b -s style.css']), "-b -s style.css").rejects.toBeDefined();
    });

    test('default translation', async () => {
        await expect(latexjs.execute([], ["A paragraph."])).resolves
            .toHaveProperty('stdout', '<!DOCTYPE html><html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>A para\u00ADgraph.</p></div></body></html>' + EOL);
    });

    test('return only the body', async () => {
        await expect(latexjs.execute(['-b'], ["A paragraph."])).resolves
            .toHaveProperty('stdout', '<div class="body"><p>A para\u00ADgraph.</p></div>' + EOL);
    });

    test('include custom macros', async () => {
        await expect(latexjs.execute(['-b', '-m', 'test/api/CustomMacros.ts'], ["A \\myMacro[custom] macro."])).resolves
            .toHaveProperty('stdout', '<div class="body"><p>A -cus\u00ADtom- macro.</p></div>' + EOL);
    });

    test.skip('include custom package', () => {});
});
