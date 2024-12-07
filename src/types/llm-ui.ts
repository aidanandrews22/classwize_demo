// src/types/llm-ui.ts
export interface BlockMatch {
    output: string;
    visibleText: string;
    isVisible: boolean;
    block: {
      component: React.ComponentType<{ blockMatch: BlockMatch }>;
    };
  }
  
  export interface LLMOutputComponent extends React.FC<{ blockMatch: BlockMatch }> {}
  
  export interface UseLLMOutputResult {
    blockMatches: BlockMatch[];
  }
  
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