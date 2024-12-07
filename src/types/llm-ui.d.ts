// src/types/llm-ui.d.ts
declare module '@llm-ui/react' {
    import { ReactNode } from 'react';
  
    export interface BlockMatch {
      output: string;
      visibleText: string;
      isVisible: boolean;
      block: {
        component: React.ComponentType<{ blockMatch: BlockMatch }>;
      };
    }
  
    export interface LLMOutputComponent extends React.FC<{ blockMatch: BlockMatch }> {}
  
    export interface UseLLMOutputOptions {
      llmOutput: string;
      blocks: Array<{
        component: LLMOutputComponent;
        findCompleteMatch: (text: string) => { match: string; index: number } | null;
        findPartialMatch: (text: string) => { match: string; index: number } | null;
        lookBack: (text: string) => number;
      }>;
      fallbackBlock: {
        component: LLMOutputComponent;
        lookBack: (text: string) => number;
      };
      isStreamFinished: boolean;
    }
  
    export function useLLMOutput(options: UseLLMOutputOptions): {
      blockMatches: BlockMatch[];
    };
  
    export function useStreamExample(example: string): {
      isStreamFinished: boolean;
      output: string;
    };
  }
  
  declare module '@llm-ui/markdown' {
    export function markdownLookBack(): (text: string) => number;
  }
  
  declare module '@llm-ui/code' {
    import { HighlighterCore } from 'shiki/core';
  
    export interface CodeToHtmlOptions {
      theme?: string;
      [key: string]: any;
    }
  
    export function loadHighlighter(highlighter: HighlighterCore): {
      getHighlighter: () => HighlighterCore | undefined;
      highlighterPromise: Promise<HighlighterCore>;
    };
  
    export function useCodeBlockToHtml(options: {
      markdownCodeBlock: string;
      highlighter: ReturnType<typeof loadHighlighter>;
      codeToHtmlOptions?: CodeToHtmlOptions;
    }): {
      html: string | null;
      code: string;
    };
  
    export function allLangs(languagesInfo: any): any[];
    export function allLangsAlias(languagesInfo: any): Record<string, string>;
    export function findCompleteCodeBlock(): (text: string) => { match: string; index: number } | null;
    export function findPartialCodeBlock(): (text: string) => { match: string; index: number } | null;
    export function codeBlockLookBack(): (text: string) => number;
  }