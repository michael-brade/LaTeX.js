declare module 'latex.js' {

  export interface ParseOptions {
    generator?: HtmlGenerator;
    [key: string]: any;
  }

  export interface HtmlGeneratorOptions {
    hyphenate?: boolean;
    languagePatterns?: any;
    documentClass?: string;
    CustomMacros?: any;
    styles?: string[];
    [key: string]: any;
  }

  export class HtmlGenerator {
    constructor(options?: HtmlGeneratorOptions);
    domFragment(): DocumentFragment;
    htmlDocument(baseUrl?: string): Document;
    [key: string]: any;
  }
  export interface ParseResult {
    domFragment(): DocumentFragment;
    htmlDocument(baseUrl?: string): Document;
    [key: string]: any;
  }
  export function parse(text: string, options?: ParseOptions): ParseResult;
  export namespace he {
    interface EncodeOptions {
      strict?: boolean;
      useNamedReferences?: boolean;
      allowUnsafeSymbols?: boolean;
      [key: string]: any;
    }
    namespace encode {
      let options: EncodeOptions;
    }
    function encode(text: string, options?: EncodeOptions): string;
    function decode(text: string, options?: any): string;
  }
}