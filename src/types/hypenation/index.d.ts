interface HyphenationPatterns {
  id: string | string[];
  leftmin: number;
  rightmin: number;
  patterns: {
    [key: number]: string;
  };
  charSubstitution?: {
    [key: string]: string;
  };
}

declare module 'hyphenation.*' {
  const patterns: HyphenationPatterns;
  export default patterns;
}