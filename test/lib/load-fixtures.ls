'use strict'

fs = require 'fs'
p = require 'path'


parse = (input, separator) ->
    # escape separator
    separator = separator.replace //[.?*+^$[\]\\(){}|-]//g, "\\$&"
    # add OS-specific EOLs
    separator = //(?:^|\r\n|\n|\r)(?:#{separator}(?:$|\r\n|\n|\r)(?!#{separator})|#{separator}(?=$|\r\n|\n|\r))//

    lines = input.split separator

    result = {
        fixtures: []
    }

    fid = 1

    # assemble fixtures
    for line from 0 til lines.length by 3

        fixture =
            id: fid++
            header: lines[line].trim!
            source: lines[line + 1]
            result: lines[line + 2]

        break if fixture.source == undefined or fixture.result == undefined

        result.fixtures.push fixture

    return result

/* Read a file with fixtures.
    @param path         the path to the file with fixtures
    @param separator    fixture separator (default is '.')
    @return a fixture object:
        {
            file: path,
            fixtures: [
                fixture1,
                fixture2,
                ...
            ]
        }
*/
export load = (path, separator = '.') ->
    stat = fs.statSync path

    if stat.isFile!
        input = fs.readFileSync path, 'utf8'

        # returns { fixtures: <array of fixtures> }
        result = parse input, separator
        result.file = path

        return result

    # silently ignore other entries (symlinks, directories, and so on)
    return
        fixtures: []
