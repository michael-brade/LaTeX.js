import { SyntaxError as PegjsSyntaxError } from 'pegjs';

declare module 'latex.js' {

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

  // parse

  export interface ParseOptions {
    generator?: HtmlGenerator;
    [key: string]: any;
  }

  export interface ParseResult {
    domFragment(): DocumentFragment;
    htmlDocument(baseUrl?: string): Document;
    [key: string]: any;
  }

  export function parse(text: string, options?: ParseOptions): ParseResult;

  // SyntaxError: export the type for compiler checks
  export interface SyntaxError extends PegjsSyntaxError {}
  // and export the value (constructor) for runtime 'instanceof' checks
  export const SyntaxError: typeof PegjsSyntaxError;


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