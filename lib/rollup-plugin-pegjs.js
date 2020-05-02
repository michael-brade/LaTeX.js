import { generate } from 'pegjs';
import { createFilter } from '@rollup/pluginutils';
import { readFileSync, accessSync, R_OK } from 'fs';
import { dirname, resolve as resolvePath } from 'path';


export default (options = {}) => ({
  name: 'pegjs-loader',

  resolveId(source, importer) {
    if (!source.endsWith(".pegjs")) {
      source += ".pegjs"
    }

    if (importer) {
      const basedir = dirname(importer)
      source = resolvePath(basedir, source)
    }


    try {
      accessSync(source, R_OK)
      return source + ".js"
    } catch {}

    return null;
  },

  load(filename) {
    const { target = 'es6', include = ['*.pegjs.js', '**/*.pegjs.js'], exclude } = options;
    const filter = createFilter(include, exclude);

    if (!filter(filename)) return;

    // strip .js again to read the actual file
    const grammar = readFileSync(filename.slice(0, -3)).toString('utf8');
    const exporter = target == 'es6' ? 'export default' : 'module.exports =';
    const code = `${exporter} ${generate(grammar, Object.assign({ output: 'source' }, options))};`

    return {
      code: code,
      map: null
    };
  }
})
