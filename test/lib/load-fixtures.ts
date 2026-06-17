import fs from 'node:fs';

export interface Fixture {
    id: number;
    attrs: Set<string>;
    header: string;
    source: string;
    result: string;
}

export interface Fixtures {
    file: string;
    fixtures: Fixture[];
}


function parse(input: string, separator: string): Fixture[]
{
    // escape separator
    separator = separator.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    // add OS-specific EOLs
    const nl = String.raw`(?:\r\n|\n|\r)`;
    const separatorRegex = new RegExp(
        String.raw`(?:^|${nl})(?:${separator}(?:$|${nl})(?!${separator})|${separator}(?=$|${nl}))`
    );

    const sections = input.split(separatorRegex);

    const result: Fixture[] = [];

    let fid = 1;

    // assemble fixtures: each fixture consists of four sections
    for (let start = 0; start < sections.length; start += 3) {
        const sourceSection = sections[start + 1];
        const resultSection = sections[start + 2];

        if (sourceSection === undefined || resultSection === undefined)
            break;

        let headers = sections[start].trim().split(new RegExp(nl));
        let attrs: Set<string> = new Set;
        let title;

        if (headers.length == 1)
            title = headers[0].trim();
        else {
            for (let char of headers[0])
                attrs.add(char);
            title = headers[1].trim();
        }

        const fixture: Fixture = {
            id: fid++,
            attrs: attrs,
            header: title,
            source: sourceSection,
            result: resultSection
        };

        result.push(fixture);
    }


    return result;
};

/**
 * Read a file with fixtures.
 * @param path         the path to the file with fixtures
 * @param separator    fixture separator (default is '.')
 * @return a ParseResult object
 */
export const load = (path: string, separator: string = '.'): Fixtures => {
    const stat = fs.statSync(path);

    if (stat.isFile()) {
        const input = fs.readFileSync(path, 'utf8');
        const result: Fixture[] = parse(input, separator);

        return {
            file: path,
            fixtures: result
        };
    }

    // silently ignore other entries (symlinks, directories, and so on)
    return {
        file: path,
        fixtures: []
    };
};
