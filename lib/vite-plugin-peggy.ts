import { readFileSync } from 'node:fs';

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
                    grammarSource: filename,
                    ...options
                }).toStringWithSourceMap({
                    file: filename
                });

                return {
                    code: codeAndMap.code,
                    map: JSON.parse(codeAndMap.map.toString())
                };
            }
        }
    };
}
