// src/components/chat/CodeBlock.tsx
import React from 'react';
import { LLMOutputComponent } from '../../types/llm-ui';
import { useCodeBlockToHtml, loadHighlighter, allLangs, allLangsAlias } from '@llm-ui/code';
import { getHighlighterCore } from 'shiki/core';
import { bundledLanguagesInfo } from 'shiki/langs';
import githubDark from 'shiki/themes/github-dark.mjs';
import getWasm from 'shiki/wasm';
import parseHtml from 'html-react-parser';

const highlighter = loadHighlighter(
  getHighlighterCore({
    langs: allLangs(bundledLanguagesInfo),
    langAlias: allLangsAlias(bundledLanguagesInfo),
    themes: [githubDark],
    loadWasm: getWasm,
  })
);

const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions: { theme: 'github-dark' },
  });

  if (!html) {
    return (
      <pre className="shiki">
        <code>{code}</code>
      </pre>
    );
  }

  return <>{parseHtml(html)}</>;
};

export default CodeBlock;