import { generate } from 'pegjs';
import { createFilter } from '@rollup/pluginutils';
import { readFileSync } from 'fs';
import resolve from 'resolve';


export default (options = {}) => ({
  name: 'pegjs-loader',

  resolveId(source) {
    if (!source.endsWith(".pegjs")) {
      source += ".pegjs"
    }

    try {
      return resolve.sync(source, { basedir: __dirname + "/src" }) + ".js"
    } catch {}

    return null;
  },

  load(filename) {
    const { target = 'es6', include = ['*.pegjs.js', '**/*.pegjs.js'], exclude } = options;
    const filter = createFilter(include, exclude);

    if (!filter(filename)) return;

    const grammar = readFileSync(filename.slice(0, -3)).toString('utf8');
    const exporter = target == 'es6' ? 'export default' : 'module.exports =';
    const code = `${exporter} ${generate(grammar, Object.assign({ output: 'source' }, options))};`

    return {
      code: code,
      map: null
    };
  }
})
