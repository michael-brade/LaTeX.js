export default class CustomMacros
{
    static displayName = "CustomMacros"

    static args: Record<string, string[]> = {
        myMacro: ["H", "o?"]
    };

    g: any;

    constructor(generator: any) {
        this.g = generator;
    }

    myMacro(o: string): string[] {
        return ["-", o, "-"];
    }
}
