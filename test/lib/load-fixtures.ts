import fs from 'node:fs';

interface Fixture {
    id: number;
    header: string;
    source: string;
    result: string;
}

interface ParseResult {
    fixtures: Fixture[];
    file?: string;
}


const parse = (input: string, separator: string): ParseResult => {
    // escape separator
    separator = separator.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    // add OS-specific EOLs
    const nl = String.raw`(?:\r\n|\n|\r)`;
    const separatorRegex = new RegExp(
        String.raw`(?:^|${nl})(?:${separator}(?:$|${nl})(?!${separator})|${separator}(?=$|${nl}))`
    );

    const lines = input.split(separatorRegex);

    const result: ParseResult = {
        fixtures: []
    };

    let fid = 1;

    // assemble fixtures
    for (let line = 0; line < lines.length; line += 3) {
        const sourceLine = lines[line + 1];
        const resultLine = lines[line + 2];

        if (sourceLine === undefined || resultLine === undefined)
            break;

        const fixture: Fixture = {
            id: fid++,
            header: lines[line].trim(),
            source: sourceLine,
            result: resultLine
        };

        result.fixtures.push(fixture);
    }


    return result;
};

/**
 * Read a file with fixtures.
 * @param path         the path to the file with fixtures
 * @param separator    fixture separator (default is '.')
 * @return a fixture object:
 *      {
 *          file: path,
 *          fixtures: [
 *              fixture1,
 *              fixture2,
 *              ...
 *          ]
 *      }
 */
export const load = (path: string, separator: string = '.'): ParseResult => {
    const stat = fs.statSync(path);

    if (stat.isFile()) {
        const input = fs.readFileSync(path, 'utf8');

        // returns { fixtures: <array of fixtures> }
        const result = parse(input, separator);
        result.file = path;

        return result;
    }

    // silently ignore other entries (symlinks, directories, and so on)
    return {
        fixtures: []
    };
};
