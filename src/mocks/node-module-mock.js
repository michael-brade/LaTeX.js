// browser replacement for node:module: there is no file system to load packages from, so every
// package that is not builtin is reported as not found (like Node's require.resolve does)
export function createRequire() {
  function notFound(id) {
    const e = new Error(`Cannot find module '${id}'`);
    e.code = "MODULE_NOT_FOUND";
    throw e;
  }

  const require = (id) => notFound(id);
  require.resolve = (id) => notFound(id);
  return require;
}

export default {
  createRequire
};
