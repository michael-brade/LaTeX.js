'use strict'

fs = require 'fs'
p = require 'path'
_ = require 'lodash'



addLF = (str) -> if str.length then str + '\n' else str

parse = (input, separators) ->
    lines = input.split //\r?\n//g
    max = lines.length
    min = line = 0

    result = {
        fixtures: []
    }

    # Scan fixtures
    while line < max
        if separators.indexOf(lines[line]) < 0
            line++
            continue

        currentSep = lines[line]

        fixture =
            header: ''
            first:
                text: ''
                range: []

            second:
                text: ''
                range: []


        # seek end of first and second blocks
        for block in ['first', 'second']
            blockStart = ++line

            while line < max and lines[line] isnt currentSep
                line++

            break if line >= max

            fixture[block].text = addLF (lines.slice blockStart, line).join '\n'
            fixture[block].range.push(blockStart, line)

        line++

        # look for header on the two lines before the fixture.first block
        i = fixture.first.range.0 - 2
        while i >= Math.max(min, fixture.first.range.0 - 3)
            l = lines[i]
            break if (separators.indexOf l) >= 0

            if l.trim!.length
                fixture.header = l.trim!
                break
            i--

        result.fixtures.push fixture

    return if result.fixtures.length then result else null


/* Read fixtures (recursively).
    @separator (String|Array) - allowed fixture separator(s)
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
export load = (path, separator) ->
    stat = fs.statSync path

    if _.isString separator
        separator = separator.split ''
    else if not _.isArray separator
        separator = ['.']


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
