// latex.ltx is still LiveScript (until it is ported to TypeScript)
declare module "*/latex.ltx.ls" {
    import type { MacroPackageClass } from "../macros.ts"

    export const LaTeX: MacroPackageClass
}
