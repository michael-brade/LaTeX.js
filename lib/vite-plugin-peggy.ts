import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'vite';
import type { LoadResult } from 'rolldown';

import { BuildOptionsBase } from 'peggy';
import peggy from 'peggy';


export default function peggyLoader(options: BuildOptionsBase): Plugin {
    return {
        name: 'peggy-loader',

        load: {
            filter: {
                id: {
                    include: /\.pegjs$/
                }
            },

            handler(filename: string): LoadResult {
                const grammar = readFileSync(filename).toString('utf8');

                const codeAndMap = peggy.generate(grammar, {
                    format: "es",
                    output: "source-and-map",
                    // used in grammar error messages, and as the source map's "sources" entry,
                    // see below in map: {...}; must be relative!
                    grammarSource: path.relative(process.cwd(), filename),
                    ...options
                }).toStringWithSourceMap();

                return {
                    code: codeAndMap.code,
                    map: {
                        ...JSON.parse(codeAndMap.map.toString()),
                        // rolldown resolves "sources" relative to the directory of the module (the .pegjs file),
                        // so the cwd-relative grammarSource would end up as src/parser/src/parser/...
                        // this makes it src/parser/latex-parser.pegjs
                        sources: [path.basename(filename)],
                        sourcesContent: [grammar]
                    }
                };
            }
        }
    };
}
