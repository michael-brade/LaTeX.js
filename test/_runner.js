'use strict';

var fs = require('fs');
var p = require('path');

var _ = require('lodash');


function fixLF(str) {
    return str.length ? str + '\n' : str;
}

function parse(input, options) {
    var lines = input.split(/\r?\n/g),
        max = lines.length,
        min = 0,
        line = 0,
        fixture, i, l, currentSep, blockStart;

    var result = {
        fixtures: []
    };

    var sep = options.sep || ['.'];

    // Scan fixtures
    while (line < max) {
        if (sep.indexOf(lines[line]) < 0) {
            line++;
            continue;
        }

        currentSep = lines[line];

        fixture = {
            header: '',
            first: {
                text: '',
                range: []
            },
            second: {
                text: '',
                range: []
            }
        };

        line++;
        blockStart = line;

        // seek end of first block
        while (line < max && lines[line] !== currentSep) {
            line++;
        }
        if (line >= max) {
            break;
        }

        fixture.first.text = fixLF(lines.slice(blockStart, line).join('\n'));
        fixture.first.range.push(blockStart, line);

        line++;
        blockStart = line;

        // seek end of second block
        while (line < max && lines[line] !== currentSep) {
            line++;
        }
        if (line >= max) {
            break;
        }

        fixture.second.text = fixLF(lines.slice(blockStart, line).join('\n'));
        fixture.second.range.push(blockStart, line);
        line++;

        // look for header on the two lines before the fixture.first block
        i = fixture.first.range[0] - 2;
        while (i >= Math.max(min, fixture.first.range[0] - 3)) {
            l = lines[i];
            if (sep.indexOf(l) >= 0) {
                break;
            }
            if (l.trim().length) {
                fixture.header = l.trim();
                break;
            }
            i--;
        }

        result.fixtures.push(fixture);
    }

    return result.fixtures.length ? result : null;
}


// Read fixtures recursively, and run iterator on parsed content
//
// Options
//
// - sep (String|Array) - allowed fixture separator(s)
//
// Parsed data fields:
//
// - fixtures
//

function load(path, options, iterator) {
    var stat = fs.statSync(path);

    if (_.isFunction(options)) {
        iterator = options;
        options = {
            sep: ['.']
        };
    } else if (_.isString(options)) {
        options = {
            sep: options.split('')
        };
    } else if (_.isArray(options)) {
        options = {
            sep: options
        };
    }

    if (stat.isFile()) {
        var input = fs.readFileSync(path, 'utf8');
        var parsed = parse(input, options);

        if (!parsed) {
            return null;
        }

        parsed.file = path;

        if (iterator) {
            iterator(parsed);
        }
        return parsed;
    }

    if (stat.isDirectory()) {
        var result, res;
        result = [];

        fs.readdirSync(path).forEach(function(name) {
            res = load(p.join(path, name), options, iterator);
            if (Array.isArray(res)) {
                result = result.concat(res);
            } else if (res) {
                result.push(res);
            }
        });

        return result;
    }

    // Silently other entries (symlinks and so on)
    return null;
}


function generate(path, options, generator) {
    if (!generator) {
        generator = options;
        options = {};
    }

    options = _.assign({}, options);
    options.assert = options.assert || require('chai').assert;

    load(path, options, function(data) {
        var desc = p.relative(path, data.file);

        describe(desc, function() {
            data.fixtures.forEach(function(fixture) {
                test(fixture.header && options.header ? fixture.header : 'line ' + (fixture.first.range[0] - 1), function() {
                    options.assert.strictEqual(generator(fixture.first.text), fixture.second.text);
                });
            });
        });
    });
}

module.exports = generate;
module.exports.load = load;
