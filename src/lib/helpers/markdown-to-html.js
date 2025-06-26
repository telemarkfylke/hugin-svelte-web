import { katexPlugin } from '../helpers/katex-plugin.js'
import highlightJs from 'highlight.js';
import markdownIt from 'markdown-it';

import 'highlight.js/styles/a11y-light.min.css'
import 'katex/dist/katex.min.css'

const converter = markdownIt({
  highlight: function (str, lang) {
    const preCodeHtml = '<pre><code class="code-block hljs">'
    if (lang && highlightJs.getLanguage(lang)) {
      try {
        return preCodeHtml +
          highlightJs.highlight(str, { language: lang, ignoreIllegals: true }).value + '</code></pre>';
      } catch (err) {
        console.error("Highlighting error:", err)
      }
    }
    return preCodeHtml + converter.utils.escapeHtml(str) + '</code></pre>';
  },
  linkify: true
})

const defaultRender = converter.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
}

const addKatexToMathStrings = (text) => {
  const lines = text.split('\n')
  let isInCodeBlock = false
  const linesWithKatex = []
  for (let line of lines) {
    if (line.includes('```')) {
      isInCodeBlock = !isInCodeBlock // Toggle code block state
    }
    if (!isInCodeBlock && (line.includes('\\[') || line.includes('\\(') || line.includes('\\]') || line.includes('\\)'))) {
      // Replace math expressions with KaTeX syntax
      line = line.replaceAll('\\[', '$$').replaceAll('\\]', '$$')
      line = line.replaceAll('\\(', '$').replaceAll('\\)', '$')
      linesWithKatex.push(line) // Add the modified line
      continue
    }
    linesWithKatex.push(line) // Add the line as is if in code block
  }
  return linesWithKatex.join('\n') // Join the lines back into a single string
}

// Function to convert string from markdown to valid HTML with markdown-it and highlight.js.
// It also substitutes the LaTeX code with the corresponding HTML using katex.
export const markdownToHtml = (text) => {
  converter.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    // Add a new `target` attribute, or replace the value of the existing one.
    tokens[idx].attrSet('target', '_blank');

    // Pass the token to the default renderer.
    return defaultRender(tokens, idx, options, env, self);
  };

  converter.use(katexPlugin)

  const linesWithKatex = addKatexToMathStrings(text)
  return converter.render(linesWithKatex)
}
