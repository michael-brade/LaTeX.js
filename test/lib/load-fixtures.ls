'use strict'

fs = require 'fs'
p = require 'path'
_ = require 'lodash'


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

/* Read fixtures (recursively).
    @separator fixture separator (default is '.')
    @return array of fixtures grouped by filename:
    [
        {
            file: name1
            fixtures: [
                fixture1,
                fixture2,
                ...
            ]
        },
        {
            file: name2
            fixtures: [
                fixture1,
                ...
            ]
        }
    ]
*/
export load = (path, separator = '.') ->
    stat = fs.statSync path

    if stat.isFile!
        input = fs.readFileSync(path, 'utf8')

        # returns { fixtures: <array of fixtures> }
        result = parse(input, separator)

        return [] if not result

        result.file = path

        return [result]

    if stat.isDirectory!
        result = []
        fs.readdirSync(path).forEach ((name) ->
            res = load p.join(path, name), separator
            result := result.concat res
        )

        return result

    # silently ignore other entries (symlinks and so on)
    return []
