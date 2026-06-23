import { readFileSync, accessSync, constants } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';

import type { Plugin } from 'vite';
import { createFilter } from 'vite';
import type { LoadResult } from 'rolldown';

import { BuildOptionsBase } from 'peggy';
import peggy from 'peggy';


export default function peggyLoader(options: BuildOptionsBase): Plugin {
    return {
        name: 'peggy-loader',

        resolveId(source: string, importer: string | undefined): string | null {
            // If the code imported './latex-parser' (no extension) or './latex-parser.pegjs'
            let resolvedSource = source;
            if (!resolvedSource.endsWith(".pegjs"))
                resolvedSource += ".pegjs";

            if (importer) {
                const basedir = dirname(importer);
                resolvedSource = resolvePath(basedir, resolvedSource);
            }

            try {
                // Verify the actual .pegjs file exists on disk
                accessSync(resolvedSource, constants.R_OK);
                return resolvedSource;
            } catch {
                return null;
            }
        },

        load(filename: string): LoadResult {
            const {
                include = ['*.pegjs', '**/*.pegjs'],
                exclude,
                ...peggyConfig
            } = options;

            const filter = createFilter(include, exclude);
            if (!filter(filename))
                return null;

            const grammar = readFileSync(filename).toString('utf8');

            const codeAndMap = peggy.generate(grammar, {
                format: "es",
                output:"source-and-map",
                grammarSource: filename,
                ...peggyConfig
            }).toStringWithSourceMap({
                file: filename
            });

            return {
                code: codeAndMap.code,
                map: JSON.parse(codeAndMap.map.toString())
            };
        }
    };
}
