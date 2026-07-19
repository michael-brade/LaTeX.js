// debug

export function debugDOM(oParent: Node, oCallback: (this: Node) => void): void
{
    if (oParent.hasChildNodes()) {
        let oNode: Node | null = oParent.firstChild;
        while (oNode) {
            debugDOM(oNode, oCallback);
            oNode = oNode.nextSibling;
        }
    }
    oCallback.call(oParent);
}

export function debugNode(n: any): void
{
    if (!n) return;
    if (typeof n.nodeName !== "undefined")
        console.log(n.nodeName + ":", n.textContent);
    else
        console.log("not a node:", n);
}

export function debugNodes(l: any[]): void
{
    for (const n of l)
        debugNode(n);
}

// Option A: Explicit node argument (Recommended for Type Safety)
export function debugNodeContent(node: Node): void
{
    if (node && node.nodeValue)
        console.log(node.nodeValue);
}

// Option B: Preserves 'this' keyword binding if used inside .call()
export function debugNodeContentDynamic(this: Node | any): void
{
    if (this && this.nodeValue)
        console.log(this.nodeValue);
}
