// svg.js writes attribute values as given, so lengths with units (e.g. "0.4px") work where its typings
// only allow numbers; LaTeX.js relies on that to get the exact lengths into the SVG. (A property's type
// cannot be widened by augmentation, so the stroke width is cast where it is used, see latex.ltx.ts)
import "@svgdotjs/svg.js"

declare module "@svgdotjs/svg.js" {
    interface Element {
        cx(x: NumberAlias): this
        cy(y: NumberAlias): this
    }

    interface Rect {
        radius(x: NumberAlias, y?: NumberAlias): this
    }
}
