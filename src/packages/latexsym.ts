import type { Generator } from "../generator/generator.ts";


// TODO: this is math mode only!!
export class Latexsym
{
    constructor(generator: Generator, options?: any)
    {
    }

    public static symbols: Map<string, string> = new Map([
        ["mho", "\u2127"],       // ℧
        ["Join", "\u2A1D"],      // ⨝
        ["Box", "\u25A1"],       // □
        ["Diamond", "\u25C7"],   // ◇
        ["leadsto", "\u2933"],   // ⤳
        ["sqsubset", "\u228F"],  // ⊏
        ["sqsupset", "\u2290"],  // ⊐
        ["lhd", "\u22B2"],       // ⊲
        ["unlhd", "\u22B4"],     // ⊴
        ["rhd", "\u22B3"],       // ⊳
        ["unrhd", "\u22B5"]      // ⊵
    ]);
}
