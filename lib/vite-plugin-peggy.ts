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
                    output:"source-and-map",
                    grammarSource: path.relative(process.cwd(), filename),  // must be relative!
                    ...options
                }).toStringWithSourceMap();

                return {
                    code: codeAndMap.code,
                    map: {
                        ...JSON.parse(codeAndMap.map.toString()),
                        sourcesContent: [grammar]
                    }
                };
            }
        }
    };
}
