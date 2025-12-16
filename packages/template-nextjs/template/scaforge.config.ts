import { defineConfig } from '@scaforge/core';

export default defineConfig({
  name: '{{name}}',
  template: 'nextjs',
  plugins: {},
  settings: {
    generateExamples: true,
    codeStyle: {
      semicolons: true,
      singleQuote: true,
      tabWidth: 2,
    },
  },
});